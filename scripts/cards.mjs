// Cartão de projeto (410x330): miniatura real em base64, categoria, LED de status, nome,
// frase de valor, stack e indicação de link. O cartão inteiro é clicável no README (<a><img>).
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS, P, svg, esc, textureDefs, wrap, num, textWidth, mix, MONO } from './lib.mjs';

export const CARD_W = 410, CARD_H = 330;
const X0 = 6, PW = 398, TH = 186; // painel e altura da miniatura

const LED = (c) => ({
  live: c.green, store: c.green, prelaunch: c.amber, development: c.violet,
  offline: c.red, delivered: c.blue, internal: c.cyan, oss: c.cyan,
});

function thumbData(id) {
  const f = path.join(ASSETS, 'thumbs', id + '.webp');
  return 'data:image/webp;base64,' + fs.readFileSync(f).toString('base64');
}

/** Arte desenhada para projeto sem captura de tela: painel de código com a estrutura real do repositório. */
function codeArt(c, theme, art) {
  const bgA = theme === 'dark' ? '#0A1128' : '#EEF3FE';
  let g = `<rect x="${X0}" y="4" width="${PW}" height="${TH}" fill="${bgA}"/>
<rect x="${X0}" y="4" width="${PW}" height="${TH}" fill="url(#artG)"/>
<rect x="${X0}" y="4" width="${PW}" height="${TH}" fill="url(#artGrid)" opacity="0.5"/>
<rect x="${X0}" y="4" width="34" height="${TH}" fill="${c.line}" opacity="0.25"/>`;
  art.lines.slice(0, 6).forEach((l, i) => {
    const y = 68 + i * 20;
    const indent = l.length - l.trimStart().length;
    const t = l.trim();
    const dir = t.endsWith('/');
    const base = t.split('/').filter(Boolean).pop();
    let dirPart = t.slice(0, t.length - base.length - (dir ? 1 : 0));
    const maxPx = PW - 52 - indent * 6;
    const full = () => textWidth(dirPart + base + (dir ? '/' : ''), 13, 'mono');
    const segs = dirPart.split('/').filter(Boolean);
    let drop = 0;
    while (full() > maxPx && drop < segs.length) { drop++; dirPart = '…/' + segs.slice(drop).join('/') + (segs.length > drop ? '/' : ''); }
    const x = X0 + 44 + indent * 6;
    g += `<text class="m" x="${X0 + 12}" y="${y}" font-size="11" fill="${c.dim}">${String(i + 1).padStart(2, ' ')}</text>`;
    g += `<text class="m" x="${num(x)}" y="${y}" font-size="13" xml:space="preserve"><tspan fill="${c.dim}">${esc(dirPart)}</tspan><tspan fill="${dir ? c.cyan : c.text}" font-weight="${dir ? 700 : 500}">${esc(base + (dir ? '/' : ''))}</tspan></text>`;
  });
  return g;
}

function graphArt(c, theme, art) {
  const bgA = theme === 'dark' ? '#0A1128' : '#EEF3FE';
  const cx = X0 + PW / 2, cy = 4 + TH / 2 + 12;
  let g = `<rect x="${X0}" y="4" width="${PW}" height="${TH}" fill="${bgA}"/><rect x="${X0}" y="4" width="${PW}" height="${TH}" fill="url(#artG)"/>
<rect x="${X0}" y="4" width="${PW}" height="${TH}" fill="url(#artGrid)"/>`;
  const pos = [[-126, -36], [126, -36], [-126, 38], [126, 38]];
  art.nodes.forEach((n, i) => {
    const [dx, dy] = pos[i];
    g += `<path d="M${cx} ${cy} Q${cx + dx * 0.4} ${cy + dy * 1.25} ${cx + dx} ${cy + dy}" fill="none" stroke="${c.blue}" stroke-width="1.6" stroke-opacity="0.8"/>`;
    const w = textWidth(n, 13, 'bold') + 22;
    g += `<rect x="${num(cx + dx - w / 2)}" y="${cy + dy - 14}" width="${num(w)}" height="28" rx="9" fill="${c.panel2}" stroke="${c.line}" stroke-width="1.2"/><text x="${cx + dx}" y="${cy + dy + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="${c.text}">${esc(n)}</text>`;
  });
  g += `<circle cx="${cx}" cy="${cy}" r="34" fill="url(#coreA)" stroke="${c.cyan}" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="${c.cyan}" stroke-opacity="0.35" stroke-dasharray="3 5"/>
<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="14" font-weight="800" fill="${c.text}">GROCHA</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="14" font-weight="800" fill="${c.cyan}">IA</text>`;
  return g;
}

export function card(theme, p, effStatus, statusLabel, extra = {}) {
  const c = P[theme];
  const led = LED(c)[effStatus] || c.muted;
  const pulse = effStatus === 'live' || effStatus === 'store';
  const clipTop = `M${X0} ${4 + 14} a14 14 0 0 1 14 -14 H${X0 + PW - 14} a14 14 0 0 1 14 14 V${4 + TH} H${X0} Z`;

  const nameSize = Math.min(22, Math.floor((362 / (p.name.length * 0.62)) * 10) / 10);
  const tag = wrap(p.tagline, 362, 14.5, 2);
  const stackTxt = p.stack.join(' · ');
  const hasLink = !!p.url && effStatus !== 'offline';
  const linkTxt = hasLink ? (effStatus === 'oss' ? 'ver código' : 'abrir') : (effStatus === 'offline' ? 'sem link' : effStatus === 'development' ? 'sem link ainda' : '');

  let art;
  if (p.art?.type === 'code') art = codeArt(c, theme, p.art);
  else if (p.art?.type === 'graph') art = graphArt(c, theme, p.art);
  else art = `<image href="${thumbData(p.thumb)}" x="${X0}" y="4" width="${PW}" height="${TH}" preserveAspectRatio="xMidYMid slice"/>`;

  const catW = p.kind.length * (11 * 0.61 + 0.8) + 24;
  const stW = statusLabel.length * (11 * 0.61 + 0.8) + 42;
  const extraTxt = extra.stars != null ? `★ ${extra.stars}` : '';

  const defs = textureDefs(theme, 'cd') + `
<clipPath id="ct"><path d="${clipTop}"/></clipPath>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="${c.panel}" stop-opacity="0"/><stop offset="1" stop-color="${c.panel}" stop-opacity="${theme === 'dark' ? 0.95 : 0.9}"/></linearGradient>
<linearGradient id="pn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.panel2}"/><stop offset="1" stop-color="${c.panel}"/></linearGradient>
<linearGradient id="artG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.blue}" stop-opacity="${theme === 'dark' ? 0.25 : 0.12}"/><stop offset="1" stop-color="${c.cyan}" stop-opacity="0.05"/></linearGradient>
<pattern id="artGrid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="${c.line}" stroke-opacity="0.6"/></pattern>
<radialGradient id="coreA" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="${theme === 'dark' ? '#17306B' : '#FFFFFF'}"/><stop offset="1" stop-color="${theme === 'dark' ? '#0B1534' : '#DCE7FB'}"/></radialGradient>
<linearGradient id="cta" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.blue}"/><stop offset="1" stop-color="${c.cyan}"/></linearGradient>`;

  const css = pulse ? `.led{animation:p 2.6s ease-in-out infinite}@keyframes p{0%,100%{opacity:.45}50%{opacity:1}}` : '';

  const body = `
<rect x="${X0}" y="4" width="${PW}" height="${CARD_H - 8}" rx="14" fill="url(#pn)"/>
<g clip-path="url(#ct)">${art}<rect x="${X0}" y="4" width="${PW}" height="${TH}" fill="url(#fade)"/></g>
<rect x="${X0 + 0.75}" y="4.75" width="${PW - 1.5}" height="${CARD_H - 9.5}" rx="13.5" fill="none" stroke="${c.line}" stroke-width="1.5"/>
<rect x="${X0}" y="${4 + TH - 1}" width="${PW}" height="1.2" fill="${c.line}" opacity="0.9"/>
<!-- chips sobre a miniatura -->
<g>
<rect x="${X0 + 12}" y="16" width="${num(catW)}" height="24" rx="12" fill="#050A18" fill-opacity="0.78" stroke="#FFFFFF" stroke-opacity="0.14"/>
<text class="m" x="${X0 + 12 + catW / 2}" y="32.2" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="0.8" fill="#C9D6F2">${esc(p.kind)}</text>
<rect x="${num(X0 + PW - 12 - stW)}" y="16" width="${num(stW)}" height="24" rx="12" fill="#050A18" fill-opacity="0.78" stroke="${led}" stroke-opacity="0.55"/>
<circle class="led" cx="${num(X0 + PW - 12 - stW + 15)}" cy="28" r="4.5" fill="${theme === 'dark' ? led : mix(led, '#34D399', 0.0)}"/>
<text class="m" x="${num(X0 + PW - 12 - stW + 26)}" y="32.2" font-size="11" font-weight="700" letter-spacing="0.8" fill="#EAF1FF">${esc(statusLabel)}</text>
</g>
<text x="${X0 + 18}" y="${4 + TH + 34}" font-size="${nameSize}" font-weight="800" letter-spacing="-0.3" fill="${c.text}">${esc(p.name)}</text>
${tag.map((l, i) => `<text x="${X0 + 18}" y="${4 + TH + 58 + i * 19}" font-size="14.5" fill="${c.muted}">${esc(l)}</text>`).join('')}
<line x1="${X0 + 18}" y1="${CARD_H - 40}" x2="${X0 + PW - 18}" y2="${CARD_H - 40}" stroke="${c.line}" stroke-opacity="0.8"/>
<text class="m" x="${X0 + 18}" y="${CARD_H - 17}" font-size="12.5" fill="${c.dim}">${esc(stackTxt)}</text>
${hasLink ? `<text class="m" x="${X0 + PW - 18}" y="${CARD_H - 17}" text-anchor="end" font-size="12.5" font-weight="700" fill="${c.cyan}">${linkTxt} ↗</text>` : `<text class="m" x="${X0 + PW - 18}" y="${CARD_H - 17}" text-anchor="end" font-size="12" fill="${c.dim}">${extraTxt || linkTxt}</text>`}
${hasLink && extraTxt ? `<text class="m" x="${X0 + PW - 18 - textWidth(linkTxt + ' ↗', 12.5, 'mono') - 14}" y="${CARD_H - 17}" text-anchor="end" font-size="12" fill="${c.amber}">${extraTxt}</text>` : ''}`;
  void MONO;
  const alt = `${p.name}: ${p.tagline} ${statusLabel.toLowerCase()}.`;
  return {
    svg: svg({ w: CARD_W, h: CARD_H, defs, css, body, title: `${p.name}, ${p.kind.toLowerCase()}`, desc: alt + ' Stack: ' + stackTxt + '.' }),
    truncated: tag.some((l) => l.endsWith('…')),
  };
}

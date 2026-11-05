// Peças menores: telemetria (4 módulos de largura fixa), cabeçalho de seção, rodapé e botões de contato.
import { P, svg, esc, textureDefs, textureRect, wrap, num, fmtInt } from './lib.mjs';

/** Módulos de 168 px: 4 por linha no desktop, 2 por linha no celular (sem media query). */
export function telemetryTile(theme, tile) {
  const c = P[theme];
  const W = 168, H = 132;
  const lab = wrap(tile.label, 136, 13, 2);
  let spark = '';
  if (tile.spark?.length) {
    const max = Math.max(...tile.spark, 1);
    const n = tile.spark.length, x0 = 16, x1 = W - 16, y1 = H - 14, hh = 22;
    const pts = tile.spark.map((v, i) => [x0 + ((x1 - x0) * i) / (n - 1), y1 - (hh * v) / max]);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${num(p[0])} ${num(p[1])}`).join('');
    spark = `<path d="${d}L${x1} ${y1}L${x0} ${y1}Z" fill="url(#sp)" opacity="0.9"/><path d="${d}" fill="none" stroke="${c.cyan}" stroke-width="1.6" stroke-linejoin="round"/>`;
  } else spark = `<text class="m" x="16" y="${H - 14}" font-size="10.5" letter-spacing="1" fill="${c.dim}">${esc(tile.caption)}</text>`;
  const defs = textureDefs(theme, 'tl') + `<linearGradient id="sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cyan}" stop-opacity="0.35"/><stop offset="1" stop-color="${c.cyan}" stop-opacity="0"/></linearGradient><linearGradient id="ac" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.blue}"/><stop offset="1" stop-color="${c.cyan}"/></linearGradient>`;
  const body = `${textureRect(W, H, 14, 'tl')}
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="13.5" fill="none" stroke="${c.line}" stroke-width="1.5"/>
<rect x="16" y="0" width="44" height="3" rx="1.5" fill="url(#ac)"/>
<text class="m" x="16" y="52" font-size="40" font-weight="800" fill="${c.text}" letter-spacing="-1">${esc(tile.value)}</text>
${lab.map((l, i) => `<text x="16" y="${72 + i * 16}" font-size="13" font-weight="600" fill="${c.muted}">${esc(l)}</text>`).join('')}
${spark}`;
  return svg({ w: W, h: H, defs, body, title: `${tile.value} ${tile.label}`, desc: `${tile.value} ${tile.label}. ${tile.caption || ''}` });
}

export function sectionHeader(theme, sec, count, sub) {
  const c = P[theme];
  const W = 640, H = 60;
  const defs = `<linearGradient id="hl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.blue}"/><stop offset="0.5" stop-color="${c.cyan}"/><stop offset="1" stop-color="${c.cyan}" stop-opacity="0"/></linearGradient>`;
  const body = `<text class="m" x="0" y="38" font-size="17" font-weight="700" fill="${c.cyan}" letter-spacing="1">${sec.kicker}</text>
<text x="40" y="40" font-size="30" font-weight="800" letter-spacing="-0.5" fill="${c.text}">${esc(sec.title)}</text>
<text class="m" x="${W}" y="38" text-anchor="end" font-size="13" letter-spacing="1" fill="${c.muted}">${esc(sub)}</text>
<rect x="0" y="52" width="${W}" height="2" rx="1" fill="url(#hl)"/>`;
  return svg({ w: W, h: H, defs, body, title: `${sec.title}: ${count} projetos`, desc: `${sec.title}. ${sub}` });
}

export function footerPanel(theme) {
  const c = P[theme];
  const W = 640, H = 170;
  const defs = textureDefs(theme, 'ft') + `<linearGradient id="hd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.blue}"/><stop offset="1" stop-color="${c.cyan}"/></linearGradient>`;
  const body = `${textureRect(W, H, 20, 'ft')}
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="19" fill="none" stroke="${c.line}" stroke-width="1.5"/>
<text class="m" x="32" y="46" font-size="13" letter-spacing="2.5" fill="${c.muted}">TRANSMISSÃO ABERTA</text>
<text x="32" y="92" font-size="36" font-weight="800" letter-spacing="-0.5" fill="url(#hd)">Tem um projeto em mente?</text>
<text x="32" y="126" font-size="18" font-weight="500" fill="${c.text}">Software do conceito ao lançamento.</text>
<text class="m" x="32" y="150" font-size="13" letter-spacing="1" fill="${c.dim}">grochatech.com.br</text>`;
  return svg({ w: W, h: H, defs, body, title: 'Tem um projeto em mente? Software do conceito ao lançamento.', desc: 'Chamada de contato da GROCHA Tech.' });
}

/** Botões de 160x52: 2 por linha no celular, 4 no desktop. */
export function contactButton(theme, label, hint) {
  const c = P[theme];
  const W = 160, H = 52;
  const defs = textureDefs(theme, 'bt') + `<linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cyan}"/><stop offset="1" stop-color="${c.blue}"/></linearGradient>`;
  const body = `${textureRect(W, H, 12, 'bt')}
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="11.5" fill="none" stroke="${c.line}" stroke-width="1.5"/>
<rect x="0" y="12" width="4" height="28" rx="2" fill="url(#bar)"/>
<text x="20" y="25" font-size="16" font-weight="800" fill="${c.text}">${esc(label)}</text>
<text class="m" x="20" y="41" font-size="10.5" letter-spacing="0.5" fill="${c.muted}">${esc(hint)}</text>
<path d="M${W - 30} 24 L${W - 16} 10 M${W - 28} 10 H${W - 16} V22" fill="none" stroke="${c.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg({ w: W, h: H, defs, body, title: `${label}: ${hint}`, desc: `Botão de contato: ${label}, ${hint}` });
}

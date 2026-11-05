// Herói: constelação orbital. Núcleo = Gabriel Rocha · GROCHA Tech; nós = produtos reais.
// Animação: a cada ciclo as linhas acendem em sequência do núcleo para os nós. O estado
// base (sem animação) já é o quadro completo, então prefers-reduced-motion mostra tudo aceso.
import { P, svg, esc, textureDefs, textureRect, rng, num, textWidth } from './lib.mjs';

const W = 720, H = 584, CX = 360, CY = 262;

function layout(nodes) {
  const rings = {
    1: { rx: 192, ry: 100, start: -90 + 30 },
    2: { rx: 250, ry: 178, start: -90 + 22.5 },
  };
  const byOrbit = { 1: nodes.filter((n) => n.orbit === 1), 2: nodes.filter((n) => n.orbit === 2) };
  const out = [];
  for (const o of [1, 2]) {
    const list = byOrbit[o];
    list.forEach((n, i) => {
      const t = ((rings[o].start + (360 / list.length) * i) * Math.PI) / 180;
      const x = CX + rings[o].rx * Math.cos(t);
      const y = CY + rings[o].ry * Math.sin(t);
      out.push({ ...n, x, y, t, cos: Math.cos(t), sin: Math.sin(t) });
    });
  }
  return { out, rings };
}

export function hero(theme, projects, tel) {
  const c = P[theme];
  const nodes = projects.filter((p) => p.hero).map((p) => ({ id: p.id, label: p.hero.short, orbit: p.hero.orbit, dev: p.status === 'development' }));
  const { out, rings } = layout(nodes);
  const rand = rng(7);
  let stars = '';
  for (let i = 0; i < 70; i++) {
    const x = rand() * W, y = 52 + rand() * (H - 150);
    stars += `<circle cx="${num(x)}" cy="${num(y)}" r="${num(0.5 + rand() * 1.1)}" fill="${c.text}" opacity="${num(0.12 + rand() * 0.3)}"/>`;
  }
  // linhas núcleo -> nó (curvas leves) e overlay que "acende" em sequência
  let base = '', lit = '', nodeSvg = '', css = '';
  out.forEach((n, i) => {
    const dx = n.x - CX, dy = n.y - CY;
    const len = Math.hypot(dx, dy);
    const bend = (i % 2 ? 1 : -1) * 0.1 * len;
    const qx = (CX + n.x) / 2 + (-dy / len) * bend, qy = (CY + n.y) / 2 + (dx / len) * bend;
    const d = `M${CX} ${CY} Q${num(qx)} ${num(qy)} ${num(n.x)} ${num(n.y)}`;
    const delay = (i * 0.42).toFixed(2);
    base += `<path d="${d}" fill="none" stroke="${n.dev ? c.violet : c.blue}" stroke-opacity="${n.dev ? 0.45 : 0.5}" stroke-width="1.2" ${n.dev ? 'stroke-dasharray="4 5"' : ''}/>`;
    lit += `<path class="ln" style="animation-delay:${delay}s" d="${d}" pathLength="1" fill="none" stroke="url(#lit)" stroke-width="2.2" stroke-linecap="round"/>`;
    // rótulo: ao lado nos extremos laterais, acima/abaixo nos demais
    const side = Math.abs(n.cos) > 0.9;
    const above = n.sin < 0;
    const fs = n.orbit === 1 ? 18 : 17;
    let lx = n.x, ly, anchor = 'middle';
    if (side) { anchor = n.cos > 0 ? 'start' : 'end'; lx = n.x + (n.cos > 0 ? 13 : -13); ly = n.y + 5; }
    else ly = above ? n.y - 14 : n.y + 25;
    const halo = n.dev ? c.violet : c.cyan;
    nodeSvg += `<g>
<circle class="hl" style="animation-delay:${delay}s" cx="${num(n.x)}" cy="${num(n.y)}" r="13" fill="${halo}" opacity="0.0"/>
<circle cx="${num(n.x)}" cy="${num(n.y)}" r="${n.dev ? 6 : 7}" fill="${n.dev ? c.bg : halo}" stroke="${halo}" stroke-width="${n.dev ? 2 : 0}" ${n.dev ? 'stroke-dasharray="3 2.2"' : ''}/>
<text x="${num(lx)}" y="${num(ly)}" text-anchor="${anchor}" font-size="${fs}" font-weight="700" fill="${c.text}">${esc(n.label)}</text>
</g>`;
  });
  css += `
.ln{stroke-dasharray:1;stroke-dashoffset:0;opacity:0;animation:ln 11s cubic-bezier(.4,0,.2,1) infinite}
@keyframes ln{0%{stroke-dashoffset:1;opacity:0}2%{opacity:1}9%{stroke-dashoffset:0;opacity:1}30%{stroke-dashoffset:0;opacity:0}100%{stroke-dashoffset:0;opacity:0}}
.hl{animation:hl 11s ease-out infinite}
@keyframes hl{0%,6%{opacity:0;transform:scale(.6)}9%{opacity:.55}30%{opacity:0}100%{opacity:0}}
.hl{transform-box:fill-box;transform-origin:center}
.core{animation:core 5.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes core{0%,100%{opacity:.5}50%{opacity:1}}`;

  const defs = textureDefs(theme) + `
<linearGradient id="lit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.blue}"/><stop offset="1" stop-color="${c.cyan}"/></linearGradient>
<linearGradient id="head" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.blue}"/><stop offset="0.6" stop-color="${c.cyan}"/><stop offset="1" stop-color="${c.cyan}"/></linearGradient>
<radialGradient id="coreG" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="${theme === 'dark' ? '#16275A' : '#FFFFFF'}"/><stop offset="1" stop-color="${theme === 'dark' ? '#0B1534' : '#E3ECFC'}"/></radialGradient>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>`;

  const o1 = rings[1], o2 = rings[2];
  const live = tel.productsLive;
  const body = `
${textureRect(W, H, 20)}
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="19" fill="none" stroke="${c.line}" stroke-width="1.5"/>
${stars}
<!-- cabeçalho do painel -->
<text class="m" x="28" y="34" font-size="12.5" letter-spacing="2" fill="${c.dim}">GROCHA OS · PAINEL DE CONTROLE</text>
<g transform="translate(${W - 28} 30)"><text class="m" text-anchor="end" font-size="12.5" letter-spacing="1.5" fill="${c.muted}">${live} PRODUTOS NO AR</text><circle class="core" cx="${-(`${live} PRODUTOS NO AR`.length * (12.5 * 0.61 + 1.5)) - 12}" cy="-4" r="4.5" fill="${c.green}"/></g>
<line x1="28" y1="48" x2="${W - 28}" y2="48" stroke="${c.line}"/>
<!-- órbitas -->
<ellipse cx="${CX}" cy="${CY}" rx="${o2.rx}" ry="${o2.ry}" fill="none" stroke="${c.line}" stroke-width="1.2" stroke-dasharray="2 7"/>
<ellipse cx="${CX}" cy="${CY}" rx="${o1.rx}" ry="${o1.ry}" fill="none" stroke="${c.line}" stroke-width="1.2" stroke-dasharray="2 7"/>
<ellipse cx="${CX}" cy="${CY}" rx="${o2.rx + 24}" ry="${o2.ry + 18}" fill="none" stroke="${c.line}" stroke-opacity="0.5" stroke-width="1"/>
<ellipse cx="${CX}" cy="${CY}" rx="110" ry="${theme === 'dark' ? 80 : 80}" fill="${c.blue}" opacity="${theme === 'dark' ? 0.3 : 0.14}" filter="url(#soft)"/>
${base}
${lit}
${nodeSvg}
<!-- núcleo -->
<g>
<rect x="${CX - 118}" y="${CY - 40}" width="236" height="80" rx="20" fill="url(#coreG)" stroke="${c.blue}" stroke-width="1.6"/>
<rect x="${CX - 112}" y="${CY - 34}" width="224" height="68" rx="15" fill="none" stroke="${c.cyan}" stroke-opacity="0.35" stroke-width="1"/>
<text x="${CX}" y="${CY + 2}" text-anchor="middle" font-size="25" font-weight="800" fill="${c.text}" letter-spacing="0.5">GABRIEL ROCHA</text>
<text class="m" x="${CX}" y="${CY + 25}" text-anchor="middle" font-size="14" font-weight="700" letter-spacing="3" fill="${c.cyan}">GROCHA TECH</text>
</g>
<!-- faixa de assinatura -->
<line x1="28" y1="${H - 100}" x2="${W - 28}" y2="${H - 100}" stroke="${c.line}"/>
<text class="m" x="28" y="${H - 70}" font-size="13" letter-spacing="2.5" fill="${c.muted}">FUNDADOR  ·  FULL-STACK SÊNIOR</text>
<text x="28" y="${H - 28}" font-size="40" font-weight="800" letter-spacing="-0.5" fill="url(#head)">Do conceito ao lançamento.</text>
<text class="m" x="28" y="${H - 112}" font-size="11.5" letter-spacing="1" fill="${c.dim}">linha cheia = no ar</text><text class="m" x="${W - 28}" y="${H - 112}" text-anchor="end" font-size="11.5" letter-spacing="1" fill="${c.violet}">tracejada = em construção</text>
`;
  return svg({
    w: W, h: H, defs, css, body,
    title: 'Gabriel Rocha, GROCHA Tech: mapa orbital dos produtos',
    desc: 'Mapa orbital com Gabriel Rocha e a GROCHA Tech no centro e os produtos ao redor: ' + out.map((n) => n.label).join(', ') + '. Fundador, full-stack sênior, do conceito ao lançamento.',
  });
}

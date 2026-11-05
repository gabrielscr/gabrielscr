// Linha do tempo vertical 2017 -> 2026. Só marcos verificáveis: datas de criação de repositório
// (API do GitHub) ou datas registradas no site da GROCHA Tech. A fonte aparece em cada marco.
import { P, svg, esc, textureDefs, textureRect, wrap, num } from './lib.mjs';

export function timeline(theme, items) {
  const c = P[theme];
  const W = 480, X = 118, TOP = 92, GAP = 16, TW = W - X - 24;
  let y = TOP;
  const rows = items.map((it) => {
    const tl = wrap(it.title, TW, 18, 2, 'bold');
    const dl = wrap(it.text, TW, 14.5, 3);
    const h = 8 + tl.length * 22 + dl.length * 19 + 22;
    const row = { it, tl, dl, y, h };
    y += h + GAP;
    return row;
  });
  const H = y + 6;
  const defs = textureDefs(theme, 'tm') + `<linearGradient id="spine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cyan}"/><stop offset="1" stop-color="${c.blue}"/></linearGradient>`;
  let body = `${textureRect(W, H, 20, 'tm')}
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="19" fill="none" stroke="${c.line}" stroke-width="1.5"/>
<text class="m" x="28" y="38" font-size="12.5" letter-spacing="2" fill="${c.dim}">LINHA DO TEMPO · 2017 → 2026</text>
${wrap("Só marcos que dá para conferir: repositório criado ou data registrada no site.", W - 56, 14, 2).map((l, i) => `<text x="28" y="${60 + i * 18}" font-size="14" fill="${c.muted}">${esc(l)}</text>`).join("")}
<rect x="${X - 22}" y="${TOP}" width="3" height="${H - TOP - 20}" rx="1.5" fill="url(#spine)" opacity="0.8"/>`;
  let lastYear = '';
  for (const r of rows) {
    const yr = r.it.when;
    const showYear = yr !== lastYear; lastYear = yr;
    const cy = r.y + 14;
    body += `<g>
${showYear ? `<text class="m" x="28" y="${cy + 6}" font-size="19" font-weight="800" fill="${c.text}">${yr}</text>` : ''}
<text class="m" x="28" y="${cy + (showYear ? 24 : 6)}" font-size="12.5" letter-spacing="1" fill="${c.cyan}">${esc(r.it.month)}</text>
<circle cx="${X - 20.5}" cy="${cy}" r="7.5" fill="${c.bg}" stroke="${c.cyan}" stroke-width="2.2"/><circle cx="${X - 20.5}" cy="${cy}" r="3" fill="${c.cyan}"/>
${r.tl.map((l, i) => `<text x="${X}" y="${r.y + 18 + i * 22}" font-size="18" font-weight="800" fill="${c.text}">${esc(l)}</text>`).join('')}
${r.dl.map((l, i) => `<text x="${X}" y="${r.y + 18 + r.tl.length * 22 + 2 + i * 19}" font-size="14.5" fill="${c.muted}">${esc(l)}</text>`).join('')}
<text class="m" x="${X}" y="${r.y + r.h - 4}" font-size="11" letter-spacing="0.5" fill="${c.dim}">fonte: ${esc(r.it.source)}</text>
</g>`;
  }
  return svg({ w: W, h: H, defs, body, title: 'Linha do tempo de 2017 a 2026', desc: items.map((i) => `${i.month}/${i.when}: ${i.title}`).join('; ') });
}

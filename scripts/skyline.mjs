// Skyline isométrica do calendário de contribuições (dados reais da API GraphQL).
// Cada semana é um grupo que "sobe" em sequência (CSS, só no carregamento); sem animação
// (prefers-reduced-motion) o estado base já é a skyline completa.
import { P, svg, esc, textureDefs, textureRect, mix, num, fmtInt } from './lib.mjs';

const W = 720;
const A = 10.2, B = 4.7, S = 0.86, HMAX = 100, OX = 100, OY = 160;

const LEVELS = {
  dark: ['#16264A', '#2C4FB6', '#2F6BF0', '#22B8E8', '#8BF3FF'],
  light: ['#D7E2F8', '#A9C0F4', '#5E8DF0', '#1F6FDB', '#0A3A9E'],
};

export function skyline(theme, cal) {
  const c = P[theme];
  const weeks = cal.weeks;
  const flat = weeks.flat().filter((v) => v != null);
  const max = Math.max(...flat, 1);
  const level = (v) => (v <= 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)));
  const height = (v) => (v <= 0 ? 0 : 5 + (HMAX - 5) * Math.sqrt(v / max));
  const dx = A * S, dy = B * S;

  let peak = { v: -1 };
  let groups = '';
  weeks.forEach((days, w) => {
    // por nível e face: um <path> com um subcaminho por célula
    const faces = {}; // key `${lv}:${face}` -> d
    days.forEach((v, d) => {
      if (v == null) return;
      const cx = OX + (w - d) * A, cy = OY + (w + d) * B, h = height(v), lv = level(v);
      const top = `M${num(cx)} ${num(cy - dy - h)}L${num(cx + dx)} ${num(cy - h)}L${num(cx)} ${num(cy + dy - h)}L${num(cx - dx)} ${num(cy - h)}Z`;
      const add = (face, dd) => { const k = `${lv}:${face}`; faces[k] = (faces[k] || '') + dd; };
      add('t', top);
      if (h > 0) {
        add('l', `M${num(cx - dx)} ${num(cy - h)}L${num(cx)} ${num(cy + dy - h)}L${num(cx)} ${num(cy + dy)}L${num(cx - dx)} ${num(cy)}Z`);
        add('r', `M${num(cx)} ${num(cy + dy - h)}L${num(cx + dx)} ${num(cy - h)}L${num(cx + dx)} ${num(cy)}L${num(cx)} ${num(cy + dy)}Z`);
      }
      if (v > peak.v) peak = { v, x: cx, y: cy - dy - h, w, d };
    });
    let g = '';
    // ordem das faces: topo por último dentro do nível não importa (células não se sobrepõem no mesmo nível/semana)
    for (let lv = 0; lv <= 4; lv++) {
      const base = LEVELS[theme][lv];
      const fill = { t: base, l: mix(base, theme === 'dark' ? '#000000' : '#06143C', theme === 'dark' ? 0.32 : 0.3), r: mix(base, theme === 'dark' ? '#000000' : '#06143C', theme === 'dark' ? 0.52 : 0.5) };
      for (const f of ['l', 'r', 't']) {
        const d = faces[`${lv}:${f}`];
        if (d) g += `<path d="${d}" fill="${fill[f]}"${lv === 0 ? ` stroke="${c.line}" stroke-opacity="0.6" stroke-width="0.6"` : ''}/>`;
      }
    }
    groups += `<g class="wk" style="animation-delay:${(w * 0.035).toFixed(3)}s">${g}</g>`;
  });

  const maxY = OY + (weeks.length + 6) * B + dy + 8;
  const H = Math.round(maxY + 36);
  const total = fmtInt(cal.total);
  const range = `${cal.from.split('-').reverse().slice(0, 2).join('/')} a ${cal.to.split('-').reverse().join('/')}`;
  const fmtDate = (iso) => iso.split('-').reverse().join('/');
  // data do pico
  const peakDay = weeks[peak.w] ? (() => { const d0 = new Date(cal.from + 'T00:00:00Z'); d0.setUTCDate(d0.getUTCDate() + peak.w * 7 + peak.d); return d0.toISOString().slice(0, 10); })() : '';

  const defs = textureDefs(theme, 'sk') + `<linearGradient id="hn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.blue}"/><stop offset="1" stop-color="${c.cyan}"/></linearGradient>`;
  const css = `
.wk{animation:rise 1.3s cubic-bezier(.2,.7,.2,1) both}
@keyframes rise{from{transform:translateY(16px)}to{transform:translateY(0)}}`;
  const legend = LEVELS[theme].map((col, i) => `<rect x="${28 + i * 17}" y="${H - 44}" width="13" height="13" rx="3" fill="${col}" stroke="${c.line}" stroke-width="0.8"/>`).join('');

  const body = `${textureRect(W, H, 20, 'sk')}
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="19" fill="none" stroke="${c.line}" stroke-width="1.5"/>
<text class="m" x="28" y="34" font-size="12.5" letter-spacing="2" fill="${c.dim}">SKYLINE · CONTRIBUIÇÕES NO GITHUB</text>
<line x1="28" y1="48" x2="${W - 28}" y2="48" stroke="${c.line}"/>
<g>${groups}</g>
<g>
<text class="m" x="${W - 28}" y="116" text-anchor="end" font-size="52" font-weight="800" letter-spacing="-2" fill="url(#hn)">${esc(total)}</text>
<text x="${W - 28}" y="142" text-anchor="end" font-size="16" font-weight="600" fill="${c.text}">contribuições nos últimos 12 meses</text>
<text class="m" x="${W - 28}" y="162" text-anchor="end" font-size="12" letter-spacing="0.5" fill="${c.muted}">${esc(fmtDate(cal.from))} a ${esc(fmtDate(cal.to))}</text>
${legend}
<text class="m" x="${28 + 5 * 17 + 6}" y="${H - 33}" font-size="11" fill="${c.dim}">menos → mais</text>
</g>
<text class="m" x="28" y="${H - 54}" font-size="11.5" letter-spacing="0.5" fill="${c.muted}">pico: ${peak.v} num dia (${esc(fmtDate(peakDay))})</text>`;
  void range;
  return svg({
    w: W, h: H, defs, css, body,
    title: `${total} contribuições no GitHub nos últimos 12 meses`,
    desc: `Calendário de contribuições de ${fmtDate(cal.from)} a ${fmtDate(cal.to)} em skyline isométrica: ${total} contribuições, pico de ${peak.v} num dia.`,
  });
}

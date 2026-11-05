// Biblioteca comum dos geradores de SVG do perfil: paleta (escuro/claro), escape,
// quebra de texto, envelope <svg> e o <picture> que troca a imagem pelo tema.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ASSETS = path.join(ROOT, 'assets');
export const REPO = 'gabrielscr/gabrielscr';
export const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main/assets`;

export const THEMES = ['dark', 'light'];

// Paleta da marca GROCHA Tech. O claro é uma paleta própria (não é o escuro invertido).
export const P = {
  dark: {
    bg: '#070B16', bg2: '#0B1226', panel: '#0D1530', panel2: '#121C3E', line: '#1F2D55',
    text: '#E6ECF7', muted: '#93A3C6', dim: '#5B6C93',
    blue: '#2563EB', cyan: '#22D3EE', violet: '#7C5CFF',
    green: '#34D399', amber: '#FBBF24', red: '#F87171', ink: '#04101F',
    glow: 0.9,
  },
  light: {
    bg: '#F3F6FD', bg2: '#E8EEFB', panel: '#FFFFFF', panel2: '#EEF3FE', line: '#C9D6F0',
    text: '#0B1330', muted: '#42557F', dim: '#6E7FA6',
    blue: '#1D4ED8', cyan: '#0E7490', violet: '#5B3FE0',
    green: '#047857', amber: '#B45309', red: '#B91C1C', ink: '#FFFFFF',
    glow: 0.35,
  },
};

export const SANS = `ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
export const MONO = `ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`;

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Largura estimada de texto (conservadora: sobra folga, nunca falta). */
export function textWidth(text, size, kind = 'sans') {
  const k = kind === 'bold' ? 0.62 : kind === 'mono' ? 0.61 : 0.55;
  return String(text).length * size * k;
}

/** Quebra por palavras em linhas que cabem em maxWidth. Reticências se passar de maxLines. */
export function wrap(text, maxWidth, size, maxLines = 99, kind = 'sans') {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (textWidth(test, size, kind) <= maxWidth || !cur) cur = test;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && textWidth(last + '…', size, kind) > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = last.replace(/[\s,;:.]+$/, '') + '…';
    return kept;
  }
  return lines;
}

/** Mistura de cores hex: t=0 -> a, t=1 -> b. */
export function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Gerador pseudoaleatório determinístico (mesma entrada, mesmo SVG: sem diffs à toa). */
export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export const num = (n) => (Math.round(n * 10) / 10).toString();

/**
 * Envelope SVG. `css` entra num <style>; o bloco de movimento reduzido derruba toda animação.
 * Como <img> o SVG não executa script nem busca recurso externo (nada disso é usado aqui).
 */
export function svg({ w, h, title, desc, body, css = '', defs = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc || title)}</desc>
<defs>${defs}</defs>
<style>
text{font-family:${SANS}}
.m{font-family:${MONO}}
${css}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
</style>
${body}
</svg>
`;
}

/** Fundo texturizado (gradiente radial + grade fina): nenhuma superfície lisa. */
export function textureDefs(t, id = 'bg') {
  const c = P[t];
  return `<radialGradient id="${id}A" cx="18%" cy="0%" r="95%"><stop offset="0" stop-color="${c.blue}" stop-opacity="${t === 'dark' ? 0.28 : 0.12}"/><stop offset="0.55" stop-color="${c.bg2}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}B" cx="100%" cy="100%" r="80%"><stop offset="0" stop-color="${c.cyan}" stop-opacity="${t === 'dark' ? 0.16 : 0.10}"/><stop offset="1" stop-color="${c.bg}" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}L" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg2}"/><stop offset="1" stop-color="${c.bg}"/></linearGradient>
<pattern id="${id}G" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${c.line}" stroke-opacity="${t === 'dark' ? 0.4 : 0.7}" stroke-width="1"/></pattern>`;
}

export function textureRect(w, h, rx, id = 'bg') {
  return `<rect width="${w}" height="${h}" rx="${rx}" fill="url(#${id}L)"/><rect width="${w}" height="${h}" rx="${rx}" fill="url(#${id}G)"/><rect width="${w}" height="${h}" rx="${rx}" fill="url(#${id}A)"/><rect width="${w}" height="${h}" rx="${rx}" fill="url(#${id}B)"/>`;
}

export function writeAsset(name, content) {
  fs.mkdirSync(ASSETS, { recursive: true });
  fs.writeFileSync(path.join(ASSETS, name), content);
}

/** <picture> com troca por tema; `alt` obrigatório. */
export function picture(base, alt, attrs = '') {
  const d = `${RAW_BASE}/${base}-dark.svg`;
  const l = `${RAW_BASE}/${base}-light.svg`;
  return `<picture><source media="(prefers-color-scheme: dark)" srcset="${d}"><source media="(prefers-color-scheme: light)" srcset="${l}"><img src="${d}" alt="${esc(alt)}" ${attrs}></picture>`;
}

export function readJson(rel, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); } catch { return fallback; }
}
export function writeJson(rel, data) {
  fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(data, null, 2) + '\n');
}

export const fmtInt = (n) => new Intl.NumberFormat('pt-BR').format(n);

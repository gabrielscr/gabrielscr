// Mapa de stack: cada tecnologia mostra em quantos projetos do portfólio ela aparece
// (contagem sobre `fullStack` de data/projects.json, que vem do site e dos repositórios, mais data/stack-evidence.json).
import { P, svg, esc, textureDefs, textureRect, num } from './lib.mjs';

const GROUPS = [
  { name: 'BACKEND E DADOS', items: ['.NET / C#', 'NestJS', 'PostgreSQL', 'Drizzle / Prisma', 'EF Core', 'SignalR'] },
  { name: 'MOBILE', items: ['Flutter / Dart', 'Kotlin', 'Swift'] },
  { name: 'WEB', items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'] },
  { name: 'JOGOS', items: ['Unity', 'Godot'] },
  { name: 'NUVEM E ENTREGA', items: ['Firebase', 'Cloudflare', 'GitHub Actions', 'Docker'] },
  { name: 'IA E PAGAMENTOS', items: ['GROCHA IA', 'OpenAI', 'Stripe', 'Mercado Pago'] },
];

// token do campo `stack` (e `kind`/repo) -> tecnologia canônica
const CANON = [
  [/^\.net|^c#$/i, '.NET / C#'], [/^nestjs$/i, 'NestJS'], [/^postgresql$/i, 'PostgreSQL'],
  [/^drizzle|^prisma/i, 'Drizzle / Prisma'], [/^ef core$/i, 'EF Core'], [/^signalr$/i, 'SignalR'],
  [/^flutter|^dart$/i, 'Flutter / Dart'], [/^kotlin$/i, 'Kotlin'], [/^swift$/i, 'Swift'],
  [/^next\.js$/i, 'Next.js'], [/^react$/i, 'React'], [/^typescript$/i, 'TypeScript'], [/^tailwind/i, 'Tailwind CSS'],
  [/^framer motion$/i, 'Framer Motion'], [/^unity/i, 'Unity'], [/^godot$/i, 'Godot'],
  [/^firebase/i, 'Firebase'], [/^cloudflare/i, 'Cloudflare'], [/^github actions$/i, 'GitHub Actions'], [/^docker$/i, 'Docker'],
  [/^grocha ia$/i, 'GROCHA IA'], [/^openai$/i, 'OpenAI'], [/^stripe$/i, 'Stripe'], [/^mercado pago$/i, 'Mercado Pago'],
];

export function tally(projects) {
  const counts = {};
  for (const p of projects) {
    const seen = new Set();
    for (const tok of (p.fullStack || [])) for (const [re, name] of CANON) if (re.test(tok.trim())) seen.add(name);
    for (const n of seen) counts[n] = (counts[n] || 0) + 1;
  }
  return counts;
}

export function stackModules(theme, projects, evidence) {
  const c = P[theme];
  const counts = tally(projects);
  for (const e of evidence || []) for (const tok of e.stack) counts[tok] = (counts[tok] || 0) + 1;
  const max = Math.max(...Object.values(counts), 1);
  const W = 264, ROW = 30, H = 34 + 6 * ROW + 50;
  const out = [];
  for (const g of GROUPS) {
    const items = g.items.filter((n) => counts[n]).sort((a, b) => counts[b] - counts[a]);
    if (!items.length) continue;
    const defs = textureDefs(theme, 'st') + `<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.blue}"/><stop offset="1" stop-color="${c.cyan}"/></linearGradient>`;
    const bx = 134, bwMax = W - 20 - bx - 30;
    let body = `${textureRect(W, H, 16, 'st')}
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="15.25" fill="none" stroke="${c.line}" stroke-width="1.5"/>
<text class="m" x="20" y="34" font-size="12" font-weight="700" letter-spacing="1.5" fill="${c.cyan}">${esc(g.name)}</text><line x1="20" y1="46" x2="${W - 20}" y2="46" stroke="${c.line}"/>`;
    items.forEach((n, i) => {
      const y = 58 + i * ROW;
      const bw = Math.max(8, (bwMax * counts[n]) / max);
      body += `<text x="20" y="${y + 14}" font-size="14.5" font-weight="600" fill="${c.text}">${esc(n)}</text>
<rect x="${bx}" y="${y + 4}" width="${bwMax}" height="11" rx="5.5" fill="${c.line}" opacity="0.55"/>
<rect x="${bx}" y="${y + 4}" width="${num(bw)}" height="11" rx="5.5" fill="url(#bar)"/>
<text class="m" x="${W - 20}" y="${y + 14}" text-anchor="end" font-size="13" font-weight="700" fill="${c.muted}">${counts[n]}</text>`;
    });
    body += `<text class="m" x="20" y="${H - 16}" font-size="11" letter-spacing="0.5" fill="${c.dim}">${items.length} ${items.length === 1 ? 'tecnologia' : 'tecnologias'}</text>`;
    out.push({ id: g.name.toLowerCase().normalize('NFD').replace(/[^a-z]+/g, '-'), name: g.name, svg: svg({ w: W, h: H, defs, body, title: 'Stack: ' + g.name, desc: g.name + ': ' + items.map((n) => n + ' (' + counts[n] + ')').join(', ') }), alt: 'Stack ' + g.name.toLowerCase() + ': ' + items.map((n) => n + ' em ' + counts[n]).join(', ') });
  }
  return out;
}

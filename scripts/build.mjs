// Gera todos os SVGs em assets/ e o README.md a partir de data/. Sem dependências.
//   node scripts/build.mjs            (usa o que já está em data/)
//   node scripts/fetch-data.mjs       (antes, para atualizar contribuições e LEDs)
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS, THEMES, esc, picture, readJson, writeAsset, ROOT, fmtInt, RAW_BASE } from './lib.mjs';
import { hero } from './hero.mjs';
import { skyline } from './skyline.mjs';
import { card, CARD_W } from './cards.mjs';
import { telemetryTile, sectionHeader, footerPanel, contactButton } from './panels.mjs';
import { stackModules } from './stack.mjs';

const data = readJson('data/projects.json');
const state = readJson('data/state.json', {});
const stats = readJson('data/stats.json');
const evidence = readJson('data/stack-evidence.json', []);
if (!stats?.contributions) throw new Error('data/stats.json sem calendário: rode scripts/fetch-data.mjs primeiro.');

// limpa os SVGs gerados antes (as miniaturas webp ficam)
for (const f of fs.existsSync(ASSETS) ? fs.readdirSync(ASSETS) : []) if (f.endsWith('.svg')) fs.unlinkSync(path.join(ASSETS, f));

/** Estado efetivo: o declarado, a menos que a medição prove queda (2 dias seguidos). */
const effective = (p) => (p.check && state[p.id]?.up === false ? 'offline' : p.status);
const label = (s) => data.statusLabels[s];
const isUp = (s) => s === 'live' || s === 'store';

const own = data.projects.filter((p) => p.own && isUp(effective(p)));
const gamesStore = data.projects.filter((p) => p.section === 'jogos' && effective(p) === 'store');
const weekly = stats.contributions.weeks.map((w) => w.reduce((a, b) => a + (b || 0), 0));
const tel = { productsLive: own.length };

const tiles = [
  { id: 'contrib', value: fmtInt(stats.contributions.total), label: 'contribuições nos últimos 12 meses', caption: '', spark: weekly },
  { id: 'repos', value: String(stats.publicRepos), label: 'repositórios públicos', caption: "API DO GITHUB" },
  { id: 'produtos', value: String(own.length), label: 'produtos no ar', caption: "LINKS MEDIDOS" },
  { id: 'jogos', value: String(gamesStore.length), label: 'jogos nas lojas', caption: "APP STORE · PLAY" },
];

let size = 0;
const emit = (name, content) => { writeAsset(name, content); size += content.length; if (content.length > 300 * 1024) throw new Error(`${name} passou de 300 KB`); };
const both = (base, fn) => { for (const t of THEMES) emit(`${base}-${t}.svg`, fn(t)); };

both('hero', (t) => hero(t, data.projects, tel));
for (const t of tiles) both(`tile-${t.id}`, (th) => telemetryTile(th, t));
both('skyline', (t) => skyline(t, stats.contributions));
const modules = stackModules('dark', data.projects, evidence);
const moduleAlts = [];
for (const m of modules) { both(`stack-${m.id}`, (t) => stackModules(t, data.projects, evidence).find((x) => x.name === m.name).svg); moduleAlts.push(m); }
both('footer', (t) => footerPanel(t));
const buttons = [
  { id: 'site', label: 'Site', hint: 'grochatech.com.br', url: 'https://grochatech.com.br', alt: 'Site da GROCHA Tech: grochatech.com.br' },
  { id: 'portfolio', label: 'Portfólio', hint: 'eu.grochatech.com.br', url: 'https://eu.grochatech.com.br', alt: 'Portfólio de Gabriel Rocha: eu.grochatech.com.br' },
  { id: 'whatsapp', label: 'WhatsApp', hint: '(19) 99611-5213', url: 'https://wa.me/5519996115213', alt: 'Conversar pelo WhatsApp: (19) 99611-5213' },
  { id: 'linkedin', label: 'LinkedIn', hint: 'in/gabrielscr', url: 'https://linkedin.com/in/gabrielscr', alt: 'Perfil no LinkedIn: in/gabrielscr' },
];
for (const b of buttons) both(`btn-${b.id}`, (t) => contactButton(t, b.label, b.hint));

// seções e cartões
const warnings = [];
const sectionsMd = [];
for (const sec of data.sections) {
  const list = data.projects.filter((p) => p.section === sec.id);
  const nUp = list.filter((p) => isUp(effective(p))).length;
  const nDev = list.filter((p) => effective(p) === 'development' || effective(p) === 'prelaunch').length;
  const parts = [`${list.length} ${list.length === 1 ? 'projeto' : 'projetos'}`];
  if (sec.id === 'ia') parts.push('uso interno');
  else {
    if (nUp) parts.push(`${nUp} no ar`);
    if (nDev) parts.push(`${nDev} em construção`);
  }
  const sub = parts.join(' · ');
  both(`section-${sec.id}`, (t) => sectionHeader(t, sec, list.length, sub));
  const cards = list.map((p) => {
    const eff = effective(p);
    const extra = p.repo ? { stars: stats.repos?.[p.id]?.stars > 0 ? stats.repos[p.id].stars : null } : {};
    for (const t of THEMES) {
      const r = card(t, p, eff, label(eff), extra);
      if (r.truncated && t === 'dark') warnings.push(`${p.id}: frase de valor truncada`);
      emit(`card-${p.id}-${t}.svg`, r.svg);
    }
    const alt = `${p.name} (${p.kind.toLowerCase()}, ${label(eff).toLowerCase()}): ${p.tagline}${p.url && eff !== 'offline' ? ' Abre ' + p.url.replace(/^https?:\/\//, '').replace(/\/$/, '') + '.' : ''}`;
    const img = picture(`card-${p.id}`, alt, `width="${CARD_W - 10}"`);
    return p.url && eff !== 'offline' ? `<a href="${p.url}">${img}</a>` : img;
  });
  sectionsMd.push(`<h2 align="center">${picture(`section-${sec.id}`, `${sec.title}: ${sub}`, 'width="100%"')}</h2>\n\n<p align="center">\n${cards.join('\n')}\n</p>`);
}

// README -----------------------------------------------------------------------------------
const tileImgs = tiles.map((t) => picture(`tile-${t.id}`, `${t.value} ${t.label}`, 'width="160"')).join('\n');
const stackImgs = moduleAlts.map((m) => picture(`stack-${m.id}`, m.alt, 'width="264"')).join('\n');
const btnImgs = buttons.map((b) => `<a href="${b.url}">${picture(`btn-${b.id}`, b.alt, 'width="160"')}</a>`).join('\n');

const textTable = data.sections.map((sec) => {
  const rows = data.projects.filter((p) => p.section === sec.id).map((p) => {
    const eff = effective(p);
    const link = p.url && eff !== 'offline' ? `[${p.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}](${p.url})` : '—';
    return `| ${p.name} | ${p.kind.charAt(0) + p.kind.slice(1).toLowerCase()} | ${label(eff).charAt(0) + label(eff).slice(1).toLowerCase()} | ${link} |`;
  });
  return `**${sec.title}**\n\n| Projeto | Tipo | Estado | Link |\n|---|---|---|---|\n${rows.join('\n')}`;
}).join('\n\n');

const readme = `<!-- Gerado por scripts/build.mjs a partir de data/. Edite data/ e scripts/, não este arquivo. -->
<h1 align="center">${picture('hero', 'Gabriel Rocha, GROCHA Tech. Mapa orbital com os produtos ao redor: ' + data.projects.filter((p) => p.hero).map((p) => p.hero.short).join(', ') + '. Do conceito ao lançamento.', 'width="100%"')}</h1>

<p align="center">
<b>Gabriel Rocha</b> · fundador da <a href="https://grochatech.com.br"><b>GROCHA Tech</b></a><br>
Desenvolvedor full-stack sênior · do conceito ao lançamento
</p>

<p align="center">
${tileImgs}
</p>

<p align="center">
${picture('skyline', `Skyline isométrica das contribuições no GitHub nos últimos 12 meses: ${fmtInt(stats.contributions.total)} contribuições, ${stats.publicRepos} repositórios públicos.`, 'width="100%"')}
</p>

${sectionsMd.join('\n\n')}

<h2 align="center">${picture('footer', 'Tem um projeto em mente? Software do conceito ao lançamento.', 'width="100%"')}</h2>

<p align="center">
${btnImgs}
</p>

<h2 align="center">Stack</h2>

<p align="center">
${stackImgs}
</p>

<details>
<summary><b>Tudo em texto</b> (lista de projetos, links e contatos)</summary>

<br>

${textTable}

**Contato:** [grochatech.com.br](https://grochatech.com.br) · [eu.grochatech.com.br](https://eu.grochatech.com.br) · [WhatsApp (19) 99611-5213](https://wa.me/5519996115213) · [LinkedIn](https://linkedin.com/in/gabrielscr)

</details>

<p align="center"><sub>Painel gerado por <a href="https://github.com/${'gabrielscr/gabrielscr'}/tree/main/scripts">scripts/</a> a partir de <code>data/projects.json</code>. Contribuições, repositórios e o LED de cada link são medidos todo dia pelo GitHub Actions; o link só aparece onde o endereço é público.</sub></p>
`;
fs.writeFileSync(path.join(ROOT, 'README.md'), readme);

const files = fs.readdirSync(ASSETS).filter((f) => f.endsWith('.svg'));
const total = files.reduce((a, f) => a + fs.statSync(path.join(ASSETS, f)).size, 0);
const biggest = files.map((f) => [f, fs.statSync(path.join(ASSETS, f)).size]).sort((a, b) => b[1] - a[1])[0];
console.log(`SVGs: ${files.length} | ${(total / 1024).toFixed(0)} KB | maior: ${biggest[0]} ${(biggest[1] / 1024).toFixed(0)} KB`);
if (warnings.length) console.warn('AVISOS:\n' + warnings.join('\n'));
void esc; void RAW_BASE; void size;

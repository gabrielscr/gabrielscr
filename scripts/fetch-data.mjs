// Busca dados públicos e mede os links. Não escreve segredo em lugar nenhum.
//   GITHUB_TOKEN (Actions) ou GH_TOKEN (local: `GH_TOKEN=$(gh auth token) node scripts/fetch-data.mjs`)
// Saídas: data/stats.json (contribuições, repositórios) e data/state.json (LED medido por projeto).
// Falha de rede em qualquer etapa mantém o arquivo anterior (nunca zera dado por erro).
import { readJson, writeJson } from './lib.mjs';

const LOGIN = 'gabrielscr';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const UA = 'gabrielscr-profile-readme/1.0 (+https://github.com/gabrielscr/gabrielscr)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = (url, init = {}) =>
  fetch(url, { ...init, headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}), ...(init.headers || {}) }, signal: AbortSignal.timeout(20000) });

async function fetchStats(prev) {
  const stats = { ...(prev || {}) };
  try {
    // contributionsCollection: from/to cobrem no máximo 1 ano; sem argumentos = últimos 12 meses.
    const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{firstDay contributionDays{contributionCount weekday date}}}}}}`;
    const res = await api('https://api.github.com/graphql', { method: 'POST', body: JSON.stringify({ query, variables: { login: LOGIN } }) });
    const json = await res.json();
    const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal || !cal.weeks?.length) throw new Error('calendário ausente: ' + JSON.stringify(json).slice(0, 200));
    const weeks = cal.weeks.map((w) => {
      const days = Array(7).fill(null);
      for (const d of w.contributionDays) days[d.weekday] = d.contributionCount;
      return days;
    });
    const last = cal.weeks[cal.weeks.length - 1].contributionDays.at(-1).date;
    stats.contributions = { total: cal.totalContributions, from: cal.weeks[0].firstDay, to: last, weeks };
  } catch (e) { console.warn('contribuições: mantido o dado anterior (' + e.message + ')'); }
  try {
    const u = await (await api(`https://api.github.com/users/${LOGIN}`)).json();
    if (typeof u.public_repos !== 'number') throw new Error('public_repos ausente');
    stats.publicRepos = u.public_repos;
  } catch (e) { console.warn('repositórios públicos: mantido o anterior (' + e.message + ')'); }
  return stats;
}

async function fetchRepos(projects, stats) {
  stats.repos = stats.repos || {};
  for (const p of projects.filter((x) => x.repo)) {
    try {
      const r = await (await api(`https://api.github.com/repos/${p.repo}`)).json();
      if (!r.full_name) throw new Error(r.message || 'sem resposta');
      stats.repos[p.id] = { stars: r.stargazers_count, language: r.language, license: r.license?.spdx_id ?? null, fork: r.fork, private: r.private, pushed: r.pushed_at?.slice(0, 10) };
    } catch (e) { console.warn(`repo ${p.repo}: mantido o anterior (${e.message})`); }
  }
}

/** ok | down | unknown. Só "down" é conclusivo; bloqueio de bot ou erro de rede é "unknown". */
async function probe(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(20000) });
    if (res.status >= 200 && res.status < 400) return 'ok';
    const protectedByBotWall = res.headers.has('cf-mitigated') || /cloudflare|akamai|sucuri|incapsula/i.test(res.headers.get('server') || '');
    if (res.status === 404 || res.status === 410) return 'down';
    if ([500, 502, 504].includes(res.status) && !protectedByBotWall) return 'down';
    return 'unknown'; // 401, 403, 429, 503 e demais: não prova queda
  } catch (e) {
    const code = e?.cause?.code || e?.code;
    return code === 'ENOTFOUND' ? 'down' : 'unknown'; // timeout, TLS, reset: inconclusivo
  }
}

async function checkLinks(projects, prev) {
  const state = { ...(prev || {}) };
  for (const p of projects.filter((x) => x.check && x.url)) {
    let verdict = 'unknown';
    for (let i = 0; i < 3 && verdict !== 'ok'; i++) {
      if (i) await sleep(3000);
      verdict = await probe(p.url);
      if (verdict === 'unknown' && i === 2) break;
    }
    const cur = state[p.id] || { up: true, fails: 0 };
    if (verdict === 'ok') state[p.id] = { up: true, fails: 0 };
    else if (verdict === 'down') {
      const fails = cur.fails + 1;
      // dois dias seguidos de queda conclusiva para virar "fora do ar" (evita piscar por manutenção)
      state[p.id] = { up: fails >= 2 ? false : cur.up, fails };
    } else state[p.id] = cur; // inconclusivo: mantém o último estado
    console.log(`${p.id.padEnd(18)} ${verdict.padEnd(8)} -> ${state[p.id].up ? 'no ar' : 'fora do ar'}`);
  }
  return state;
}

const data = readJson('data/projects.json');
const stats = await fetchStats(readJson('data/stats.json', {}));
await fetchRepos(data.projects, stats);
writeJson('data/stats.json', stats);
writeJson('data/state.json', await checkLinks(data.projects, readJson('data/state.json', {})));
console.log('contribuições:', stats.contributions?.total, '| repositórios públicos:', stats.publicRepos);

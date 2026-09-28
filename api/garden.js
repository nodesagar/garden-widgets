import { get, put } from '@vercel/blob';

// The little plot: which days each plant got watered. { "pranya": ["2026-09-28", ...], "sagar": [...] }
const FILE = 'garden.json';
const PLANTS = ['pranya', 'sagar'];
const MAX_DAYS = 5000;
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const json = (body, status = 200) => Response.json(body, { status, headers: { ...CORS, 'cache-control': 'no-store' } });

async function load() {
  const res = await get(FILE, { access: 'private', useCache: false });
  if (!res || res.statusCode !== 200) return {};
  return JSON.parse(await new Response(res.stream).text());
}

function view(g) {
  const key = today();
  const plants = {};
  for (const p of PLANTS) {
    const days = g[p] || [];
    plants[p] = { count: days.length, last: days[days.length - 1] || null, wateredToday: days.includes(key) };
  }
  return { date: key, plants };
}

export async function GET() {
  return json(view(await load()));
}

export async function POST(request) {
  const { plant } = await request.json().catch(() => ({}));
  if (!PLANTS.includes(plant)) return json({ error: 'unknown plant' }, 400);
  // ponytail: read-modify-write, last write wins; fine for two people
  const g = await load();
  const days = (g[plant] ||= []);
  const key = today();
  if (!days.includes(key) && days.length < MAX_DAYS) {
    days.push(key);
    await put(FILE, JSON.stringify(g), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' });
  }
  return json(view(g));
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

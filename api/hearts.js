import { get, put } from '@vercel/blob';

// Shared calendar hearts, stored as one small JSON file: { "2026-9-28": 1, ... }
const FILE = 'hearts.json';
const KEY = /^\d{4}-\d{1,2}-\d{1,2}$/;
const MAX_HEARTS = 5000;
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

async function load() {
  const res = await get(FILE, { access: 'private', useCache: false });
  if (!res || res.statusCode !== 200) return {};
  return JSON.parse(await new Response(res.stream).text());
}

export async function GET() {
  return Response.json(await load(), { headers: { ...CORS, 'cache-control': 'no-store' } });
}

export async function POST(request) {
  const { key } = await request.json().catch(() => ({}));
  if (typeof key !== 'string' || !KEY.test(key)) {
    return Response.json({ error: 'invalid key' }, { status: 400, headers: CORS });
  }
  // ponytail: read-modify-write, last write wins; fine for two people tapping, use Redis HSET if it ever races
  const hearts = await load();
  if (hearts[key]) delete hearts[key];
  else if (Object.keys(hearts).length >= MAX_HEARTS) return Response.json({ error: 'full' }, { status: 413, headers: CORS });
  else hearts[key] = 1;
  await put(FILE, JSON.stringify(hearts), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' });
  return Response.json(hearts, { headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

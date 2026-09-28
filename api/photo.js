import { get, put } from '@vercel/blob';

// The one shared photo in the living-room frame. Anyone can view it; changing it needs PHOTO_PASSCODE.
const FILE = 'photo';
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, x-passcode',
};

export async function GET() {
  const res = await get(FILE, { access: 'private', useCache: false });
  if (!res || res.statusCode !== 200) return new Response('no photo yet', { status: 404, headers: CORS });
  return new Response(res.stream, {
    headers: { ...CORS, 'content-type': res.blob.contentType, 'cache-control': 'no-store' },
  });
}

export async function POST(request) {
  const expected = process.env.PHOTO_PASSCODE;
  if (!expected || request.headers.get('x-passcode') !== expected) {
    return Response.json({ error: 'wrong passcode' }, { status: 401, headers: CORS });
  }
  const type = request.headers.get('content-type') || '';
  if (!TYPES.includes(type)) return Response.json({ error: 'jpeg, png or webp only' }, { status: 415, headers: CORS });
  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_BYTES) {
    return Response.json({ error: 'photo must be under 4 MB' }, { status: 413, headers: CORS });
  }
  await put(FILE, body, { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: type });
  return Response.json({ ok: true }, { headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

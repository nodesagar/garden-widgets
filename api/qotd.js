import { get, put } from '@vercel/blob';

// Question of the day. One JSON file: { "2026-09-28": { "q": 0, "a": { "pranya": "...", "sagar": "..." } }, ... }
const FILE = 'qotd.json';
const PEOPLE = ['pranya', 'sagar'];
const MAX_LEN = 1000;
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};
const QUESTIONS = [
  "What's your favorite song right now, and why?",
  'What always makes you smile, no matter what?',
  "What's a memory you cherish?",
  "What's your comfort food?",
  'If you could master one skill overnight, what would it be?',
  "What's the best advice you've ever received?",
  'What small thing made your week better?',
  'Which movie could you rewatch forever?',
  'If you had a free day with no plans, how would you spend it?',
  "What's something you're proud of but rarely talk about?",
  'Where in the world do you want to go next?',
  "What's your go-to way to relax after a long day?",
  'Which book or show changed how you think?',
  "What's the weirdest food combo you secretly love?",
  'What did you want to be when you were little?',
  "What's one app you couldn't live without?",
  "What's a dream project you'd build if time and money didn't matter?",
  "What's a song that instantly takes you back in time?",
  "What's a tiny habit that makes your life better?",
  'What are you most curious about lately?',
  'Mountains or beaches? Defend your answer.',
  "What's a goal you want to hit this year?",
  'Who has influenced you the most, and how?',
  "What's your favorite way to spend a rainy day?",
  'If your life had a theme song, what would it be?',
  "What's a place that feels like home to you?",
  "What's the last thing that made you laugh out loud?",
  "What's something new you'd like to learn this month?",
  "What's your favorite season and why?",
  'What would your perfect weekend look like?',
];

// Both of us are in India, so the day flips at IST midnight.
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const dayNumber = (key) => Math.floor(Date.parse(key) / 86400000);

async function load() {
  const res = await get(FILE, { access: 'private', useCache: false });
  if (!res || res.statusCode !== 200) return {};
  return JSON.parse(await new Response(res.stream).text());
}

function view(log) {
  const key = today();
  const entry = log[key] || { q: dayNumber(key) % QUESTIONS.length, a: {} };
  const history = Object.keys(log)
    .filter((k) => k !== key && Object.keys(log[k].a).length)
    .sort()
    .reverse()
    .map((k) => ({ date: k, question: QUESTIONS[log[k].q], answers: log[k].a }));
  return { date: key, question: QUESTIONS[entry.q], answers: entry.a, history };
}

const json = (body, status = 200) => Response.json(body, { status, headers: { ...CORS, 'cache-control': 'no-store' } });

export async function GET() {
  return json(view(await load()));
}

export async function POST(request) {
  const { action, who, text } = await request.json().catch(() => ({}));
  // ponytail: read-modify-write, last write wins; fine for two people, use Redis if it ever races
  const log = await load();
  const key = today();
  const entry = (log[key] ||= { q: dayNumber(key) % QUESTIONS.length, a: {} });

  if (action === 'skip') {
    if (Object.keys(entry.a).length) return json({ error: 'already answered' }, 409);
    entry.q = (entry.q + 1) % QUESTIONS.length;
  } else if (action === 'answer') {
    if (!PEOPLE.includes(who) || typeof text !== 'string' || text.length > MAX_LEN) return json({ error: 'invalid answer' }, 400);
    if (text.trim()) entry.a[who] = text.trim();
    else delete entry.a[who];
  } else {
    return json({ error: 'unknown action' }, 400);
  }

  await put(FILE, JSON.stringify(log), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' });
  return json(view(log));
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

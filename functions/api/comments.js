// Anonymous comments API — Cloudflare Pages Function
// Stores comments in KV and generates persona replies

import { PERSONA } from './chat.js';

const COMMENTS_KEY = 'site_comments';
const RATE_LIMIT_PREFIX = 'rate_limit:';
const MAX_COMMENTS = 200;
const MAX_NAME_LEN = 30;
const MAX_MESSAGE_LEN = 300;
const RATE_LIMIT_SEC = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const raw = await env.COMMENTS_KV.get(COMMENTS_KEY);
    const comments = raw ? JSON.parse(raw) : [];
    return json(comments);
  } catch (error) {
    console.error('Comments fetch error:', error);
    return json({ error: 'Failed to load comments' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Rate limiting
    const rateKey = RATE_LIMIT_PREFIX + clientIP;
    const lastSubmit = await env.COMMENTS_KV.get(rateKey);
    if (lastSubmit) {
      const elapsed = (Date.now() - parseInt(lastSubmit, 10)) / 1000;
      if (elapsed < RATE_LIMIT_SEC) {
        return json({ error: `请 ${Math.ceil(RATE_LIMIT_SEC - elapsed)} 秒后再发` }, 429);
      }
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim().slice(0, MAX_NAME_LEN) || '匿名';
    const message = String(body.message || '').trim();

    if (!message) {
      return json({ error: '消息不能为空' }, 400);
    }
    if (message.length > MAX_MESSAGE_LEN) {
      return json({ error: `消息不能超过 ${MAX_MESSAGE_LEN} 字` }, 400);
    }

    const comment = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name,
      message: message.slice(0, MAX_MESSAGE_LEN),
      time: new Date().toISOString(),
    };

    // Generate persona reply
    const reply = await generateReply(env, name, message);
    if (reply) {
      comment.reply = reply;
    }

    const raw = await env.COMMENTS_KV.get(COMMENTS_KEY);
    const comments = raw ? JSON.parse(raw) : [];

    if (comments.length >= MAX_COMMENTS) {
      comments.length = MAX_COMMENTS - 1;
    }

    comments.unshift(comment);

    await Promise.all([
      env.COMMENTS_KV.put(COMMENTS_KEY, JSON.stringify(comments)),
      env.COMMENTS_KV.put(rateKey, String(Date.now()), { expirationTtl: RATE_LIMIT_SEC }),
    ]);

    return json(comment, 201);
  } catch (error) {
    console.error('Comments post error:', error);
    return json({ error: 'Failed to save comment' }, 500);
  }
}

async function generateReply(env, guestName, message) {
  const apiKey = env.AI_API_KEY;
  const apiBase = env.AI_API_BASE || 'https://api.deepseek.com/v1';
  const model = env.AI_MODEL || 'deepseek-v4-flash';

  if (!apiKey) return null;

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: PERSONA },
          {
            role: 'user',
            content: `你的个人网站上有个叫"${guestName}"的人给你留言了："${message}"。请用你的真实风格回复这条留言。一定要简短，像你平时回QQ消息一样。`,
          },
        ],
        temperature: 0.9,
        max_tokens: 120,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('Reply generation failed:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Reply generation error:', error);
    return null;
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

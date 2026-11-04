/**
 * Cloudflare Pages Function: /api/highlights
 * Synchronizes user highlights and notes with Cloudflare KV / Waline session.
 * Gracefully degrades if HIGHLIGHTS_KV is not yet bound.
 */

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const user = url.searchParams.get('user');
  const isPublicOnly = url.searchParams.get('public') === 'true';

  if (!env.HIGHLIGHTS_KV) {
    return new Response(JSON.stringify({
      errno: 0,
      status: 'local_only',
      message: 'HIGHLIGHTS_KV is not bound in Cloudflare Pages dashboard. Using local storage.',
      highlights: {}
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    let key = user ? `user_hl:${user}` : null;

    if (!key) {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        key = `token_hl:${token.slice(0, 32)}`;
      }
    }

    if (!key) {
      return new Response(JSON.stringify({ errno: 1, errmsg: 'Missing user parameter or auth token', highlights: {} }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const raw = await env.HIGHLIGHTS_KV.get(key);
    let highlights = raw ? JSON.parse(raw) : {};

    if (isPublicOnly) {
      const filtered = {};
      for (const [id, hl] of Object.entries(highlights)) {
        if (hl.isPublic !== false) {
          filtered[id] = hl;
        }
      }
      highlights = filtered;
    }

    return new Response(JSON.stringify({ errno: 0, highlights }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ errno: 1, errmsg: err.message, highlights: {} }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.HIGHLIGHTS_KV) {
    return new Response(JSON.stringify({
      errno: 0,
      status: 'local_only',
      message: 'HIGHLIGHTS_KV is not bound in Cloudflare Pages dashboard. Stored in client localStorage.'
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return new Response(JSON.stringify({ errno: 1, errmsg: 'Unauthorized: Waline token required for cloud sync' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const highlights = body.highlights || {};

    const key = `token_hl:${token.slice(0, 32)}`;
    await env.HIGHLIGHTS_KV.put(key, JSON.stringify(highlights));

    return new Response(JSON.stringify({
      errno: 0,
      status: 'synced',
      count: Object.keys(highlights).length
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ errno: 1, errmsg: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

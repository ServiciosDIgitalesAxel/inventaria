const FALLBACK_GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzVWVGKwDHRIgi49n8vkK2hq652hHC293qNhHfWFfI1q3ipHjXW6Lozkj49tNGEYkGQ/exec";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS
  });
}

async function proxyGas(request, env, functionName) {
  const gasUrl = env.GAS_WEBAPP_URL || FALLBACK_GAS_WEBAPP_URL;

  if (!gasUrl) {
    return json(500, {
      ok: false,
      error: "Falta configurar GAS_WEBAPP_URL."
    });
  }

  if (!/^[A-Za-z0-9_]+$/.test(functionName)) {
    return json(400, {
      ok: false,
      error: "Funcion invalida."
    });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return json(400, {
      ok: false,
      error: "JSON invalido."
    });
  }

  const upstream = await fetch(gasUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      functionName,
      payload
    })
  });

  const text = await upstream.text();
  const pareceJson = text.trim().startsWith("{") || text.trim().startsWith("[");

  if (!pareceJson) {
    return json(502, {
      ok: false,
      error: "GAS no devolvio JSON. Revise que la Web App este implementada como 'Cualquier persona' y que Code.gs tenga doPost."
    });
  }

  return new Response(text, {
    status: upstream.ok ? 200 : upstream.status,
    headers: JSON_HEADERS
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/gas/")) {
      if (url.pathname === "/api/gas/ping" && request.method === "GET") {
        return json(200, {
          ok: true,
          runtime: "Cloudflare Worker",
          timestamp: new Date().toISOString()
        });
      }
      if (request.method !== "POST") {
        return json(405, {
          ok: false,
          error: "Use POST."
        });
      }
      const functionName = decodeURIComponent(url.pathname.replace("/api/gas/", ""));
      return proxyGas(request, env, functionName);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("INVENTARIA Worker activo, pero falta vincular Static Assets.", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }
};

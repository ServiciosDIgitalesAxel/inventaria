const FALLBACK_GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzVWVGKwDHRIgi49n8vkK2hq652hHC293qNhHfWFfI1q3ipHjXW6Lozkj49tNGEYkGQ/exec";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS
  });
}

async function handleRequest(request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/gas/")) {
    if (url.pathname === "/api/gas/ping" && request.method === "GET") {
      return json(200, {
        ok: true,
        runtime: "Cloudflare Worker",
        mode: "classic",
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
    return proxyGas(request, functionName);
  }

  if (typeof ASSETS !== "undefined") {
    return ASSETS.fetch(request);
  }

  return new Response("INVENTARIA Worker activo, pero falta vincular Static Assets.", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

async function proxyGas(request, functionName) {
  const gasUrl = typeof GAS_WEBAPP_URL !== "undefined" && GAS_WEBAPP_URL
    ? GAS_WEBAPP_URL
    : FALLBACK_GAS_WEBAPP_URL;

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
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
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

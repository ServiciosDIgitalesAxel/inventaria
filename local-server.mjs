import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const rootDir = resolve(".");
const port = Number(process.env.PORT || 5173);
const gasWebAppUrl = process.env.GAS_WEBAPP_URL || "";

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml; charset=utf-8"],
]);

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Connection": "close",
  });
  response.end(body);
}

async function readRequestJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleGasMock(request, response, pathname) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const functionName = pathname.replace("/api/gas/", "");
  const body = await readRequestJson(request);

  if (gasWebAppUrl) {
    const upstream = await fetch(gasWebAppUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        functionName,
        payload: body,
      }),
    });
    const text = await upstream.text();
    response.writeHead(upstream.ok ? 200 : upstream.status, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(text),
      "Connection": "close",
    });
    response.end(text);
    return;
  }

  if (functionName === "ping") {
    sendJson(response, 200, {
      ok: true,
      runtime: "localhost",
      message: body.message || body.args?.[0] || "Conectado",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  sendJson(response, 200, {
    ok: true,
    runtime: "localhost",
    functionName,
    payload: body,
    note: "Mock local. Agrega esta funcion en local-server.mjs si necesitas datos reales antes de pasar a GAS.",
  });
}

async function handleStaticFile(response, pathname) {
  const requestPath = pathname === "/" ? "/index.html" : pathname;
  const normalizedPath = normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(rootDir, normalizedPath);

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes.get(extname(filePath)) || "application/octet-stream",
      "Content-Length": file.length,
      "Connection": "close",
    });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (url.pathname.startsWith("/api/gas/")) {
      await handleGasMock(request, response, url.pathname);
      return;
    }

    await handleStaticFile(response, url.pathname);
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error.message,
    });
  }
});

server.listen(port, () => {
  console.log(`Local GAS preview: http://localhost:${port}`);
});

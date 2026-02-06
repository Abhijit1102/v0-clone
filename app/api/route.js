async function proxyRequest(request) {
  const { searchParams } = new URL(request.url);
  let targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing URL", { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    if (!parsed.pathname || parsed.pathname === "/") {
      parsed.pathname = "/index.html";
    }
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) {
    return new Response("Preview mode", { status: 204 });
  }

  const response = await fetch(parsed.toString(), {
    headers: {
      "user-agent": "Mozilla/5.0",
    },
  });

  let html = await response.text();
  html = injectBaseHref(html, parsed.origin + "/");

  return new Response(html, {
    status: response.status,
    headers: {
      "Content-Type": "text/html",
      "Content-Security-Policy": "frame-ancestors *",
    },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;


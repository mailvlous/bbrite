import { defineMiddleware } from "astro:middleware";
import { verifyAccessRequest } from "./lib/access";
import { getEnv } from "./lib/runtime";

function privateResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const result = await verifyAccessRequest(context.request, getEnv());

  if (!result.ok) {
    if (context.url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "Content-Type": "application/json",
          Pragma: "no-cache",
        },
      });
    }
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Type": "text/plain; charset=utf-8",
        Pragma: "no-cache",
      },
    });
  }

  context.locals.user = result.user;
  return privateResponse(await next());
});

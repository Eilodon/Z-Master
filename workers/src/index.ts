export interface Env {
    GEMINI_API_KEY: string;
    ALLOWED_ORIGIN: string;
    ENVIRONMENT?: string;
    RATE_LIMITER?: any; // Simple binding type
}

// Minimal type definitions for Cloudflare Workers
declare global {
    class WebSocketPair {
        0: WebSocket;
        1: WebSocket;
    }
    interface ResponseInit {
        webSocket?: WebSocket;
    }
    interface ExecutionContext {
        waitUntil(promise: Promise<any>): void;
        passThroughOnException(): void;
    }
}


export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // 1. INVARIANT: Strict Origin Check (Safe by Default)
        // Hardened: Deny UNLESS explicitly 'development' AND matching origin
        const origin = request.headers.get("Origin");
        const allowedOrigin = env.ALLOWED_ORIGIN || "http://localhost:5173";

        const isProduction = env.ENVIRONMENT !== 'development'; // Default to Production if undefined

        if (isProduction && origin !== allowedOrigin) {
            return new Response("Forbidden: Origin Violation (Strict)", { status: 403 });
        }

        // 2. INVARIANT: Rate Limiting (Token Bucket)
        // Giả sử dùng Cloudflare Rate Limiting API hoặc Durable Object đơn giản
        // Nếu binding RATE_LIMITER tồn tại (đã config trong wrangler.toml)
        if (env.RATE_LIMITER) {
            const ip = request.headers.get("CF-Connecting-IP") || "unknown";
            try {
                const { success } = await env.RATE_LIMITER.limit({ key: ip });
                if (!success) {
                    return new Response("Too Many Requests", { status: 429 });
                }
            } catch (e) {
                // Ignore if binding fails locally or mocking needed
                console.warn("Rate limit check failed", e);
            }
        }

        // CORs Preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": allowedOrigin,
                    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Upgrade, x-goog-api-client, x-goog-api-key",
                }
            });
        }

        const upgradeHeader = request.headers.get("Upgrade");
        const url = new URL(request.url);

        // Map worker path to Google API path
        // Client sends: http://worker/v1beta/models/gemini-pro:generateContent
        // Upstream: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=...

        // Default upstream base
        const upstreamBase = "https://generativelanguage.googleapis.com";

        // Construct upstream URL
        // We preserve the path from the worker request
        const path = url.pathname;
        const upstreamUrl = new URL(`${upstreamBase}${path}`);

        // Copy search params (preserve existing) and inject API Key
        url.searchParams.forEach((value, key) => {
            upstreamUrl.searchParams.append(key, value);
        });
        upstreamUrl.searchParams.append("key", env.GEMINI_API_KEY);

        // 2. WebSocket Proxy (for Live API)
        if (upgradeHeader === "websocket") {
            // WSS Upstream
            const upstreamWsUrl = upstreamUrl.toString().replace("https://", "wss://");

            try {
                const googleResponse = await fetch(upstreamWsUrl, {
                    method: "GET",
                    headers: {
                        "Upgrade": "websocket",
                        "Connection": "Upgrade",
                        "User-Agent": "Thay-Airlock/1.0"
                    }
                });

                if (googleResponse.status !== 101) {
                    return new Response(`Upstream Error: ${googleResponse.statusText}`, { status: 502 });
                }

                const googleSocket = (googleResponse as any).webSocket;
                if (!googleSocket) return new Response("No socket from upstream", { status: 502 });

                const [client, server] = Object.values(new WebSocketPair());

                server.accept();
                googleSocket.accept();

                server.addEventListener("message", e => googleSocket.send(e.data));
                googleSocket.addEventListener("message", e => server.send(e.data));
                server.addEventListener("close", () => googleSocket.close());
                googleSocket.addEventListener("close", () => server.close());

                return new Response(null, { status: 101, webSocket: client });

            } catch (e: any) {
                return new Response(`Proxy Error: ${e.message}`, { status: 500 });
            }
        }

        // 3. HTTP Proxy (for generateContent)
        // Clone request to modify headers/url
        const newRequest = new Request(upstreamUrl.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.body
        });

        try {
            const response = await fetch(newRequest);

            // Re-create response to add CORS headers
            const newResponse = new Response(response.body, response);
            newResponse.headers.set("Access-Control-Allow-Origin", allowedOrigin);

            return newResponse;
        } catch (e: any) {
            return new Response(`HTTP Proxy Error: ${e.message}`, { status: 500 });
        }
    },
};

export interface Env {
    GEMINI_API_KEY: string;
    ALLOWED_ORIGIN: string;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // 1. Invariant Check: Origin Security
        const origin = request.headers.get("Origin");
        const allowedOrigin = env.ALLOWED_ORIGIN || "http://localhost:5173";

        // Allow localhost for dev, but enforce strict check in prod
        // const isDev = allowedOrigin.includes("localhost");
        // if (!isDev && origin !== allowedOrigin) {
        //     return new Response("Forbidden: Invalid Origin", { status: 403 });
        // }

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

                const googleSocket = googleResponse.webSocket;
                if (!googleSocket) return new Response("No socket from upstream", { status: 502 });

                const [client, server] = Object.values(new WebSocketPair());

                server.accept();
                googleSocket.accept();

                server.addEventListener("message", e => googleSocket.send(e.data));
                googleSocket.addEventListener("message", e => server.send(e.data));
                server.addEventListener("close", () => googleSocket.close());
                googleSocket.addEventListener("close", () => server.close());
                // Handle errors?

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

        // Remove Host header to avoid conflicts? Request constructor usually handles this.
        // But we DO need to remove Origin potentially? 
        // Actually Google API expects secure context.

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

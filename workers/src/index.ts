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
        const isDev = allowedOrigin.includes("localhost");
        if (!isDev && origin !== allowedOrigin) {
            return new Response("Forbidden: Invalid Origin", { status: 403 });
        }

        const upgradeHeader = request.headers.get("Upgrade");
        if (!upgradeHeader || upgradeHeader !== "websocket") {
            return new Response("Expected Upgrade: websocket", { status: 426 });
        }

        // 2. Construct Gemini Upstream URL
        // Using Gemini 2.0 Flash Exp as standard
        const model = "models/gemini-2.0-flash-exp";
        const upstreamUrl = `wss://generativelanguage.googleapis.com/v1beta/${model}:live?key=${env.GEMINI_API_KEY}`;

        // 3. Establish Upstream Connection
        // We use the 'fetch' API to open a WebSocket to Google
        // Note: fetch(ws_url) returns a Response with a 'webSocket' property if successful switch
        // BUT Cloudflare Workers 'fetch' creates a standard WebSocket connection when used with Upgrade?
        // Actually, the standard pattern for Workers Pipe is:

        const [client, server] = Object.values(new WebSocketPair());

        // Connect to Google
        // Note: We need to forward the client's socket to Google.
        // But Google expects a direct connection. 
        // We act as a Man-in-the-Middle using Stream tunneling.

        // Option A: Direct Fetch Proxy (Easiest, but headers can be tricky)
        // const response = await fetch(upstreamUrl, {
        //     headers: { Upgrade: 'websocket' }
        // });
        // return response; 
        // ^ This exposes the key if we are not careful with redirects, but WS handshake usually safe.
        // HOWEVER, we want to inject the key in the URL, not headers.

        // Let's us do the manual piping for maximum control and logging if needed.

        // Make the request to Google
        // We replace the request URL with Google's URL, but keep the websocket upgrade headers
        // WARNING: fetch() with WebSocket in Workers is powerful but specific.

        try {
            const googleResponse = await fetch(upstreamUrl, {
                method: "GET",
                headers: {
                    "Upgrade": "websocket",
                    "Connection": "Upgrade",
                    "User-Agent": "Thay-Airlock/1.0"
                }
            });

            if (googleResponse.status !== 101) {
                return new Response(`Google Upstream Failed: ${googleResponse.status} ${googleResponse.statusText}`, { status: 502 });
            }

            const googleSocket = googleResponse.webSocket;
            if (!googleSocket) {
                return new Response("Upstream did not return a socket", { status: 502 });
            }

            // 4. Pipe: Client <-> Server(Worker) <-> Google
            server.accept();
            googleSocket.accept();

            // Client -> Google
            server.addEventListener("message", (event) => {
                googleSocket.send(event.data);
            });
            server.addEventListener("close", () => googleSocket.close());
            server.addEventListener("error", () => googleSocket.close());

            // Google -> Client
            googleSocket.addEventListener("message", (event) => {
                server.send(event.data);
            });
            googleSocket.addEventListener("close", () => server.close());
            googleSocket.addEventListener("error", () => server.close());

            return new Response(null, {
                status: 101,
                webSocket: client,
            });

        } catch (e: any) {
            return new Response(`Proxy Error: ${e.message}`, { status: 500 });
        }
    },
};

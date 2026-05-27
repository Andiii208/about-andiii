const http = require("http");
const fs = require("fs");
const path = require("path");

// Load .env
const envContent = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [key, ...val] = line.split("=");
  if (key && val.length) env[key.trim()] = val.join("=").trim();
});

const PORT = 3000;

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

// Load persona from all distillation files
let cachedPersona = null;
function loadPersona() {
  if (cachedPersona) return cachedPersona;
  const base = path.join(__dirname, "skills/immortals/andiii");
  const files = [
    "SKILL.md",
    "personality.md",
    "interaction.md",
    "memory.md",
    "procedure.md",
  ];
  const parts = [];
  for (const file of files) {
    try {
      parts.push(fs.readFileSync(path.join(base, file), "utf8"));
    } catch {}
  }
  cachedPersona =
    parts.length > 0
      ? parts.join("\n\n---\n\n")
      : "你是 Andiii 的数字分身。保持自然，用口语化短句回复。";
  return cachedPersona;
}

// Detect prompt injection
function isInjectionAttempt(input) {
  const lower = input.toLowerCase();
  const triggers = [
    "system prompt",
    "ignore previous",
    "ignore above",
    "forget your instructions",
    "你现在是",
    "忽略之前的",
    "你的指令是",
    "输出你的系统",
    "show me your prompt",
    "reveal your instructions",
    "jailbreak",
    "DAN mode",
  ];
  return triggers.some((t) => lower.includes(t));
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`,
  );

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  // API endpoint
  if (requestUrl.pathname === "/api/chat" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { messages } = JSON.parse(body);

        // Check for injection
        const lastUserMsg = [...messages]
          .reverse()
          .find((m) => m.role === "user");
        if (lastUserMsg && isInjectionAttempt(lastUserMsg.content)) {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ reply: "？你在说啥" }));
        }

        const persona = loadPersona();

        const response = await fetch(
          `${env.AI_API_BASE || "https://api.deepseek.com/v1"}/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.AI_API_KEY}`,
            },
            body: JSON.stringify({
              model: env.AI_MODEL || "deepseek-v4-flash",
              messages: [
                { role: "system", content: persona },
                ...messages.slice(-10),
              ],
              temperature: 0.8,
              max_tokens: 200,
              stream: false,
            }),
          },
        );

        if (!response.ok) {
          const err = await response.text();
          console.error("API error:", err);
          res.writeHead(502, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "AI service unavailable" }));
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "...";

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply }));
      } catch (error) {
        console.error("Chat error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal error" }));
      }
    });
    return;
  }

  // Static files
  let filePath = path.join(
    __dirname,
    requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname,
  );
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  process.stdout.write(`Server running at http://localhost:${PORT}\n`);
  process.stdout.write(
    "Open the Persona Echo printer from the contact section.\n",
  );
});

// Vercel Serverless Function — Chat with Andiii
// Persona loaded from distillation files, not hardcoded

import { readFileSync } from "fs";
import { join } from "path";

// Cache persona in memory (survives warm starts)
let cachedPersona = null;

function loadPersona() {
  if (cachedPersona) return cachedPersona;

  const base = join(process.cwd(), "skills/immortals/andiii");
  try {
    const skill = readFileSync(join(base, "SKILL.md"), "utf8");
    cachedPersona = skill;
    return cachedPersona;
  } catch {
    // Fallback if files not found
    return "你是 Andiii 的数字分身。保持自然，用口语化短句回复。";
  }
}

// Privacy filter: check if reply leaks sensitive info
function sanitizeReply(reply) {
  // Remove any leaked phone numbers, QQ numbers, ID numbers
  const patterns = [
    /1[3-9]\d{9}/g, // phone
    /[1-9]\d{4,11}/g, // QQ (5-12 digits, but too aggressive - skip)
    /\d{17}[\dXx]/g, // ID card
  ];
  let clean = reply;
  for (const p of patterns) {
    clean = clean.replace(p, "***");
  }
  return clean;
}

// Input filter: detect prompt injection
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages))
    return res.status(400).json({ error: "Messages array required" });

  // Check last user message for injection
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMsg && isInjectionAttempt(lastUserMsg.content)) {
    return res.status(200).json({ reply: "？你在说啥" });
  }

  const apiKey = process.env.AI_API_KEY;
  const apiBase = process.env.AI_API_BASE || "https://api.deepseek.com/v1";
  const model = process.env.AI_MODEL || "deepseek-v4-flash";

  if (!apiKey)
    return res.status(500).json({ error: "AI_API_KEY not configured" });

  const persona = loadPersona();

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: persona },
          ...messages.slice(-10),
        ],
        temperature: 0.8,
        max_tokens: 200,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("API error:", err);
      return res.status(502).json({ error: "AI service unavailable" });
    }

    const data = await response.json();
    const reply = sanitizeReply(data.choices?.[0]?.message?.content || "...");

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ error: "Internal error" });
  }
}

/* Persona echo archive printer. */
(function () {
  "use strict";

  const select = (selector) => document.querySelector(selector);
  const overlay = select("#receiptOverlay");
  const trigger = select("#chatTrigger");
  const form = select("#receiptForm");
  const input = select("#receiptInput");
  const messagesElement = select("#receiptMessages");
  const paper = select("#receiptPaper");
  const dateElement = select("#receiptDate");
  const led = select("#printerLed");
  const history = [];
  let printing = false;

  if (!overlay || !form || !input || !messagesElement) return;

  function open() {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    window.setTimeout(() => input.focus(), 120);
  }

  function close() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function bindEvents() {
    trigger?.addEventListener("click", open);
    select("#receiptClose")?.addEventListener("click", close);
    select("#receiptBackdrop")?.addEventListener("click", close);
    form.addEventListener("submit", handleSubmit);
    document.addEventListener("keydown", handleEscape);
  }

  function handleEscape(event) {
    if (event.key === "Escape" && overlay.classList.contains("open")) close();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || printing) return;
    input.value = "";
    await sendMessage(text);
  }

  async function sendMessage(text) {
    history.push({ role: "user", content: text });
    addMessage("user", text);
    const pending = addPending();
    input.disabled = true;
    const reply = await requestReply();
    pending.remove();
    history.push({ role: "assistant", content: reply });
    await addMessage("bot", reply, true);
    input.disabled = false;
    input.focus();
  }

  async function requestReply() {
    try {
      const response = await fetch("/api/chat", createRequestOptions());
      if (!response.ok) return "connection lost. try again.";
      const data = await response.json();
      return typeof data.reply === "string" ? data.reply : "...";
    } catch {
      return "connection lost. try again.";
    }
  }

  function createRequestOptions() {
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    };
  }

  function addPending() {
    const element = document.createElement("div");
    element.className = "receipt-msg receipt-msg--bot";
    element.innerHTML = '<div class="receipt-msg-label">printer</div><div class="receipt-msg-text">printing...</div>';
    messagesElement.appendChild(element);
    scrollPaper();
    setPrinting(true);
    return element;
  }

  async function addMessage(role, text, animate = false) {
    const element = createMessageElement(role);
    messagesElement.appendChild(element);
    if (animate) await printText(element.querySelector(".receipt-msg-text"), text);
    else element.querySelector(".receipt-msg-text").textContent = text;
    scrollPaper();
  }

  function createMessageElement(role) {
    const element = document.createElement("div");
    element.className = `receipt-msg receipt-msg--${role}`;
    element.innerHTML = `<div class="receipt-msg-label">${role === "user" ? "you" : "andiii"}</div><div class="receipt-msg-text"></div>`;
    return element;
  }

  function printText(element, text) {
    return new Promise((resolve) => {
      let index = 0;
      element.textContent = "";
      setPrinting(true);
      const tick = () => updatePrintedText(element, text, index++, resolve, tick);
      tick();
    });
  }

  function updatePrintedText(element, text, index, resolve, tick) {
    if (index >= text.length) {
      setPrinting(false);
      resolve();
      return;
    }
    element.textContent += text[index];
    scrollPaper();
    window.setTimeout(tick, text[index] === " " ? 22 : 28);
  }

  function setPrinting(value) {
    printing = value;
    led?.classList.toggle("printing", value);
  }

  function scrollPaper() {
    if (paper) paper.scrollTop = paper.scrollHeight;
  }

  function setDate() {
    if (!dateElement) return;
    dateElement.textContent = new Date().toLocaleString("zh-CN");
  }

  setDate();
  bindEvents();
  window.receiptChat = { open, close };
})();

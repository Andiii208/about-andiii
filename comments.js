/* Guestbook — anonymous comments with persona replies */
(function () {
  "use strict";

  const select = (s, root) => (root || document).querySelector(s);
  const selectAll = (s, root) => [...(root || document).querySelectorAll(s)];

  const form = select("#guestbookForm");
  const wall = select("#guestbookWall");
  const nameInput = select("#guestName");
  const messageInput = select("#guestMessage");
  const charCounter = select("#charCounter");
  const submitBtn = select("#guestbookSubmit");
  const emptyHint = select("#guestbookEmpty");

  if (!form || !wall) return;

  const API = "/api/comments";

  function formatTime(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function renderComment(comment) {
    const note = document.createElement("article");
    note.className = "guestbook-note";

    note.innerHTML = `
      <div class="guestbook-note-meta">
        <span class="guestbook-note-name">${escapeHtml(comment.name)}</span>
        <time class="guestbook-note-time">${formatTime(comment.time)}</time>
      </div>
      <p class="guestbook-note-message">${escapeHtml(comment.message)}</p>
      ${comment.reply ? `
        <div class="guestbook-reply">
          <span class="guestbook-reply-label">Andiii的数字分身</span>
          <p class="guestbook-reply-text">${escapeHtml(comment.reply)}</p>
        </div>
      ` : ""}
    `;

    return note;
  }

  function escapeHtml(str) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return str.replace(/[&<>"']/g, (ch) => map[ch]);
  }

  function showToast(text, type) {
    let toast = select(".guestbook-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "guestbook-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.className = `guestbook-toast is-${type} is-visible`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("is-visible"), 3000);
  }

  async function loadComments() {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("load failed");
      const comments = await res.json();

      // Clear existing notes but keep empty hint
      wall.querySelectorAll(".guestbook-note").forEach((n) => n.remove());

      if (comments.length === 0) {
        if (emptyHint) emptyHint.style.display = "";
      } else {
        if (emptyHint) emptyHint.style.display = "none";
        comments.forEach((c, i) => {
          const note = renderComment(c);
          note.style.animationDelay = `${i * 0.05}s`;
          wall.appendChild(note);
        });
      }
    } catch {
      // fail silently
    }
  }

  function autoResize() {
    messageInput.style.height = "auto";
    messageInput.style.height = messageInput.scrollHeight + "px";
  }

  function updateCounter() {
    const len = messageInput.value.length;
    charCounter.textContent = `${len} / 300`;
    charCounter.classList.toggle("is-full", len >= 280);
  }

  function setSubmitting(disabled) {
    submitBtn.disabled = disabled;
    submitBtn.querySelector("span").textContent = disabled ? "贴上中…" : "贴上去";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!message) {
      showToast("写点什么再贴吧", "error");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "提交失败", "error");
        return;
      }

      // Prepend new comment
      const note = renderComment(data);
      note.style.animation = "none";
      const firstNote = select(".guestbook-note", wall);
      if (firstNote) {
        wall.insertBefore(note, firstNote);
      } else {
        if (emptyHint) emptyHint.style.display = "none";
        wall.appendChild(note);
      }
      // Force reflow for animation
      note.offsetHeight;
      note.style.animation = "";

      messageInput.value = "";
      autoResize();
      updateCounter();

      if (data.reply) {
        showToast("数字分身已回复你的留言", "success");
      } else {
        showToast("已贴上", "success");
      }
    } catch {
      showToast("网络异常，稍后再试", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Init
  if (messageInput) {
    messageInput.addEventListener("input", () => {
      autoResize();
      updateCounter();
    });
  }

  form.addEventListener("submit", handleSubmit);
  loadComments();
})();

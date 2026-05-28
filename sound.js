/* Minimal Web Audio feedback for the digital museum. */
(function () {
  "use strict";

  let ctx = null;
  let unlocked = false;

  function ensureContext() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function unlock() {
    if (unlocked) return;
    ensureContext();
    unlocked = true;
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
  }

  /* one-time unlock on first user gesture */
  document.addEventListener("click", unlock, { once: false });
  document.addEventListener("touchstart", unlock, { once: false });

  function beep(freq, dur, vol) {
    if (!unlocked) return;
    const audio = ensureContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + dur);
  }

  function hoverSound() {
    beep(1200, 0.05, 0.015);
  }

  function clickSound() {
    beep(800, 0.1, 0.03);
  }

  function navSound() {
    if (!unlocked) return;
    const audio = ensureContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audio.currentTime + 0.3);
    gain.gain.setValueAtTime(0.025, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.3);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.35);
  }

  window.museumSound = { hoverSound, clickSound, navSound };
})();

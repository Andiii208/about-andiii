/* Main interaction layer for the digital museum. */
(function () {
  "use strict";

  const select = (selector, root = document) => root.querySelector(selector);
  const selectAll = (selector, root = document) => [...root.querySelectorAll(selector)];
  const hasGsap = () => typeof window.gsap !== "undefined";

  function createScrollEngine() {
    if (typeof window.Lenis === "undefined") return null;
    const engine = new window.Lenis({ duration: 1.2, smoothWheel: true });
    if (hasGsap() && window.ScrollTrigger) {
      engine.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => engine.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    }
    return engine;
  }

  function hideLoader() {
    const loader = select("#loader");
    const fill = select("#loaderFill");
    if (!loader) return;
    if (hasGsap() && fill) animateLoader(loader, fill);
    else window.setTimeout(() => loader.classList.add("is-hidden"), 500);
  }

  function animateLoader(loader, fill) {
    window.gsap.timeline()
      .to(fill, { width: "100%", duration: 0.9, ease: "power3.inOut" })
      .to(loader, { opacity: 0, duration: 0.55, ease: "power3.inOut" })
      .set(loader, { visibility: "hidden" });
  }

  function initCursor() {
    const cursor = select("#cursor");
    const follower = select("#cursorFollower");
    if (!cursor || !follower || window.innerWidth <= 900) return;
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const trail = { x: pointer.x, y: pointer.y };
    document.addEventListener("mousemove", (event) => updatePointer(pointer, event));
    requestAnimationFrame(() => moveCursor(cursor, follower, pointer, trail));
    bindCursorTargets();
    initCursorRegions();
  }

  function initCursorRegions() {
    selectAll(".section").forEach((section) => {
      section.addEventListener("mouseenter", () => {
        document.body.dataset.cursorRoom = section.dataset.room;
      });
    });
  }

  function updatePointer(pointer, event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }

  function moveCursor(cursor, follower, pointer, trail) {
    cursor.style.transform = `translate(${pointer.x}px, ${pointer.y}px) translate(-50%, -50%)`;
    trail.x += (pointer.x - trail.x) * 0.12;
    trail.y += (pointer.y - trail.y) * 0.12;
    follower.style.transform = `translate(${trail.x}px, ${trail.y}px) translate(-50%, -50%)`;
    requestAnimationFrame(() => moveCursor(cursor, follower, pointer, trail));
  }

  function bindCursorTargets() {
    const targets = selectAll("a, button, input, .statement-panel");
    targets.forEach((target) => {
      target.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
      target.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
    });
  }

  function initIntroAnimations() {
    if (!hasGsap()) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    const timeline = window.gsap.timeline({ delay: 0.2 });
    timeline.from(".nav", { y: -18, opacity: 0, duration: 0.7, ease: "power3.out" });
    timeline.from(["#heroEyebrow", "#heroSubtitle", ".hero-caption"], staggerIn(), "-=0.35");
    animateScrollSections();
  }

  function staggerIn() {
    return { y: 24, opacity: 0, duration: 0.85, stagger: 0.12, ease: "power3.out" };
  }

  function animateScrollSections() {
    /* section labels: slide from left */
    selectAll(".section-label").forEach((el) => {
      window.gsap.from(el, {
        x: -30, opacity: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });

    /* section titles: scale up from below */
    selectAll(".section-title").forEach((el) => {
      window.gsap.from(el, {
        y: 60, opacity: 0, scale: 0.95, duration: 1, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 82%" },
      });
    });

    /* world cards: stagger with rotateX */
    selectAll(".world-card").forEach((el, i) => {
      window.gsap.from(el, {
        y: 80, opacity: 0, rotateX: 8, duration: 0.9,
        delay: i * 0.15, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    /* thought tiles: stagger with slight rotation */
    selectAll(".thought-tile").forEach((el, i) => {
      window.gsap.from(el, {
        y: 50, opacity: 0, rotation: i % 2 === 0 ? -2 : 2,
        duration: 0.8, delay: i * 0.12, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });

    /* archive items: horizontal slide alternation */
    selectAll(".archive-item").forEach((el, i) => {
      window.gsap.from(el, {
        x: i % 2 === 0 ? -40 : 40, opacity: 0, duration: 0.7,
        delay: i * 0.1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });
  }

  function initNavigationCards() {
    selectAll("[data-page]").forEach((element) => {
      element.addEventListener("click", () => navigateFromData(element));
    });
  }

  function navigateFromData(element) {
    const page = element.getAttribute("data-page");
    if (page && window.museumNavigation) window.museumNavigation.navigateTo(page);
  }

  function initNavLinks() {
    selectAll(".nav-link[data-section]").forEach((link) => {
      link.addEventListener("click", (event) => handleSectionClick(event, link));
    });
  }

  function handleSectionClick(event, link) {
    event.preventDefault();
    const sectionId = link.getAttribute("data-section");
    if (window.museumNavigation?.currentPage() !== "home") {
      window.museumNavigation.navigateHomeThen(sectionId);
      return;
    }
    scrollToSection(sectionId);
  }

  function scrollToSection(sectionId) {
    const target = sectionId ? select(`#${sectionId}`) : null;
    if (!target) return;
    if (window.scrollEngine) window.scrollEngine.scrollTo(target, { duration: 1.25 });
    else target.scrollIntoView({ behavior: "smooth" });
  }

  function initLogo() {
    const logo = select("#navLogo");
    if (!logo) return;
    logo.addEventListener("click", handleLogoClick);
  }

  function handleLogoClick(event) {
    event.preventDefault();
    if (window.museumNavigation?.currentPage() !== "home") window.museumNavigation.navigateTo("home");
    else scrollToSection("hero");
  }

  function initTilt() {
    selectAll(".world-card, .statement-panel").forEach((card) => bindTilt(card));
  }

  function bindTilt(card) {
    card.addEventListener("mousemove", (event) => applyTilt(card, event));
    card.addEventListener("mouseleave", () => resetTilt(card));
  }

  function applyTilt(card, event) {
    card.style.transition = "none";
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
  }

  function resetTilt(card) {
    card.style.transition = "transform 0.5s var(--ease)";
    card.style.transform = "translateY(0) rotateX(0deg) rotateY(0deg)";
    card.addEventListener("transitionend", function handler() {
      card.style.transition = "";
      card.style.transform = "";
      card.removeEventListener("transitionend", handler);
    }, { once: true });
  }

  function initFooterTime() {
    const text = new Date().toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    selectAll("#footerTime, #footerTimeSub").forEach((element) => {
      element.textContent = `local time ${text}`;
    });
  }

  function initPhotoLightbox() {
    let overlay = select(".photo-lightbox");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "photo-lightbox";
      overlay.innerHTML = `
        <button class="photo-lightbox-close" aria-label="关闭">&times;</button>
        <img src="" alt="" />
        <div class="photo-lightbox-caption"></div>
      `;
      document.body.appendChild(overlay);

      const img = select("img", overlay);
      const caption = select(".photo-lightbox-caption", overlay);
      const closeBtn = select(".photo-lightbox-close", overlay);

      function openLightbox(src, alt) {
        img.src = src;
        img.alt = alt;
        caption.textContent = alt;
        overlay.classList.add("open");
      }

      function closeLightbox() {
        overlay.classList.remove("open");
      }

      closeBtn.addEventListener("click", closeLightbox);
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeLightbox();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeLightbox();
      });

      window._photoLightboxOpen = openLightbox;
    }

    selectAll(".photo-item").forEach((item) => {
      if (item._lightboxBound) return;
      item._lightboxBound = true;
      item.style.cursor = "none";
      item.addEventListener("click", () => {
        const image = select("img", item);
        if (image) window._photoLightboxOpen(image.src, image.alt);
      });
    });
  }

  function initHeroParallax() {
    if (!hasGsap()) return;
    const circles = selectAll(".hero-circle");
    circles.forEach((circle, i) => {
      window.gsap.to(circle, {
        y: -100 * (i + 1),
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1 },
      });
    });
    window.gsap.to("#heroTitle", {
      y: -60,
      opacity: 0,
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "60% top", scrub: 1 },
    });
  }

  function init() {
    window.scrollEngine = createScrollEngine();
    hideLoader();
    initCursor();
    initIntroAnimations();
    initHeroParallax();
    initNavigationCards();
    initNavLinks();
    initLogo();
    initTilt();
    initFooterTime();
    initAboutTime();
  }

  function initAboutTime() {
    const timeElement = select("#aboutTime");
    if (!timeElement) return;
    function updateTime() {
      const now = new Date();
      timeElement.textContent = now.toLocaleString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }
    updateTime();
    setInterval(updateTime, 1000);
  }

  window.museumUi = { initNavigationCards, initTilt, initFooterTime, scrollToSection, initPhotoLightbox, initAboutTime };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

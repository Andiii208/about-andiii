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
    const cursorState = { paused: false };
    document.addEventListener("mousemove", (event) => updatePointer(pointer, event));
    document.addEventListener("visibilitychange", () => {
      cursorState.paused = document.hidden;
      if (!cursorState.paused) requestAnimationFrame(() => moveCursor(cursor, follower, pointer, trail, cursorState));
    });
    requestAnimationFrame(() => moveCursor(cursor, follower, pointer, trail, cursorState));
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

  function moveCursor(cursor, follower, pointer, trail, cursorState) {
    if (cursorState?.paused) return;
    cursor.style.transform = `translate(${pointer.x}px, ${pointer.y}px) translate(-50%, -50%)`;
    trail.x += (pointer.x - trail.x) * 0.12;
    trail.y += (pointer.y - trail.y) * 0.12;
    follower.style.transform = `translate(${trail.x}px, ${trail.y}px) translate(-50%, -50%)`;
    requestAnimationFrame(() => moveCursor(cursor, follower, pointer, trail, cursorState));
  }

  function bindCursorTargets() {
    const targets = selectAll("a, button, input, .statement-panel");
    targets.forEach((target) => {
      if (target._cursorBound) return;
      target._cursorBound = true;
      target.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
      target.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
    });
  }

  function rebindCursorTargets() {
    bindCursorTargets();
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

    /* variable font optical sizing: 96 → 24 as user scrolls past hero */
    window.gsap.to("#heroTitle", {
      fontVariationSettings: '"opsz" 24',
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1 },
    });
  }

  function initSoundFeedback() {
    if (!window.museumSound) return;
    selectAll("a, button, .world-card, .thought-tile, .archive-item").forEach((el) => {
      el.addEventListener("mouseenter", () => window.museumSound.hoverSound());
      el.addEventListener("click", () => window.museumSound.clickSound());
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
    initSoundFeedback();
    initAnimationObserver();
  }

  const infiniteAnimSelectors = [
    ".about-line--1", ".about-line--2", ".statement-orbit",
    ".contact", ".contact-title",
    ".contact-footer span", ".about-avatar-ring",
    ".about-status-dot", ".project-rail",
    ".sub-hero", ".sub-hero span", ".sub-hero h1",
    ".printer-led", ".printer-label",
    ".printer-slot", ".receipt-header strong",
    ".thoughts-layout",
  ];

  function initAnimationObserver() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        entry.target.classList.toggle("anim-active", entry.isIntersecting);
      }),
      { rootMargin: "100px" },
    );
    selectAll(infiniteAnimSelectors.join(", ")).forEach((el) => {
      el.setAttribute("data-animate-infinite", "");
      observer.observe(el);
    });
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

  function initSoundRoom() {
    const trackList = select("#trackList");
    const vinylLabel = select("#vinylLabel");
    const vinylTitle = select("#vinylTitle");
    const vinylArtist = select("#vinylArtist");
    const vinylGlow = select("#vinylGlow");
    const lyricCurtain = select("#lyricCurtain");
    const curtainClose = select("#lyricCurtainClose");
    const curtainTitle = select("#curtainTitle");
    const curtainText = select("#curtainText");
    const curtainLabel = select("#curtainLabel");
    const curtainMeta = select("#curtainMeta");
    const particlesContainer = select("#lyricParticles");
    if (!trackList) return;

    const tracks = [
      { title: "天天", artist: "陶喆", album: "《I'm OK》", year: "1999", color: "#ff5b35",
        lyric: "那马路上天天都在塞\n而每个人天天在忍耐\n没有你日子很黑白\n原来这样就是恋爱",
        fragments: ["那马路上天天都在塞", "而每个人天天在忍耐", "原来这样就是恋爱"] },
      { title: "我们俩", artist: "郭顶", album: "《微微》", year: "2016", color: "#67d8ff",
        lyric: "你在左边\n我紧靠右\n第一张照片\n不太敢亲密的",
        fragments: ["你在左边", "我紧靠右", "第一张照片"] },
      { title: "蝴蝶", artist: "陶喆", album: "《黑色柳丁》", year: "2002", color: "#d7ff49",
        lyric: "每次一见到你\n心里好平静\n就像一只蝴蝶\n飞过废墟",
        fragments: ["每次一见到你", "心里好平静", "一只蝴蝶飞过废墟"] },
      { title: "爱爱爱", artist: "方大同", album: "《爱爱爱》", year: "2006", color: "#ff6b9d",
        lyric: "有一天翻开辞海找不到爱\n花不开树不摆还是更畅快\n爱还是会期待\n还是觉得孤单太失败",
        fragments: ["翻开辞海找不到爱", "花不开树不摆", "孤单太失败"] },
      { title: "Love Song", artist: "方大同", album: "《未来》", year: "2007", color: "#c084fc",
        lyric: "Love song\n一直想写一首 love song\n你给了我一首 love song\n那旋律让我疯狂",
        fragments: ["一直想写一首 love song", "你给了我一首 love song", "那旋律让我疯狂"] },
    ];

    let currentIndex = 0;
    let particleInterval = null;

    function selectTrack(index) {
      currentIndex = index;
      const track = tracks[index];

      // 更新 active 状态
      trackList.querySelectorAll(".track-item").forEach((item, i) => {
        item.classList.toggle("active", i === index);
        item.style.setProperty("--track-item-color", i === index ? track.color : "");
      });

      // 更新唱片标签
      if (vinylTitle) vinylTitle.textContent = track.title;
      if (vinylArtist) vinylArtist.textContent = track.artist;
      if (vinylLabel) vinylLabel.style.setProperty("--track-color", track.color);

      // 更新全局 CSS 变量
      document.documentElement.style.setProperty("--track-color", track.color);

      // 更新发光效果
      if (vinylGlow) vinylGlow.style.background = `radial-gradient(circle, ${track.color} 0%, transparent 70%)`;

      // 重启歌词粒子
      spawnParticles(track.fragments);
    }

    function spawnParticles(fragments) {
      if (particleInterval) clearInterval(particleInterval);
      if (!particlesContainer) return;
      particlesContainer.innerHTML = "";

      let count = 0;
      particleInterval = setInterval(() => {
        if (count > 16) { clearInterval(particleInterval); return; }
        const particle = document.createElement("span");
        particle.className = "lyric-particle";
        particle.textContent = fragments[count % fragments.length];
        const size = 0.7 + Math.random() * 0.5;
        particle.style.left = `${Math.random() * 80 + 10}%`;
        particle.style.top = `${Math.random() * 70 + 15}%`;
        particle.style.fontSize = `clamp(${size}rem, 1.2vw, ${size + 0.3}rem)`;
        particle.style.animationDelay = `${Math.random() * 2.5}s`;
        particle.style.animationDuration = `${7 + Math.random() * 7}s`;
        particle.style.transform = `rotate(${(Math.random() - 0.5) * 8}deg)`;
        particlesContainer.appendChild(particle);
        count++;
      }, 1200);
    }

    function openCurtain(index) {
      const track = tracks[index];
      if (!lyricCurtain) return;
      lyricCurtain.style.setProperty("--track-color", track.color);
      lyricCurtain.style.background = `rgba(5, 5, 6, 0.96)`;
      if (curtainLabel) curtainLabel.textContent = `${track.artist} · ${track.album}`;
      if (curtainTitle) curtainTitle.textContent = track.title;
      if (curtainMeta) curtainMeta.textContent = `${track.year} · ${track.album}`;
      if (curtainText) {
        const lines = track.lyric.split("\n");
        curtainText.innerHTML = lines.map(
          (line, i) => `<span class="lyric-line" style="transition-delay: ${0.4 + i * 0.12}s">${line}</span>`
        ).join("");
      }
      lyricCurtain.classList.add("open");
      window.setTimeout(() => {
        lyricCurtain.style.background = `linear-gradient(135deg, rgba(5, 5, 6, 0.96), ${track.color}15)`;
      }, 600);
    }

    function closeCurtain() {
      if (lyricCurtain) lyricCurtain.classList.remove("open");
    }

    // 绑定事件
    trackList.querySelectorAll(".track-item").forEach((item, index) => {
      item.addEventListener("click", () => {
        if (index === currentIndex) {
          openCurtain(index);
        } else {
          selectTrack(index);
        }
      });
      item.addEventListener("dblclick", () => openCurtain(index));
    });

    if (curtainClose) curtainClose.addEventListener("click", closeCurtain);
    if (lyricCurtain) {
      lyricCurtain.addEventListener("click", (e) => {
        if (e.target === lyricCurtain) closeCurtain();
      });
    }

    // 初始选中第一首
    selectTrack(0);
  }

  window.museumUi = { initNavigationCards, initTilt, initFooterTime, scrollToSection, initPhotoLightbox, initAboutTime, initSoundRoom, rebindCursorTargets };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

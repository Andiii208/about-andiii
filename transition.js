/* Hash navigation and gallery room transitions. */
(function () {
  "use strict";

  const select = (selector, root = document) => root.querySelector(selector);
  const pageNames = ["about", "photography", "coding", "music", "thoughts", "contact"];
  let activePage = "home";
  let isTransitioning = false;

  const overlay = createTransitionOverlay();

  function createTransitionOverlay() {
    const element = document.createElement("div");
    element.className = "page-transition-overlay";
    element.innerHTML = createPanelMarkup();
    document.body.appendChild(element);
    return element;
  }

  function createPanelMarkup() {
    const panels = Array.from({ length: 5 }, (_, index) => `<span class="pt-panel" style="left:${index * 20}%"></span>`);
    return `${panels.join("")}<strong class="pt-label"></strong>`;
  }

  function navigateTo(pageName) {
    if (isTransitioning || pageName === activePage) return;
    if (pageName !== "home" && !pageNames.includes(pageName)) return;
    isTransitioning = true;
    runTransition(pageName);
  }

  function runTransition(pageName) {
    if (window.gsap) runGsapTransition(pageName);
    else {
      swapPage(pageName);
      activePage = pageName;
      isTransitioning = false;
    }
  }

  function runGsapTransition(pageName) {
    const panels = overlay.querySelectorAll(".pt-panel");
    const label = overlay.querySelector(".pt-label");
    label.textContent = pageName === "home" ? "Andiii" : pageName;
    window.gsap.timeline({ onComplete: () => finishTransition(pageName) })
      .set(overlay, { display: "block" })
      .to(panels, { scaleY: 1, duration: 0.55, stagger: 0.045, ease: "power4.inOut" })
      .to(label, { opacity: 1, duration: 0.22 }, "-=0.18")
      .call(() => swapPage(pageName))
      .to(label, { opacity: 0, duration: 0.18 })
      .to(panels, { scaleY: 0, transformOrigin: "top", duration: 0.5, stagger: 0.035, ease: "power4.inOut" });
  }

  function finishTransition(pageName) {
    overlay.style.display = "none";
    activePage = pageName;
    isTransitioning = false;
  }

  function swapPage(pageName) {
    const mainContent = select("#mainContent");
    const pageContainer = select("#pageContainer");
    if (!mainContent || !pageContainer) return;
    pageName === "home" ? showHome(mainContent, pageContainer) : showSubPage(pageName, mainContent, pageContainer);
    window.scrollTo({ top: 0, behavior: "instant" });
    updateHash(pageName);
  }

  function showHome(mainContent, pageContainer) {
    mainContent.hidden = false;
    pageContainer.hidden = true;
    pageContainer.innerHTML = "";
    hideBackHint();
    window.galleryScene?.resume?.();
  }

  function showSubPage(pageName, mainContent, pageContainer) {
    const template = select(`#tpl-${pageName}`);
    if (!template) return;
    mainContent.hidden = true;
    pageContainer.hidden = false;
    pageContainer.className = `page-container page-${pageName}`;
    pageContainer.innerHTML = template.innerHTML;
    window.galleryScene?.pause?.();
    initializeSubPage(pageContainer);
    showBackHint();
  }

  function initializeSubPage(pageContainer) {
    bindBackButtons(pageContainer);
    bindSubChat(pageContainer);
    window.museumUi?.initNavigationCards?.();
    window.museumUi?.initTilt?.();
    animateSubPage(pageContainer);
    if (pageContainer.classList.contains("page-photography")) {
      window.museumUi?.initPhotoLightbox?.();
      initLazyImages(pageContainer);
    }
    if (pageContainer.classList.contains("page-about")) {
      window.museumUi?.initAboutTime?.();
    }
  }

  function initLazyImages(container) {
    const images = container.querySelectorAll("img[loading='lazy']");
    if (!images.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src || img.src;

            // 创建新图片预加载
            const preload = new Image();
            preload.onload = () => {
              img.src = src;
              img.classList.add("loaded");
              img.closest(".photo-item")?.classList.add("img-loaded");
            };
            preload.onerror = () => {
              // 加载失败也显示
              img.classList.add("loaded");
              img.closest(".photo-item")?.classList.add("img-loaded");
            };
            preload.src = src;

            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "200px" }
    );

    images.forEach((img) => observer.observe(img));
  }

  function bindBackButtons(pageContainer) {
    pageContainer.querySelectorAll(".page-back").forEach((button) => {
      button.addEventListener("click", () => navigateTo("home"));
    });
  }

  function bindSubChat(pageContainer) {
    const trigger = pageContainer.querySelector("#subChatTrigger");
    if (trigger) trigger.addEventListener("click", () => window.receiptChat?.open?.());
  }

  function animateSubPage(pageContainer) {
    if (!window.gsap) return;
    const tl = window.gsap.timeline({ delay: 0.1 });

    /* sub-hero: clip-path wipe reveal */
    const subHero = pageContainer.querySelector(".sub-hero");
    if (subHero) {
      tl.from(subHero, {
        clipPath: "inset(0 100% 0 0)",
        duration: 0.8,
        ease: "power4.inOut",
      });
    }

    /* sections: stagger from below */
    const sections = pageContainer.querySelectorAll("section");
    if (sections.length) {
      tl.from(sections, {
        y: 50, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out",
      }, "-=0.4");
    }
  }

  function updateHash(pageName) {
    const nextHash = pageName === "home" ? location.pathname : `#${pageName}`;
    history.pushState(null, "", nextHash);
  }

  function showBackHint() {
    const hint = select("#backHint");
    if (!hint) return;
    hint.classList.add("visible");
    window.setTimeout(() => hint.classList.remove("visible"), 4200);
  }

  function hideBackHint() {
    select("#backHint")?.classList.remove("visible");
  }

  function navigateHomeThen(sectionId) {
    navigateTo("home");
    window.setTimeout(() => window.museumUi?.scrollToSection?.(sectionId), 900);
  }

  function handleInitialHash() {
    const hash = window.location.hash.replace("#", "");
    if (pageNames.includes(hash)) window.setTimeout(() => navigateTo(hash), 350);
  }

  window.addEventListener("hashchange", handleInitialHash);
  window.museumNavigation = { navigateTo, navigateHomeThen, currentPage: () => activePage };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", handleInitialHash);
  else handleInitialHash();
})();

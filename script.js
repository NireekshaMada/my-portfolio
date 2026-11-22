const SOCIAL_LINKS = {
  github: "https://github.com/NireekshaMada",
  linkedin: "https://www.linkedin.com/in/nireeksha-mada-5812a2374",
  instagram: "https://www.instagram.com/nireeksha_mada/",
};
const PROJECT_LINKS = {
  "honey-chain": "https://github.com/NireekshaMada/HoneyChain",
  "routeless": "https://github.com/NireekshaMada/PromptBattleRouteless",
  "stayfix": "https://github.com/NireekshaMada/stayfix",
};

document.querySelectorAll("[data-repo]").forEach((button) => {
  const url = PROJECT_LINKS[button.dataset.repo];
  if (url) {
    button.href = url;
    button.target = "_blank";                
    button.rel = "noopener noreferrer";
  } else {
    button.remove();                     
  }
});

const SITE_CONFIG = {
  formspreeFormId: "mppdypll",
};

document.querySelectorAll("[data-link]").forEach((link) => {
  const url = SOCIAL_LINKS[link.dataset.link];
  if (url) {
    link.href = url;
  }
});

document.querySelectorAll("[data-handle]").forEach((element) => {
  const url = SOCIAL_LINKS[element.dataset.handle];
  if (url) {
    element.textContent = url.replace(/\/+$/, "").split("/").pop();
  }
});

const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#primary-nav");
const navLinks = document.querySelectorAll(".nav__link");

function openMenu() {
  nav.classList.add("is-open");                      
  document.body.classList.add("menu-open");         
  navToggle.setAttribute("aria-expanded", "true");   
  navToggle.setAttribute("aria-label", "Close menu");
}

function closeMenu() {
  nav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open menu");
}

navToggle.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});
navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

const desktopQuery = window.matchMedia("(min-width: 52rem)");
desktopQuery.addEventListener("change", (event) => {
  if (event.matches) {
    closeMenu();
  }
});

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const yearElement = document.querySelector("#year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible"); 
          observer.unobserve(entry.target);         
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  
  revealElements.forEach((element) => element.classList.add("is-visible"));
}
const themeToggle = document.querySelector(".theme-toggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const THEME_COLORS = { light: "#F6F4EF", dark: "#151514" };

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
  );

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", THEME_COLORS[theme]);
  }
}

themeToggle.addEventListener("click", () => {
  const nextTheme = getTheme() === "dark" ? "light" : "dark";
  if (!reducedMotionQuery.matches) {
    document.documentElement.classList.add("theme-transition");
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 400);
  }

  applyTheme(nextTheme);

  try {
    localStorage.setItem("theme", nextTheme);
  } catch (error) {

  }
});

applyTheme(getTheme());

document.querySelectorAll("[data-gallery]").forEach((gallery) => {
  const track = gallery.querySelector(".gallery__track");
  const slides = Array.from(gallery.querySelectorAll(".gallery__slide"));
  const countText = gallery.querySelector(".gallery__count");
  const nameText = gallery.querySelector(".gallery__name");
  const previousButton = gallery.querySelector(".gallery__arrow--prev");
  const nextButton = gallery.querySelector(".gallery__arrow--next");

  let currentIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));

  if (previousButton) {
    previousButton.disabled = currentIndex === 0;
  }
  if (nextButton) {
    nextButton.disabled = currentIndex === slides.length - 1;
  }

  function activate(index, moveFocus) {
    if (index === currentIndex && !moveFocus) {
      return;
    }

    gallery.dataset.direction = index > currentIndex ? "next" : "prev";
    currentIndex = index;

    slides.forEach((slide, i) => {
      const isActive = i === index;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-pressed", String(isActive)); 
    });

    const number = String(index + 1).padStart(2, "0");
    const total = String(slides.length).padStart(2, "0");
    countText.textContent = number + " / " + total;
    nameText.textContent = slides[index].dataset.caption;

    if (previousButton) {
      previousButton.disabled = index === 0;
    }
    if (nextButton) {
      nextButton.disabled = index === slides.length - 1;
    }

    gallery.classList.remove("is-changing");
    void gallery.offsetWidth;
    gallery.classList.add("is-changing");

    if (moveFocus) {
      slides[index].focus();
    }
  }

  function step(direction) {
    const next = Math.min(Math.max(currentIndex + direction, 0), slides.length - 1);
    activate(next, false);
  }

  if (previousButton) {
    previousButton.addEventListener("click", () => step(-1));
  }
  if (nextButton) {
    nextButton.addEventListener("click", () => step(1));
  }

  slides.forEach((slide, index) => {
    slide.addEventListener("click", () => activate(index, false));
  });

  gallery.addEventListener("keydown", (event) => {
    const focused = slides.indexOf(document.activeElement);
    if (focused === -1) {
      return;
    }

    let next = focused;
    if (event.key === "ArrowRight") next = Math.min(focused + 1, slides.length - 1);
    if (event.key === "ArrowLeft") next = Math.max(focused - 1, 0);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = slides.length - 1;

    if (next !== focused) {
      event.preventDefault();
      activate(next, true);
    }
  });
  const DRAG_START = 6;         
  let pointerId = null;          
  let pointerKind = "mouse";     
  let startX = 0;
  let startY = 0;
  let lastStepX = 0;             
  let dragging = false;          
  let didStep = false;           
  let wasDragged = false;        
  function stepSize() {
    if (pointerKind === "touch") {
      return Math.min(140, Math.max(90, track.clientWidth / 4));
    }
    return Math.min(120, Math.max(50, track.clientWidth / 8));
  }

  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;                    
    }
    pointerId = event.pointerId;
    pointerKind = event.pointerType;
    startX = lastStepX = event.clientX;
    startY = event.clientY;
    dragging = false;
    didStep = false;
    wasDragged = false;
  });

  track.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) {
      return;
    }

    if (!dragging) {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) < DRAG_START || Math.abs(dy) > Math.abs(dx)) {
        return;                  
      }
      dragging = true;
      wasDragged = true;
      track.classList.add("is-dragging");
      track.setPointerCapture(pointerId);   
    }

    const travelled = event.clientX - lastStepX;
    if (Math.abs(travelled) >= stepSize()) {
      step(travelled < 0 ? 1 : -1);          
      lastStepX = event.clientX;
      didStep = true;
    }
  });

  function endDrag(event) {
    if (event.pointerId !== pointerId) {
      return;
    }
    if (dragging && !didStep && event.type === "pointerup") {
      const total = event.clientX - startX;
      if (Math.abs(total) >= 30) {
        step(total < 0 ? 1 : -1);
      }
    }

    track.classList.remove("is-dragging");
    pointerId = null;
    dragging = false;
  }

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  track.addEventListener(
    "click",
    (event) => {
      if (wasDragged) {
        event.preventDefault();
        event.stopPropagation();
        wasDragged = false;
      }
    },
    true
  );

  track.addEventListener("dragstart", (event) => event.preventDefault());
  let wheelTotal = 0;
  let wheelLocked = false;
  let wheelTimer = null;

  track.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
        return;                  
      }
      event.preventDefault();   

      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheelLocked = false;     
        wheelTotal = 0;
      }, 160);

      if (wheelLocked) {
        return;
      }
      wheelTotal += event.deltaX;
      if (Math.abs(wheelTotal) >= 50) {
        step(wheelTotal > 0 ? 1 : -1);       
        wheelLocked = true;
      }
    },
    { passive: false }           
  );
});

const spyLinks = Array.from(document.querySelectorAll(".nav__link"));

function setActiveLink(sectionId) {
  spyLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === "#" + sectionId;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

if ("IntersectionObserver" in window) {
  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  spyLinks.forEach((link) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      spyObserver.observe(target);
    }
  });
}

document.querySelectorAll("[data-select-group]").forEach((group) => {
  let selectedCard = null;

  function setSelected(card, isSelected) {
    card.classList.toggle("is-selected", isSelected);
    const attribute = card.tagName === "BUTTON" ? "aria-pressed" : "aria-current";
    card.setAttribute(attribute, String(isSelected));
  }

  function selectCard(card) {
    if (selectedCard === card) {
      setSelected(card, false);            
      selectedCard = null;
      return;
    }
    if (selectedCard) {
      setSelected(selectedCard, false);   
    }
    setSelected(card, true);
    selectedCard = card;
  }

  group.addEventListener("click", (event) => {
    const card = event.target.closest("[data-selectable]");
    if (!card || !group.contains(card)) {
      return;
    }

    const inner = event.target.closest("button, a");
    if (inner && inner !== card) {
      return;
    }
    selectCard(card);
  });

  group.addEventListener("keydown", (event) => {
    const card = event.target;
    const isActivationKey = event.key === "Enter" || event.key === " ";
    if (isActivationKey && card.matches("[data-selectable]") && card.tagName !== "BUTTON") {
      event.preventDefault();            
      selectCard(card);
    }
  });
});

const portal = document.getElementById("portal");

if (portal) {
  if (document.documentElement.classList.contains("portal-active")) {
    runPortal(portal);
  } else {
    portal.remove();                     
  }
}

function runPortal(portalElement) {
  const root = document.documentElement;
  const pageParts = document.querySelectorAll(".site-header, main, .site-footer");
  const BEAM_HOLD = 600;                   
  let started = false;
  let finished = false;

  pageParts.forEach((part) => part.setAttribute("inert", ""));

  function markSeen() {
    try {
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = "portalSeen=1; path=/; SameSite=Lax" + secure;   
    } catch (error) {}
    try {
      sessionStorage.setItem("portalSeen", "1");
    } catch (error) {}
  }

  function finish() {
    if (finished) {
      return;
    }
    finished = true;
    markSeen();
    portalElement.remove();
    root.classList.remove("portal-active", "portal-running");
    pageParts.forEach((part) => part.removeAttribute("inert"));
  }

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function openOval() {
    portalElement.classList.add("is-opening");

    const width = portalElement.clientWidth;
    const height = portalElement.clientHeight;
    const startRx = 1;                     
    const startRy = height * 0.28;         
    const endRx = width;                  
    const endRy = height;
    const duration = 650;
    const startTime = performance.now();

    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const widthEase = ease(progress);
      const heightEase = ease(Math.min(Math.max((progress - 0.15) / 0.85, 0), 1));

      portalElement.style.setProperty("--rx", startRx + (endRx - startRx) * widthEase + "px");
      portalElement.style.setProperty("--ry", startRy + (endRy - startRy) * heightEase + "px");
      portalElement.style.setProperty("--wash", String(progress * 0.85));

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        portalElement.classList.add("is-fading");   
        setTimeout(finish, 230);
      }
    }

    requestAnimationFrame(frame);
  }

  function start() {
    if (started || finished) {
      return;
    }
    started = true;
    root.classList.add("portal-running");
    root.classList.remove("portal-active");

    if (reducedMotionQuery.matches) {
      portalElement.classList.add("is-quick");     
      setTimeout(finish, 230);
      return;
    }

    portalElement.classList.add("is-lit");        
    setTimeout(openOval, 220);                  
  }

  function whenReady() {
    const loaded = document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const heroPicture = document.querySelector(".hero-visual__img");
    const decoded = heroPicture && heroPicture.decode ? heroPicture.decode().catch(() => {}) : Promise.resolve();
    const giveUp = new Promise((resolve) => setTimeout(resolve, 3500));
    return Promise.race([Promise.all([loaded, fonts, decoded]), giveUp]);
  }

  whenReady().then(() => {
    setTimeout(start, reducedMotionQuery.matches ? 0 : BEAM_HOLD);
  });
  setTimeout(finish, 8000);
}

const pageRegions = document.querySelectorAll(".site-header, main, .site-footer");
let openPanel = null;
let panelOpener = null;

function openProjectPanel(panel, opener) {
  openPanel = panel;
  panelOpener = opener;
  panel.hidden = false;
  panel.scrollTop = 0;
  panel.classList.add("is-open");
  document.documentElement.classList.add("panel-open");
  pageRegions.forEach((region) => region.setAttribute("inert", ""));
  panel.querySelector("[data-close-panel]").focus({ preventScroll: true });
}

function closeProjectPanel() {
  if (!openPanel) {
    return;
  }
  openPanel.classList.remove("is-open");
  openPanel.hidden = true;
  document.documentElement.classList.remove("panel-open");
  pageRegions.forEach((region) => region.removeAttribute("inert"));
  if (panelOpener) {
    panelOpener.focus({ preventScroll: true });   
  }
  openPanel = null;
  panelOpener = null;
}

document.querySelectorAll("[data-open-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.openPanel);
    if (panel) {
      openProjectPanel(panel, button);
    }
  });
});

document.querySelectorAll("[data-close-panel]").forEach((button) => {
  button.addEventListener("click", closeProjectPanel);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && openPanel) {
    closeProjectPanel();
  }
});

const contactForm = document.getElementById("contact-form");

if (contactForm) {
  const nameField = contactForm.elements["name"];
  const emailField = contactForm.elements["email"];
  const messageField = contactForm.elements["message"];
  const trapField = contactForm.elements["_gotcha"];
  const submitButton = document.getElementById("cf-submit");
  const statusText = document.getElementById("cf-status");
  const notSetUpNote = document.getElementById("cf-note");
  const WAIT_BETWEEN_MESSAGES = 30000;    
  const MIN_MESSAGE_LENGTH = 10;
  let lastSentAt = 0;
  let sending = false;
  if (!SITE_CONFIG.formspreeFormId) {
    notSetUpNote.hidden = false;
  }

  function showStatus(text, state) {
    statusText.textContent = text;
    statusText.dataset.state = state || "info";
  }

  function setError(field, message) {
    const errorText = document.getElementById(field.id + "-error");
    errorText.textContent = message;
    if (message) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
    return message === "";
  }

  function checkName() {
    const value = nameField.value.trim();
    return setError(nameField, value.length >= 2 ? "" : "Please enter your name (at least 2 characters).");
  }

  function checkEmail() {
    const value = emailField.value.trim();
    if (value === "") {
      return setError(emailField, "Please enter your email address.");
    }
    const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    return setError(emailField, looksValid ? "" : "Please enter a valid email address, like name@example.com.");
  }

  function checkMessage() {
    const length = messageField.value.trim().length;
    if (length === 0) {
      return setError(messageField, "Please write a message.");
    }
    return setError(messageField, length >= MIN_MESSAGE_LENGTH ? "" : "Your message is a little short (at least " + MIN_MESSAGE_LENGTH + " characters).");
  }
  [[nameField, checkName], [emailField, checkEmail], [messageField, checkMessage]].forEach(([field, check]) => {
    field.addEventListener("blur", () => { if (field.value !== "" || field.hasAttribute("aria-invalid")) check(); });
    field.addEventListener("input", () => { if (field.hasAttribute("aria-invalid")) check(); });
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) {
      return;
    }

    if (trapField.value !== "") {
      return;
    }

    const results = [checkName(), checkEmail(), checkMessage()];
    if (results.includes(false)) {
      showStatus("Please fix the highlighted fields.", "error");
      const firstBad = [nameField, emailField, messageField].find((field) => field.hasAttribute("aria-invalid"));
      if (firstBad) {
        firstBad.focus();
      }
      return;
    }

    if (!SITE_CONFIG.formspreeFormId) {
      showStatus("This form is not set up yet, so your message was NOT sent.", "error");
      return;
    }

    const waitLeft = WAIT_BETWEEN_MESSAGES - (Date.now() - lastSentAt);
    if (lastSentAt && waitLeft > 0) {
      showStatus("Please wait " + Math.ceil(waitLeft / 1000) + " seconds before sending another message.", "info");
      return;
    }

    sending = true;
    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    showStatus("Sending your message…", "info");

    try {
      const response = await fetch("https://formspree.io/f/" + encodeURIComponent(SITE_CONFIG.formspreeFormId), {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(contactForm),
      });

      if (response.ok) {
        lastSentAt = Date.now();
        contactForm.reset();
        showStatus("Thank you. Your message has been sent.", "success");
      } else {
        let detail = "";
        try {
          const data = await response.json();
          if (data && Array.isArray(data.errors) && data.errors.length) {
            detail = " " + data.errors.map((item) => item.message).join(" ");
          }
        } catch (error) {}
        showStatus("Your message could not be sent." + detail + " Please try again later.", "error");
      }
    } catch (error) {
      showStatus("Could not reach the message service. Please check your internet connection and try again.", "error");
    } finally {
      sending = false;
      submitButton.disabled = false;
      submitButton.textContent = "Send Message";
    }
  });
}

const fineMouseQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const CURSOR_NATIVE_ZONES = "input, textarea, select, [contenteditable='true'], .gallery__track, iframe, embed, object";
const CURSOR_HOVER_TARGETS = "a, button, summary, label, [role='button'], [data-selectable]";

let cursorRing = null;
let cursorDot = null;

function startFollowCursor() {
  if (cursorRing || !fineMouseQuery.matches) {
    return;
  }

  const root = document.documentElement;
  cursorRing = document.createElement("div");
  cursorRing.className = "cursor-ring";
  cursorDot = document.createElement("div");
  cursorDot.className = "cursor-dot";
  cursorRing.setAttribute("aria-hidden", "true");
  cursorDot.setAttribute("aria-hidden", "true");
  document.body.append(cursorRing, cursorDot);

  let targetX = 0;
  let targetY = 0;
  let ringX = 0;
  let ringY = 0;
  let hasPosition = false;
  let animating = false;
  function animateRing() {
    const follow = reducedMotionQuery.matches ? 1 : 0.18;
    ringX += (targetX - ringX) * follow;
    ringY += (targetY - ringY) * follow;
    cursorRing.style.translate = ringX + "px " + ringY + "px";

    const stillMoving = Math.abs(targetX - ringX) > 0.1 || Math.abs(targetY - ringY) > 0.1;
    if (stillMoving) {
      requestAnimationFrame(animateRing);
    } else {
      animating = false;                  
    }
  }

  function onPointerMove(event) {
    if (event.pointerType === "touch") {
      return;
    }
    targetX = event.clientX;
    targetY = event.clientY;
    cursorDot.style.translate = targetX + "px " + targetY + "px";  

    if (!hasPosition) {                    
      hasPosition = true;
      ringX = targetX;
      ringY = targetY;
      root.classList.add("has-custom-cursor");
    }
    root.classList.add("cursor-visible");

    if (!animating) {
      animating = true;
      requestAnimationFrame(animateRing);
    }
  }

  function onPointerOver(event) {
    if (event.pointerType === "touch" || !(event.target instanceof Element)) {
      return;
    }
    const inNativeZone = event.target.closest(CURSOR_NATIVE_ZONES) !== null;
    const overInteractive = !inNativeZone && event.target.closest(CURSOR_HOVER_TARGETS) !== null;
    root.classList.toggle("cursor-native", inNativeZone);
    cursorRing.classList.toggle("is-hover", overInteractive);
    cursorDot.classList.toggle("is-hover", overInteractive);
  }

  function onPointerDown(event) {
    if (event.pointerType === "touch" || event.button !== 0) {
      return;
    }
    cursorRing.classList.add("is-down");
    if (!reducedMotionQuery.matches && !root.classList.contains("cursor-native")) {
      const ripple = document.createElement("div");
      ripple.className = "cursor-ripple";
      ripple.style.translate = event.clientX + "px " + event.clientY + "px";
      ripple.addEventListener("animationend", () => ripple.remove());
      document.body.append(ripple);
    }
  }

  function onPointerUp() {
    cursorRing.classList.remove("is-down");
  }

  function hideCursor() {
    root.classList.remove("cursor-visible");
  }

  function showCursor() {
    if (hasPosition) {
      root.classList.add("cursor-visible");
    }
  }

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerover", onPointerOver, { passive: true });
  document.addEventListener("pointerdown", onPointerDown, { passive: true });
  document.addEventListener("pointerup", onPointerUp, { passive: true });
  document.addEventListener("pointercancel", onPointerUp, { passive: true });
  root.addEventListener("mouseleave", hideCursor);  
  root.addEventListener("mouseenter", showCursor);
  window.addEventListener("blur", hideCursor);
  cursorRing.stopFollowing = () => {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);
    root.removeEventListener("mouseleave", hideCursor);
    root.removeEventListener("mouseenter", showCursor);
    window.removeEventListener("blur", hideCursor);
    root.classList.remove("has-custom-cursor", "cursor-visible", "cursor-native");
    cursorRing.remove();
    cursorDot.remove();
    cursorRing = null;
    cursorDot = null;
  };
}

startFollowCursor();
fineMouseQuery.addEventListener("change", () => {
  if (fineMouseQuery.matches) {
    startFollowCursor();
  } else if (cursorRing) {
    cursorRing.stopFollowing();
  }
});

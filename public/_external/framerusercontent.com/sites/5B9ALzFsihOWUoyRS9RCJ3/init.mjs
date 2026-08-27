
// --- C² & D² Native Typewriter Controller ---
(function() {
  function startTypewriter(el, words, typingSpeed, deletingSpeed, pauseDuration) {
    if (!el || el.__typewriterRunning) return;
    el.__typewriterRunning = true;
    let wordIdx = 0;
    let charIdx = words[0] ? words[0].length : 0;
    let isDeleting = false;
    
    // Find or create the primary text node before cursor
    let textNode = el.firstChild;
    if (!textNode || textNode.nodeType !== 3) {
      textNode = document.createTextNode(words[0] || "");
      el.insertBefore(textNode, el.firstChild);
    }
    
    function step() {
      let currentWord = words[wordIdx % words.length] || "";
      textNode.textContent = currentWord.slice(0, charIdx);
      if (!isDeleting && charIdx < currentWord.length) {
        charIdx++;
        globalThis.setTimeout(step, typingSpeed);
      } else if (!isDeleting && charIdx === currentWord.length) {
        isDeleting = true;
        globalThis.setTimeout(step, pauseDuration);
      } else if (isDeleting && charIdx > 0) {
        charIdx--;
        globalThis.setTimeout(step, deletingSpeed);
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        globalThis.setTimeout(step, 250);
      }
    }
    globalThis.setTimeout(step, 600);
  }

  function init() {
    let hero = document.querySelector(".framer-t7n6a2-container span[aria-live='polite']");
    if (hero) {
      startTypewriter(hero, ["[AI SaaS Apps]", "[Trading Bots]", "[Agent Swarms]", "[Bespoke AI]"], 70, 35, 1200);
    }
    let cta = document.querySelector(".framer-1rczhi4-container span[aria-live='polite']");
    if (cta) {
      startTypewriter(cta, ["[unified]", "[simplified]", "[streamlined]"], 75, 35, 1200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  globalThis.setTimeout(init, 300);
  globalThis.setTimeout(init, 1000);
})();


// --- C² & D² Performance Comparison Slider Controller ---
(function() {
  function initPerfSlider() {
    const container = document.querySelector(".framer-pq481k-container");
    if (!container) return;

    const allDivs = Array.from(container.querySelectorAll("div"));
    const clipDiv = allDivs[4];
    const dividerLine = allDivs[5];
    const handleSquare = allDivs[6];
    const leftTag = allDivs[7];
    const rightTag = allDivs[8];

    if (!clipDiv) return;

    let isDragging = false;
    let currentPct = 50;

    function applyPosition(pct) {
      pct = Math.max(1, Math.min(99, pct));
      currentPct = pct;

      const insetRight = 100 - pct;
      clipDiv.style.clipPath = "inset(0% " + insetRight + "% 0% 0%)";
      clipDiv.style.webkitClipPath = "inset(0% " + insetRight + "% 0% 0%)";

      if (dividerLine) dividerLine.style.left = pct + "%";
      if (handleSquare) handleSquare.style.left = pct + "%";
      if (leftTag) leftTag.style.right = "calc(" + (100 - pct) + "% + 16px)";
      if (rightTag) rightTag.style.left = "calc(" + pct + "% + 16px)";
    }

    function onPointerScrub(clientX) {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const x = clientX - rect.left;
      const pct = (x / rect.width) * 100;
      applyPosition(pct);
    }

    container.style.cursor = "ew-resize";
    container.style.pointerEvents = "auto";
    container.style.touchAction = "none";

    container.addEventListener("pointerdown", function(e) {
      isDragging = true;
      try { container.setPointerCapture(e.pointerId); } catch(err) {}
      onPointerScrub(e.clientX);
    }, true);

    container.addEventListener("pointermove", function(e) {
      onPointerScrub(e.clientX);
    }, true);

    container.addEventListener("mousemove", function(e) {
      onPointerScrub(e.clientX);
    }, true);

    window.addEventListener("pointerup", function() {
      isDragging = false;
    }, true);

    window.addEventListener("pointercancel", function() {
      isDragging = false;
    }, true);

    container.addEventListener("mouseleave", function() {
      if (isDragging) return;
      let start = currentPct;
      let target = 50;
      let startTime = performance.now();
      let duration = 300;

      function anim(now) {
        let elapsed = now - startTime;
        let p = Math.min(1, elapsed / duration);
        let ease = 1 - Math.pow(1 - p, 3);
        let val = start + (target - start) * ease;
        applyPosition(val);
        if (p < 1) {
          requestAnimationFrame(anim);
        } else {
          applyPosition(50);
        }
      }
      requestAnimationFrame(anim);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPerfSlider);
  } else {
    initPerfSlider();
  }
  globalThis.setTimeout(initPerfSlider, 300);
  globalThis.setTimeout(initPerfSlider, 800);
  globalThis.setTimeout(initPerfSlider, 2000);
})();

// --- C² & D² How It Works 4-Card Interactive Switcher ---
(function() {
  const CARDS_DATA = [
    {
      index: 0,
      title: "1. Concept Ideation (C²)",
      desc: "We define the system architecture, mathematical models, trading logic, and feature roadmap.",
      img: "/_external/framerusercontent.com/images/dBfahZDc1HsTHIPuk2qsOP0YsBQ--14pte2r.png"
    },
    {
      index: 1,
      title: "2. Product & UI Design (D²)",
      desc: "High-fidelity interactive UI design, component systems, data visualization grids, and user flows.",
      img: "/_external/framerusercontent.com/images/shPAeRHnsfHQy8YnN4xIpEn1d00--14pte2r.png"
    },
    {
      index: 2,
      title: "3. Custom Engineering & Bots",
      desc: "Full-stack development, LLM pipelines, exchange WebSockets, and autonomous multi-agent workers.",
      img: "/_external/framerusercontent.com/images/LQxvlANeHXobX2HulvnG4HKUew--14pte2r.png"
    },
    {
      index: 3,
      title: "4. Deploy, Test & Scale",
      desc: "Zero-downtime sovereign deployment, air-gapped security audits, telemetry dashboards, and 24/7 SLA.",
      img: "/_external/framerusercontent.com/images/4NexgLAt7lVwZrxwR9goWC59Yxw--14pte2r.png"
    }
  ];

  function setupHIWCards() {
    const section = document.querySelector("section[data-framer-name='How It Work Section']");
    if (!section) return;

    const cardWrap = section.querySelector("[data-framer-name='Card Wrap']");
    if (!cardWrap) return;

    const cards = Array.from(cardWrap.children);
    if (cards.length < 4) return;

    function activateCard(idx) {
      cards.forEach((card, i) => {
        const data = CARDS_DATA[i];
        if (!data) return;
        const isActive = (i === idx);

        card.style.cursor = "pointer";
        card.style.transition = "all 250ms cubic-bezier(0.16, 1, 0.3, 1)";

        const imgEl = card.querySelector("img");
        const titleEl = card.querySelector("p, h3, div[data-framer-name*='Title']");

        if (imgEl) {
          imgEl.src = data.img;
          imgEl.style.width = "40px";
          imgEl.style.height = "40px";
          imgEl.style.display = "block";
          imgEl.style.visibility = "visible";
          imgEl.style.opacity = "1";
          imgEl.style.transition = "all 250ms ease";
          
          if (isActive) {
            // Glowing electric blue filter matching C² & D² brand
            imgEl.style.filter = "invert(32%) sepia(98%) saturate(3000%) hue-rotate(215deg) brightness(102%) contrast(105%) drop-shadow(0 4px 12px rgba(0, 85, 255, 0.5))";
            imgEl.style.transform = "scale(1.15)";
          } else {
            // High-contrast clean outline
            imgEl.style.filter = "invert(20%) opacity(0.85)";
            imgEl.style.transform = "scale(1.0)";
          }
        }

        if (isActive) {
          card.style.borderTop = "2px solid rgb(0, 85, 255)";
          card.style.backgroundColor = "rgba(0, 85, 255, 0.03)";
          if (titleEl) {
            titleEl.style.color = "rgb(0, 85, 255)";
            titleEl.style.fontWeight = "600";
          }
        } else {
          card.style.borderTop = "1px solid rgba(0, 0, 0, 0.1)";
          card.style.backgroundColor = "transparent";
          if (titleEl) {
            titleEl.style.color = "rgb(26, 26, 26)";
            titleEl.style.fontWeight = "400";
          }
        }
      });
    }

    cards.forEach((card, i) => {
      card.onmouseenter = () => activateCard(i);
      card.onclick = () => activateCard(i);
    });

    activateCard(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupHIWCards);
  } else {
    setupHIWCards();
  }
  globalThis.setTimeout(setupHIWCards, 200);
  globalThis.setTimeout(setupHIWCards, 600);
  globalThis.setTimeout(setupHIWCards, 1500);
})();
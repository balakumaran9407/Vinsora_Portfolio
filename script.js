(() => {
  "use strict";

  /* ---------------------------------------------------------
     Hero centerpiece: a still, monochrome isometric
     architectural form, generated as SVG on milky white canvas.
     --------------------------------------------------------- */
  const svg = document.getElementById("monolith");
  if (svg) {
    const NS = "http://www.w3.org/2000/svg";
    const S = 34;                 // unit size
    const C = Math.cos(Math.PI / 6);
    const iso = (x, y, z) => [(x - y) * S * C, (x + y) * S * 0.5 - z * S];

    // Boxes listed back-to-front (painter's order): [x, y, z, w, d, h, tone]
    const boxes = [
      [0, 0, 0, 7.4, 7.4, 0.45, 0],     // plinth
      [0.6, 0.6, 0.45, 2.6, 2.6, 7.2, 1], // tall tower
      [3.4, 0.6, 0.45, 3.2, 2.6, 3.4, 0], // mid block
      [3.2, 0.3, 3.85, 3.7, 3.2, 0.32, 2],// cantilever slab
      [0.6, 3.7, 0.45, 2.6, 3.0, 1.6, 0], // low front block
      [4.4, 3.9, 0.45, 0.36, 2.9, 2.9, 2],// vertical fin
      [5.2, 4.6, 0.45, 1.6, 1.6, 0.9, 0]  // small cube
    ];

    const tones = [
      { top: "#FFFFFF", left: "#F4F4F6", right: "#E4E4E7" },          // 0: alabaster pearl plinth
      { top: "#FFFFFF", left: "#EBEBEF", right: "#D4D4D8" },          // 1: sculpted travertine tower
      { top: "#27272A", left: "#18181B", right: "#09090B" }           // 2: velvet obsidian cantilever
    ];

    const pts = (arr) => arr.map(p => iso(...p).map(n => n.toFixed(2)).join(",")).join(" ");
    const g = document.createElementNS(NS, "g");
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    boxes.forEach(([x, y, z, w, d, h, t]) => {
      const tone = tones[t];
      const faces = [
        // right face (x + w plane)
        { fill: tone.right, p: [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]] },
        // left face (y + d plane)
        { fill: tone.left, p: [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]] },
        // top face
        { fill: tone.top, p: [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]] }
      ];
      faces.forEach(f => {
        const poly = document.createElementNS(NS, "polygon");
        poly.setAttribute("points", pts(f.p));
        poly.setAttribute("fill", f.fill);
        poly.setAttribute("stroke", "rgba(9, 9, 11, 0.12)");
        poly.setAttribute("stroke-width", "0.75");
        poly.setAttribute("stroke-linejoin", "round");
        g.appendChild(poly);
        f.p.forEach(p => {
          const [sx, sy] = iso(...p);
          minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
        });
      });
    });

    // Faint horizontal floor lines on the tower's right face — window bands
    for (let i = 1; i < 9; i++) {
      const z = 0.45 + i * 0.8;
      const line = document.createElementNS(NS, "polyline");
      line.setAttribute("points", pts([[3.2, 0.6, z], [3.2, 3.2, z]]));
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "rgba(9, 9, 11, 0.18)");
      line.setAttribute("stroke-width", "0.7");
      if (z < 7.6) g.insertBefore(line, g.children[6]); // after tower faces
    }

    const pad = 40;
    svg.setAttribute("viewBox", `${(minX - pad).toFixed(1)} ${(minY - pad).toFixed(1)} ${(maxX - minX + pad * 2).toFixed(1)} ${(maxY - minY + pad * 2).toFixed(1)}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.appendChild(g);
  }

  /* ---------------------------------------------------------
     Menu overlay (mobile header trigger)
     with focus trap and accessibility handling
     --------------------------------------------------------- */
  const menu = document.getElementById("menuOverlay");
  const toggles = [document.getElementById("menuToggleMobile")].filter(Boolean);
  let lastActiveElement = null;
  let isOpen = false;
  let closeTimer = null;

  const getFocusableInMenu = () => {
    if (!menu) return [];
    const toggle = toggles.find(t => t.offsetParent !== null);
    const inside = [...menu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    return toggle ? [toggle, ...inside] : inside;
  };

  const setMenu = (open) => {
    isOpen = open;
    clearTimeout(closeTimer);
    toggles.forEach(t => {
      t.setAttribute("aria-expanded", String(open));
      t.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    if (open) {
      lastActiveElement = document.activeElement;
      menu.hidden = false;
      void menu.offsetWidth;
      menu.classList.add("is-open");
      document.body.style.overflow = "hidden";
      const firstLink = menu.querySelector("a[href]");
      if (firstLink) firstLink.focus();
    } else {
      menu.classList.remove("is-open");
      document.body.style.overflow = "";
      closeTimer = setTimeout(() => {
        menu.hidden = true;
        if (lastActiveElement && typeof lastActiveElement.focus === "function") {
          lastActiveElement.focus({ preventScroll: true });
        }
      }, 200);
    }
  };

  toggles.forEach(t => t.addEventListener("click", () => setMenu(!isOpen)));
  if (menu) {
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  }

  document.addEventListener("keydown", e => {
    if (!isOpen) return;
    if (e.key === "Escape") {
      setMenu(false);
      return;
    }
    if (e.key === "Tab") {
      const focusables = getFocusableInMenu();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------------------------------------------------------
     Top scroll progress + active section highlighting
     --------------------------------------------------------- */
  const bar = document.getElementById("scrollProgress");
  const headerLinks = [...document.querySelectorAll(".header__nav a")];
  const sections = [...document.querySelectorAll("main section[id]")];

  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;

    const probe = window.innerHeight * 0.35;
    let current = null, bestTop = -Infinity;
    sections.forEach(s => {
      const top = s.getBoundingClientRect().top;
      if (top <= probe && top > bestTop) { current = s; bestTop = top; }
    });

    const curId = current ? "#" + current.id : "";
    headerLinks.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === curId));

    ticking = false;
  };
  window.addEventListener("scroll", () => { 
    if (!ticking) { 
      ticking = true; 
      requestAnimationFrame(onScroll); 
    } 
  }, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     Contact form — validates, updates ARIA states, then 
     pre-fills email inquiry with fallback notice.
     --------------------------------------------------------- */
  const CONTACT_EMAIL = "hello@vinsora.com";
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll("[required]").forEach(el => {
        const valid = el.checkValidity() && el.value.trim() !== "";
        el.closest(".field")?.classList.toggle("has-error", !valid);
        el.setAttribute("aria-invalid", String(!valid));
        if (!valid) ok = false;
      });
      if (!ok) { 
        if (status) status.textContent = "Please complete the highlighted fields."; 
        return; 
      }

      const d = Object.fromEntries(new FormData(form));
      const subject = `Project inquiry — ${d.service || "General"}`;
      const body = `Name: ${d.name}\nEmail: ${d.email}\nService: ${d.service}\n\n${d.message}`;
      location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (status) status.textContent = "Opening your email app… You can also reach us directly at +91 73396 63729.";
    });

    form.addEventListener("input", e => {
      const f = e.target.closest(".field");
      if (f && (f.classList.contains("has-error") || e.target.getAttribute("aria-invalid") === "true") && e.target.checkValidity()) {
        f.classList.remove("has-error");
        e.target.removeAttribute("aria-invalid");
      }
    });
  }

  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();

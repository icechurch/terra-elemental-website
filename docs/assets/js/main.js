// Site-wide behavior: mobile menu, product filters, science tabs, field results gallery, quote form.
(function () {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // Mobile menu
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    const setOpen = (open) => {
      menu.classList.toggle("hidden", !open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      toggle.querySelector("[data-menu-open]").classList.toggle("hidden", open);
      toggle.querySelector("[data-menu-close]").classList.toggle("hidden", !open);
    };
    toggle.addEventListener("click", () => setOpen(menu.classList.contains("hidden")));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }

  // Product line filter (products.html), also driven by ?line=
  const group = document.querySelector("[data-filter-group]");
  if (group) {
    const buttons = group.querySelectorAll("[data-filter]");
    const sections = document.querySelectorAll("[data-line-section]");
    const apply = (line, push) => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === line)));
      sections.forEach((s) => s.classList.toggle("hidden", line !== "all" && s.dataset.lineSection !== line));
      if (push) {
        const url = new URL(location.href);
        if (line === "all") url.searchParams.delete("line"); else url.searchParams.set("line", line);
        history.replaceState(null, "", url);
      }
    };
    buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter, true)));
    const initial = new URLSearchParams(location.search).get("line");
    if (initial && group.querySelector(`[data-filter="${initial}"]`)) apply(initial, false);
  }

  // Tabs (science.html deep dive). Without JS every panel shows. #panel-id or #anything-inside-a-panel opens that tab.
  const tabs = document.querySelector("[data-tabs]");
  if (tabs) {
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    const panels = [...tabs.querySelectorAll("[data-tab-panel]")];
    const strip = tabs.querySelector('[role="tablist"]').parentElement;
    const select = (id, focus) => {
      buttons.forEach((b) => {
        const on = b.getAttribute("aria-controls") === id;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus({ preventScroll: true });
        // Scroll only the tab strip sideways (on phones), never the page.
        if (on) {
          const l = b.offsetLeft - strip.offsetLeft, r = l + b.offsetWidth;
          if (l < strip.scrollLeft) strip.scrollLeft = l - 16;
          else if (r > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = r - strip.clientWidth + 16;
        }
      });
      panels.forEach((p) => p.classList.toggle("hidden", p.id !== id));
    };
    buttons.forEach((b, i) => {
      b.addEventListener("click", () => {
        select(b.getAttribute("aria-controls"));
        history.replaceState(null, "", `#${b.getAttribute("aria-controls")}`);
      });
      b.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        select(buttons[(i + step + buttons.length) % buttons.length].getAttribute("aria-controls"), true);
      });
    });
    const fromHash = () => {
      const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      const panel = target && panels.find((p) => p === target || p.contains(target));
      if (!panel) return false;
      select(panel.id);
      requestAnimationFrame(() => (panel === target ? document.getElementById("deep-dive") : target).scrollIntoView());
      return true;
    };
    if (!fromHash()) select(panels[0].id);
    window.addEventListener("hashchange", fromHash);
  }

  // Field results: tag filter and photo/video detail view.
  const fieldData = document.getElementById("field-data");
  if (fieldData) {
    const items = JSON.parse(fieldData.textContent);
    const grid = document.querySelector("[data-field-grid]");
    const filter = document.querySelector("[data-field-filter]");
    let visible = items.map((x) => x.id);

    filter.querySelectorAll("[data-tag]").forEach((b) => b.addEventListener("click", () => {
      const tag = b.dataset.tag;
      filter.querySelectorAll("[data-tag]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      visible = [];
      grid.querySelectorAll("[data-tags]").forEach((li) => {
        const show = tag === "all" || li.dataset.tags.split(" ").includes(tag);
        li.classList.toggle("hidden", !show);
        if (show) visible.push(li.querySelector("[data-field-open]").dataset.fieldOpen);
      });
    }));

    const dlg = document.querySelector("[data-field-dialog]");
    const $ = (k) => dlg.querySelector(`[data-field-${k}]`);
    let current = null;
    const show = (id) => {
      const x = items.find((i) => i.id === id);
      current = id;
      const box = $("media");
      box.replaceChildren();
      if (x.video) {
        const v = document.createElement("video");
        Object.assign(v, { src: x.video, poster: x.image, controls: true, autoplay: true, muted: true, playsInline: true, loop: true });
        v.className = "max-h-[60dvh] w-full md:max-h-[calc(100dvh-1.5rem)]";
        if (x.captions) {
          const t = document.createElement("track");
          Object.assign(t, { kind: "captions", srclang: "en", label: "English", src: x.captions, default: true });
          v.append(t);
        }
        box.append(v);
      } else {
        // Show the already-loaded grid thumbnail while the full-size photo downloads.
        const img = document.createElement("img");
        Object.assign(img, { src: x.thumb, alt: x.title });
        const full = new Image();
        full.onload = () => { if (current === x.id) img.src = x.image; };
        full.src = x.image;
        img.className = "max-h-[55dvh] w-full object-contain md:max-h-[calc(100dvh-1.5rem)]";
        box.append(img);
      }
      $("title").textContent = x.title;
      $("caption").textContent = x.caption;
      $("stage").textContent = x.stage;
      $("doing").textContent = x.doing;
      $("fits").textContent = x.fits;
      const list = visible.includes(id) ? visible : items.map((i) => i.id);
      $("pos").textContent = `${list.indexOf(id) + 1} of ${list.length}`;
      dlg.querySelector(".overflow-y-auto")?.scrollTo(0, 0);
    };
    const move = (step) => {
      const list = visible.includes(current) ? visible : items.map((i) => i.id);
      show(list[(list.indexOf(current) + step + list.length) % list.length]);
    };
    document.querySelectorAll("[data-field-open]").forEach((el) => el.addEventListener("click", (e) => {
      if (typeof dlg.showModal !== "function") return; // very old browsers: follow the link to the photo
      e.preventDefault();
      show(el.dataset.fieldOpen);
      dlg.showModal();
    }));
    $("prev").addEventListener("click", () => move(-1));
    $("next").addEventListener("click", () => move(1));
    $("close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    });
    dlg.addEventListener("close", () => $("media").replaceChildren());
  }

  // Quote form: builds a pre-filled email (static hosting has no form backend).
  const form = document.querySelector("[data-quote-form]");
  if (form) {
    const f = form.elements; // form.name would be the form's own name attribute
    const product = new URLSearchParams(location.search).get("product");
    if (product && f.product.querySelector(`option[value="${CSS.escape(product)}"]`)) f.product.value = product;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const err = form.querySelector("[data-form-error]");
      const missing = [];
      if (!f.name.value.trim()) missing.push("your name");
      if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) missing.push("a valid email address");
      if (missing.length) {
        err.textContent = `Please add ${missing.join(" and ")}.`;
        err.classList.remove("hidden");
        (missing[0] === "your name" ? f.name : f.email).focus();
        return;
      }
      err.classList.add("hidden");
      const sel = f.product.selectedOptions[0];
      const lines = [
        ["Name", f.name.value],
        ["Organization", f.organization.value],
        ["Email", f.email.value],
        ["Phone", f.phone.value],
        ["Type of site", f.site.value],
        ["Approximate area", f.area.value],
        ["Product of interest", f.product.value ? sel.textContent : "Please recommend"],
      ].filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v.trim()}`);
      const body = `${lines.join("\n")}\n\n${f.message.value.trim()}`;
      const org = f.organization.value.trim();
      const subject = `Quote request${org ? ` – ${org}` : ""}`;
      const mailto = `mailto:info@terraelemental.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // No form service configured yet: fall back to a pre-filled email.
      const key = form.dataset.accessKey;
      if (!key) { location.href = mailto; return; }

      const btn = form.querySelector("[data-submit]");
      btn.disabled = true;
      const label = btn.innerHTML;
      btn.textContent = "Sending…";
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: key,
          subject,
          from_name: "Terra Elemental website",
          replyto: f.email.value.trim(),
          botcheck: f.botcheck.checked,
          Name: f.name.value.trim(),
          Organization: f.organization.value.trim(),
          Email: f.email.value.trim(),
          Phone: f.phone.value.trim(),
          "Type of site": f.site.value,
          "Approximate area": f.area.value.trim(),
          "Product of interest": f.product.value ? sel.textContent : "Please recommend",
          Message: f.message.value.trim(),
        }),
      })
        .then((res) => res.json().then((data) => { if (!res.ok || !data.success) throw new Error(data.message || "Submission failed"); }))
        .then(() => {
          form.reset();
          form.classList.add("hidden");
          const ok = document.querySelector("[data-form-success]");
          ok.classList.remove("hidden");
          ok.focus();
        })
        .catch(() => {
          err.innerHTML = `Sorry, your request couldn't be sent. Please try again, or <a class="font-semibold underline" href="${mailto}">email us directly</a>.`;
          err.classList.remove("hidden");
        })
        .finally(() => { btn.disabled = false; btn.innerHTML = label; });
    });
  }
})();

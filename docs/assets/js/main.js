// Site-wide behavior: mobile menu, product filters, quote form.
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
      location.href = `mailto:info@terraelemental.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();

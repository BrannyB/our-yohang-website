// Progressive enhancement only — the page works fully without this file.
document.documentElement.classList.add("js");

// Scrapbook items "settle" onto the page the first time they scroll into view.
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-set");
        observer.unobserve(entry.target);
      }
    }
  },
  { rootMargin: "0px 0px -10% 0px" }
);
document.querySelectorAll("[data-settle]").forEach((el) => observer.observe(el));

// Film strip: infinite loop, prev/next buttons, and mouse drag-to-scroll.
// Touch swipes and shift+wheel already work natively; this covers plain mice.
for (const root of document.querySelectorAll("[data-strip-root]")) {
  const strip = root.querySelector(".strip");
  if (!strip) continue;

  // Loop: clone the whole set on both sides and start in the middle copy.
  // Whenever the viewer nears an edge, jump back by exactly one set-width —
  // the content there is identical, so the jump is invisible.
  const originals = [...strip.children];
  const makeClones = () =>
    originals.map((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.removeAttribute("data-settle");
      return clone;
    });
  strip.prepend(...makeClones());
  strip.append(...makeClones());
  // Distance between an item and its clone one set over.
  const setWidth = () =>
    strip.children[originals.length].offsetLeft - strip.children[0].offsetLeft;
  strip.scrollLeft = setWidth();

  const wrap = () => {
    const w = setWidth();
    if (strip.scrollLeft < w * 0.5) strip.scrollLeft += w;
    else if (strip.scrollLeft >= w * 1.5) strip.scrollLeft -= w;
  };
  if ("onscrollend" in strip) {
    strip.addEventListener("scrollend", wrap);
  } else {
    let idle;
    strip.addEventListener("scroll", () => {
      clearTimeout(idle);
      idle = setTimeout(wrap, 150);
    });
  }

  const step = () => {
    const item = strip.querySelector("li");
    return item ? item.getBoundingClientRect().width + 40 : 360;
  };
  root
    .querySelector("[data-strip-prev]")
    ?.addEventListener("click", () => strip.scrollBy({ left: -step(), behavior: "smooth" }));
  root
    .querySelector("[data-strip-next]")
    ?.addEventListener("click", () => strip.scrollBy({ left: step(), behavior: "smooth" }));

  let dragging = false;
  let startX = 0;
  let startLeft = 0;
  strip.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    dragging = true;
    startX = e.clientX;
    startLeft = strip.scrollLeft;
    strip.classList.add("is-dragging");
    strip.setPointerCapture(e.pointerId);
  });
  strip.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    strip.scrollLeft = startLeft - (e.clientX - startX);
    // Wrap mid-drag too, shifting the drag anchor with the jump.
    const before = strip.scrollLeft;
    wrap();
    startLeft += strip.scrollLeft - before;
  });
  const endDrag = () => {
    dragging = false;
    strip.classList.remove("is-dragging");
  };
  strip.addEventListener("pointerup", endDrag);
  strip.addEventListener("pointercancel", endDrag);
}

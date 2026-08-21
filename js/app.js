import { fragrances, products, testimonials } from "./data.js";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function renderCollection() {
  const container = $("[data-collection]");
  if (!container) return;

  container.innerHTML = fragrances.map((item, index) => `
    <article class="fragrance-card reveal" style="--tone-a:${item.gradientTop};--tone-b:${item.gradientBottom}">
      <span class="fragrance-card__number">0${index + 1}</span>
      <span class="fragrance-card__ghost" aria-hidden="true">${item.moodWordFr}</span>
      <img class="fragrance-card__image" src="${item.image}" alt="${item.name} fragrance" loading="lazy" />
      <div class="fragrance-card__footer">
        <div><h3>${item.name}</h3><p>${item.scentFamily}</p></div>
        <span class="fragrance-card__mood">${item.moodWord}</span>
      </div>
    </article>
  `).join("");
}

function renderProducts() {
  $$('[data-products]').forEach((container) => {
    const category = container.dataset.products;
    container.innerHTML = products.filter((item) => item.category === category).map((item) => `
      <article class="product-card reveal">
        <div class="product-card__visual"><img src="${item.image}" alt="${item.title}" loading="lazy" /></div>
        <div class="product-card__content">
          <p class="eyebrow">${item.overline}</p>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <p class="product-card__price">${item.price}</p>
        </div>
      </article>
    `).join("");
  });
}

function renderTestimonials() {
  const container = $("[data-testimonials]");
  if (!container) return;

  container.innerHTML = testimonials.map((item) => `
    <article class="testimonial reveal">
      <div class="testimonial__stars" aria-label="5 out of 5 stars">★★★★★</div>
      <blockquote>“${item.quote}”</blockquote>
      <cite>${item.author}</cite>
    </article>
  `).join("");
}

function setupMoodChamber() {
  const section = $("[data-mood]");
  const options = $("[data-mood-options]");
  if (!section || !options) return;

  options.innerHTML = fragrances.map((item, index) => `
    <button class="mood-option" type="button" data-mood-index="${index}" style="--accent:${item.accentColor}" aria-pressed="false">
      <span class="mood-option__ring"><span class="mood-option__dot"></span></span>
      <span>${item.name}</span>
    </button>
  `).join("");

  const selectMood = (index) => {
    const item = fragrances[index];
    section.style.setProperty("--mood-a", item.gradientTop);
    section.style.setProperty("--mood-b", item.gradientBottom);
    $("[data-mood-label]", section).textContent = "Selected fragrance";
    $("[data-mood-name]", section).textContent = item.name;
    $("[data-mood-word]", section).textContent = item.moodWord;
    $("[data-mood-description]", section).textContent = item.description;
    $("[data-mood-words]", section).textContent = `${item.name} · ${item.moodWordFr} · ${item.name}`;

    $$("[data-mood-index]", options).forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };

  options.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mood-index]");
    if (button) selectMood(Number(button.dataset.moodIndex));
  });

  section.addEventListener("pointermove", (event) => {
    const bounds = section.getBoundingClientRect();
    section.style.setProperty("--mood-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    section.style.setProperty("--mood-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  });
}

function setupNavigation() {
  const header = $("[data-header]");
  const button = $("[data-menu-button]");
  const menu = $("[data-menu]");
  if (!header || !button || !menu) return;

  const closeMenu = () => {
    button.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  button.addEventListener("click", () => {
    const willOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(willOpen));
    menu.classList.toggle("is-open", willOpen);
    document.body.classList.toggle("menu-open", willOpen);
  });
  menu.addEventListener("click", (event) => { if (event.target.matches("a")) closeMenu(); });
  window.addEventListener("resize", () => { if (window.innerWidth > 767) closeMenu(); });
  window.addEventListener("scroll", () => header.classList.toggle("is-scrolled", window.scrollY > 40), { passive: true });
}

function setupHeroPointer() {
  const hero = $("[data-hero]");
  const glow = $("[data-hero-glow]");
  if (!hero || !glow) return;

  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    glow.style.setProperty("--mx", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    glow.style.setProperty("--my", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  });
}

function setupRevealAnimations() {
  const elements = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

  elements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
    observer.observe(element);
  });
}

function setupNewsletter() {
  const form = $("[data-newsletter]");
  const message = $("[data-newsletter-message]");
  if (!form || !message) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    message.textContent = "Thank you. Your private dispatch is confirmed.";
    form.reset();
  });
}

function finishLoading() {
  const loader = $(".page-loader");
  window.setTimeout(() => loader?.classList.add("is-hidden"), 450);
}

function init() {
  renderCollection();
  renderProducts();
  renderTestimonials();
  setupMoodChamber();
  setupNavigation();
  setupHeroPointer();
  setupRevealAnimations();
  setupNewsletter();
  finishLoading();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

const pages = [...document.querySelectorAll("[data-page]")];
const navLinks = [...document.querySelectorAll(".main-nav a")];
const routeLinks = [...document.querySelectorAll("[data-route]")];
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const availabilityButton = document.querySelector("[data-availability-button]");
const availabilityStatus = document.querySelector("[data-availability-status]");
const contactButton = document.querySelector("[data-contact-button]");
const contactStatus = document.querySelector("[data-contact-status]");
const contactName = document.querySelector("[data-contact-name]");
const contactArrival = document.querySelector("[data-contact-arrival]");
const contactNights = document.querySelector("[data-contact-nights]");
const contactRoom = document.querySelector("[data-contact-room]");
const contactGuests = document.querySelector("[data-contact-guests]");
const checkInInput = document.querySelector("[data-check-in]");
const checkOutInput = document.querySelector("[data-check-out]");
const defaultPage = document.body.dataset.defaultPage || "home";

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setDefaultStayDates() {
  if (!checkInInput || !checkOutInput) {
    return;
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  checkInInput.value = formatDateInputValue(today);
  checkInInput.min = formatDateInputValue(today);
  checkOutInput.value = formatDateInputValue(tomorrow);
  checkOutInput.min = formatDateInputValue(tomorrow);
}

function normalizeRoute(value) {
  return value.replace(/^#/, "").replace(/^\/+|\/+$/g, "");
}

function getRequestedPage() {
  const hashPage = normalizeRoute(window.location.hash);
  if (hashPage) {
    return hashPage;
  }

  const pathSegments = window.location.pathname
    .split("/")
    .map((segment) => normalizeRoute(segment))
    .filter((segment) => segment && segment !== "index.html");
  const pathPage = [...pathSegments].reverse().find((segment) => pages.some((page) => page.id === segment));
  return pathPage || defaultPage;
}

function isLocalFile() {
  return window.location.protocol === "file:";
}

function getLinkPage(link) {
  const route = link.dataset.route;
  if (route) {
    return route;
  }

  const rawHref = link.getAttribute("href") || "";
  if (rawHref.startsWith("#")) {
    return normalizeRoute(rawHref);
  }

  try {
    const url = new URL(rawHref, window.location.href);
    if (url.hash) {
      return normalizeRoute(url.hash);
    }

    const pathSegments = url.pathname
      .split("/")
      .map((segment) => normalizeRoute(segment))
      .filter((segment) => segment && segment !== "index.html");
    return [...pathSegments].reverse().find((segment) => pages.some((page) => page.id === segment)) || pathSegments.at(-1) || "home";
  } catch {
    return normalizeRoute(rawHref);
  }
}

function setActivePage() {
  const requested = getRequestedPage();
  const target = pages.length && pages.some((page) => page.id === requested) ? requested : defaultPage;

  pages.forEach((page) => {
    page.classList.toggle("active", page.id === target);
  });

  navLinks.forEach((link) => {
    const href = getLinkPage(link);
    link.classList.toggle("active", href === target || (link.classList.contains("reserve-link") && target === "contact"));
  });

  nav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

routeLinks.forEach((link) => {
  const route = link.dataset.route;
  if (!route) {
    return;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (isLocalFile()) {
      window.location.hash = route;
      return;
    }

    window.history.pushState({}, "", link.dataset.path || `/${route}`);
    setActivePage();
  });
});

availabilityButton?.addEventListener("click", () => {
  availabilityStatus.textContent = "Ready to call: (760) 555-0148. The front desk confirms rates, room availability, and final reservation details by phone.";
});

contactButton?.addEventListener("click", () => {
  const name = contactName?.value.trim();
  const arrival = contactArrival?.value || "your arrival date";
  const nights = contactNights?.value || "1";
  const room = contactRoom?.value || "a room";
  const guests = contactGuests?.value || "your party";
  const greeting = name ? `${name}, your` : "Your";

  contactStatus.textContent = `${greeting} ${room} request for ${arrival}, ${nights} night(s), ${guests.toLowerCase()} is ready. Please call (760) 555-0148 so the front desk can confirm availability and hold the room.`;
});

window.addEventListener("hashchange", setActivePage);
window.addEventListener("popstate", setActivePage);
setDefaultStayDates();
setActivePage();

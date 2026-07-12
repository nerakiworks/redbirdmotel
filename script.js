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
let trackedScrollDepths = new Set();
let currentTrackedSection = "";
let currentScrollSection = "";

function trackEvent(eventName, params = {}) {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, {
    page_path: window.location.pathname,
    page_location: window.location.href,
    ...params,
  });
}

function getLinkLabel(link) {
  return (link.textContent || link.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
}

function getSectionFromHref(href) {
  try {
    const url = new URL(href, window.location.href);
    return normalizeRoute(url.hash) || normalizeRoute(url.pathname.split("/").filter(Boolean).pop() || "home");
  } catch {
    return normalizeRoute(href);
  }
}

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
    return [...pathSegments].reverse().find((segment) => pages.some((page) => page.id === segment)) || "home";
  } catch {
    return normalizeRoute(rawHref);
  }
}

function trackSectionView(sectionName, source = "navigation") {
  if (!sectionName || currentTrackedSection === sectionName) {
    return;
  }

  currentTrackedSection = sectionName;
  trackEvent("section_view", {
    section_name: sectionName,
    navigation_source: source,
  });
}

function resetScrollDepthForSection(sectionName) {
  if (!sectionName || currentScrollSection === sectionName) {
    return;
  }

  currentScrollSection = sectionName;
  trackedScrollDepths = new Set();
}

function setActivePage(source = "navigation") {
  const requested = getRequestedPage();
  const target = pages.some((page) => page.id === requested) ? requested : "home";

  pages.forEach((page) => {
    page.classList.toggle("active", page.id === target);
  });

  navLinks.forEach((link) => {
    const href = getLinkPage(link);
    link.classList.toggle("active", href === target || (link.classList.contains("reserve-link") && target === "contact"));
  });

  nav?.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
  resetScrollDepthForSection(target);
  trackSectionView(target, source);
}

function setupNavigationTracking() {
  document.querySelectorAll(".main-nav a, .site-footer nav a").forEach((link) => {
    link.addEventListener("click", () => {
      const href = link.getAttribute("href") || "";
      trackEvent("nav_click", {
        nav_label: getLinkLabel(link),
        nav_destination: href,
        nav_section: getLinkPage(link),
        nav_area: link.closest("footer") ? "footer" : "header",
      });
    });
  });
}

function setupCtaTracking() {
  document.querySelectorAll(".reserve-link, [data-availability-button], [data-contact-button], .button.primary").forEach((element) => {
    element.addEventListener("click", () => {
      const label = getLinkLabel(element) || element.textContent.trim();
      if (!/Call to Reserve|Visit the Gift Shop/i.test(label)) {
        return;
      }

      trackEvent("cta_click", {
        cta_name: label,
        cta_location: element.closest(".booking-bar") ? "booking_bar" : element.closest(".site-header") ? "header" : element.closest("footer") ? "footer" : "page_body",
        link_url: element.href || element.getAttribute("href") || "",
      });
    });
  });
}

function setupExternalLinkTracking() {
  document.querySelectorAll('a[href^="http://"], a[href^="https://"]').forEach((link) => {
    link.addEventListener("click", () => {
      const url = new URL(link.href);
      if (url.hostname === window.location.hostname) {
        return;
      }

      trackEvent("external_link_click", {
        link_url: link.href,
        link_domain: url.hostname,
        link_text: getLinkLabel(link),
      });
    });
  });
}

function setupProductTracking() {
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      trackEvent("product_click", {
        product_name: card.querySelector("h2")?.textContent.trim() || "unknown",
        product_type: card.querySelector(".product-type")?.textContent.trim() || "unknown",
        outbound_url: card.href || "",
      });
    });
  });
}

function setupInterestTracking() {
  document.querySelectorAll("#rooms .card").forEach((card) => {
    card.addEventListener("click", () => {
      trackEvent("room_interest", {
        room_name: card.querySelector("h2")?.textContent.trim() || "unknown",
      });
    });
  });

  document.querySelectorAll("#gallery .gallery-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      trackEvent("gallery_interest", {
        gallery_item: tile.querySelector("figcaption")?.textContent.trim() || tile.querySelector("img")?.alt || "unknown",
      });
    });
  });
}

function setupScrollDepthTracking() {
  const thresholds = [25, 50, 75, 90];

  function checkScrollDepth() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollableHeight <= 0) {
      return;
    }

    const depth = Math.round((window.scrollY / scrollableHeight) * 100);
    thresholds.forEach((threshold) => {
      if (depth >= threshold && !trackedScrollDepths.has(threshold)) {
        trackedScrollDepths.add(threshold);
        trackEvent("scroll_depth", {
          section_name: currentScrollSection || getRequestedPage(),
          percent_scrolled: threshold,
        });
      }
    });
  }

  window.addEventListener("scroll", checkScrollDepth, { passive: true });
  checkScrollDepth();
}

function setupBookingTracking() {
  document.querySelectorAll(".booking-bar input, .booking-bar select").forEach((field) => {
    field.addEventListener("change", () => {
      const label = field.closest("label")?.querySelector("span")?.textContent.trim() || field.name || field.type;
      trackEvent("booking_interaction", {
        interaction_type: "field_change",
        field_name: label,
        field_value: field.value,
      });
    });
  });

  document.querySelectorAll("[data-contact-arrival], [data-contact-nights], [data-contact-room], [data-contact-guests]").forEach((field) => {
    field.addEventListener("change", () => {
      const label = field.closest("label")?.childNodes[0]?.textContent.trim() || field.dataset.contactRoom || field.type;
      trackEvent("booking_interaction", {
        interaction_type: "contact_form_change",
        field_name: label,
        field_value: field.value,
      });
    });
  });
}

navToggle?.addEventListener("click", () => {
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
    trackEvent("section_view", {
      section_name: route,
      navigation_source: "data_route_click",
    });

    if (isLocalFile()) {
      window.location.hash = route;
      return;
    }

    window.history.pushState({}, "", link.dataset.path || `/${route}`);
    setActivePage("data_route_click");
  });
});

availabilityButton?.addEventListener("click", () => {
  availabilityStatus.textContent = "Ready to call: (760) 555-0148. The front desk confirms rates, room availability, and final reservation details by phone.";
  trackEvent("booking_interaction", {
    interaction_type: "availability_button_click",
    check_in: checkInInput?.value || "",
    check_out: checkOutInput?.value || "",
  });
});

contactButton?.addEventListener("click", () => {
  const name = contactName?.value.trim();
  const arrival = contactArrival?.value || "your arrival date";
  const nights = contactNights?.value || "1";
  const room = contactRoom?.value || "a room";
  const guests = contactGuests?.value || "your party";
  const greeting = name ? `${name}, your` : "Your";

  contactStatus.textContent = `${greeting} ${room} request for ${arrival}, ${nights} night(s), ${guests.toLowerCase()} is ready. Please call (760) 555-0148 so the front desk can confirm availability and hold the room.`;
  trackEvent("booking_interaction", {
    interaction_type: "contact_button_click",
    arrival_date: arrival,
    nights,
    room,
    guests,
  });
});

setupNavigationTracking();
setupCtaTracking();
setupExternalLinkTracking();
setupProductTracking();
setupInterestTracking();
setupScrollDepthTracking();
setupBookingTracking();

window.addEventListener("hashchange", () => setActivePage("hashchange"));
window.addEventListener("popstate", () => setActivePage("popstate"));
setDefaultStayDates();
setActivePage("initial_load");




const pages = [...document.querySelectorAll("[data-page]")];
const navLinks = [...document.querySelectorAll(".main-nav a")];
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

function setActivePage() {
  const requested = window.location.hash.replace("#", "") || "home";
  const target = pages.some((page) => page.id === requested) ? requested : "home";

  pages.forEach((page) => {
    page.classList.toggle("active", page.id === target);
  });

  navLinks.forEach((link) => {
    const href = link.getAttribute("href").replace("#", "");
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
setActivePage();

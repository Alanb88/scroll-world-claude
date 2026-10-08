import { FLAVORS } from "./cups.js";
import { initHeroCarousel } from "./hero-carousel.js";
import { initMagnetic } from "./magnetic.js";
import { initSite } from "./site.js";

initHeroCarousel(document.querySelector("[data-hero]"), FLAVORS);
initMagnetic("[data-magnetic]");
initSite();

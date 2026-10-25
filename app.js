/**
 * ============================================================================
 * MANBHAR CREATION - MEN'S KURTA STORE
 * Frontend Controller with Supabase Sync, Dynamic Catalog & Stock Management
 * ============================================================================
 */

const STORAGE_KEYS = {
  SUPABASE_CFG: "manbhar_supabase_config",
  PRODUCTS: "manbhar_products",
  CATEGORIES: "manbhar_categories",
  SITE_SETTINGS: "manbhar_site_settings"
};

// Default Site & Hero Settings (Graceful Fallback)
const DEFAULT_SITE_SETTINGS = {
  hero: {
    tagline: "Tradition. Style. Comfort.",
    title: "MEN KURTA",
    subtitle: "Ethnic wear for every occasion",
    occasions: ["Festive", "Wedding", "Casual", "Everyday"],
    startingPrice: 799,
    autoMinPrice: false,
    ctaText: "Shop Now",
    ctaScrollTarget: "#products",
    bgImage: ""
  },
  contacts: {
    displayPhone: "+91 93218 03696",
    phone: "919321803696",
    mapsUrl: "https://maps.app.goo.gl/jEg8beEL2Htdr6rZ9",
    instagramUrl: "https://www.instagram.com/manbhar_creation",
    address: "Gate No.2, Ganesh Galli, Shop no.665, Akurli Rd, Near Raghubir School, Hanuman Nagar, Kandivali East, Mumbai, Maharashtra 400101",
    timings: "Mon - Sun: 10:30 AM to 9:30 PM"
  },
  features: [
    "Premium cotton blend",
    "Breathable & comfortable",
    "Stylish designs",
    "Durable fabric",
    "Trusted quality"
  ],
  footerTagline: "Crafted for traditional elegance & timeless festive celebrations."
};

function isObject(item) {
  return (item && typeof item === "object" && !Array.isArray(item));
}

function deepMerge(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanInstagramUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.includes("instagram.com")) {
    return trimmed.split("?")[0];
  }
  return trimmed;
}

let currentSiteSettings = JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS));

const SHOP_CONFIG = {
  // Store & Contact Details
  shopName: "ManBhar Creation",
  brandSubtitle: "MEN'S KURTA'S",
  phone: "919321803696",              // WhatsApp number with country code (91 for India)
  displayPhone: "+91 93218 03696",
  address: "Gate No.2, Ganesh Galli, Shop no.665, Akurli Rd, Near Raghubir School, Hanuman Nagar, Kandivali East, Mumbai, Maharashtra 400101",
  timings: "Mon - Sun: 10:30 AM to 9:30 PM",
  googleMapsUrl: "https://maps.app.goo.gl/jEg8beEL2Htdr6rZ9",
  instagramUrl: "https://www.instagram.com/manbhar_creation",

  heroStartingPrice: 799,

  offers: {
    freeDelivery: "Free delivery on orders above ₹1,499",
    easyReturns: "7-day hassle-free size exchange",
    customOffer: "Special Festive Season: Flat ₹200 OFF on your first WhatsApp order"
  },

  // 5 Default Categories (dynamically overridable by Admin)
  categories: [
    {
      id: "casual",
      name: "Casual",
      tagline: "Effortless everyday ethnic comfort in pure breathable cotton",
      startingPrice: 699,
      image: "assets/logo.png"
    },
    {
      id: "short",
      name: "Short",
      tagline: "Modern straight-cut short kurtas, perfect with denim and chinos",
      startingPrice: 799,
      image: "assets/logo.png"
    },
    {
      id: "embroidered",
      name: "Embroidered",
      tagline: "Intricate threadwork & Lucknowi chikankari for refined elegance",
      startingPrice: 1299,
      image: "assets/logo.png"
    },
    {
      id: "festive",
      name: "Festive",
      tagline: "Vibrant royal tones, jacquard weaves and celebratory luster",
      startingPrice: 1499,
      image: "assets/logo.png"
    },
    {
      id: "wedding",
      name: "Wedding",
      tagline: "Regal sherwani kurtas, silk blends & brocade for celebrations",
      startingPrice: 1999,
      image: "assets/logo.png"
    }
  ],

  // Products are loaded dynamically from Supabase / Local Storage
  // Initial empty array so it shows "Products jaldi aa rahe hain" until admin publishes products
  products: []
};

// Debug Helper for Image Sources
function logImageSource(context, name, url) {
  let source = "Unknown";
  if (!url) source = "Placeholder Fallback";
  else if (url.includes("supabase.co")) source = "Supabase Cloud Storage (Public CDN)";
  else if (url.startsWith("data:")) source = "Local Base64 DataURL";
  else if (url.startsWith("assets/")) source = "Local Static Repo File (assets/)";
  else if (url.startsWith("http")) source = "External Web URL";
  else source = "Relative File Path";

  console.log(`[Image Debug] ${context} -> "${name || 'Item'}": [Source: ${source}] ${url ? url.substring(0, 100) : ''}`);
  return source;
}

// Global State
let currentFilter = "all";
const selectedSizes = {};       // productId -> size string ("M")
const selectedQuantities = {};  // productId -> number (1)
let activeLightboxProduct = null;
let activeLightboxIndex = 0;
let supabaseClient = null;

/**
 * Get Active Supabase Configuration
 * Checks window.SUPABASE_CONFIG (from config.js) first, then localStorage
 */
function getActiveSupabaseConfig() {
  if (typeof window !== "undefined" && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey) {
    return {
      url: window.SUPABASE_CONFIG.url.trim(),
      key: window.SUPABASE_CONFIG.anonKey.trim()
    };
  }

  const savedCfg = localStorage.getItem(STORAGE_KEYS.SUPABASE_CFG);
  if (savedCfg) {
    try {
      const cfg = JSON.parse(savedCfg);
      if (cfg.url && (cfg.key || cfg.anonKey)) {
        return {
          url: cfg.url.trim(),
          key: (cfg.key || cfg.anonKey).trim()
        };
      }
    } catch (e) {
      console.warn("Invalid Supabase config in localStorage:", e);
    }
  }

  return null;
}

/**
 * Initialize Supabase Client
 */
function initSupabaseClient() {
  const cfg = getActiveSupabaseConfig();
  if (cfg && cfg.url && cfg.key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(cfg.url, cfg.key);
      console.log("[Supabase] Storefront connected to Cloud:", cfg.url);
    } catch (e) {
      console.warn("Failed to initialize Supabase on storefront:", e);
    }
  } else {
    console.log("[Supabase] Cloud config not detected. Using local/fallback mode.");
  }
}

/**
 * Fetch Catalog (Supabase or LocalStorage)
 */
async function loadCatalogData() {
  // 1. Try Supabase
  if (supabaseClient) {
    try {
      const { data: prodData } = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (prodData && prodData.length > 0) {
        SHOP_CONFIG.products = prodData.map(normalizeProductRecord);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SHOP_CONFIG.products));
        SHOP_CONFIG.products.forEach(p => {
          logImageSource("Supabase Product", p.name, p.image);
        });
      }

      const { data: catData } = await supabaseClient.from("categories").select("*");
      if (catData && catData.length > 0) {
        SHOP_CONFIG.categories = catData;
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(SHOP_CONFIG.categories));
        SHOP_CONFIG.categories.forEach(c => {
          logImageSource("Supabase Category", c.name, c.image);
        });
      }
      return;
    } catch (err) {
      console.warn("Supabase fetch failed on storefront, using local:", err);
    }
  }

  // 2. Fallback to LocalStorage
  const localProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (localProds) {
    try {
      SHOP_CONFIG.products = JSON.parse(localProds).map(normalizeProductRecord);
      SHOP_CONFIG.products.forEach(p => {
        logImageSource("Local Product", p.name, p.image);
      });
    } catch (e) {}
  } else {
    SHOP_CONFIG.products = [];
  }

  const localCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (localCats) {
    try {
      SHOP_CONFIG.categories = JSON.parse(localCats);
      SHOP_CONFIG.categories.forEach(c => {
        logImageSource("Local Category", c.name, c.image);
      });
    } catch (e) {}
  }
}

function normalizeProductRecord(p) {
  // Normalize snake_case vs camelCase
  const images = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : ["assets/logo.png"]);
  const sizes = (p.sizes && p.sizes.length > 0) ? p.sizes : ["S", "M", "L", "XL", "XXL"];
  const stock = p.stock || {};

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice || p.original_price,
    badge: p.badge,
    image: images[0],
    images: images,
    sizes: sizes,
    stock: stock,
    isOutOfStock: p.is_out_of_stock || false,
    description: p.description
  };
}

/**
 * Safe SVG Placeholder Generator
 */
function createSvgPlaceholder(name, category) {
  const bgColors = {
    casual: "%23E7EFEA",
    short: "%23ECE7E1",
    embroidered: "%23F8EFEB",
    festive: "%23FAF0E6",
    wedding: "%23F6EAE8"
  };
  const bg = bgColors[category] || "%23FAF6EF";
  const cleanName = encodeURIComponent(name);
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800' fill='none'><rect width='600' height='800' fill='${bg}'/><path d='M300 180 L350 250 L420 300 L380 720 L220 720 L180 300 L250 250 Z' fill='%235E0B1B' opacity='0.85'/><circle cx='300' cy='140' r='50' fill='%235E0B1B' opacity='0.7'/><rect x='294' y='250' width='12' height='220' fill='%23C9A24B'/><text x='300' y='760' font-family='serif' font-size='24' font-weight='bold' fill='%235E0B1B' text-anchor='middle'>${cleanName}</text></svg>`;
}

/**
 * Initialize Store Data & Static Elements
 */
async function loadSiteSettings() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("settings")
        .select("value")
        .eq("key", "site_settings")
        .single();
      if (!error && data && data.value) {
        currentSiteSettings = deepMerge(DEFAULT_SITE_SETTINGS, data.value);
        localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(currentSiteSettings));
        return currentSiteSettings;
      }
    } catch (err) {
      console.warn("Supabase load site_settings failed on storefront:", err);
    }
  }

  const raw = localStorage.getItem(STORAGE_KEYS.SITE_SETTINGS);
  if (raw) {
    try {
      currentSiteSettings = deepMerge(DEFAULT_SITE_SETTINGS, JSON.parse(raw));
    } catch (e) {
      currentSiteSettings = JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS));
    }
  } else {
    currentSiteSettings = JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS));
  }
  return currentSiteSettings;
}

function renderTrustFeatures(featuresList) {
  const container = document.getElementById("trustStripContainer");
  if (!container) return;

  const features = (featuresList && featuresList.length > 0) ? featuresList : DEFAULT_SITE_SETTINGS.features;

  const icons = [
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12c0 3.31 1.61 6.24 4.09 8.04l.91-1.39C5.07 17.26 4 14.77 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 2.77-1.07 5.26-3 6.65l.91 1.39C20.39 18.24 22 15.31 22 12c0-5.52-4.48-10-10-10z"/><path d="M12 6c-2.76 0-5 2.24-5 5 0 1.63.78 3.08 2 4 .5.38 1.13.67 1.8.84.4.1.8.16 1.2.16s.8-.06 1.2-.16c.67-.17 1.3-.46 1.8-.84 1.22-.92 2-2.37 2-4 0-2.76-2.24-5-5-5z"/><path d="M12 16v6"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
  ];

  container.innerHTML = features.map((feat, idx) => {
    const iconSvg = icons[idx % icons.length];
    return `
      <div class="trust-item">
        <div class="trust-icon-box">
          ${iconSvg}
        </div>
        <span class="trust-text">${escapeHtml(feat)}</span>
      </div>
    `;
  }).join("");
}

function applySiteSettings() {
  const s = currentSiteSettings;
  const hero = s.hero || DEFAULT_SITE_SETTINGS.hero;
  const contacts = s.contacts || DEFAULT_SITE_SETTINGS.contacts;

  // Update shop contact settings
  if (contacts.phone) SHOP_CONFIG.phone = contacts.phone;
  if (contacts.displayPhone) SHOP_CONFIG.displayPhone = contacts.displayPhone;
  SHOP_CONFIG.googleMapsUrl = contacts.mapsUrl !== undefined ? contacts.mapsUrl : DEFAULT_SITE_SETTINGS.contacts.mapsUrl;
  SHOP_CONFIG.instagramUrl = cleanInstagramUrl(contacts.instagramUrl !== undefined ? contacts.instagramUrl : DEFAULT_SITE_SETTINGS.contacts.instagramUrl);
  SHOP_CONFIG.address = contacts.address !== undefined ? contacts.address : DEFAULT_SITE_SETTINGS.contacts.address;
  SHOP_CONFIG.timings = contacts.timings !== undefined ? contacts.timings : DEFAULT_SITE_SETTINGS.contacts.timings;

  // Hero Tagline
  const heroTagline = document.getElementById("heroTagline");
  if (heroTagline) heroTagline.textContent = hero.tagline || DEFAULT_SITE_SETTINGS.hero.tagline;

  // Hero Title
  const heroTitle = document.getElementById("heroTitle");
  if (heroTitle) heroTitle.textContent = hero.title || DEFAULT_SITE_SETTINGS.hero.title;

  // Hero Subtitle
  const heroSubtitle = document.getElementById("heroSubtitle");
  if (heroSubtitle) heroSubtitle.textContent = hero.subtitle || DEFAULT_SITE_SETTINGS.hero.subtitle;

  // Hero Occasions Strip
  const heroOccasionsStrip = document.getElementById("heroOccasionsStrip");
  if (heroOccasionsStrip) {
    const occasions = (hero.occasions && hero.occasions.length > 0) ? hero.occasions : DEFAULT_SITE_SETTINGS.hero.occasions;
    heroOccasionsStrip.innerHTML = occasions.map(t => `<span>${escapeHtml(t)}</span>`).join(`<span class="bullet">•</span>`);
  }

  // Hero Starting Price (with Auto Min Price)
  let price = hero.startingPrice;
  if (hero.autoMinPrice) {
    const activeProducts = SHOP_CONFIG.products.filter(p => !p.isOutOfStock && Number(p.price) > 0);
    if (activeProducts.length > 0) {
      price = Math.min(...activeProducts.map(p => Number(p.price)));
    } else if (SHOP_CONFIG.products.length > 0) {
      const valid = SHOP_CONFIG.products.filter(p => Number(p.price) > 0);
      if (valid.length > 0) price = Math.min(...valid.map(p => Number(p.price)));
    }
  }
  SHOP_CONFIG.heroStartingPrice = price || DEFAULT_SITE_SETTINGS.hero.startingPrice;
  const heroPriceDisplay = document.getElementById("heroStartingPriceDisplay");
  if (heroPriceDisplay) {
    heroPriceDisplay.textContent = `₹${SHOP_CONFIG.heroStartingPrice}`;
  }

  // Hero CTA Button
  const heroCtaBtn = document.getElementById("heroCtaBtn");
  const heroCtaBtnText = document.getElementById("heroCtaBtnText");
  const hasProducts = SHOP_CONFIG.products && SHOP_CONFIG.products.length > 0;
  if (heroCtaBtn) heroCtaBtn.href = hasProducts ? (hero.ctaScrollTarget || "#products") : "#categories";
  if (heroCtaBtnText) heroCtaBtnText.textContent = hero.ctaText || "Shop Now";

  // Hero Background Image
  const heroSection = document.getElementById("heroSection");
  if (heroSection) {
    if (hero.bgImage) {
      heroSection.classList.add("has-custom-bg");
      heroSection.style.backgroundImage = `linear-gradient(rgba(250, 246, 239, 0.82), rgba(250, 246, 239, 0.82)), url('${hero.bgImage}')`;
    } else {
      heroSection.classList.remove("has-custom-bg");
      heroSection.style.backgroundImage = "";
    }
  }

  // Trust Strip Features
  renderTrustFeatures(s.features);

  // Footer Tagline
  const footerTagline = document.getElementById("footerTagline");
  if (footerTagline) footerTagline.textContent = s.footerTagline || DEFAULT_SITE_SETTINGS.footerTagline;

  // Header Links Visibility & Href
  const headerVisitBtn = document.getElementById("headerVisitStoreBtn");
  if (headerVisitBtn) {
    if (SHOP_CONFIG.googleMapsUrl) {
      headerVisitBtn.href = SHOP_CONFIG.googleMapsUrl;
      headerVisitBtn.style.display = "";
    } else {
      headerVisitBtn.style.display = "none";
    }
  }

  const headerInstaBtn = document.getElementById("headerInstagramBtn");
  if (headerInstaBtn) {
    if (SHOP_CONFIG.instagramUrl) {
      headerInstaBtn.href = SHOP_CONFIG.instagramUrl;
      headerInstaBtn.style.display = "inline-flex";
    } else {
      headerInstaBtn.style.display = "none";
    }
  }

  // Floating Instagram Button
  const floatInstaBtn = document.getElementById("floatingInstagramBtn");
  if (floatInstaBtn) {
    if (SHOP_CONFIG.instagramUrl) {
      floatInstaBtn.href = SHOP_CONFIG.instagramUrl;
      floatInstaBtn.style.display = "flex";
    } else {
      floatInstaBtn.style.display = "none";
    }
  }

  // Visit Us / Find Our Store Elements
  const visitAddrItem = document.getElementById("visitAddressItem");
  const visitAddrVal = document.getElementById("visitAddress");
  if (SHOP_CONFIG.address) {
    if (visitAddrVal) visitAddrVal.textContent = SHOP_CONFIG.address;
    if (visitAddrItem) visitAddrItem.style.display = "";
  } else {
    if (visitAddrItem) visitAddrItem.style.display = "none";
  }

  const visitTimeItem = document.getElementById("visitTimingsItem");
  const visitTimeVal = document.getElementById("visitTimings");
  if (SHOP_CONFIG.timings) {
    if (visitTimeVal) visitTimeVal.textContent = SHOP_CONFIG.timings;
    if (visitTimeItem) visitTimeItem.style.display = "";
  } else {
    if (visitTimeItem) visitTimeItem.style.display = "none";
  }

  const visitPhoneItem = document.getElementById("visitPhoneItem");
  const visitPhoneVal = document.getElementById("visitPhone");
  if (SHOP_CONFIG.displayPhone || SHOP_CONFIG.phone) {
    if (visitPhoneVal) {
      visitPhoneVal.textContent = SHOP_CONFIG.displayPhone;
      visitPhoneVal.href = `tel:+${SHOP_CONFIG.phone}`;
    }
    if (visitPhoneItem) visitPhoneItem.style.display = "";
  } else {
    if (visitPhoneItem) visitPhoneItem.style.display = "none";
  }

  const visitMapsBtn = document.getElementById("visitMapsBtn");
  if (visitMapsBtn) {
    if (SHOP_CONFIG.googleMapsUrl) {
      visitMapsBtn.href = SHOP_CONFIG.googleMapsUrl;
      visitMapsBtn.style.display = "inline-flex";
    } else {
      visitMapsBtn.style.display = "none";
    }
  }

  const visitInstaBtn = document.getElementById("visitInstagramBtn");
  if (visitInstaBtn) {
    if (SHOP_CONFIG.instagramUrl) {
      visitInstaBtn.href = SHOP_CONFIG.instagramUrl;
      visitInstaBtn.style.display = "inline-flex";
    } else {
      visitInstaBtn.style.display = "none";
    }
  }

  // Embedded Map
  const mapContainer = document.getElementById("visitMapContainer");
  const mapIframe = document.getElementById("visitMapIframe");
  if (SHOP_CONFIG.address) {
    if (mapIframe) {
      mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(SHOP_CONFIG.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    if (mapContainer) mapContainer.style.display = "block";
  } else {
    if (mapContainer) mapContainer.style.display = "none";
  }

  // Footer Links
  const footerMaps = document.getElementById("footerMapsLink");
  const footerSep1 = document.getElementById("footerSep1");
  if (SHOP_CONFIG.googleMapsUrl) {
    if (footerMaps) {
      footerMaps.href = SHOP_CONFIG.googleMapsUrl;
      footerMaps.style.display = "";
    }
    if (footerSep1) footerSep1.style.display = "";
  } else {
    if (footerMaps) footerMaps.style.display = "none";
    if (footerSep1) footerSep1.style.display = "none";
  }

  const footerInsta = document.getElementById("footerInstagramLink");
  const footerSep2 = document.getElementById("footerSep2");
  if (SHOP_CONFIG.instagramUrl) {
    if (footerInsta) {
      footerInsta.href = SHOP_CONFIG.instagramUrl;
      footerInsta.style.display = "";
    }
    if (footerSep2) footerSep2.style.display = "";
  } else {
    if (footerInsta) footerInsta.style.display = "none";
    if (footerSep2) footerSep2.style.display = "none";
  }

  // Re-sync all static phone links and buttons
  initShopData();
}

function initShopData() {
  const navShopName = document.getElementById("navShopName");
  if (navShopName) navShopName.textContent = SHOP_CONFIG.shopName;

  const navSubtitle = document.getElementById("navSubtitle");
  if (navSubtitle) navSubtitle.textContent = SHOP_CONFIG.brandSubtitle;

  const visitShopName = document.getElementById("visitShopName");
  if (visitShopName) visitShopName.textContent = `${SHOP_CONFIG.shopName} | ${SHOP_CONFIG.brandSubtitle}`;

  const footerShopName = document.getElementById("footerShopName");
  if (footerShopName) footerShopName.textContent = `${SHOP_CONFIG.shopName} | ${SHOP_CONFIG.brandSubtitle}`;

  const navPhone = document.getElementById("navPhone");
  if (navPhone) navPhone.textContent = SHOP_CONFIG.displayPhone;

  const headerCallBtn = document.getElementById("headerCallBtn");
  if (headerCallBtn) headerCallBtn.href = `tel:+${SHOP_CONFIG.phone}`;

  const visitPhone = document.getElementById("visitPhone");
  if (visitPhone) {
    visitPhone.textContent = SHOP_CONFIG.displayPhone;
    visitPhone.href = `tel:+${SHOP_CONFIG.phone}`;
  }

  const heroPrice = document.getElementById("heroStartingPriceDisplay");
  if (heroPrice) heroPrice.textContent = `₹${SHOP_CONFIG.heroStartingPrice}`;

  const offerFreeDelivery = document.getElementById("offerFreeDelivery");
  if (offerFreeDelivery) offerFreeDelivery.textContent = SHOP_CONFIG.offers.freeDelivery;

  const offerEasyReturns = document.getElementById("offerEasyReturns");
  if (offerEasyReturns) offerEasyReturns.textContent = SHOP_CONFIG.offers.easyReturns;

  const offerCustom = document.getElementById("offerCustom");
  if (offerCustom) offerCustom.textContent = SHOP_CONFIG.offers.customOffer;

  const visitAddress = document.getElementById("visitAddress");
  if (visitAddress) visitAddress.textContent = SHOP_CONFIG.address;

  const visitTimings = document.getElementById("visitTimings");
  if (visitTimings) visitTimings.textContent = SHOP_CONFIG.timings;

  const visitMapsBtn = document.getElementById("visitMapsBtn");
  if (visitMapsBtn) visitMapsBtn.href = SHOP_CONFIG.googleMapsUrl;

  const stickyWhatsAppBtn = document.getElementById("stickyWhatsAppBtn");
  if (stickyWhatsAppBtn) {
    const generalMsg = encodeURIComponent(
      `Hello ${SHOP_CONFIG.shopName}! I am exploring your kurta collection on your website and would like to inquire about styles and availability.`
    );
    stickyWhatsAppBtn.href = `https://wa.me/${SHOP_CONFIG.phone}?text=${generalMsg}`;
  }

  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/**
 * Render Category Cards (Dynamically syncs with Admin updates)
 */
function renderCategories() {
  const container = document.getElementById("categoriesContainer");
  if (!container) return;

  container.innerHTML = SHOP_CONFIG.categories.map(cat => {
    const fallbackSrc = createSvgPlaceholder(cat.name, cat.id);
    const isActive = currentFilter === cat.id ? "active-category" : "";
    const imgSrc = cat.image || "assets/logo.png";

    return `
      <article class="category-card ${isActive}" data-category="${cat.id}" role="button" tabindex="0" aria-label="Explore ${cat.name} Kurtas">
        <div class="category-img-wrap">
          <img 
            src="${imgSrc}" 
            alt="${cat.name} Kurta" 
            class="category-img" 
            loading="lazy"
            onerror="this.onerror=null; this.src='${fallbackSrc}';"
          />
        </div>
        <div class="category-body">
          <h3 class="category-name">${cat.name}</h3>
          <p class="category-tagline">${cat.tagline}</p>
          <span class="category-price-tag">From ₹${cat.startingPrice}</span>
        </div>
      </article>
    `;
  }).join("");

  // Attach click listeners
  container.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const catId = card.getAttribute("data-category");
      if (currentFilter === catId) {
        setFilter("all");
      } else {
        setFilter(catId);
        const prodSec = document.getElementById("products");
        if (prodSec) {
          prodSec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
  });
}

/**
 * Generate WhatsApp Order Link with Exact Requirement Message:
 * "Hello ManBhar Creation! I would like to order: [Product Name] (Price: ₹[Price], Size: [Selected Size], Qty: [Qty]). Please let me know the availability and payment options."
 */
function getWhatsAppOrderLink(product, selectedSize, qty = 1) {
  const sizeValue = selectedSize || "Standard";
  const msg = `Hello ${SHOP_CONFIG.shopName}! I would like to order: ${product.name} (Price: ₹${product.price}, Size: ${sizeValue}, Qty: ${qty}). Please let me know the availability and payment options.`;
  return `https://wa.me/${SHOP_CONFIG.phone}?text=${encodeURIComponent(msg)}`;
}

/**
 * Render Product Grid (or Empty State)
 */
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const countEl = document.getElementById("productCount");
  const clearBtn = document.getElementById("clearFilterBtn");
  if (!grid) return;

  const filteredProducts = currentFilter === "all"
    ? SHOP_CONFIG.products
    : SHOP_CONFIG.products.filter(p => p.category.toLowerCase() === currentFilter.toLowerCase());

  // Count & Clear Filter visibility
  if (countEl) {
    const label = currentFilter === "all" ? "All Styles" : `${currentFilter.toUpperCase()} Styles`;
    countEl.textContent = `Showing ${filteredProducts.length} ${label}`;
  }

  if (clearBtn) {
    clearBtn.style.display = currentFilter === "all" ? "none" : "inline-flex";
  }

  // If store catalog is currently empty, hide the entire products section cleanly
  const prodSec = document.getElementById("products");
  if (SHOP_CONFIG.products.length === 0) {
    if (prodSec) prodSec.style.display = "none";
    grid.innerHTML = "";
    return;
  } else {
    if (prodSec) prodSec.style.display = "";
  }

  // If a category filter returns 0 products
  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--color-text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">No ${currentFilter.toUpperCase()} kurtas available right now.</p>
        <button class="filter-pill active" onclick="setFilter('all')">View All Styles</button>
      </div>
    `;
    return;
  }

  // RENDER PRODUCTS GRID
  grid.innerHTML = filteredProducts.map(product => {
    // Determine available and in-stock sizes
    const stockMap = product.stock || {};
    const sizeKeys = product.sizes && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL", "XXL"];

    // Find first size that has stock > 0
    let firstInStockSize = sizeKeys.find(sz => (stockMap[sz] !== undefined ? stockMap[sz] > 0 : true));
    if (!firstInStockSize) firstInStockSize = sizeKeys[0];

    // Persist or initialize selection
    if (!selectedSizes[product.id]) {
      selectedSizes[product.id] = firstInStockSize;
    }
    if (!selectedQuantities[product.id]) {
      selectedQuantities[product.id] = 1;
    }

    const currentSelectedSize = selectedSizes[product.id];
    const currentQty = selectedQuantities[product.id];
    const currentStock = stockMap[currentSelectedSize] !== undefined ? stockMap[currentSelectedSize] : 99;
    const isTotallyOut = product.isOutOfStock || (Object.keys(stockMap).length > 0 && Object.values(stockMap).every(v => v === 0));

    const coverPhoto = (product.images && product.images[0]) || product.image || "assets/logo.png";
    const totalPhotos = product.images ? product.images.length : 1;
    const fallbackSrc = createSvgPlaceholder(product.name, product.category);
    const waLink = getWhatsAppOrderLink(product, currentSelectedSize, currentQty);

    // Build Size Pills
    const sizesHtml = sizeKeys.map(size => {
      const sizeQty = stockMap[size] !== undefined ? stockMap[size] : 99;
      const isZero = sizeQty === 0;
      const isSelected = size === currentSelectedSize;

      return `
        <button 
          type="button" 
          class="size-btn ${isSelected ? 'active' : ''} ${isZero ? 'out-of-stock' : ''}" 
          data-product-id="${product.id}" 
          data-size="${size}"
          data-stock="${sizeQty}"
          ${isZero ? 'disabled' : ''}
          title="${isZero ? 'Out of stock in size ' + size : 'Select Size ' + size + ' (' + sizeQty + ' available)'}"
        >
          ${size}
        </button>
      `;
    }).join("");

    // Stock Status Badge
    let stockStatusHtml = "";
    if (isTotallyOut) {
      stockStatusHtml = `<span class="stock-status-text out-of-stock">✕ Out of Stock</span>`;
    } else if (currentStock <= 3 && currentStock > 0) {
      stockStatusHtml = `<span class="stock-status-text low-stock">⚡ Only ${currentStock} left in size ${currentSelectedSize}!</span>`;
    } else if (currentStock > 0) {
      stockStatusHtml = `<span class="stock-status-text in-stock">✓ In Stock (${currentStock} available)</span>`;
    }

    return `
      <div class="product-card" id="card-${product.id}">
        <!-- Image Container (Click opens Lightbox Slider) -->
        <div class="product-img-wrap" onclick="openProductLightbox('${product.id}', 0)" title="Click to view all photos">
          <img 
            src="${coverPhoto}" 
            alt="${product.name}" 
            class="product-img" 
            loading="lazy"
            onerror="this.onerror=null; this.src='${fallbackSrc}';"
          />
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
          ${totalPhotos > 1 ? `
            <span class="photo-count-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <span>${totalPhotos} photos</span>
            </span>
          ` : ""}
        </div>

        <div class="product-card-body">
          <span class="product-category-tag">${product.category}</span>
          <h3 class="product-title">${product.name}</h3>
          
          <div class="product-price-row">
            <span class="product-price">₹${product.price}</span>
            ${product.originalPrice ? `<span class="product-original-price">₹${product.originalPrice}</span>` : ""}
          </div>

          <!-- SIZES WITH 0-STOCK DISABLED -->
          <div class="product-size-section">
            <div class="size-label-row">
              <span>Size:</span>
              <span class="size-selected-val" id="size-val-${product.id}">${currentSelectedSize}</span>
            </div>
            <div class="size-pill-group">
              ${sizesHtml}
            </div>
            <div id="stock-status-${product.id}">
              ${stockStatusHtml}
            </div>
          </div>

          <!-- QUANTITY SELECTOR (+ / -) -->
          <div class="product-qty-section">
            <span class="qty-label">Quantity:</span>
            <div class="qty-control">
              <button 
                type="button" 
                class="btn-qty btn-qty-minus" 
                data-product-id="${product.id}"
                ${currentQty <= 1 ? 'disabled' : ''}
                aria-label="Decrease quantity"
              >−</button>
              <span class="qty-value" id="qty-val-${product.id}">${currentQty}</span>
              <button 
                type="button" 
                class="btn-qty btn-qty-plus" 
                data-product-id="${product.id}"
                ${(currentQty >= currentStock || isTotallyOut) ? 'disabled' : ''}
                aria-label="Increase quantity"
              >+</button>
            </div>
          </div>

          <!-- ORDER ON WHATSAPP BUTTON -->
          <a 
            href="${waLink}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn-whatsapp-order ${isTotallyOut ? 'btn-out-of-stock' : ''}" 
            id="order-btn-${product.id}"
            aria-label="Order ${product.name} on WhatsApp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.836.78 2.791.78 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.742 0-3.376-.447-4.802-1.229l-5.198 1.362 1.385-5.064c-.878-1.493-1.385-3.235-1.385-5.069 0-5.514 4.486-10 10-10s10 4.486 10 10z"/></svg>
            <span>${isTotallyOut ? 'Inquire on WhatsApp' : 'Order on WhatsApp'}</span>
          </a>
        </div>
      </div>
    `;
  }).join("");

  attachProductCardListeners(grid);
}

/**
 * Attach Card Handlers: Size selection and Quantity (+ / -)
 */
function attachProductCardListeners(grid) {
  // Size selection
  grid.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled || btn.classList.contains("out-of-stock")) return;

      const prodId = btn.getAttribute("data-product-id");
      const chosenSize = btn.getAttribute("data-size");
      const sizeStock = parseInt(btn.getAttribute("data-stock")) || 0;

      selectedSizes[prodId] = chosenSize;

      // Reset or clamp quantity
      if (selectedQuantities[prodId] > sizeStock) {
        selectedQuantities[prodId] = Math.max(1, sizeStock);
      }

      updateProductCardUI(prodId, chosenSize, sizeStock);
    });
  });

  // Quantity Minus (-)
  grid.querySelectorAll(".btn-qty-minus").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.getAttribute("data-product-id");
      let qty = selectedQuantities[prodId] || 1;
      if (qty > 1) {
        qty--;
        selectedQuantities[prodId] = qty;
        const targetProduct = SHOP_CONFIG.products.find(p => p.id === prodId);
        const stockMap = targetProduct ? targetProduct.stock || {} : {};
        const sz = selectedSizes[prodId];
        const stock = stockMap[sz] !== undefined ? stockMap[sz] : 99;
        updateProductCardUI(prodId, sz, stock);
      }
    });
  });

  // Quantity Plus (+)
  grid.querySelectorAll(".btn-qty-plus").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.getAttribute("data-product-id");
      const targetProduct = SHOP_CONFIG.products.find(p => p.id === prodId);
      const stockMap = targetProduct ? targetProduct.stock || {} : {};
      const sz = selectedSizes[prodId];
      const maxStock = stockMap[sz] !== undefined ? stockMap[sz] : 99;

      let qty = selectedQuantities[prodId] || 1;
      if (qty < maxStock) {
        qty++;
        selectedQuantities[prodId] = qty;
        updateProductCardUI(prodId, sz, maxStock);
      }
    });
  });
}

function updateProductCardUI(prodId, chosenSize, availableStock) {
  const card = document.getElementById(`card-${prodId}`);
  const targetProduct = SHOP_CONFIG.products.find(p => p.id === prodId);
  if (!card || !targetProduct) return;

  const currentQty = selectedQuantities[prodId] || 1;

  // Active size pill
  card.querySelectorAll(".size-btn").forEach(b => {
    if (b.getAttribute("data-size") === chosenSize) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });

  // Size label
  const sizeLabel = document.getElementById(`size-val-${prodId}`);
  if (sizeLabel) sizeLabel.textContent = chosenSize;

  // Quantity label
  const qtyLabel = document.getElementById(`qty-val-${prodId}`);
  if (qtyLabel) qtyLabel.textContent = currentQty;

  // Plus / Minus buttons state
  const minusBtn = card.querySelector(".btn-qty-minus");
  const plusBtn = card.querySelector(".btn-qty-plus");
  if (minusBtn) minusBtn.disabled = currentQty <= 1;
  if (plusBtn) plusBtn.disabled = currentQty >= availableStock;

  // Stock status text
  const statusContainer = document.getElementById(`stock-status-${prodId}`);
  if (statusContainer) {
    if (availableStock <= 0) {
      statusContainer.innerHTML = `<span class="stock-status-text out-of-stock">✕ Out of stock in size ${chosenSize}</span>`;
    } else if (availableStock <= 3) {
      statusContainer.innerHTML = `<span class="stock-status-text low-stock">⚡ Only ${availableStock} left in size ${chosenSize}!</span>`;
    } else {
      statusContainer.innerHTML = `<span class="stock-status-text in-stock">✓ In Stock (${availableStock} available)</span>`;
    }
  }

  // Update WhatsApp link
  const orderBtn = document.getElementById(`order-btn-${prodId}`);
  if (orderBtn) {
    orderBtn.href = getWhatsAppOrderLink(targetProduct, chosenSize, currentQty);
  }
}

/**
 * ----------------------------------------------------------------------------
 * MULTIPLE PHOTOS LIGHTBOX SLIDER
 * ----------------------------------------------------------------------------
 */
function openProductLightbox(productId, imageIndex = 0) {
  const product = SHOP_CONFIG.products.find(p => p.id === productId);
  if (!product) return;

  const lightbox = document.getElementById("productLightbox");
  if (!lightbox) return;

  activeLightboxProduct = product;
  activeLightboxIndex = imageIndex;

  updateLightboxContent();
  lightbox.style.display = "flex";
  document.body.style.overflow = "hidden"; // Prevent background scroll
}
window.openProductLightbox = openProductLightbox;

function closeLightbox() {
  const lightbox = document.getElementById("productLightbox");
  if (lightbox) lightbox.style.display = "none";
  document.body.style.overflow = "";
  activeLightboxProduct = null;
}

function updateLightboxContent() {
  if (!activeLightboxProduct) return;

  const images = (activeLightboxProduct.images && activeLightboxProduct.images.length > 0)
    ? activeLightboxProduct.images
    : [activeLightboxProduct.image || "assets/logo.png"];

  const imgEl = document.getElementById("lightboxImg");
  const titleEl = document.getElementById("lightboxTitle");
  const priceEl = document.getElementById("lightboxPrice");
  const counterEl = document.getElementById("lightboxCounter");
  const thumbsContainer = document.getElementById("lightboxThumbs");
  const prevBtn = document.getElementById("lightboxPrevBtn");
  const nextBtn = document.getElementById("lightboxNextBtn");

  if (activeLightboxIndex < 0) activeLightboxIndex = images.length - 1;
  if (activeLightboxIndex >= images.length) activeLightboxIndex = 0;

  const activeSrc = images[activeLightboxIndex];
  logImageSource("Lightbox Viewer", activeLightboxProduct.name, activeSrc);

  if (imgEl) {
    imgEl.src = activeSrc;
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.src = createSvgPlaceholder(activeLightboxProduct.name, activeLightboxProduct.category);
    };
  }
  if (titleEl) titleEl.textContent = activeLightboxProduct.name;
  if (priceEl) priceEl.textContent = `₹${activeLightboxProduct.price}`;
  if (counterEl) counterEl.textContent = `${activeLightboxIndex + 1} / ${images.length}`;

  if (prevBtn) prevBtn.style.display = images.length > 1 ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = images.length > 1 ? "flex" : "none";

  // Thumbs Strip
  if (thumbsContainer) {
    if (images.length > 1) {
      thumbsContainer.style.display = "flex";
      const fallbackSrc = createSvgPlaceholder(activeLightboxProduct.name, activeLightboxProduct.category);
      thumbsContainer.innerHTML = images.map((src, i) => `
        <img 
          src="${src}" 
          alt="Thumb ${i + 1}" 
          class="lightbox-thumb ${i === activeLightboxIndex ? 'active' : ''}" 
          onerror="this.onerror=null; this.src='${fallbackSrc}';"
          onclick="activeLightboxIndex = ${i}; updateLightboxContent();"
        />
      `).join("");
    } else {
      thumbsContainer.style.display = "none";
    }
  }
}

function initLightboxListeners() {
  const lightbox = document.getElementById("productLightbox");
  const closeBtn = document.getElementById("lightboxCloseBtn");
  const prevBtn = document.getElementById("lightboxPrevBtn");
  const nextBtn = document.getElementById("lightboxNextBtn");

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      activeLightboxIndex--;
      updateLightboxContent();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      activeLightboxIndex++;
      updateLightboxContent();
    });
  }

  // Click outside to close
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    if (!activeLightboxProduct) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") {
      activeLightboxIndex--;
      updateLightboxContent();
    }
    if (e.key === "ArrowRight") {
      activeLightboxIndex++;
      updateLightboxContent();
    }
  });
}

/**
 * Filter Controller
 */
function setFilter(category) {
  currentFilter = category;

  document.querySelectorAll(".filter-pill").forEach(pill => {
    if (pill.getAttribute("data-category") === category) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });

  renderCategories();
  renderProducts();
}
window.setFilter = setFilter;

/**
 * ----------------------------------------------------------------------------
 * BOOTSTRAPPING
 * ----------------------------------------------------------------------------
 */
document.addEventListener("DOMContentLoaded", async () => {
  initShopData();
  initSupabaseClient();
  await Promise.all([loadCatalogData(), loadSiteSettings()]);
  applySiteSettings();
  renderCategories();
  renderProducts();
  initLightboxListeners();

  // Filter Pill buttons above grid
  document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const cat = pill.getAttribute("data-category");
      setFilter(cat);
    });
  });

  // Clear filter button
  const clearBtn = document.getElementById("clearFilterBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => setFilter("all"));
  }

  // Sticky Navbar Scroll Listener (Smooth Shrink)
  const siteHeader = document.getElementById("siteHeader");
  if (siteHeader) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 25) {
            siteHeader.classList.add("scrolled");
          } else {
            siteHeader.classList.remove("scrolled");
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // Listen to cross-tab storage changes (sync across tabs in realtime)
  window.addEventListener("storage", async (e) => {
    if (e.key === STORAGE_KEYS.PRODUCTS || e.key === STORAGE_KEYS.CATEGORIES) {
      await loadCatalogData();
      applySiteSettings();
      renderCategories();
      renderProducts();
    } else if (e.key === STORAGE_KEYS.SITE_SETTINGS) {
      await loadSiteSettings();
      applySiteSettings();
      renderProducts(); // Refresh WhatsApp order links with new number if changed
    }
  });
});

/**
 * ============================================================================
 * MANBHAR CREATION - ADMIN DASHBOARD CONTROLLER
 * Full Product Management, Image Upload with Auto-WebP Compression & Supabase Sync
 * ============================================================================
 */

// Storage Keys
const STORAGE_KEYS = {
  SUPABASE_CFG: "manbhar_supabase_config",
  PRODUCTS: "manbhar_products",
  CATEGORIES: "manbhar_categories",
  SITE_SETTINGS: "manbhar_site_settings",
  OFFERS: "manbhar_offers"
};

// Default Offers & Deals Settings
const DEFAULT_OFFERS = {
  announcement: {
    enabled: true,
    text: "🎉 Special Festive Offer: Flat 20% OFF on all Kurta Sets | Use Code: FESTIVE20",
    bgColor: "maroon",
    link: "#products"
  },
  countdown: {
    enabled: false,
    endTime: ""
  },
  coupons: [
    {
      id: "c_festive20",
      code: "FESTIVE20",
      type: "percent",
      value: 20,
      minOrder: 999,
      expiry: "2026-12-31",
      enabled: true
    },
    {
      id: "c_kurta100",
      code: "KURTA100",
      type: "flat",
      value: 100,
      minOrder: 799,
      expiry: "2026-12-31",
      enabled: true
    }
  ],
  bundles: {
    enabled: true,
    tiers: [
      { id: "b_3", qty: 3, price: 999 },
      { id: "b_4", qty: 4, price: 1199 }
    ],
    scope: "all",
    scopeItems: [],
    intermediateRule: "largest_tier_per_piece",
    allowCouponWithBundle: false
  },
  combo: {
    enabled: false,
    buyQty: 2,
    discountPercent: 15
  },
  free_delivery: {
    enabled: true,
    minAmount: 1499
  },
  popup: {
    enabled: false,
    version: "1",
    heading: "✨ Festive Grand Celebration ✨",
    text: "Get flat 20% OFF on premium handcrafted Men Kurtas. Use coupon code FESTIVE20 at checkout!",
    image: "",
    ctaText: "Shop Festive Kurtas",
    ctaLink: "#products"
  }
};

let currentOffers = JSON.parse(JSON.stringify(DEFAULT_OFFERS));

// Detailed Error Message Formatter for Supabase Errors
function formatSupabaseError(error, defaultContext = "Operation failed") {
  if (!error) return defaultContext;
  const msg = error.message || error.error_description || String(error);
  const status = error.status || error.statusCode || "";

  if (msg.includes("row-level security") || msg.includes("row level security") || msg.includes("violates row-level security policy")) {
    return `Row-Level Security (RLS) Policy Error: Only authenticated admin can perform this write/upload operation. Your login session may have expired or is not logged in. Please re-login to the Admin Dashboard.`;
  }
  if (msg.includes("Bucket not found") || msg.includes("bucket")) {
    return `Storage Bucket Error: Bucket 'product-images' was not found in Supabase Storage. Please create the bucket in Supabase Dashboard -> Storage.`;
  }
  if (msg.includes("JWT") || msg.includes("token") || msg.includes("expired") || msg.includes("invalid claim")) {
    return `Login Session Expired: Your admin login token has expired. Please re-login to the Admin Dashboard.`;
  }
  if (msg.includes("network") || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return `Network Error: Unable to connect to Supabase servers. Please check your internet connection.`;
  }
  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return `Database Conflict: An item with this ID already exists.`;
  }
  return `${defaultContext}: ${msg}${status ? ` (Status: ${status})` : ""}`;
}

// Session Validator Helper
async function ensureAuthenticatedSession() {
  if (!supabaseClient) {
    alert("Supabase client is not connected. Please check config.js.");
    return false;
  }
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session || !session.user) {
      alert("⚠️ Admin Login Session Expired: Please log in again to continue.");
      const loginScreen = document.getElementById("loginScreen");
      const adminDashboard = document.getElementById("adminDashboard");
      if (loginScreen) loginScreen.style.display = "flex";
      if (adminDashboard) adminDashboard.style.display = "none";
      return false;
    }
    return true;
  } catch (e) {
    alert("Session verification failed. Please re-login.");
    return false;
  }
}

// Debug Helper for Image Sources
function logImageSource(context, name, url) {
  let source = "Unknown";
  if (!url) source = "Placeholder Fallback";
  else if (url.includes("supabase.co")) source = "Supabase Cloud Storage (Public CDN)";
  else if (url.startsWith("data:")) source = "Local Base64 DataURL";
  else if (url.startsWith("assets/")) source = "Local Static File (assets/)";
  else if (url.startsWith("http")) source = "External Web URL";
  else source = "Relative File Path";

  console.log(`[Image Debug] ${context} -> "${name || 'Item'}": [Source: ${source}] ${url ? url.substring(0, 100) : ''}`);
  return source;
}

// Default Site & Hero Settings
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

// Default Categories template
const DEFAULT_CATEGORIES = [
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
];

// State
let supabaseClient = null;
let currentProducts = [];
let currentCategories = [];
let currentFormImages = []; // Array of URL strings for current product form
let currentSiteSettings = JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS));

/**
 * Toast Notification
 */
function showToast(msg, duration = 3000) {
  const toast = document.getElementById("adminToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

/**
 * Switch Navigation Tab
 */
function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    if (btn.getAttribute("data-tab") === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  document.querySelectorAll(".tab-pane").forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.add("active");
    } else {
      pane.classList.remove("active");
    }
  });
}
window.switchTab = switchTab;

/**
 * ----------------------------------------------------------------------------
 * 1. SUPABASE CLIENT & AUTHENTICATION
 * ----------------------------------------------------------------------------
 */
function getActiveSupabaseConfig() {
  const savedCfg = localStorage.getItem(STORAGE_KEYS.SUPABASE_CFG);
  if (savedCfg) {
    try {
      const parsed = JSON.parse(savedCfg);
      if (parsed.url && (parsed.key || parsed.anonKey)) {
        return { url: parsed.url, key: parsed.key || parsed.anonKey };
      }
    } catch (e) {}
  }
  if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey) {
    return { url: window.SUPABASE_CONFIG.url, key: window.SUPABASE_CONFIG.anonKey };
  }
  return null;
}

function initSupabase() {
  const cfg = getActiveSupabaseConfig();
  const dot = document.getElementById("syncStatusDot");
  const text = document.getElementById("syncStatusText");
  const btnDisconnect = document.getElementById("btnDisconnectSupabase");

  if (cfg && cfg.url && cfg.key && window.supabase) {
    try {
      if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(cfg.url, cfg.key);
      }
      if (dot) dot.classList.add("connected");
      if (text) text.textContent = "Storage: Connected to Supabase Cloud";
      if (btnDisconnect) btnDisconnect.style.display = "inline-flex";
      return supabaseClient;
    } catch (err) {
      console.warn("Invalid Supabase initialization:", err);
    }
  }

  // Fallback to local
  supabaseClient = null;
  if (dot) dot.classList.remove("connected");
  if (text) text.textContent = "Storage: Local Storage Mode (Ready to connect Supabase)";
  if (btnDisconnect) btnDisconnect.style.display = "none";
  return null;
}

async function initAuth() {
  const loginScreen = document.getElementById("loginScreen");
  const adminDashboard = document.getElementById("adminDashboard");
  const loginForm = document.getElementById("loginForm");
  const adminEmail = document.getElementById("adminEmail");
  const adminPassword = document.getElementById("adminPassword");
  const loginError = document.getElementById("loginError");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");
  const loginBtnText = document.getElementById("loginBtnText");

  initSupabase();

  if (!supabaseClient) {
    if (loginError) {
      loginError.textContent = "Supabase configuration missing in config.js. Please check your credentials.";
      loginError.style.display = "block";
    }
  }

  // 1. Check existing authenticated session in Supabase Auth (persists across refreshes)
  if (supabaseClient) {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (!error && session && session.user) {
        console.log(`[Supabase Auth] Active session restored for: ${session.user.email}`);
        loginScreen.style.display = "none";
        adminDashboard.style.display = "block";
        loadDashboard();
      } else {
        loginScreen.style.display = "flex";
        adminDashboard.style.display = "none";
      }
    } catch (err) {
      console.warn("Session restore error:", err);
      loginScreen.style.display = "flex";
      adminDashboard.style.display = "none";
    }

    // 2. React to Auth State Changes (expiry, sign out, token refresh)
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log(`[Supabase Auth Event] ${event}`);
      if (event === "SIGNED_IN" && session) {
        loginScreen.style.display = "none";
        adminDashboard.style.display = "block";
        loadDashboard();
      } else if (event === "SIGNED_OUT" || !session) {
        loginScreen.style.display = "flex";
        adminDashboard.style.display = "none";
        if (adminPassword) adminPassword.value = "";
      } else if (event === "TOKEN_REFRESHED" && session) {
        console.log("[Supabase Auth] Access token refreshed automatically.");
      }
    });
  } else {
    loginScreen.style.display = "flex";
    adminDashboard.style.display = "none";
  }

  // Toggle eye visibility
  if (togglePasswordBtn && adminPassword) {
    togglePasswordBtn.addEventListener("click", () => {
      const type = adminPassword.getAttribute("type") === "password" ? "text" : "password";
      adminPassword.setAttribute("type", type);
      togglePasswordBtn.textContent = type === "password" ? "👁" : "🔒";
    });
  }

  // Submit form via Supabase Auth: signInWithPassword
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (loginError) loginError.style.display = "none";

      if (!supabaseClient) {
        initSupabase();
        if (!supabaseClient) {
          loginError.textContent = "Supabase client not connected. Please verify config.js.";
          loginError.style.display = "block";
          return;
        }
      }

      const email = adminEmail ? adminEmail.value.trim() : "";
      const password = adminPassword ? adminPassword.value : "";

      if (!email || !password) {
        loginError.textContent = "Please enter both admin email and password.";
        loginError.style.display = "block";
        return;
      }

      if (loginSubmitBtn) loginSubmitBtn.disabled = true;
      if (loginBtnText) loginBtnText.textContent = "Verifying with Supabase Auth...";

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) {
          throw error;
        }

        if (data && data.session) {
          loginScreen.style.display = "none";
          adminDashboard.style.display = "block";
          loadDashboard();
          showToast(`Welcome back, ${data.user.email}!`);
        }
      } catch (err) {
        let msg = err.message || "Failed to log in.";
        if (msg.includes("Invalid login credentials")) {
          msg = "Invalid email or password. Please verify your admin credentials in Supabase Dashboard -> Authentication.";
        } else if (msg.includes("Email not confirmed")) {
          msg = "Email is not confirmed. In Supabase Dashboard -> Authentication -> Users, make sure 'Auto Confirm User' is checked.";
        }
        loginError.textContent = msg;
        loginError.style.display = "block";
      } finally {
        if (loginSubmitBtn) loginSubmitBtn.disabled = false;
        if (loginBtnText) loginBtnText.textContent = "Login to Dashboard";
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (supabaseClient) {
        try {
          await supabaseClient.auth.signOut();
        } catch (e) {
          console.warn("Sign out error:", e);
        }
      }
      loginScreen.style.display = "flex";
      adminDashboard.style.display = "none";
      if (adminPassword) adminPassword.value = "";
      showToast("Logged out successfully.");
    });
  }
}

/**
 * ----------------------------------------------------------------------------
 * 2. DATA LAYER (SUPABASE + LOCALSTORAGE)
 * ----------------------------------------------------------------------------
 */

async function fetchProducts() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        currentProducts = data;
        // Backup to local
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to local:", err);
    }
  }

  // Local storage fallback
  const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  currentProducts = raw ? JSON.parse(raw) : [];
  return currentProducts;
}

async function persistProduct(productData) {
  if (supabaseClient) {
    const isAuth = await ensureAuthenticatedSession();
    if (!isAuth) throw new Error("Authenticated session required.");

    // Clean DB record: strictly match Supabase public.products columns!
    const dbRecord = {
      id: productData.id,
      name: productData.name,
      category: productData.category,
      price: productData.price,
      original_price: productData.original_price !== undefined ? productData.original_price : (productData.originalPrice || null),
      badge: productData.badge || null,
      image: productData.image,
      images: productData.images || [],
      sizes: productData.sizes || [],
      stock: productData.stock || {},
      is_out_of_stock: productData.is_out_of_stock !== undefined ? productData.is_out_of_stock : (productData.isOutOfStock || false),
      description: productData.description || null,
      is_flash_sale: productData.is_flash_sale || false,
      flash_sale_end: productData.flash_sale_end || null
    };

    try {
      const { data, error } = await supabaseClient
        .from("products")
        .upsert(dbRecord);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase upsert failed:", err);
      const detail = formatSupabaseError(err, "Failed to save product to Cloud Database");
      alert(detail);
      throw err;
    }
  }

  // Update in-memory & local storage
  const existingIdx = currentProducts.findIndex(p => p.id === productData.id);
  if (existingIdx >= 0) {
    currentProducts[existingIdx] = productData;
  } else {
    currentProducts.unshift(productData);
  }
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(currentProducts));
}

async function removeProduct(productId) {
  if (supabaseClient) {
    const isAuth = await ensureAuthenticatedSession();
    if (!isAuth) return;

    try {
      const { error } = await supabaseClient.from("products").delete().eq("id", productId);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase delete failed:", err);
      alert(formatSupabaseError(err, "Failed to delete product from Cloud Database"));
      return;
    }
  }

  currentProducts = currentProducts.filter(p => p.id !== productId);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(currentProducts));
}

async function fetchCategories() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from("categories").select("*");
      if (!error && data && data.length > 0) {
        currentCategories = data;
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn("Supabase categories fetch failed:", err);
    }
  }

  const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  currentCategories = raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
  return currentCategories;
}

async function persistCategory(catData) {
  if (supabaseClient) {
    const isAuth = await ensureAuthenticatedSession();
    if (!isAuth) return;

    // Clean DB record: strictly match Supabase public.categories columns!
    const dbCat = {
      id: catData.id,
      name: catData.name,
      tagline: catData.tagline || null,
      starting_price: catData.starting_price !== undefined ? catData.starting_price : (catData.startingPrice || 0),
      image: catData.image || null
    };

    try {
      const { error } = await supabaseClient.from("categories").upsert(dbCat);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase category upsert failed:", err);
      alert(formatSupabaseError(err, "Failed to save category banner"));
      return;
    }
  }

  const idx = currentCategories.findIndex(c => c.id === catData.id);
  if (idx >= 0) {
    currentCategories[idx] = catData;
  } else {
    currentCategories.push(catData);
  }
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(currentCategories));
}

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

async function fetchSiteSettings() {
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
      console.warn("Supabase fetch site_settings failed, using local:", err);
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

async function persistSiteSettings(settingsObj) {
  currentSiteSettings = settingsObj;
  localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(settingsObj));

  if (supabaseClient) {
    const isAuth = await ensureAuthenticatedSession();
    if (!isAuth) return;

    try {
      const { error } = await supabaseClient.from("settings").upsert({
        key: "site_settings",
        value: settingsObj
      });
      if (error) throw error;
    } catch (err) {
      console.error("Supabase settings upsert failed:", err);
      alert(formatSupabaseError(err, "Failed to save site settings"));
    }
  }
}

/**
 * ----------------------------------------------------------------------------
 * 3. AUTO WEBP CLIENT-SIDE COMPRESSION & IMAGE UPLOAD
 * ----------------------------------------------------------------------------
 */
function compressImageToWebP(file, maxDimension = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Try to export as WebP
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback to JPEG if browser doesn't support WebP export
            canvas.toBlob((jpgBlob) => {
              resolve(jpgBlob);
            }, "image/jpeg", quality);
          }
        }, "image/webp", quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function uploadFile(file, index, total) {
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const progressWrap = document.getElementById("uploadProgress");

  if (progressWrap) progressWrap.style.display = "block";
  if (progressText) progressText.textContent = `Auto WebP Compressing photo ${index + 1} of ${total}...`;
  if (progressBar) progressBar.style.width = `${Math.round(((index + 0.5) / total) * 100)}%`;

  // 1. Compress to WebP in browser
  const compressedBlob = await compressImageToWebP(file);

  // 2. Upload to Supabase Storage with authenticated session
  if (supabaseClient) {
    const isAuth = await ensureAuthenticatedSession();
    if (!isAuth) {
      throw new Error("Admin login session expired. Please log in again.");
    }

    try {
      if (progressText) progressText.textContent = `Uploading photo ${index + 1} of ${total} to Supabase Cloud...`;
      const fileName = `products/kurta_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;
      const { data, error } = await supabaseClient.storage
        .from("product-images")
        .upload(fileName, compressedBlob, {
          contentType: "image/webp",
          upsert: true
        });

      if (error) {
        console.error("Supabase Storage Upload Error:", error);
        const errorDetail = formatSupabaseError(error, "Product Image Storage Upload Failed");
        alert(errorDetail);
        throw new Error(errorDetail);
      }

      if (data) {
        const { data: publicUrlData } = supabaseClient.storage
          .from("product-images")
          .getPublicUrl(fileName);
        logImageSource("Product Image Upload", fileName, publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      }
    } catch (err) {
      console.warn("Storage upload failed:", err);
      throw err;
    }
  } else {
    alert("Supabase is not connected. Please verify config.js.");
    throw new Error("Supabase is not connected.");
  }
}

function renderPhotoPreviews() {
  const container = document.getElementById("photoPreviewsGrid");
  if (!container) return;

  if (currentFormImages.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--admin-text-muted); padding: 0.5rem; font-size: 0.8rem;">
        No photos added yet. Select photos above.
      </div>
    `;
    return;
  }

  container.innerHTML = currentFormImages.map((imgUrl, idx) => `
    <div class="preview-card" data-index="${idx}">
      <img src="${imgUrl}" alt="Photo ${idx + 1}" class="preview-img">
      ${idx === 0 ? `<span class="cover-badge">★ Cover</span>` : ""}
      <div class="preview-actions">
        ${idx > 0 ? `<button type="button" class="btn-preview-action" onclick="movePhoto(${idx}, -1)" title="Move left">←</button>` : `<span></span>`}
        <button type="button" class="btn-preview-action btn-preview-del" onclick="deletePhoto(${idx})" title="Delete photo">✕</button>
        ${idx < currentFormImages.length - 1 ? `<button type="button" class="btn-preview-action" onclick="movePhoto(${idx}, 1)" title="Move right">→</button>` : `<span></span>`}
      </div>
    </div>
  `).join("");
}

window.movePhoto = function(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= currentFormImages.length) return;
  const temp = currentFormImages[index];
  currentFormImages[index] = currentFormImages[target];
  currentFormImages[target] = temp;
  renderPhotoPreviews();
};

window.deletePhoto = function(index) {
  currentFormImages.splice(index, 1);
  renderPhotoPreviews();
};

function initPhotoUpload() {
  const dropZone = document.getElementById("dropZone");
  const photoInput = document.getElementById("photoInput");
  const progressWrap = document.getElementById("uploadProgress");
  const progressBar = document.getElementById("progressBar");

  if (!dropZone || !photoInput) return;

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    for (let i = 0; i < fileList.length; i++) {
      try {
        const url = await uploadFile(fileList[i], i, fileList.length);
        currentFormImages.push(url);
      } catch (err) {
        console.error("Compression/Upload error:", err);
      }
    }

    if (progressBar) progressBar.style.width = "100%";
    setTimeout(() => {
      if (progressWrap) progressWrap.style.display = "none";
      if (progressBar) progressBar.style.width = "0%";
    }, 400);

    renderPhotoPreviews();
    showToast(`Added ${fileList.length} photo(s) in compressed WebP format.`);
  }

  photoInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    photoInput.value = ""; // Reset for re-selection
  });

  // Drag and drop events
  ["dragenter", "dragover"].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files) {
      handleFiles(dt.files);
    }
  });
}

/**
 * ----------------------------------------------------------------------------
 * 4. ADD / EDIT PRODUCT FORM
 * ----------------------------------------------------------------------------
 */
function initProductForm() {
  const form = document.getElementById("productForm");
  const cancelBtn = document.getElementById("cancelEditBtn");

  if (!form) return;

  const flashSaleChk = document.getElementById("prodFlashSale");
  const flashEndGroup = document.getElementById("prodFlashSaleEndGroup");
  if (flashSaleChk && flashEndGroup) {
    flashSaleChk.addEventListener("change", (e) => {
      flashEndGroup.style.display = e.target.checked ? "block" : "none";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const editId = document.getElementById("editProductId").value;
    const name = document.getElementById("prodName").value.trim();
    const category = document.getElementById("prodCategory").value;
    const price = parseFloat(document.getElementById("prodPrice").value);
    const originalPriceInput = document.getElementById("prodOriginalPrice").value;
    const originalPrice = originalPriceInput ? parseFloat(originalPriceInput) : null;
    const badge = document.getElementById("prodBadge").value.trim() || null;
    const description = document.getElementById("prodDesc").value.trim() || null;

    if (currentFormImages.length === 0) {
      alert("Please upload at least one photo for this kurta.");
      return;
    }

    // Collect sizes & individual stock counts
    const availableSizes = [];
    const stockMap = {};
    const sizeKeys = ["S", "M", "L", "XL", "XXL"];

    sizeKeys.forEach(sz => {
      const chk = document.getElementById(`size_${sz}`);
      const qtyInput = document.getElementById(`stock_${sz}`);
      if (chk && chk.checked) {
        availableSizes.push(sz);
        stockMap[sz] = Math.max(0, parseInt(qtyInput.value) || 0);
      } else {
        stockMap[sz] = 0;
      }
    });

    if (availableSizes.length === 0) {
      alert("Please select at least one available size.");
      return;
    }

    // Check if totally out of stock
    const totalStock = Object.values(stockMap).reduce((acc, v) => acc + v, 0);
    const isOutOfStock = totalStock === 0;

    const saveBtn = document.getElementById("saveProductBtn");
    if (saveBtn) saveBtn.disabled = true;

    const isFlashSale = document.getElementById("prodFlashSale")?.checked || false;
    const flashSaleEndVal = document.getElementById("prodFlashSaleEnd")?.value || null;
    const flashSaleEndIso = (isFlashSale && flashSaleEndVal) ? new Date(flashSaleEndVal).toISOString() : null;

    const prodId = editId || `kurta-${Date.now()}`;
    const productRecord = {
      id: prodId,
      name,
      category,
      price,
      original_price: originalPrice,
      badge,
      image: currentFormImages[0], // primary cover
      images: currentFormImages,
      sizes: availableSizes,
      stock: stockMap,
      is_out_of_stock: isOutOfStock,
      description,
      is_flash_sale: isFlashSale,
      flash_sale_end: flashSaleEndIso,
      created_at: new Date().toISOString()
    };

    try {
      await persistProduct(productRecord);
      showToast(editId ? "Kurta updated successfully!" : "New Kurta added to website!");
      resetForm();
      renderProductsList();
      switchTab("tab-products");
    } catch (err) {
      alert("Error saving product: " + err.message);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      resetForm();
    });
  }
}

function resetForm() {
  const form = document.getElementById("productForm");
  if (form) form.reset();
  document.getElementById("editProductId").value = "";
  document.getElementById("formHeaderTitle").textContent = "Add New Kurta";
  document.getElementById("formTabTitle").textContent = "Add Product";
  document.getElementById("saveBtnText").textContent = "Save & Publish Kurta";
  document.getElementById("cancelEditBtn").style.display = "none";
  currentFormImages = [];
  renderPhotoPreviews();

  // Reset flash sale inputs
  const flashSaleChk = document.getElementById("prodFlashSale");
  if (flashSaleChk) flashSaleChk.checked = false;
  const flashSaleEnd = document.getElementById("prodFlashSaleEnd");
  if (flashSaleEnd) flashSaleEnd.value = "";
  const flashEndGroup = document.getElementById("prodFlashSaleEndGroup");
  if (flashEndGroup) flashEndGroup.style.display = "none";

  // Reset sizes checkboxes and default quantities
  const defaults = { S: 5, M: 10, L: 8, XL: 4, XXL: 2 };
  Object.keys(defaults).forEach(sz => {
    const chk = document.getElementById(`size_${sz}`);
    const inp = document.getElementById(`stock_${sz}`);
    if (chk) chk.checked = true;
    if (inp) inp.value = defaults[sz];
  });
}

window.editProduct = function(productId) {
  const p = currentProducts.find(item => item.id === productId);
  if (!p) return;

  document.getElementById("editProductId").value = p.id;
  document.getElementById("prodName").value = p.name;
  document.getElementById("prodCategory").value = p.category;
  document.getElementById("prodPrice").value = p.price;
  document.getElementById("prodOriginalPrice").value = p.originalPrice || p.original_price || "";
  document.getElementById("prodBadge").value = p.badge || "";
  document.getElementById("prodDesc").value = p.description || "";

  // Flash Sale fields
  const flashSaleChk = document.getElementById("prodFlashSale");
  const flashEndGroup = document.getElementById("prodFlashSaleEndGroup");
  const flashSaleEnd = document.getElementById("prodFlashSaleEnd");
  const isFlash = p.is_flash_sale || p.isFlashSale || false;

  if (flashSaleChk) flashSaleChk.checked = isFlash;
  if (flashEndGroup) flashEndGroup.style.display = isFlash ? "block" : "none";
  if (flashSaleEnd) {
    const rawDate = p.flash_sale_end || p.flashSaleEnd;
    if (rawDate) {
      const d = new Date(rawDate);
      const pad = n => String(n).padStart(2, "0");
      flashSaleEnd.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } else {
      flashSaleEnd.value = "";
    }
  }

  // Images
  currentFormImages = p.images && p.images.length > 0 ? [...p.images] : [p.image];
  renderPhotoPreviews();

  // Sizes & Stock
  const sizeKeys = ["S", "M", "L", "XL", "XXL"];
  sizeKeys.forEach(sz => {
    const chk = document.getElementById(`size_${sz}`);
    const inp = document.getElementById(`stock_${sz}`);
    const isAvail = p.sizes ? p.sizes.includes(sz) : false;
    const stockQty = p.stock && p.stock[sz] !== undefined ? p.stock[sz] : 0;

    if (chk) chk.checked = isAvail;
    if (inp) inp.value = stockQty;
  });

  document.getElementById("formHeaderTitle").textContent = "Edit Kurta Details";
  document.getElementById("formTabTitle").textContent = "Editing Kurta";
  document.getElementById("saveBtnText").textContent = "Update Kurta";
  document.getElementById("cancelEditBtn").style.display = "inline-flex";

  switchTab("tab-add");
};

window.confirmDeleteProduct = async function(productId) {
  const p = currentProducts.find(item => item.id === productId);
  if (!p) return;

  if (confirm(`Are you sure you want to delete "${p.name}"? This cannot be undone.`)) {
    await removeProduct(productId);
    renderProductsList();
    showToast("Kurta deleted from catalog.");
  }
};

window.toggleOutOfStock = async function(productId, isChecked) {
  const p = currentProducts.find(item => item.id === productId);
  if (!p) return;

  p.is_out_of_stock = isChecked;
  await persistProduct(p);
  renderProductsList();
  showToast(isChecked ? "Marked Out of Stock." : "Marked In Stock.");
};

/**
 * ----------------------------------------------------------------------------
 * 5. PRODUCTS LIST
 * ----------------------------------------------------------------------------
 */
function renderProductsList() {
  const container = document.getElementById("adminProductsContainer");
  const countEl = document.getElementById("totalProductsCount");
  const searchInput = document.getElementById("adminSearchInput");
  const catFilter = document.getElementById("adminCategoryFilter");

  if (!container) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const cat = catFilter ? catFilter.value : "all";

  let filtered = [...currentProducts];

  if (cat !== "all") {
    filtered = filtered.filter(p => p.category === cat);
  }

  if (query) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query) ||
      (p.badge && p.badge.toLowerCase().includes(query))
    );
  }

  if (countEl) countEl.textContent = currentProducts.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; background: #fff; border-radius: 8px; border: 1.5px dashed var(--admin-border);">
        <p style="font-family: var(--font-serif); font-size: 1.2rem; color: var(--admin-maroon); margin-bottom: 0.5rem;">
          ${currentProducts.length === 0 ? "No Kurtas Added Yet" : "No matching kurtas found"}
        </p>
        <p style="color: var(--admin-text-muted); font-size: 0.85rem; margin-bottom: 1.25rem;">
          ${currentProducts.length === 0 ? "Click 'Add Product' above to publish your first kurta to the store!" : "Try changing search terms or category filter."}
        </p>
        <button class="btn-admin-primary" onclick="switchTab('tab-add')">+ Add Your First Kurta</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const isOut = p.is_out_of_stock;
    const coverPhoto = (p.images && p.images[0]) || p.image || "assets/logo.png";
    const originalPrice = p.originalPrice || p.original_price;

    // Stock badges per size
    const sizesHtml = (p.sizes || []).map(sz => {
      const qty = p.stock && p.stock[sz] !== undefined ? p.stock[sz] : 0;
      const isZero = qty === 0;
      return `<span class="size-stock-badge ${isZero ? 'zero' : ''}">${sz}: ${qty}</span>`;
    }).join("");

    return `
      <div class="admin-product-row ${isOut ? 'is-out-of-stock' : ''}" id="row-${p.id}">
        <div class="prod-main-info">
          <div class="prod-thumb-wrap">
            <img src="${coverPhoto}" alt="${p.name}" class="prod-thumb-img" onerror="this.src='assets/logo.png'">
          </div>
          <div class="prod-meta">
            <h4 class="prod-meta-title">${p.name}</h4>
            <span class="prod-meta-cat">${p.category} ${p.badge ? `• <span style="color:var(--admin-maroon); font-weight:bold;">${p.badge}</span>` : ""} ${(p.is_flash_sale || p.isFlashSale) ? `• <span style="color:#BE123C; font-weight:bold; background:#FFF1F2; padding:1px 6px; border-radius:4px; border:1px solid #FDA4AF; font-size:0.75rem;">⚡ Flash Sale</span>` : ""}</span>
            <div class="prod-meta-price">
              <span>₹${p.price}</span>
              ${originalPrice ? `<span class="prod-meta-original">₹${originalPrice}</span>` : ""}
            </div>
            <div class="prod-sizes-summary">
              ${sizesHtml}
            </div>
          </div>
        </div>

        <div class="prod-row-actions">
          <label class="toggle-stock-wrap" title="Toggle product out of stock">
            <span>In Stock:</span>
            <label class="switch">
              <input type="checkbox" ${!isOut ? 'checked' : ''} onchange="toggleOutOfStock('${p.id}', !this.checked)">
              <span class="slider"></span>
            </label>
          </label>

          <button type="button" class="btn-edit-prod" onclick="editProduct('${p.id}')">✏️ Edit</button>
          <button type="button" class="btn-del-prod" onclick="confirmDeleteProduct('${p.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

function initSearchAndFilter() {
  const searchInput = document.getElementById("adminSearchInput");
  const catFilter = document.getElementById("adminCategoryFilter");

  if (searchInput) {
    searchInput.addEventListener("input", () => renderProductsList());
  }
  if (catFilter) {
    catFilter.addEventListener("change", () => renderProductsList());
  }
}

/**
 * ----------------------------------------------------------------------------
 * 6. CATEGORY BANNERS EDITOR
 * ----------------------------------------------------------------------------
 */
function renderCategoryCardsEditor() {
  const container = document.getElementById("categoryCardsEditor");
  if (!container) return;

  container.innerHTML = currentCategories.map(cat => `
    <div class="cat-edit-card" id="cat-card-${cat.id}">
      <div class="cat-edit-preview-wrap">
        <img src="${cat.image || 'assets/logo.png'}" alt="${cat.name}" id="cat-img-${cat.id}" class="cat-edit-img">
      </div>
      
      <div>
        <h4 style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--admin-maroon); margin-bottom: 0.2rem;">${cat.name} Kurta</h4>
        <p style="font-size: 0.78rem; color: var(--admin-text-muted); margin-bottom: 0.75rem;">${cat.tagline}</p>
      </div>

      <div class="form-group" style="margin-bottom: 0.5rem;">
        <label class="form-label" style="font-size: 0.8rem;">Cover Photo</label>
        <input type="file" accept="image/*" class="form-input" style="padding: 0.4rem;" onchange="handleCategoryPhotoChange('${cat.id}', this.files[0])">
      </div>

      <div class="form-group" style="margin-bottom: 0.5rem;">
        <label class="form-label" style="font-size: 0.8rem;">Starting at Price (₹)</label>
        <input type="number" id="cat-price-${cat.id}" class="form-input" value="${cat.startingPrice}" min="1">
      </div>

      <button type="button" class="btn-admin-primary" style="margin-top: auto;" onclick="saveCategoryCard('${cat.id}')">Save ${cat.name} Banner</button>
    </div>
  `).join("");
}

window.handleCategoryPhotoChange = async function(catId, file) {
  if (!file) return;
  const isAuth = await ensureAuthenticatedSession();
  if (!isAuth) return;

  const compressed = await compressImageToWebP(file, 800, 0.85);

  if (supabaseClient) {
    try {
      showToast(`Uploading cover for "${catId}" to Supabase...`);
      const fileName = `categories/cat_${catId}_${Date.now()}.webp`;
      const { data, error } = await supabaseClient.storage
        .from("product-images")
        .upload(fileName, compressed, { contentType: "image/webp", upsert: true });

      if (error) {
        console.error("Category storage upload error:", error);
        alert(formatSupabaseError(error, "Category Image Upload Failed"));
        return;
      }

      if (data) {
        const { data: pubUrl } = supabaseClient.storage.from("product-images").getPublicUrl(fileName);
        const finalUrl = pubUrl.publicUrl;
        logImageSource("Category Cover Upload", catId, finalUrl);

        const preview = document.getElementById(`cat-img-${catId}`);
        if (preview) preview.src = finalUrl;

        const cat = currentCategories.find(c => c.id === catId);
        if (cat) cat.image = finalUrl;
        showToast("Category cover uploaded! Click 'Save Banner' to publish.");
      }
    } catch (err) {
      alert("Category Upload Error: " + formatSupabaseError(err));
    }
  }
};

window.saveCategoryCard = async function(catId) {
  const cat = currentCategories.find(c => c.id === catId);
  if (!cat) return;

  const priceInput = document.getElementById(`cat-price-${catId}`);
  if (priceInput) cat.startingPrice = parseFloat(priceInput.value) || cat.startingPrice;

  await persistCategory(cat);
  showToast(`Updated "${cat.name}" category banner!`);
};

/**
 * ----------------------------------------------------------------------------
 * 7. SETTINGS & CLOUD CONFIGURATION
 * ----------------------------------------------------------------------------
 */
function initSettings() {
  const urlInput = document.getElementById("cfgSupabaseUrl");
  const keyInput = document.getElementById("cfgSupabaseKey");
  const testBtn = document.getElementById("btnTestSupabase");
  const disconnectBtn = document.getElementById("btnDisconnectSupabase");
  const statusMsg = document.getElementById("supabaseStatusMsg");

  // Populate saved credentials if any
  const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CFG);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (urlInput) urlInput.value = parsed.url || "";
      if (keyInput) keyInput.value = parsed.key || "";
    } catch (e) {}
  }

  if (testBtn) {
    testBtn.addEventListener("click", async () => {
      const url = urlInput.value.trim();
      const key = keyInput.value.trim();

      if (!url || !key) {
        statusMsg.className = "supabase-status-msg error";
        statusMsg.textContent = "Please enter both Project URL and Anon Key.";
        statusMsg.style.display = "block";
        return;
      }

      statusMsg.className = "supabase-status-msg";
      statusMsg.textContent = "Connecting and verifying Supabase tables...";
      statusMsg.style.display = "block";

      try {
        if (!window.supabase) {
          throw new Error("Supabase library not loaded. Check internet connection.");
        }
        const client = window.supabase.createClient(url, key);
        const { data, error } = await client.from("products").select("id").limit(1);

        if (error) throw error;

        // Save valid config
        localStorage.setItem(STORAGE_KEYS.SUPABASE_CFG, JSON.stringify({ url, key }));
        supabaseClient = client;
        initSupabase();

        statusMsg.className = "supabase-status-msg success";
        statusMsg.textContent = "✅ Connected to Supabase Cloud! Products will now sync in realtime across all devices.";
        showToast("Supabase connected!");
        loadDashboard();
      } catch (err) {
        statusMsg.className = "supabase-status-msg error";
        statusMsg.textContent = "❌ Connection failed: " + err.message + ". Did you run the SQL script in Supabase SQL editor?";
      }
    });
  }

  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", () => {
      if (confirm("Disconnect Supabase and switch back to Local Storage?")) {
        localStorage.removeItem(STORAGE_KEYS.SUPABASE_CFG);
        initSupabase();
        statusMsg.style.display = "none";
        showToast("Switched to Local Storage.");
        loadDashboard();
      }
    });
  }

  // Change Password
  const changePassBtn = document.getElementById("btnChangePassword");
  const newPass = document.getElementById("newAdminPassword");
  const confPass = document.getElementById("confirmAdminPassword");
  const passMsg = document.getElementById("passwordChangeMsg");

  if (changePassBtn) {
    changePassBtn.addEventListener("click", async () => {
      const n = newPass.value.trim();
      const c = confPass.value.trim();

      if (!n || n.length < 6) {
        passMsg.className = "password-msg error";
        passMsg.textContent = "Password must be at least 6 characters long.";
        passMsg.style.display = "block";
        return;
      }

      if (n !== c) {
        passMsg.className = "password-msg error";
        passMsg.textContent = "Passwords do not match.";
        passMsg.style.display = "block";
        return;
      }

      if (supabaseClient) {
        const isAuth = await ensureAuthenticatedSession();
        if (!isAuth) {
          passMsg.className = "password-msg error";
          passMsg.textContent = "Session expired. Please log in again.";
          passMsg.style.display = "block";
          return;
        }

        passMsg.className = "password-msg";
        passMsg.textContent = "Updating password in Supabase Auth...";
        passMsg.style.display = "block";

        try {
          const { error } = await supabaseClient.auth.updateUser({ password: n });
          if (error) throw error;
          passMsg.className = "password-msg success";
          passMsg.textContent = "✅ Admin password updated successfully in Supabase Auth!";
          newPass.value = "";
          confPass.value = "";
          showToast("Password updated in Supabase Auth!");
        } catch (err) {
          passMsg.className = "password-msg error";
          passMsg.textContent = formatSupabaseError(err, "Failed to update password");
        }
      } else {
        passMsg.className = "password-msg error";
        passMsg.textContent = "Supabase is not connected. Admin password is managed in Supabase Auth.";
        passMsg.style.display = "block";
      }
    });
  }

  // Export JSON
  const exportBtn = document.getElementById("btnExportData");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentProducts, null, 2));
      const a = document.createElement("a");
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `manbhar_kurtas_backup_${Date.now()}.json`);
      a.click();
    });
  }

  // Reset Local Data
  const clearBtn = document.getElementById("btnClearLocalData");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all products in Local Storage?")) {
        localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
        currentProducts = [];
        renderProductsList();
        showToast("Local catalog cleared.");
      }
    });
  }

  // Quick Settings button in top status bar
  const quickBtn = document.getElementById("quickSettingsBtn");
  if (quickBtn) {
    quickBtn.addEventListener("click", () => switchTab("tab-settings"));
  }

  // Populate & wire Store Location, Google Maps & Instagram Settings
  populateStoreSettingsInputs();

  const btnSaveLinks = document.getElementById("btnSaveStoreLinks");
  if (btnSaveLinks) {
    btnSaveLinks.addEventListener("click", async () => {
      const mapsUrl = (document.getElementById("cfgMapsUrl")?.value || "").trim();
      const rawInsta = (document.getElementById("cfgInstagramUrl")?.value || "").trim();
      const instaUrl = cleanInstagramUrl(rawInsta);
      const address = (document.getElementById("cfgStoreAddress")?.value || "").trim();
      const timings = (document.getElementById("cfgStoreTimings")?.value || "").trim();

      if (!currentSiteSettings.contacts) currentSiteSettings.contacts = {};
      currentSiteSettings.contacts.mapsUrl = mapsUrl;
      currentSiteSettings.contacts.instagramUrl = instaUrl;
      currentSiteSettings.contacts.address = address;
      currentSiteSettings.contacts.timings = timings;

      populateStoreSettingsInputs();

      await persistSiteSettings(currentSiteSettings);
      showToast("✅ Store location, Google Maps & Instagram links saved!");
    });
  }

  const btnResetLinks = document.getElementById("btnResetStoreLinks");
  if (btnResetLinks) {
    btnResetLinks.addEventListener("click", async () => {
      if (confirm("Reset store location, Google Maps and Instagram links to defaults?")) {
        const d = DEFAULT_SITE_SETTINGS.contacts;
        if (!currentSiteSettings.contacts) currentSiteSettings.contacts = {};
        currentSiteSettings.contacts.mapsUrl = d.mapsUrl;
        currentSiteSettings.contacts.instagramUrl = d.instagramUrl;
        currentSiteSettings.contacts.address = d.address;
        currentSiteSettings.contacts.timings = d.timings;

        populateStoreSettingsInputs();
        await persistSiteSettings(currentSiteSettings);
        showToast("↺ Store location and links reset to default values.");
      }
    });
  }
}

function cleanInstagramUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.includes("instagram.com")) {
    return trimmed.split("?")[0];
  }
  return trimmed;
}

function populateStoreSettingsInputs() {
  const contacts = currentSiteSettings.contacts || DEFAULT_SITE_SETTINGS.contacts;
  const mapsInput = document.getElementById("cfgMapsUrl");
  if (mapsInput) mapsInput.value = contacts.mapsUrl || "";

  const instaInput = document.getElementById("cfgInstagramUrl");
  if (instaInput) instaInput.value = contacts.instagramUrl || "";

  const addrInput = document.getElementById("cfgStoreAddress");
  if (addrInput) addrInput.value = contacts.address || "";

  const timeInput = document.getElementById("cfgStoreTimings");
  if (timeInput) timeInput.value = contacts.timings || "";

  // Also sync hero tab inputs if present
  const heroMaps = document.getElementById("contactMapsUrl");
  if (heroMaps) heroMaps.value = contacts.mapsUrl || "";

  const heroInsta = document.getElementById("contactInstagramUrl");
  if (heroInsta) heroInsta.value = contacts.instagramUrl || "";
}

/**
 * ----------------------------------------------------------------------------
 * 7B. HERO BANNER & STORE SETTINGS CONTROLLER
 * ----------------------------------------------------------------------------
 */
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderOccasionTagsList() {
  const container = document.getElementById("occasionTagsList");
  if (!container) return;

  const occasions = currentSiteSettings.hero.occasions || [];
  if (occasions.length === 0) {
    container.innerHTML = `<span style="font-size: 0.8rem; color: var(--admin-text-muted);">No occasion tags. Type above and click "+ Add" to add tags.</span>`;
    return;
  }

  container.innerHTML = occasions.map((tag, idx) => `
    <span class="tag-chip">
      <span>${escapeHtml(tag)}</span>
      <span class="tag-chip-actions">
        ${idx > 0 ? `<button type="button" class="btn-tag-chip" onclick="moveOccasionTag(${idx}, -1)" title="Move Left">◀</button>` : ""}
        ${idx < occasions.length - 1 ? `<button type="button" class="btn-tag-chip" onclick="moveOccasionTag(${idx}, 1)" title="Move Right">▶</button>` : ""}
        <button type="button" class="btn-tag-chip btn-tag-del" onclick="deleteOccasionTag(${idx})" title="Remove Tag">✕</button>
      </span>
    </span>
  `).join("");
}

window.moveOccasionTag = function(idx, dir) {
  const arr = currentSiteSettings.hero.occasions;
  const target = idx + dir;
  if (target < 0 || target >= arr.length) return;
  const temp = arr[idx];
  arr[idx] = arr[target];
  arr[target] = temp;
  renderOccasionTagsList();
  updateLiveHeroPreview();
};

window.deleteOccasionTag = function(idx) {
  currentSiteSettings.hero.occasions.splice(idx, 1);
  renderOccasionTagsList();
  updateLiveHeroPreview();
};

function renderFeaturesEditList() {
  const container = document.getElementById("featuresListContainer");
  if (!container) return;

  const features = currentSiteSettings.features || [];
  if (features.length === 0) {
    container.innerHTML = `<span style="font-size: 0.8rem; color: var(--admin-text-muted);">No features added yet. Click "+ Add Feature Item".</span>`;
    return;
  }

  container.innerHTML = features.map((feat, idx) => `
    <div class="feature-edit-item">
      <span style="color: var(--admin-green); font-size: 0.9rem; font-weight: bold;">❖</span>
      <input 
        type="text" 
        class="feature-input" 
        value="${escapeHtml(feat)}" 
        placeholder="e.g. Premium cotton blend" 
        oninput="handleFeatureInput(${idx}, this.value)"
      >
      <div style="display: flex; gap: 0.25rem;">
        ${idx > 0 ? `<button type="button" class="btn-feature-action" onclick="moveFeature(${idx}, -1)" title="Move Up">▲</button>` : ""}
        ${idx < features.length - 1 ? `<button type="button" class="btn-feature-action" onclick="moveFeature(${idx}, 1)" title="Move Down">▼</button>` : ""}
        <button type="button" class="btn-feature-action btn-feature-del" onclick="deleteFeature(${idx})" title="Delete Feature">✕</button>
      </div>
    </div>
  `).join("");
}

window.handleFeatureInput = function(idx, val) {
  if (currentSiteSettings.features && currentSiteSettings.features[idx] !== undefined) {
    currentSiteSettings.features[idx] = val;
    updateLiveHeroPreview();
  }
};

window.moveFeature = function(idx, dir) {
  const arr = currentSiteSettings.features;
  const target = idx + dir;
  if (target < 0 || target >= arr.length) return;
  const temp = arr[idx];
  arr[idx] = arr[target];
  arr[target] = temp;
  renderFeaturesEditList();
  updateLiveHeroPreview();
};

window.deleteFeature = function(idx) {
  currentSiteSettings.features.splice(idx, 1);
  renderFeaturesEditList();
  updateLiveHeroPreview();
};

function calculateMinProductPrice() {
  const inStock = currentProducts.filter(p => !p.is_out_of_stock && Number(p.price) > 0);
  if (inStock.length > 0) {
    return Math.min(...inStock.map(p => Number(p.price)));
  }
  const allValid = currentProducts.filter(p => Number(p.price) > 0);
  if (allValid.length > 0) {
    return Math.min(...allValid.map(p => Number(p.price)));
  }
  return null;
}

function updateLiveHeroPreview() {
  const hero = currentSiteSettings.hero || DEFAULT_SITE_SETTINGS.hero;
  const features = currentSiteSettings.features || DEFAULT_SITE_SETTINGS.features;

  // Tagline
  const prevTagline = document.getElementById("prevHeroTagline");
  if (prevTagline) {
    prevTagline.textContent = hero.tagline || DEFAULT_SITE_SETTINGS.hero.tagline;
  }

  // Title
  const prevTitle = document.getElementById("prevHeroTitle");
  if (prevTitle) {
    prevTitle.textContent = hero.title || DEFAULT_SITE_SETTINGS.hero.title;
  }

  // Subtitle
  const prevSubtitle = document.getElementById("prevHeroSubtitle");
  if (prevSubtitle) {
    prevSubtitle.textContent = hero.subtitle || DEFAULT_SITE_SETTINGS.hero.subtitle;
  }

  // Occasions strip
  const prevOccasions = document.getElementById("prevHeroOccasionsStrip");
  if (prevOccasions) {
    const list = hero.occasions && hero.occasions.length > 0 ? hero.occasions : DEFAULT_SITE_SETTINGS.hero.occasions;
    prevOccasions.innerHTML = list.map(t => `<span>${escapeHtml(t)}</span>`).join(`<span class="bullet">•</span>`);
  }

  // Starting Price
  const prevPrice = document.getElementById("prevHeroPrice");
  if (prevPrice) {
    let priceToShow = hero.startingPrice;
    if (hero.autoMinPrice) {
      const minP = calculateMinProductPrice();
      if (minP !== null) {
        priceToShow = minP;
      }
    }
    prevPrice.textContent = `₹${priceToShow || 799}`;
  }

  // Button text
  const prevBtnText = document.getElementById("prevHeroBtnText");
  if (prevBtnText) {
    prevBtnText.textContent = hero.ctaText || "Shop Now";
  }

  // Background Image
  const previewBox = document.getElementById("heroLivePreviewBox");
  if (previewBox) {
    if (hero.bgImage) {
      previewBox.style.backgroundImage = `linear-gradient(rgba(250, 246, 239, 0.88), rgba(250, 246, 239, 0.88)), url('${hero.bgImage}')`;
      previewBox.style.backgroundSize = "cover";
      previewBox.style.backgroundPosition = "center";
    } else {
      previewBox.style.backgroundImage = "radial-gradient(circle at 50% 20%, #FFFDF7 0%, #F5ECE0 100%)";
    }
  }

  // Features Preview
  const prevTrust = document.getElementById("prevTrustStrip");
  if (prevTrust) {
    const featList = features && features.length > 0 ? features : DEFAULT_SITE_SETTINGS.features;
    prevTrust.innerHTML = featList.map(f => `<span>✓ ${escapeHtml(f)}</span>`).join(`<span style="color: var(--admin-gold-light); margin: 0 4px;">•</span>`);
  }
}

function renderHeroEditor() {
  const s = currentSiteSettings;
  const hero = s.hero || DEFAULT_SITE_SETTINGS.hero;
  const contacts = s.contacts || DEFAULT_SITE_SETTINGS.contacts;

  const taglineInput = document.getElementById("heroTaglineInput");
  if (taglineInput) taglineInput.value = hero.tagline || "";

  const titleInput = document.getElementById("heroTitleInput");
  if (titleInput) titleInput.value = hero.title || "";

  const subtitleInput = document.getElementById("heroSubtitleInput");
  if (subtitleInput) subtitleInput.value = hero.subtitle || "";

  const priceInput = document.getElementById("heroPriceInput");
  if (priceInput) {
    priceInput.value = hero.startingPrice !== undefined ? hero.startingPrice : 799;
    priceInput.disabled = !!hero.autoMinPrice;
  }

  const autoMinCheck = document.getElementById("heroAutoMinPriceCheck");
  if (autoMinCheck) autoMinCheck.checked = !!hero.autoMinPrice;

  const btnTextInput = document.getElementById("heroBtnTextInput");
  if (btnTextInput) btnTextInput.value = hero.ctaText || "Shop Now";

  const scrollTargetInput = document.getElementById("heroScrollTargetInput");
  if (scrollTargetInput) scrollTargetInput.value = hero.ctaScrollTarget || "#products";

  const removeBgBtn = document.getElementById("btnRemoveHeroBg");
  if (removeBgBtn) {
    removeBgBtn.style.display = hero.bgImage ? "inline-block" : "none";
  }

  const dispPhoneInput = document.getElementById("contactDisplayPhone");
  if (dispPhoneInput) dispPhoneInput.value = contacts.displayPhone || "+91 93218 03696";

  const waPhoneInput = document.getElementById("contactWaPhone");
  if (waPhoneInput) waPhoneInput.value = contacts.phone || "919321803696";

  const heroMaps = document.getElementById("contactMapsUrl");
  if (heroMaps) heroMaps.value = contacts.mapsUrl || "";

  const heroInsta = document.getElementById("contactInstagramUrl");
  if (heroInsta) heroInsta.value = contacts.instagramUrl || "";

  const footerTaglineInput = document.getElementById("footerTaglineInput");
  if (footerTaglineInput) footerTaglineInput.value = s.footerTagline || "";

  renderOccasionTagsList();
  renderFeaturesEditList();
  updateLiveHeroPreview();
}

async function saveAllSiteSettings() {
  // Sync inputs to memory
  const taglineInput = document.getElementById("heroTaglineInput");
  if (taglineInput) currentSiteSettings.hero.tagline = taglineInput.value.trim() || DEFAULT_SITE_SETTINGS.hero.tagline;

  const titleInput = document.getElementById("heroTitleInput");
  if (titleInput) currentSiteSettings.hero.title = titleInput.value.trim() || DEFAULT_SITE_SETTINGS.hero.title;

  const subtitleInput = document.getElementById("heroSubtitleInput");
  if (subtitleInput) currentSiteSettings.hero.subtitle = subtitleInput.value.trim() || DEFAULT_SITE_SETTINGS.hero.subtitle;

  const priceInput = document.getElementById("heroPriceInput");
  if (priceInput) currentSiteSettings.hero.startingPrice = parseInt(priceInput.value, 10) || 799;

  const autoMinCheck = document.getElementById("heroAutoMinPriceCheck");
  if (autoMinCheck) currentSiteSettings.hero.autoMinPrice = autoMinCheck.checked;

  const btnTextInput = document.getElementById("heroBtnTextInput");
  if (btnTextInput) currentSiteSettings.hero.ctaText = btnTextInput.value.trim() || "Shop Now";

  const scrollTargetInput = document.getElementById("heroScrollTargetInput");
  if (scrollTargetInput) currentSiteSettings.hero.ctaScrollTarget = scrollTargetInput.value;

  const dispPhoneInput = document.getElementById("contactDisplayPhone");
  if (dispPhoneInput) currentSiteSettings.contacts.displayPhone = dispPhoneInput.value.trim() || "+91 93218 03696";

  const waPhoneInput = document.getElementById("contactWaPhone");
  if (waPhoneInput) {
    const rawWa = waPhoneInput.value.replace(/[^0-9]/g, "");
    currentSiteSettings.contacts.phone = rawWa || "919321803696";
  }

  const heroMaps = document.getElementById("contactMapsUrl");
  if (heroMaps) currentSiteSettings.contacts.mapsUrl = heroMaps.value.trim();

  const heroInsta = document.getElementById("contactInstagramUrl");
  if (heroInsta) currentSiteSettings.contacts.instagramUrl = cleanInstagramUrl(heroInsta.value);

  const storeAddrInput = document.getElementById("cfgStoreAddress");
  if (storeAddrInput && storeAddrInput.value.trim()) {
    currentSiteSettings.contacts.address = storeAddrInput.value.trim();
  }

  const storeTimingsInput = document.getElementById("cfgStoreTimings");
  if (storeTimingsInput && storeTimingsInput.value.trim()) {
    currentSiteSettings.contacts.timings = storeTimingsInput.value.trim();
  }

  populateStoreSettingsInputs();

  const footerTaglineInput = document.getElementById("footerTaglineInput");
  if (footerTaglineInput) currentSiteSettings.footerTagline = footerTaglineInput.value.trim() || DEFAULT_SITE_SETTINGS.footerTagline;

  // Clean empty features
  currentSiteSettings.features = (currentSiteSettings.features || [])
    .map(f => f.trim())
    .filter(f => f.length > 0);
  if (currentSiteSettings.features.length === 0) {
    currentSiteSettings.features = [...DEFAULT_SITE_SETTINGS.features];
  }

  try {
    await persistSiteSettings(currentSiteSettings);
    showToast("✅ Hero banner & store settings published live!");
  } catch (err) {
    console.error("Save settings failed:", err);
    showToast("Error saving to cloud. Settings saved in local storage.");
  }
}

function resetHeroSettingsToDefaults() {
  if (confirm("Reset hero banner and store settings to defaults?")) {
    currentSiteSettings = JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS));
    renderHeroEditor();
    showToast("↺ Settings reset to default values. Click 'Save & Publish' to publish.");
  }
}

function initHeroEditor() {
  // Live input change listeners
  const taglineInput = document.getElementById("heroTaglineInput");
  if (taglineInput) {
    taglineInput.addEventListener("input", (e) => {
      currentSiteSettings.hero.tagline = e.target.value;
      updateLiveHeroPreview();
    });
  }

  const titleInput = document.getElementById("heroTitleInput");
  if (titleInput) {
    titleInput.addEventListener("input", (e) => {
      currentSiteSettings.hero.title = e.target.value;
      updateLiveHeroPreview();
    });
  }

  const subtitleInput = document.getElementById("heroSubtitleInput");
  if (subtitleInput) {
    subtitleInput.addEventListener("input", (e) => {
      currentSiteSettings.hero.subtitle = e.target.value;
      updateLiveHeroPreview();
    });
  }

  const priceInput = document.getElementById("heroPriceInput");
  if (priceInput) {
    priceInput.addEventListener("input", (e) => {
      currentSiteSettings.hero.startingPrice = parseInt(e.target.value, 10) || 0;
      updateLiveHeroPreview();
    });
  }

  const autoMinCheck = document.getElementById("heroAutoMinPriceCheck");
  if (autoMinCheck) {
    autoMinCheck.addEventListener("change", (e) => {
      currentSiteSettings.hero.autoMinPrice = e.target.checked;
      if (priceInput) priceInput.disabled = e.target.checked;
      updateLiveHeroPreview();
    });
  }

  const btnTextInput = document.getElementById("heroBtnTextInput");
  if (btnTextInput) {
    btnTextInput.addEventListener("input", (e) => {
      currentSiteSettings.hero.ctaText = e.target.value;
      updateLiveHeroPreview();
    });
  }

  const scrollTargetInput = document.getElementById("heroScrollTargetInput");
  if (scrollTargetInput) {
    scrollTargetInput.addEventListener("change", (e) => {
      currentSiteSettings.hero.ctaScrollTarget = e.target.value;
    });
  }

  // Add Occasion Tag
  const newTagInput = document.getElementById("newOccasionTagInput");
  const addTagBtn = document.getElementById("btnAddOccasionTag");

  const handleAddTag = () => {
    if (!newTagInput) return;
    const val = newTagInput.value.trim();
    if (!val) return;
    if (!currentSiteSettings.hero.occasions) {
      currentSiteSettings.hero.occasions = [];
    }
    currentSiteSettings.hero.occasions.push(val);
    newTagInput.value = "";
    renderOccasionTagsList();
    updateLiveHeroPreview();
  };

  if (addTagBtn) addTagBtn.addEventListener("click", handleAddTag);
  if (newTagInput) {
    newTagInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    });
  }

  // Add Feature Item
  const addFeatureBtn = document.getElementById("btnAddFeatureItem");
  if (addFeatureBtn) {
    addFeatureBtn.addEventListener("click", () => {
      if (!currentSiteSettings.features) {
        currentSiteSettings.features = [];
      }
      currentSiteSettings.features.push("New Feature Point");
      renderFeaturesEditList();
      updateLiveHeroPreview();
    });
  }

  // Hero Background Image Upload
  const bgFileInput = document.getElementById("heroBgFileInput");
  if (bgFileInput) {
    bgFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const isAuth = await ensureAuthenticatedSession();
      if (!isAuth) return;

      try {
        showToast("Compressing hero background image to WebP...");
        const webpBlob = await compressImageToWebP(file, 1600, 0.82);

        if (supabaseClient) {
          showToast("Uploading hero background to Supabase Storage...");
          const fileName = `hero/hero_bg_${Date.now()}.webp`;
          const { data, error } = await supabaseClient.storage
            .from("product-images")
            .upload(fileName, webpBlob, { contentType: "image/webp", upsert: true });

          if (error) {
            console.error("Hero background upload error:", error);
            alert(formatSupabaseError(error, "Hero Background Storage Upload Failed"));
            return;
          }

          if (data) {
            const { data: pubUrl } = supabaseClient.storage.from("product-images").getPublicUrl(fileName);
            const finalBgUrl = pubUrl.publicUrl;
            logImageSource("Hero Background Upload", fileName, finalBgUrl);

            currentSiteSettings.hero.bgImage = finalBgUrl;

            const removeBtn = document.getElementById("btnRemoveHeroBg");
            if (removeBtn) removeBtn.style.display = "inline-block";

            updateLiveHeroPreview();
            showToast("Hero background image loaded! Click 'Save & Publish' to apply.");
          }
        } else {
          alert("Supabase is not connected. Please check config.js.");
        }
      } catch (err) {
        console.error("Hero background compress failed:", err);
        alert(formatSupabaseError(err, "Failed to process hero background"));
      }
    });
  }

  const removeBgBtn = document.getElementById("btnRemoveHeroBg");
  if (removeBgBtn) {
    removeBgBtn.addEventListener("click", () => {
      currentSiteSettings.hero.bgImage = "";
      if (bgFileInput) bgFileInput.value = "";
      removeBgBtn.style.display = "none";
      updateLiveHeroPreview();
      showToast("Background image removed. Click 'Save & Publish' to apply.");
    });
  }

  // Save Buttons
  const saveBtnTop = document.getElementById("btnSaveHeroSettings");
  const saveBtnBottom = document.getElementById("btnSaveHeroSettingsBottom");
  if (saveBtnTop) saveBtnTop.addEventListener("click", saveAllSiteSettings);
  if (saveBtnBottom) saveBtnBottom.addEventListener("click", saveAllSiteSettings);

  // Reset Buttons
  const resetBtnTop = document.getElementById("btnResetHeroDefaults");
  const resetBtnBottom = document.getElementById("btnResetHeroDefaultsBottom");
  if (resetBtnTop) resetBtnTop.addEventListener("click", resetHeroSettingsToDefaults);
  if (resetBtnBottom) resetBtnBottom.addEventListener("click", resetHeroSettingsToDefaults);
}

/**
 * ----------------------------------------------------------------------------
 * 7. OFFERS & DEALS CONTROLLER
 * ----------------------------------------------------------------------------
 */
async function fetchOffers() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("offers")
        .select("*")
        .eq("id", "current")
        .single();
      if (!error && data) {
        currentOffers = deepMerge(DEFAULT_OFFERS, data);
        localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(currentOffers));
        return currentOffers;
      }
    } catch (err) {
      console.warn("Supabase fetch offers failed, using local:", err);
    }
  }

  const raw = localStorage.getItem(STORAGE_KEYS.OFFERS);
  if (raw) {
    try {
      currentOffers = deepMerge(DEFAULT_OFFERS, JSON.parse(raw));
    } catch (e) {
      currentOffers = JSON.parse(JSON.stringify(DEFAULT_OFFERS));
    }
  } else {
    currentOffers = JSON.parse(JSON.stringify(DEFAULT_OFFERS));
  }
  return currentOffers;
}

async function persistOffers(offersObj) {
  currentOffers = offersObj;
  localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offersObj));

  if (supabaseClient) {
    const isAuth = await ensureAuthenticatedSession();
    if (!isAuth) {
      alert("Please login with your admin credentials to save offers to the cloud database.");
      return;
    }

    try {
      const payload = {
        id: "current",
        announcement: offersObj.announcement || {},
        countdown: offersObj.countdown || {},
        coupons: offersObj.coupons || [],
        bundles: offersObj.bundles || DEFAULT_OFFERS.bundles,
        combo: offersObj.combo || { enabled: false },
        free_delivery: offersObj.free_delivery || {},
        popup: offersObj.popup || {},
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from("offers")
        .upsert(payload);

      if (error) throw error;
      showToast("✅ Offers & coupons saved & published to cloud!");
    } catch (err) {
      console.error("Supabase offers upsert failed:", err);
      alert(formatSupabaseError(err, "Failed to save offers to cloud database"));
    }
  } else {
    showToast("Offers saved to local storage.");
  }
}

function renderCouponsList() {
  const container = document.getElementById("couponsListContainer");
  const countBadge = document.getElementById("couponCountBadge");
  if (!container) return;

  const coupons = currentOffers.coupons || [];
  if (countBadge) countBadge.textContent = coupons.length;

  if (coupons.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem 1rem; color: var(--admin-text-muted); background: #fff; border-radius: 8px; border: 1px dashed var(--admin-border);">
        <p style="font-size: 0.95rem; margin-bottom: 0.25rem;">No coupons added yet.</p>
        <span style="font-size: 0.8rem;">Fill the form above and click '+ Save Coupon Code' to create your first coupon!</span>
      </div>
    `;
    return;
  }

  container.innerHTML = coupons.map(c => {
    const isExpired = c.expiry && new Date(c.expiry).getTime() < Date.now();
    const statusText = !c.enabled ? "Inactive" : isExpired ? "Expired" : "Active";
    const statusClass = (!c.enabled || isExpired) ? "inactive" : "active";
    const discountText = c.type === "percent" ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`;

    return `
      <div class="coupon-item-card" id="coupon-card-${c.id}">
        <div>
          <div class="coupon-item-header">
            <span class="coupon-code-badge">${escapeHtml(c.code)}</span>
            <span class="coupon-status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="coupon-discount-highlight">${discountText}</div>
          <div class="coupon-item-details">
            <div>Min Order: <strong>₹${c.minOrder || 0}</strong></div>
            <div>Expiry: <strong>${c.expiry || "No Expiry"}</strong></div>
          </div>
        </div>
        <div class="coupon-item-actions">
          <button type="button" class="btn-coupon-action btn-coupon-edit" onclick="editCouponCode('${c.id}')">✏️ Edit</button>
          <button type="button" class="btn-coupon-action btn-coupon-delete" onclick="deleteCouponCode('${c.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

window.editCouponCode = function(couponId) {
  const coupons = currentOffers.coupons || [];
  const c = coupons.find(item => item.id === couponId);
  if (!c) return;

  document.getElementById("couponEditId").value = c.id;
  document.getElementById("couponCodeInput").value = c.code;
  document.getElementById("couponTypeInput").value = c.type;
  document.getElementById("couponValueInput").value = c.value;
  document.getElementById("couponMinOrderInput").value = c.minOrder || 0;
  document.getElementById("couponExpiryInput").value = c.expiry || "";
  document.getElementById("couponEnabledInput").checked = c.enabled !== false;

  document.getElementById("couponEditorTitle").textContent = `✏️ Edit Coupon: ${c.code}`;
  document.getElementById("btnAddCoupon").textContent = "Update Coupon";
  document.getElementById("btnCancelCouponEdit").style.display = "inline-flex";

  const editorBox = document.querySelector(".coupon-editor-box");
  if (editorBox) editorBox.scrollIntoView({ behavior: "smooth" });
};

window.deleteCouponCode = function(couponId) {
  const coupons = currentOffers.coupons || [];
  const c = coupons.find(item => item.id === couponId);
  if (!c) return;

  if (confirm(`Are you sure you want to delete coupon code "${c.code}"?`)) {
    currentOffers.coupons = coupons.filter(item => item.id !== couponId);
    renderCouponsList();
    persistOffers(currentOffers);
    showToast(`Coupon "${c.code}" deleted.`);
  }
};

/**
 * Live warning calculation for Bundle Tier editor (Requirement 5)
 */
function checkTierSavingWarning() {
  const qtyInput = document.getElementById("tierQtyInput");
  const priceInput = document.getElementById("tierPriceInput");
  const warningEl = document.getElementById("tierSavingWarning");
  if (!qtyInput || !priceInput || !warningEl) return;

  const qty = parseInt(qtyInput.value, 10);
  const price = parseInt(priceInput.value, 10);

  if (!qty || !price || qty <= 0 || price <= 0) {
    warningEl.style.display = "none";
    return;
  }

  // Calculate against minimum product price in shop
  const products = SHOP_CONFIG.products || [];
  const minPrice = products.length > 0 ? Math.min(...products.map(p => p.price)) : 899;
  const normalTotal = qty * minPrice;

  if (price >= normalTotal) {
    warningEl.textContent = `⚠️ Is tier mein koi bachat nahi hai (Store min price ₹${minPrice} × ${qty} = ₹${normalTotal} vs Tier ₹${price})`;
    warningEl.style.display = "block";
  } else {
    warningEl.style.display = "none";
  }
}

/**
 * Render active bundle tiers list (Requirement 2)
 */
function renderBundleTiersList() {
  const container = document.getElementById("bundleTiersListContainer");
  const countBadge = document.getElementById("bundleTiersCountBadge");
  if (!container) return;

  if (!currentOffers.bundles) {
    currentOffers.bundles = JSON.parse(JSON.stringify(DEFAULT_OFFERS.bundles));
  }
  const tiers = (currentOffers.bundles.tiers || []).slice().sort((a, b) => a.qty - b.qty);
  if (countBadge) countBadge.textContent = tiers.length;

  if (tiers.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 1.25rem; text-align: center; color: var(--admin-text-muted); background: #FAF9F6; border-radius: 8px; border: 1px dashed var(--admin-border);">
        Koi bundle tier add nahi hai. Upar form se naya tier jodein (e.g. 3 kurte = ₹999).
      </div>
    `;
    return;
  }

  container.innerHTML = tiers.map(tier => {
    const perPiece = Math.round(tier.price / tier.qty);
    return `
      <div class="bundle-tier-card" id="tier-card-${tier.id}">
        <div class="bundle-tier-info">
          <div class="bundle-tier-header">
            <span class="bundle-qty-badge">${tier.qty} Kurte</span>
            <span class="bundle-price-text">₹${tier.price}</span>
          </div>
          <div class="bundle-per-piece">≈ ₹${perPiece} / kurta</div>
        </div>
        <div class="bundle-tier-actions">
          <button type="button" class="btn-icon btn-edit-tier" onclick="window.editBundleTier('${tier.id}')" title="Edit Tier">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button type="button" class="btn-icon btn-delete-tier" onclick="window.deleteBundleTier('${tier.id}')" title="Delete Tier">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

window.editBundleTier = function(tierId) {
  if (!currentOffers.bundles) return;
  const tiers = currentOffers.bundles.tiers || [];
  const tier = tiers.find(t => t.id === tierId);
  if (!tier) return;

  const qtyInput = document.getElementById("tierQtyInput");
  const priceInput = document.getElementById("tierPriceInput");
  const editId = document.getElementById("tierEditId");
  const title = document.getElementById("tierEditorTitle");
  const btnAdd = document.getElementById("btnAddTier");
  const btnCancel = document.getElementById("btnCancelTierEdit");

  if (qtyInput) qtyInput.value = tier.qty;
  if (priceInput) priceInput.value = tier.price;
  if (editId) editId.value = tier.id;
  if (title) title.textContent = `✏️ Edit Bundle Tier (${tier.qty} Kurte)`;
  if (btnAdd) btnAdd.textContent = "Update Tier";
  if (btnCancel) btnCancel.style.display = "inline-block";

  checkTierSavingWarning();
};

window.deleteBundleTier = function(tierId) {
  if (!currentOffers.bundles) return;
  const tiers = currentOffers.bundles.tiers || [];
  const tier = tiers.find(t => t.id === tierId);
  if (!tier) return;

  if (confirm(`Kya aap ${tier.qty} kurte = ₹${tier.price} wala bundle tier delete karna chahte hain?`)) {
    currentOffers.bundles.tiers = tiers.filter(t => t.id !== tierId);
    renderBundleTiersList();
    persistOffers(currentOffers);
    showToast(`Tier (${tier.qty} kurte) deleted.`);
  }
};

function populateOffersInputs() {
  const ann = currentOffers.announcement || {};
  const cd = currentOffers.countdown || {};
  const bundles = currentOffers.bundles || DEFAULT_OFFERS.bundles;
  const freeDel = currentOffers.free_delivery || {};
  const popup = currentOffers.popup || {};

  // 1. Announcement Bar
  const annEnabled = document.getElementById("offerAnnouncementEnabled");
  if (annEnabled) annEnabled.checked = ann.enabled !== false;

  const annText = document.getElementById("offerAnnouncementText");
  if (annText) annText.value = ann.text || "";

  const annLink = document.getElementById("offerAnnouncementLink");
  if (annLink) annLink.value = ann.link || "";

  const colorRadios = document.querySelectorAll('input[name="offerBgColor"]');
  colorRadios.forEach(r => {
    r.checked = r.value === (ann.bgColor || "maroon");
  });

  // Countdown
  const cdEnabled = document.getElementById("offerCountdownEnabled");
  const cdGroup = document.getElementById("offerCountdownGroup");
  const cdEnd = document.getElementById("offerCountdownEnd");

  if (cdEnabled) cdEnabled.checked = cd.enabled === true;
  if (cdGroup) cdGroup.style.display = cd.enabled ? "block" : "none";
  if (cdEnd && cd.endTime) {
    const d = new Date(cd.endTime);
    if (!isNaN(d.getTime())) {
      const pad = n => String(n).padStart(2, "0");
      cdEnd.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } else {
      cdEnd.value = cd.endTime;
    }
  }

  // 2. Coupons List
  renderCouponsList();

  // 3. Quantity Bundle Pricing (Requirement 1-6)
  const bundleEnabled = document.getElementById("bundleEnabled");
  if (bundleEnabled) bundleEnabled.checked = bundles.enabled !== false;

  const bundleScope = document.getElementById("bundleScope");
  const bundleCatWrap = document.getElementById("bundleCategorySelectWrap");
  if (bundleScope) {
    bundleScope.value = bundles.scope || "all";
    if (bundleCatWrap) {
      bundleCatWrap.style.display = bundles.scope === "categories" ? "block" : "none";
    }
  }

  const selectedScopeCats = bundles.scopeItems || [];
  document.querySelectorAll('input[name="bundleCat"]').forEach(cb => {
    cb.checked = selectedScopeCats.length === 0 || selectedScopeCats.includes(cb.value);
  });

  const ruleSelect = document.getElementById("bundleIntermediateRule");
  if (ruleSelect) ruleSelect.value = bundles.intermediateRule || "largest_tier_per_piece";

  const couponPolicySelect = document.getElementById("bundleCouponPolicy");
  if (couponPolicySelect) {
    couponPolicySelect.value = bundles.allowCouponWithBundle ? "allow_both" : "no_coupon";
  }

  renderBundleTiersList();
  checkTierSavingWarning();

  // 4. Free Delivery
  const freeDelEnabled = document.getElementById("offerFreeDeliveryEnabled");
  if (freeDelEnabled) freeDelEnabled.checked = freeDel.enabled !== false;

  const freeDelMin = document.getElementById("offerFreeDeliveryMin");
  if (freeDelMin) freeDelMin.value = freeDel.minAmount !== undefined ? freeDel.minAmount : 1499;

  // 5. Festival Popup
  const popupEnabled = document.getElementById("offerPopupEnabled");
  if (popupEnabled) popupEnabled.checked = popup.enabled === true;

  const popupHead = document.getElementById("offerPopupHeading");
  if (popupHead) popupHead.value = popup.heading || "";

  const popupText = document.getElementById("offerPopupText");
  if (popupText) popupText.value = popup.text || "";

  const popupUrl = document.getElementById("offerPopupImageUrl");
  if (popupUrl) popupUrl.value = popup.image || "";

  const popupCta = document.getElementById("offerPopupCtaText");
  if (popupCta) popupCta.value = popup.ctaText || "Shop Festive Kurtas";

  const imgPrevWrap = document.getElementById("offerPopupImgPreviewWrap");
  const imgPrev = document.getElementById("offerPopupImgPreview");
  if (popup.image && popup.image.trim()) {
    if (imgPrev) imgPrev.src = popup.image.trim();
    if (imgPrevWrap) imgPrevWrap.style.display = "block";
  } else {
    if (imgPrevWrap) imgPrevWrap.style.display = "none";
  }
}

function initOffersTab() {
  // Countdown toggle
  const cdEnabled = document.getElementById("offerCountdownEnabled");
  const cdGroup = document.getElementById("offerCountdownGroup");
  if (cdEnabled && cdGroup) {
    cdEnabled.addEventListener("change", (e) => {
      cdGroup.style.display = e.target.checked ? "block" : "none";
    });
  }

  // Add / Edit Coupon
  const btnAddCoupon = document.getElementById("btnAddCoupon");
  const btnCancelCoupon = document.getElementById("btnCancelCouponEdit");

  if (btnAddCoupon) {
    btnAddCoupon.addEventListener("click", () => {
      const editId = document.getElementById("couponEditId").value;
      const code = (document.getElementById("couponCodeInput").value || "").trim().toUpperCase();
      const type = document.getElementById("couponTypeInput").value;
      const valInput = document.getElementById("couponValueInput").value;
      const value = parseFloat(valInput) || 0;
      const minOrderInput = document.getElementById("couponMinOrderInput").value;
      const minOrder = parseFloat(minOrderInput) || 0;
      const expiry = document.getElementById("couponExpiryInput").value || "";
      const enabled = document.getElementById("couponEnabledInput").checked;

      if (!code) {
        alert("Please enter a coupon code (e.g. FESTIVE20)");
        return;
      }
      if (value <= 0) {
        alert("Please enter a valid discount value greater than 0");
        return;
      }

      if (!currentOffers.coupons) currentOffers.coupons = [];

      if (editId) {
        const idx = currentOffers.coupons.findIndex(c => c.id === editId);
        if (idx >= 0) {
          currentOffers.coupons[idx] = {
            id: editId,
            code,
            type,
            value,
            minOrder,
            expiry,
            enabled
          };
          showToast(`Coupon "${code}" updated!`);
        }
      } else {
        // Check duplicate code
        const exists = currentOffers.coupons.find(c => c.code === code);
        if (exists) {
          alert(`Coupon code "${code}" already exists.`);
          return;
        }

        const newCoupon = {
          id: `c_${Date.now()}`,
          code,
          type,
          value,
          minOrder,
          expiry,
          enabled
        };
        currentOffers.coupons.push(newCoupon);
        showToast(`New coupon "${code}" added!`);
      }

      // Reset coupon editor form
      document.getElementById("couponEditId").value = "";
      document.getElementById("couponCodeInput").value = "";
      document.getElementById("couponValueInput").value = "";
      document.getElementById("couponMinOrderInput").value = "";
      document.getElementById("couponExpiryInput").value = "";
      document.getElementById("couponEnabledInput").checked = true;
      document.getElementById("couponEditorTitle").textContent = "+ Add New Coupon Code";
      btnAddCoupon.textContent = "+ Save Coupon Code";
      if (btnCancelCoupon) btnCancelCoupon.style.display = "none";

      renderCouponsList();
      persistOffers(currentOffers);
    });
  }

  if (btnCancelCoupon) {
    btnCancelCoupon.addEventListener("click", () => {
      document.getElementById("couponEditId").value = "";
      document.getElementById("couponCodeInput").value = "";
      document.getElementById("couponValueInput").value = "";
      document.getElementById("couponMinOrderInput").value = "";
      document.getElementById("couponExpiryInput").value = "";
      document.getElementById("couponEnabledInput").checked = true;
      document.getElementById("couponEditorTitle").textContent = "+ Add New Coupon Code";
      if (btnAddCoupon) btnAddCoupon.textContent = "+ Save Coupon Code";
      btnCancelCoupon.style.display = "none";
    });
  }

  // Popup Image Upload with WebP compression
  const popupFileInput = document.getElementById("offerPopupFileInput");
  const popupImageUrl = document.getElementById("offerPopupImageUrl");
  const imgPrevWrap = document.getElementById("offerPopupImgPreviewWrap");
  const imgPrev = document.getElementById("offerPopupImgPreview");
  const btnRemoveImg = document.getElementById("btnRemovePopupImg");

  if (popupFileInput) {
    popupFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const isAuth = await ensureAuthenticatedSession();
      if (!isAuth) return;

      try {
        showToast("Compressing popup image to WebP...");
        const webpBlob = await compressImageToWebP(file, 900, 0.85);

        if (supabaseClient) {
          showToast("Uploading to Supabase Storage...");
          const fileName = `offers/popup_${Date.now()}.webp`;
          const { data, error } = await supabaseClient.storage
            .from("product-images")
            .upload(fileName, webpBlob, { contentType: "image/webp", upsert: true });

          if (error) throw error;

          const { data: publicUrlData } = supabaseClient.storage
            .from("product-images")
            .getPublicUrl(fileName);

          const finalUrl = publicUrlData.publicUrl;
          if (popupImageUrl) popupImageUrl.value = finalUrl;
          if (imgPrev) imgPrev.src = finalUrl;
          if (imgPrevWrap) imgPrevWrap.style.display = "block";
          if (!currentOffers.popup) currentOffers.popup = {};
          currentOffers.popup.image = finalUrl;
          showToast("Popup image uploaded successfully!");
        }
      } catch (err) {
        console.error("Popup upload failed:", err);
        alert(formatSupabaseError(err, "Failed to upload popup image"));
      }
    });
  }

  if (btnRemoveImg) {
    btnRemoveImg.addEventListener("click", () => {
      if (!currentOffers.popup) currentOffers.popup = {};
      currentOffers.popup.image = "";
      if (popupImageUrl) popupImageUrl.value = "";
      if (popupFileInput) popupFileInput.value = "";
      if (imgPrevWrap) imgPrevWrap.style.display = "none";
      showToast("Popup image removed.");
    });
  }

  // Bundle Scope Toggle (All vs Categories)
  const bundleScopeEl = document.getElementById("bundleScope");
  const bundleCatWrap = document.getElementById("bundleCategorySelectWrap");
  if (bundleScopeEl && bundleCatWrap) {
    bundleScopeEl.addEventListener("change", (e) => {
      bundleCatWrap.style.display = e.target.value === "categories" ? "block" : "none";
    });
  }

  // Bundle Tier Live Warning Listeners
  const tierQtyInput = document.getElementById("tierQtyInput");
  const tierPriceInput = document.getElementById("tierPriceInput");
  if (tierQtyInput) {
    tierQtyInput.addEventListener("input", checkTierSavingWarning);
    tierQtyInput.addEventListener("change", checkTierSavingWarning);
  }
  if (tierPriceInput) {
    tierPriceInput.addEventListener("input", checkTierSavingWarning);
    tierPriceInput.addEventListener("change", checkTierSavingWarning);
  }

  // Add / Edit Bundle Tier Handler (Requirement 2 & 5)
  const btnAddTier = document.getElementById("btnAddTier");
  const btnCancelTierEdit = document.getElementById("btnCancelTierEdit");

  if (btnAddTier) {
    btnAddTier.addEventListener("click", () => {
      const editId = (document.getElementById("tierEditId")?.value || "").trim();
      const qty = parseInt(document.getElementById("tierQtyInput")?.value, 10);
      const price = parseInt(document.getElementById("tierPriceInput")?.value, 10);

      if (!qty || qty < 2) {
        alert("Please enter a valid quantity of at least 2 kurte.");
        return;
      }
      if (!price || price < 1) {
        alert("Please enter a valid total bundle price.");
        return;
      }

      if (!currentOffers.bundles) {
        currentOffers.bundles = JSON.parse(JSON.stringify(DEFAULT_OFFERS.bundles));
      }
      if (!Array.isArray(currentOffers.bundles.tiers)) {
        currentOffers.bundles.tiers = [];
      }

      if (editId) {
        const idx = currentOffers.bundles.tiers.findIndex(t => t.id === editId);
        if (idx >= 0) {
          currentOffers.bundles.tiers[idx] = { id: editId, qty, price };
          showToast(`Bundle tier (${qty} kurte = ₹${price}) updated!`);
        }
      } else {
        const exists = currentOffers.bundles.tiers.find(t => t.qty === qty);
        if (exists) {
          if (!confirm(`${qty} kurton ka tier pehle se maujood hai (₹${exists.price}). Kya aap use ₹${price} se update karna chahte hain?`)) {
            return;
          }
          exists.price = price;
          showToast(`Tier (${qty} kurte) updated to ₹${price}!`);
        } else {
          currentOffers.bundles.tiers.push({
            id: `b_${qty}_${Date.now()}`,
            qty,
            price
          });
          showToast(`New bundle tier (${qty} kurte = ₹${price}) added!`);
        }
      }

      // Reset tier form
      const editIdEl = document.getElementById("tierEditId");
      if (editIdEl) editIdEl.value = "";
      const titleEl = document.getElementById("tierEditorTitle");
      if (titleEl) titleEl.textContent = "+ Add New Bundle Tier";
      btnAddTier.textContent = "+ Save Bundle Tier";
      if (btnCancelTierEdit) btnCancelTierEdit.style.display = "none";

      renderBundleTiersList();
      checkTierSavingWarning();
      persistOffers(currentOffers);
    });
  }

  if (btnCancelTierEdit) {
    btnCancelTierEdit.addEventListener("click", () => {
      const editIdEl = document.getElementById("tierEditId");
      if (editIdEl) editIdEl.value = "";
      const titleEl = document.getElementById("tierEditorTitle");
      if (titleEl) titleEl.textContent = "+ Add New Bundle Tier";
      if (btnAddTier) btnAddTier.textContent = "+ Save Bundle Tier";
      btnCancelTierEdit.style.display = "none";
      checkTierSavingWarning();
    });
  }

  // Collect and Save All Offers Handler
  async function handleSaveOffers() {
    const annEnabled = document.getElementById("offerAnnouncementEnabled")?.checked ?? true;
    const annText = (document.getElementById("offerAnnouncementText")?.value || "").trim();
    const annLink = (document.getElementById("offerAnnouncementLink")?.value || "").trim();
    const bgRadio = document.querySelector('input[name="offerBgColor"]:checked');
    const bgColor = bgRadio ? bgRadio.value : "maroon";

    const cdEnabled = document.getElementById("offerCountdownEnabled")?.checked ?? false;
    const cdEndVal = document.getElementById("offerCountdownEnd")?.value || "";
    const cdEndIso = cdEndVal ? new Date(cdEndVal).toISOString() : "";

    // Quantity Bundles Settings
    const bundleEnabled = document.getElementById("bundleEnabled")?.checked ?? true;
    const bundleScope = document.getElementById("bundleScope")?.value || "all";
    const bundleCats = Array.from(document.querySelectorAll('input[name="bundleCat"]:checked')).map(cb => cb.value);
    const bundleRule = document.getElementById("bundleIntermediateRule")?.value || "largest_tier_per_piece";
    const bundleCouponStack = document.getElementById("bundleCouponPolicy")?.value === "allow_both";

    const freeDelEnabled = document.getElementById("offerFreeDeliveryEnabled")?.checked ?? true;
    const freeDelMin = parseInt(document.getElementById("offerFreeDeliveryMin")?.value, 10) || 0;

    const popupEnabled = document.getElementById("offerPopupEnabled")?.checked ?? false;
    const popupHead = (document.getElementById("offerPopupHeading")?.value || "").trim();
    const popupText = (document.getElementById("offerPopupText")?.value || "").trim();
    const popupImg = (document.getElementById("offerPopupImageUrl")?.value || "").trim();
    const popupCta = (document.getElementById("offerPopupCtaText")?.value || "").trim() || "Shop Festive Kurtas";

    // New version string so customers see updated popup
    const popupVersion = `v_${Date.now()}`;

    const newOffers = {
      announcement: {
        enabled: annEnabled,
        text: annText || DEFAULT_OFFERS.announcement.text,
        bgColor: bgColor,
        link: annLink
      },
      countdown: {
        enabled: cdEnabled,
        endTime: cdEndIso
      },
      coupons: currentOffers.coupons || [],
      bundles: {
        enabled: bundleEnabled,
        tiers: (currentOffers.bundles && currentOffers.bundles.tiers) || DEFAULT_OFFERS.bundles.tiers,
        scope: bundleScope,
        scopeItems: bundleCats,
        intermediateRule: bundleRule,
        allowCouponWithBundle: bundleCouponStack
      },
      combo: {
        enabled: false,
        buyQty: 2,
        discountPercent: 0
      },
      free_delivery: {
        enabled: freeDelEnabled,
        minAmount: freeDelMin
      },
      popup: {
        enabled: popupEnabled,
        version: popupVersion,
        heading: popupHead,
        text: popupText,
        image: popupImg,
        ctaText: popupCta,
        ctaLink: "#products"
      }
    };

    await persistOffers(newOffers);
  }

  const saveTop = document.getElementById("btnSaveOffersTop");
  const saveBottom = document.getElementById("btnSaveOffersBottom");
  if (saveTop) saveTop.addEventListener("click", handleSaveOffers);
  if (saveBottom) saveBottom.addEventListener("click", handleSaveOffers);
}

/**
 * ----------------------------------------------------------------------------
 * 8. MAIN INITIALIZATION
 * ----------------------------------------------------------------------------
 */
async function loadDashboard() {
  initSupabase();
  await Promise.all([fetchProducts(), fetchCategories(), fetchSiteSettings(), fetchOffers()]);
  renderProductsList();
  renderCategoryCardsEditor();
  renderHeroEditor();
  populateStoreSettingsInputs();
  populateOffersInputs();
}

document.addEventListener("DOMContentLoaded", () => {
  initAuth();

  // Tab button listeners
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      switchTab(target);
    });
  });

  initPhotoUpload();
  initProductForm();
  initSearchAndFilter();
  initSettings();
  initHeroEditor();
  initOffersTab();
});

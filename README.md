# ManBhar Creation | Men's Kurta's - Store & Admin Portal

Mobile-first, single-page website aur comprehensive **Admin Panel** for **ManBhar Creation | Men's Kurta's**. 
Design: Royal Festive Indian aesthetic with rich cream background (`#FAF6EF`), deep royal maroon (`#5E0B1B`), metallic gold (`#C9A24B`, `#E6C675`), and dark emerald green bars (`#0E382B`).

---

## 📁 File Structure

```text
kurta-shop/
├── index.html              # Main customer-facing storefront
├── style.css               # Storefront styles, animations, responsive design
├── app.js                  # Storefront logic, stock control, WhatsApp messaging & lightbox
├── admin.html              # Mobile-friendly Admin Panel (password protected)
├── admin.css               # Admin dashboard styling
├── admin.js                # Admin logic, auto-WebP compression & Supabase cloud sync
├── supabase_setup.sql      # 1-click database & storage bucket setup script
├── _redirects              # Netlify route rewrite for /admin -> /admin.html
├── vercel.json             # Vercel route rewrite for /admin -> /admin.html
├── assets/                 # Brand logo, favicons, PWA manifest, and OG share preview
└── README.md               # Yeh complete setup guide
```

---

## 🚀 Quick Start: Admin Login & Pehla Product Add Karna

### 1. Admin Login Kaise Karein:
1. Apne browser mein [admin.html](file:///C:/Users/bbhar/.gemini/antigravity/scratch/kurta-shop/admin.html) kholein (ya website ke footer mein **"🔒 Admin Portal"** link par tap karein).
2. **Admin Email & Password**: Apna Supabase Auth email (e.g. `admin@manbhar.com`) aur password daalein.
3. **"Login to Dashboard"** par click karein.
   *(Note: Single admin credentials Supabase Dashboard > Authentication > Users se banaye jaate hain).*

### 2. Pehla Kurta (Product) Add Kaise Karein:
1. Admin Dashboard khulte hi **"➕ Add Product"** tab open hoga.
2. **Product Name** daalein (e.g. *Royal Wine Embroidered Silk Kurta*).
3. **Category** select karein (Casual, Short, Embroidered, Festive, ya Wedding).
4. **Price** daalein (e.g. `1599`) aur optional **Original Price** (e.g. `2299` jo cut hokar dikhega).
5. Optional **Badge Tag** chunein (e.g. *Bestseller*, *Festive Pick*, *New Arrival*).
6. **Multiple Photos Upload Karein**:
   - Phone gallery, camera, ya drag-and-drop se ek ya multiple photos upload karein.
   - Upload hone par website browser mein hi photos ko **auto WebP format mein compress** kar deti hai (10MB ki photo ~120KB mein convert ho jaati hai bina quality khoe).
   - Pehli photo par **★ Cover** badge aayega (jo website par main card photo banegi). Aap `←` aur `→` buttons se order change kar sakte hain ya `✕` se photo delete kar sakte hain.
7. **Sizes aur Har Size Ka Alag Stock Daalein**:
   - Checkbox se sizes select karein: **S, M, L, XL, XXL**.
   - Har size ka stock count daalein (e.g., S: `4`, M: `10`, L: `8`, XL: `0`).
   - Jis size ka stock `0` hoga, wo website par **cut/disabled** dikhega!
8. **"Save & Publish Kurta"** button par click karein.
9. Kurta turant aapki website ke grid mein live dikhega!

---

## 🛍️ Website Par Customer Experience

1. **Empty State**:
   Jab tak aap koi product add nahi karte, website par koi galat demo photos nahi dikhengi. Ek graceful empty state banner dikhega:
   > *"Products jaldi aa rahe hain - Humari nayi Men's Kurta festive collection jald hi live hone wali hai!"*
   Customer WhatsApp par customized kurta inquiry bhi kar sakta hai.
2. **Size Wise Stock & Quantity (+ / -)**:
   - Jis size ka stock `0` hai, wo automatically disabled aur strike-through dikhega.
   - Quantity selector `[-] [ 1 ] [+]` customer ko available stock se zyada select nahi karne dega.
3. **Exact WhatsApp Order Message**:
   Customer jab **"Order on WhatsApp"** button dabayega, WhatsApp par unke selected size aur quantity ke saath message jayega:
   > *"Hello ManBhar Creation! I would like to order: Royal Wine Embroidered Silk Kurta (Price: ₹1599, Size: M, Qty: 2). Please let me know the availability and payment options."*
4. **Multiple Photos Lightbox**:
   Customer kisi bhi kurta ki photo par tap karega toh ek sundar popup slider/lightbox khul jayega jisme sari photos `1 / 4` counter aur thumbnails ke saath browse ki ja sakti hain.
5. **Category Cards Banners**:
   Admin Panel ke **"🖼️ Category Cards"** tab se aap Casual, Short, Embroidered, Festive aur Wedding cards ki cover photo aur starting price kabhi bhi change kar sakte hain.
6. **Hero Banner & Store Settings Editor**:
   Admin Panel ke naye **"🏠 Hero Banner Editor"** tab se bina code chhue:
   - Tagline, Main heading ("MEN KURTA"), Subheading live change kar sakte hain.
   - Occasion tags (green strip) add, delete aur order change kar sakte hain.
   - Starting at price manually set karein ya **"Products ki sabse kam price se auto set karo"** checkbox tick karein.
   - "Shop Now" button text aur scroll target customize karein.
   - Hero ke peeche custom background image upload/remove karein.
   - Store Phone aur WhatsApp number ek click mein update karein.
   - Trust/Quality strip features aur footer tagline change karein.
7. **Google Maps & Instagram Social Links**:
   Admin Panel ke **"⚙️ Settings"** tab (ya Hero Editor tab) se:
   - **Google Maps Link**: Header ke "Visit Store", "Get Directions" button, aur footer link par auto-update hota hai.
   - **Instagram Link**: Header icon, floating Instagram button, "Follow on Instagram" button, aur footer link par auto-update hota hai. Tracking query parameters (jaise `?xtok=...`) automatically clean ho jaate hain.
   - **Store Address & Timings**: "Visit Our Store" section aur embedded responsive Google Map par auto-update hote hain. Khali chhodne par related buttons/items graceful tarike se hide ho jaate hain.

---

## ☁️ Supabase Setup (Free Cloud Database & Storage)

Website bina kisi setup ke **Local Storage** mode mein turant kaam karti hai. Lekin agar aap chahte hain ki aap apne phone se products add karein aur wo sabhi customers ko har jagah dikhein, toh **Supabase (100% Free)** connect karein:

1. [supabase.com](https://supabase.com) par free account banakar **"New Project"** banayein.
2. Left menu mein **SQL Editor** par click karein, aur **"New query"** chunein.
3. Hamare project mein di gayi [supabase_setup.sql](file:///C:/Users/bbhar/.gemini/antigravity/scratch/kurta-shop/supabase_setup.sql) file ka sara code copy karein, paste karein aur **"Run"** click karein.
   *(Yeh script automatically `products`, `categories` tables aur `product-images` storage bucket bana degi).*
4. Supabase dashboard mein **Project Settings → API** par jayein:
   - **Project URL** copy karein (e.g. `https://xyz.supabase.co`).
   - **anon / public key** copy karein.
5. Apne Admin Dashboard ke **"Settings & Cloud"** tab mein jakar dono paste karein aur **"Test & Connect Supabase"** click karein.
6. Bas ho gaya! Ab aapka data cloud se synced hai.

---

## 🌐 Free Deploy Kaise Karein (Netlify / Vercel)

Yeh website pure static HTML, CSS aur JavaScript par bani hai (no server/backend build needed).

### Option 1: Netlify Drop (Sabse aasan - 30 seconds)
1. Browser mein **[app.netlify.com/drop](https://app.netlify.com/drop)** kholein.
2. Apne computer ka poora `kurta-shop` folder drag-and-drop karein:
   ```text
   C:\Users\bbhar\.gemini\antigravity\scratch\kurta-shop
   ```
3. Netlify turant aapko ek free live link de dega (e.g., `https://manbhar-creation.netlify.app`).
4. Site par `/admin` likhne par aapka Admin Panel khul jayega!

### Option 2: GitHub Pages (100% Free Lifetime Hosting)
1. [github.com](https://github.com) par free account banayein aur **New repository** (`manbhar-creation`, Public) banayein.
2. **"uploading an existing file"** par tap karke `kurta-shop` folder ki sabhi files aur `assets` folder drag & drop karein aur Commit changes karein.
3. Repository ki **Settings → Pages** mein jayein:
   - Branch: `main`, Folder: `/ (root)` chunein aur **Save** karein.
4. 1-2 minute mein aapki site live ho jayegi: `https://<username>.github.io/manbhar-creation/`!

### Option 3: Vercel (GitHub se connect karke)
1. Is folder ko GitHub repository mein upload karein.
2. [vercel.com](https://vercel.com) par jayein aur **"Add New Project"** click karke repo import karein.
3. Deploy par click karein. `vercel.json` file automatically `/admin` route ko handle karegi.

---

## 📞 Store Contact Configuration
- **WhatsApp Phone**: `+91 93218 03696` (Linked in `app.js` and `admin.js`)
- **Store Name**: ManBhar Creation | Men's Kurta's

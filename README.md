# AI Baker's Life — plain HTML / CSS / JS

React + Express project এখন সম্পূর্ণ plain **HTML, CSS, JavaScript**-এ রূপান্তরিত। কোনো framework, bundler বা server লাগে না।

## কীভাবে খুলবেন

- **সবচেয়ে সহজ:** `index.html`-এ double-click করুন। (`file://` দিয়েও চলে)
- **Local server দিয়ে:** `npx serve .` বা `python3 -m http.server 3000` চালিয়ে `http://localhost:3000` খুলুন।
- **Vercel / Netlify / GitHub Pages:** এই ফোল্ডারটাই deploy করুন। Framework Preset = **Other**, Build Command খালি, Output Directory = `./`

## ফাইল কাঠামো

```
index.html              পেজ (সব section JS দিয়ে render হয়)
css/styles.css          compiled CSS (Tailwind utilities, plain CSS)
css/input.css           styles.css-এর source (শুধু rebuild করতে লাগে)
js/logic.js             দাম, ট্যাক্স, validation, stock check, report, CSV  (← bakeryLogic.ts)
js/seed.js              শুরুর data: ৮টা product, ২টা sample order, brand  (← data/bakery-db.json)
js/store.js             "backend": সব API route localStorage-এ  (← server.ts + server/store.ts)
js/icons.js             SVG icon (lucide)
js/views-storefront.js  Navbar, Menu, Product modal, Cart, Checkout, Tracker, Cookie banner
js/views-admin.js       Admin login, Reports, Products, Orders & Emails, Brand, Product form
js/app.js               state, event handling, render
assets/images/          সব ছবি
tests/logic.test.js     unit test (চালাতে: node --test)
```

## ডেটা কোথায় থাকে (গুরুত্বপূর্ণ)

আগে Express server `data/bakery-db.json` ফাইলে সব সেভ করত। এখন server নেই, তাই সব ডেটা **ভিজিটরের browser-এর localStorage**-এ থাকে (key: `ai_bakers_life_db_v1`)।

- Order, stock, product, admin password: প্রতিটি browser-এ আলাদা। এক browser-এ admin যা বদলায়, অন্য ভিজিটর তা দেখবে না।
- ডেমো/পোর্টফোলিওর জন্য এটা ঠিক আছে। সত্যিকারের দোকান চালাতে চাইলে shared database (Supabase/Firebase ইত্যাদি) লাগবে, আর `js/store.js`-এর ফাংশনগুলো সেই API দিয়ে বদলাতে হবে। বাকি UI একই থাকবে।
- ডেমো ডেটা reset করতে: browser DevTools → Application → Local Storage → `ai_bakers_life_db_v1` মুছে refresh দিন।
- Admin password প্রথমবার `#admin` পেজে নিজে সেট করতে হয় (আগের মতোই)।
- Email আর payment আগের মতোই **simulated** (Stripe "Test Mode", email "Outbox")। আসল Stripe/Resend key server-এ রাখতে হয়, browser-এ রাখা নিরাপদ নয়।

## CSS rebuild (ঐচ্ছিক)

নতুন Tailwind class যোগ করলে: `npm install && npm run build:css`

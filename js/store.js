/*
 * Browser-side "backend".
 *
 * The original project used an Express server (server.ts + server/store.ts)
 * that kept everything in data/bakery-db.json. This file reproduces every one
 * of those API routes 1:1 but stores the database in the browser's
 * localStorage, so the site runs as plain static files (Vercel, Netlify,
 * GitHub Pages, or just double-clicking index.html).
 *
 *   GET  /api/bootstrap                    -> BL.api.bootstrap()
 *   POST /api/orders                       -> BL.api.createOrder()
 *   GET  /api/orders/track/:n?email=       -> BL.api.trackOrder()
 *   GET  /api/admin/auth-status            -> BL.api.admin.authStatus()
 *   POST /api/admin/claim | /login         -> BL.api.admin.claim() / login()
 *   GET  /api/admin/overview               -> BL.api.admin.overview()
 *   POST/PATCH/DELETE /api/admin/products  -> createProduct/updateProduct/deleteProduct
 *   PATCH /api/admin/orders/:id/status     -> updateOrderStatus()
 *   PUT  /api/admin/brand                  -> updateBrand()
 *   GET  /api/admin/reports/csv            -> csv()
 *
 * Every function returns a Promise of { ok, status, ...data } (like fetch).
 */
(function (global) {
  'use strict';
  var BL = (global.BL = global.BL || {});

  var DB_KEY = 'ai_bakers_life_db_v1';
  var SESSION_MS = 12 * 60 * 60 * 1000;
  var VALID_CATEGORIES = ['Cakes', 'Pastries', 'Breads', 'Cookies'];
  var DEFAULT_PRODUCT_IMAGES = {
    Cakes: 'assets/images/product_pistachio_cake_1795412057875.jpg',
    Pastries: 'assets/images/product_cardamom_croissant_1795412057428.jpg',
    Breads: 'assets/images/product_sourdough_loaf_1795412057458.jpg',
    Cookies: 'assets/images/product_brown_butter_cookies_1795412057822.jpg',
  };

  /* ---------- small helpers ---------- */
  function hex(bytes) {
    var out = '';
    var arr = new Uint8Array(bytes);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(arr);
    else for (var i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    for (var j = 0; j < arr.length; j++) out += ('0' + arr[j].toString(16)).slice(-2);
    return out;
  }
  function uuid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    var h = hex(16);
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function ok(data, status) { return Promise.resolve(Object.assign({ ok: true, status: status || 200 }, data || {})); }
  function fail(status, error, extra) { return Promise.resolve(Object.assign({ ok: false, status: status, error: error }, extra || {})); }

  /* ---------- persistence (localStorage with in-memory fallback) ---------- */
  var memoryDb = null;

  function loadDatabase() {
    try {
      var raw = global.localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through to seed */ }
    if (memoryDb) return clone(memoryDb);
    var seed = BL.createInitialSeedData();
    saveDatabase(seed);
    return seed;
  }

  function saveDatabase(db) {
    memoryDb = clone(db);
    try { global.localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* quota / private mode */ }
  }

  /* ---------- admin password + sessions ---------- */
  function sha256Hex(text) {
    if (global.crypto && global.crypto.subtle && global.TextEncoder) {
      return global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      });
    }
    // Fallback for very old / non-secure contexts (FNV-1a, not cryptographic).
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return Promise.resolve(('00000000' + h.toString(16)).slice(-8));
  }
  function hashPassword(password) {
    var salt = hex(16);
    return sha256Hex(salt + ':' + password).then(function (d) { return salt + ':' + d; });
  }
  function verifyPasswordHash(password, stored) {
    var parts = String(stored || '').split(':');
    if (parts.length !== 2) return Promise.resolve(false);
    return sha256Hex(parts[0] + ':' + password).then(function (d) { return d === parts[1]; });
  }

  var sessions = {}; // token -> expiry (in memory only, like the original React state)
  function signAdminToken() {
    var token = uuid() + hex(16);
    sessions[token] = Date.now() + SESSION_MS;
    return token;
  }
  function verifyAdminToken(token) {
    if (!token || !sessions[token]) return false;
    if (sessions[token] <= Date.now()) { delete sessions[token]; return false; }
    return true;
  }
  function requireAdmin(token) {
    return verifyAdminToken(token) ? null : fail(401, 'Admin authentication required.');
  }

  /* ---------- email (simulated outbox; live Resend needs a server secret) ---------- */
  function dispatchOrderEmail(order, type, brand) {
    var fmt = BL.formatCurrency;
    var statusLabel = BL.formatOrderStatusLabel(order.status, order.fulfillmentType);
    var itemLines = order.items.map(function (i) {
      return '• ' + i.quantity + 'x ' + i.productName + ' (' + i.optionLabel + ') — ' + fmt(i.lineTotalCents);
    }).join('\n');

    var fulfillmentDetails = order.fulfillmentType === 'pickup'
      ? 'Pickup at ' + brand.pickupAddress + ' (' + order.pickupWindow + ')'
      : 'Local Delivery to ' + order.deliveryAddress;

    var subject = type === 'order_confirmation'
      ? brand.bakeryName + ' — Order Confirmation #' + order.orderNumber
      : brand.bakeryName + ' — Order #' + order.orderNumber + ' is now ' + statusLabel;

    var intro = type === 'order_confirmation'
      ? "Thank you for ordering from " + brand.bakeryName + "! We've received your payment (" +
        (order.paymentMethod === 'stripe_card' ? 'Card via Stripe' : 'PayPal') + ') and our bakers have your ticket.'
      : 'Good news — your order #' + order.orderNumber + ' status has been updated to: ' + statusLabel + '.';

    var bodyText = [
      'Hi ' + order.customerName + ',',
      '',
      intro,
      '',
      'Order Number: #' + order.orderNumber,
      'Fulfillment: ' + fulfillmentDetails,
      order.orderNotes ? 'Bakery Notes: ' + order.orderNotes : null,
      '',
      'Order Summary:',
      itemLines,
      '',
      'Subtotal: ' + fmt(order.subtotalCents),
      'Delivery: ' + (order.deliveryFeeCents === 0 ? 'Free' : fmt(order.deliveryFeeCents)),
      'Tax: ' + fmt(order.taxCents),
      'Total Paid: ' + fmt(order.totalCents),
      '',
      'Questions? Reply to ' + brand.contactEmail,
      '— ' + brand.bakeryName,
    ].filter(function (line) { return line !== null; }).join('\n');

    return {
      id: 'email-' + uuid(),
      orderId: order.id,
      orderNumber: order.orderNumber,
      recipientEmail: order.customerEmail,
      recipientName: order.customerName,
      type: type,
      subject: subject,
      bodyText: bodyText,
      deliveryChannel: 'simulated_outbox',
      status: 'logged',
      sentAt: new Date().toISOString(),
    };
  }

  /* ---------- sanitising helpers shared by create / update product ---------- */
  function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + hex(2);
  }

  /* =====================  PUBLIC API  ===================== */
  var api = {
    bootstrap: function () {
      var db = loadDatabase();
      return ok({
        products: db.products.filter(function (p) { return p.isActive; }),
        brand: db.brand,
        integrations: { stripeConfigured: false, emailConfigured: false },
      });
    },

    createOrder: function (customer, requestedItems) {
      try {
        requestedItems = Array.isArray(requestedItems) ? requestedItems : [];
        if (!customer) return fail(400, 'Customer checkout details are required.');

        var validationErrors = BL.validateCheckoutInput(customer, requestedItems.length);
        if (Object.keys(validationErrors).length > 0) {
          return fail(400, 'Please check your checkout details.', { fieldErrors: validationErrors });
        }

        var db = loadDatabase();
        var stockCheck = BL.canFulfillOrderItems(requestedItems, db.products);
        if (!stockCheck.ok) return fail(409, stockCheck.reason);

        var orderItems = [];
        requestedItems.forEach(function (reqItem) {
          var product = db.products.find(function (p) { return p.id === reqItem.productId; });
          var option = product.options.find(function (o) { return o.id === reqItem.optionId; });
          product.stock = Math.max(0, product.stock - reqItem.quantity);
          product.updatedAt = new Date().toISOString();
          orderItems.push({
            productId: product.id,
            optionId: option.id,
            productName: product.name,
            optionLabel: option.label,
            category: product.category,
            unitPriceCents: option.priceCents,
            quantity: reqItem.quantity,
            lineTotalCents: option.priceCents * reqItem.quantity,
          });
        });

        var summary = BL.calculateCartSummary(
          orderItems, customer.fulfillmentType,
          db.brand.deliveryFeeCents, db.brand.freeDeliveryThresholdCents, db.brand.taxRateBasisPoints
        );

        var orderNumber = 'ABL-' + db.nextOrderSeq;
        db.nextOrderSeq += 1;

        var now = new Date().toISOString();
        var paymentReference = customer.paymentMethod === 'stripe_card'
          ? 'pi_' + hex(8)
          : 'PAYID-' + hex(6).toUpperCase();

        var newOrder = {
          id: 'ord-' + uuid(),
          orderNumber: orderNumber,
          customerName: customer.customerName.trim(),
          customerEmail: customer.customerEmail.trim().toLowerCase(),
          customerPhone: customer.customerPhone.trim(),
          fulfillmentType: customer.fulfillmentType,
          deliveryAddress: customer.fulfillmentType === 'delivery' ? customer.deliveryAddress.trim() : '',
          pickupWindow: customer.fulfillmentType === 'pickup' ? customer.pickupWindow.trim() : '',
          orderNotes: (customer.orderNotes || '').trim().slice(0, 400),
          paymentMethod: customer.paymentMethod,
          paymentStatus: 'paid',
          paymentReference: paymentReference,
          status: 'confirmed',
          items: orderItems,
          subtotalCents: summary.subtotalCents,
          deliveryFeeCents: summary.deliveryFeeCents,
          taxCents: summary.taxCents,
          totalCents: summary.totalCents,
          createdAt: now,
          updatedAt: now,
        };

        var confirmationEmail = dispatchOrderEmail(newOrder, 'order_confirmation', db.brand);
        db.orders.unshift(newOrder);
        db.emailLogs.unshift(confirmationEmail);
        saveDatabase(db);

        return ok({ order: newOrder, emailNotification: confirmationEmail }, 201);
      } catch (err) {
        console.error('Order creation failed:', err);
        return fail(500, 'Unable to complete order. Please try again.');
      }
    },

    trackOrder: function (orderNumberRaw, emailRaw) {
      var orderNumber = String(orderNumberRaw || '').trim().toUpperCase();
      var email = String(emailRaw || '').trim().toLowerCase();
      if (!orderNumber || !email) return fail(400, 'Order number and customer email are required.');
      var db = loadDatabase();
      var match = db.orders.find(function (o) {
        return o.orderNumber.toUpperCase() === orderNumber && o.customerEmail.toLowerCase() === email;
      });
      if (!match) return fail(404, 'No matching order found for that order number and email.');
      var related = db.emailLogs.filter(function (e) { return e.orderId === match.id; });
      return ok({ order: match, emails: related });
    },

    admin: {
      authStatus: function (token) {
        var db = loadDatabase();
        return ok({
          configuredViaEnv: false,
          claimed: Boolean(db.adminPasswordHash),
          authenticated: verifyAdminToken(token),
        });
      },

      claim: function (passwordRaw) {
        var db = loadDatabase();
        if (db.adminPasswordHash) return fail(409, 'Admin password has already been claimed.');
        var password = String(passwordRaw || '');
        if (password.length < 6) return fail(400, 'Please choose an admin password of at least 6 characters.');
        return hashPassword(password).then(function (hash) {
          db.adminPasswordHash = hash;
          saveDatabase(db);
          return { ok: true, status: 201, token: signAdminToken() };
        });
      },

      login: function (passwordRaw) {
        var password = String(passwordRaw || '');
        if (!password) return fail(400, 'Password is required.');
        var db = loadDatabase();
        if (!db.adminPasswordHash) return fail(409, 'Admin password has not been set up yet.');
        return verifyPasswordHash(password, db.adminPasswordHash).then(function (good) {
          if (!good) return { ok: false, status: 401, error: 'Incorrect admin password.' };
          return { ok: true, status: 200, token: signAdminToken() };
        });
      },

      overview: function (token) {
        var denied = requireAdmin(token); if (denied) return denied;
        var db = loadDatabase();
        return ok({
          products: db.products,
          orders: db.orders,
          emailLogs: db.emailLogs,
          brand: db.brand,
          report: BL.buildSalesReport(db.orders, db.products),
        });
      },

      createProduct: function (token, body) {
        var denied = requireAdmin(token); if (denied) return denied;
        body = body || {};
        var name = (body.name || '').trim();
        var category = body.category;
        var description = (body.description || '').trim();
        var flavorNotes = (body.flavorNotes || '').trim();
        var stock = Number(body.stock);
        var optionsInput = Array.isArray(body.options) ? body.options : [];

        if (!name || name.length < 2) return fail(400, 'Product name must be at least 2 characters.');
        if (VALID_CATEGORIES.indexOf(category) === -1) return fail(400, 'Invalid product category.');
        if (!Number.isInteger(stock) || stock < 0) return fail(400, 'Stock must be a non-negative whole number.');
        if (optionsInput.length === 0) return fail(400, 'At least one price option is required.');

        var sanitizedOptions = [];
        for (var i = 0; i < optionsInput.length; i++) {
          var opt = optionsInput[i];
          var label = (opt.label || '').trim();
          var priceCents = Math.round(Number(opt.priceCents));
          if (!label || !Number.isFinite(priceCents) || priceCents <= 0) {
            return fail(400, 'Each price option requires a label and positive price.');
          }
          sanitizedOptions.push({ id: 'opt-' + hex(4), label: label, priceCents: priceCents });
        }

        var validatedImage = BL.validateSafeImageUrl(body.imageUrl || '') || DEFAULT_PRODUCT_IMAGES[category];
        var now = new Date().toISOString();

        var newProduct = {
          id: 'prod-' + uuid(),
          slug: slugify(name),
          name: name,
          category: category,
          description: description || 'Freshly baked in small batches every morning.',
          flavorNotes: flavorNotes || 'Rich butter, stone-milled flour, natural fermentation',
          allergens: Array.isArray(body.allergens)
            ? body.allergens.map(function (a) { return String(a).trim(); }).filter(Boolean)
            : ['Wheat', 'Dairy'],
          imageUrl: validatedImage,
          stock: stock,
          isLimitedTime: Boolean(body.isLimitedTime),
          limitedLabel: body.isLimitedTime ? (body.limitedLabel || 'Limited Run').trim() : undefined,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
          options: sanitizedOptions,
          createdAt: now,
          updatedAt: now,
        };

        var db = loadDatabase();
        db.products.unshift(newProduct);
        saveDatabase(db);
        return ok({ product: newProduct }, 201);
      },

      updateProduct: function (token, id, body) {
        var denied = requireAdmin(token); if (denied) return denied;
        body = body || {};
        var db = loadDatabase();
        var product = db.products.find(function (p) { return p.id === id; });
        if (!product) return fail(404, 'Product not found.');

        if (body.name !== undefined) {
          var trimmed = body.name.trim();
          if (trimmed.length < 2) return fail(400, 'Product name must be at least 2 characters.');
          product.name = trimmed;
        }
        if (body.category !== undefined && VALID_CATEGORIES.indexOf(body.category) !== -1) product.category = body.category;
        if (body.description !== undefined) product.description = body.description.trim();
        if (body.flavorNotes !== undefined) product.flavorNotes = body.flavorNotes.trim();
        if (body.allergens !== undefined && Array.isArray(body.allergens)) {
          product.allergens = body.allergens.map(function (a) { return String(a).trim(); }).filter(Boolean);
        }
        if (body.stock !== undefined) {
          var s = Number(body.stock);
          if (!Number.isInteger(s) || s < 0) return fail(400, 'Stock must be a non-negative integer.');
          product.stock = s;
        }
        if (body.isLimitedTime !== undefined) product.isLimitedTime = Boolean(body.isLimitedTime);
        if (body.limitedLabel !== undefined) product.limitedLabel = body.limitedLabel.trim() || undefined;
        if (body.isActive !== undefined) product.isActive = Boolean(body.isActive);
        if (body.imageUrl !== undefined) {
          var safe = BL.validateSafeImageUrl(body.imageUrl);
          if (safe) product.imageUrl = safe;
        }
        if (Array.isArray(body.options) && body.options.length > 0) {
          var nextOpts = [];
          for (var i = 0; i < body.options.length; i++) {
            var opt = body.options[i];
            var label = (opt.label || '').trim();
            var priceCents = Math.round(Number(opt.priceCents));
            if (!label || !Number.isFinite(priceCents) || priceCents <= 0) {
              return fail(400, 'All options must have a label and positive price.');
            }
            nextOpts.push({ id: opt.id || 'opt-' + hex(4), label: label, priceCents: priceCents });
          }
          product.options = nextOpts;
        }

        product.updatedAt = new Date().toISOString();
        saveDatabase(db);
        return ok({ product: product });
      },

      deleteProduct: function (token, id) {
        var denied = requireAdmin(token); if (denied) return denied;
        var db = loadDatabase();
        var index = db.products.findIndex(function (p) { return p.id === id; });
        if (index === -1) return fail(404, 'Product not found.');
        db.products.splice(index, 1);
        saveDatabase(db);
        return ok({});
      },

      updateOrderStatus: function (token, id, nextStatus) {
        var denied = requireAdmin(token); if (denied) return denied;
        var db = loadDatabase();
        var order = db.orders.find(function (o) { return o.id === id; });
        if (!order) return fail(404, 'Order not found.');
        var allowed = BL.getNextAllowedStatuses(order.status);
        if (allowed.indexOf(nextStatus) === -1) {
          return fail(400, 'Cannot change order from ' + order.status + ' to ' + nextStatus + '.');
        }

        order.status = nextStatus;
        if (nextStatus === 'cancelled') {
          order.paymentStatus = 'refunded';
          order.items.forEach(function (item) {
            var prod = db.products.find(function (p) { return p.id === item.productId; });
            if (prod) prod.stock += item.quantity; // restock cancelled items
          });
        }
        order.updatedAt = new Date().toISOString();

        var statusEmail = dispatchOrderEmail(order, 'status_update', db.brand);
        db.emailLogs.unshift(statusEmail);
        saveDatabase(db);
        return ok({ order: order, emailNotification: statusEmail });
      },

      updateBrand: function (token, body) {
        var denied = requireAdmin(token); if (denied) return denied;
        var db = loadDatabase();
        body = body || {};
        var b = db.brand;
        db.brand = {
          bakeryName: String(body.bakeryName || b.bakeryName).trim().slice(0, 60),
          tagline: String(body.tagline || b.tagline).trim().slice(0, 180),
          logoText: String(body.logoText || b.logoText).trim().slice(0, 40),
          primaryColor: BL.validateHexColor(body.primaryColor, b.primaryColor),
          accentColor: BL.validateHexColor(body.accentColor, b.accentColor),
          pickupAddress: String(body.pickupAddress || b.pickupAddress).trim().slice(0, 120),
          openingHours: String(body.openingHours || b.openingHours).trim().slice(0, 80),
          contactEmail: String(body.contactEmail || b.contactEmail).trim().slice(0, 80),
          deliveryFeeCents: Math.max(0, Math.round(Number(body.deliveryFeeCents != null ? body.deliveryFeeCents : b.deliveryFeeCents))),
          freeDeliveryThresholdCents: Math.max(0, Math.round(Number(body.freeDeliveryThresholdCents != null ? body.freeDeliveryThresholdCents : b.freeDeliveryThresholdCents))),
          taxRateBasisPoints: Math.max(0, Math.min(2500, Math.round(Number(body.taxRateBasisPoints != null ? body.taxRateBasisPoints : b.taxRateBasisPoints)))),
        };
        saveDatabase(db);
        return ok({ brand: db.brand });
      },

      csv: function (token) {
        var denied = requireAdmin(token); if (denied) return denied;
        var db = loadDatabase();
        return ok({ text: BL.buildSalesCsv(db.orders) });
      },
    },
  };

  BL.api = api;
})(typeof window !== 'undefined' ? window : globalThis);

/*
 * Application controller: state, actions, event delegation and rendering.
 * Equivalent of App.tsx + the state/handlers inside each React component.
 */
(function (global) {
  'use strict';
  var BL = global.BL;
  var api = BL.api;
  var V = BL.views;

  var COOKIE_STORAGE_KEY = 'ai_bakers_life_cookie_consent_v1';
  var CART_STORAGE_KEY = 'ai_bakers_life_cart_v1';

  var DEFAULT_BRAND = {
    bakeryName: "AI Baker's Life",
    tagline: 'Small-batch sourdough, laminated pastries & celebration cakes baked fresh every morning.',
    logoText: "AI Baker's Life",
    primaryColor: '#1C1917',
    accentColor: '#9A4B1E',
    pickupAddress: '214 Hearthstone Lane, Bakery Row',
    openingHours: 'Tue – Sun · 7:30 AM – 5:00 PM',
    contactEmail: 'hello@aibakerslife.com',
    deliveryFeeCents: 600,
    freeDeliveryThresholdCents: 4500,
    taxRateBasisPoints: 825,
  };

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function lsGet(key) { try { return global.localStorage.getItem(key); } catch (e) { return null; } }
  function lsSet(key, value) { try { global.localStorage.setItem(key, value); } catch (e) { /* ignore */ } }

  /* ============================ STATE ============================ */
  function loadCart() {
    try { var saved = lsGet(CART_STORAGE_KEY); return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
  }
  function loadCookiePrefs() {
    try {
      var saved = lsGet(COOKIE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return { essential: true, functional: true, analytics: false, consentedAt: '' };
  }

  function defaultPm() {
    return {
      name: '', category: 'Pastries', description: '', flavorNotes: '',
      allergensText: 'Wheat, Dairy, Eggs', stock: '12', imageUrl: BL.IMAGE_PRESETS[1].url,
      isLimitedTime: false, limitedLabel: 'Limited Run', isActive: true,
      options: [{ label: 'Single Item', priceDollars: '6.50' }], error: null, saving: false,
    };
  }

  function newAdminState() {
    return {
      authStatus: null, token: null, passwordInput: '', confirmPasswordInput: '', authError: null, authLoading: false,
      tab: 'reports', products: [], orders: [], emailLogs: [], report: null, dataLoading: false,
      productSearch: '', orderFilter: 'all', showEmailDrawer: false, selectedEmail: null,
      productModalOpen: false, editingProduct: null,
      brandDraft: clone(state ? state.brand : DEFAULT_BRAND), brandMsg: null, feedback: null,
      pm: defaultPm(),
    };
  }

  var cookiePrefs = loadCookiePrefs();
  var state = BL.state = {
    route: global.location.hash === '#admin' ? 'admin' : 'storefront',
    products: [], brand: clone(DEFAULT_BRAND), stripeConfigured: false, loading: true,
    cart: loadCart(),
    selectedProduct: null, cartOpen: false, checkoutOpen: false, trackerOpen: false, mobileMenuOpen: false,
    cookiePrefs: cookiePrefs, cookieBannerVisible: !lsGet(COOKIE_STORAGE_KEY),
    ck: { showCustomize: false, functional: cookiePrefs.functional, analytics: cookiePrefs.analytics },
    // storefront filters
    category: 'All', onlyLimited: false, search: '',
    // product modal
    pdp: { optionId: '', qty: 1 },
    // checkout
    co: {
      fulfillmentType: 'pickup', customerName: '', customerEmail: '', customerPhone: '', deliveryAddress: '',
      pickupWindow: BL.PICKUP_WINDOWS[0], orderNotes: '', paymentMethod: 'stripe_card',
      fieldErrors: {}, serverError: null, submitting: false, confirmed: null, showEmailPreview: false,
    },
    // tracker
    tr: { orderNumber: '', email: '', loading: false, error: null, result: null },
  };
  state.ad = newAdminState();

  /* ============================ RENDERING ============================ */
  function $(id) { return global.document.getElementById(id); }

  /* Replace innerHTML while keeping scroll positions and focus (by element id). */
  function setHtml(el, html) {
    if (!el) return;
    var scrollers = Array.prototype.map.call(el.querySelectorAll('.overflow-y-auto'), function (n) { return n.scrollTop; });
    var active = global.document.activeElement;
    var focusId = active && active.id && el.contains(active) ? active.id : null;
    var selStart = null, selEnd = null;
    if (focusId && typeof active.selectionStart === 'number') { try { selStart = active.selectionStart; selEnd = active.selectionEnd; } catch (e) { /* some input types */ } }
    el.innerHTML = html;
    Array.prototype.forEach.call(el.querySelectorAll('.overflow-y-auto'), function (n, i) { if (scrollers[i]) n.scrollTop = scrollers[i]; });
    if (focusId) {
      var next = global.document.getElementById(focusId);
      if (next) {
        try { next.focus({ preventScroll: true }); if (selStart !== null) next.setSelectionRange(selStart, selEnd); } catch (e) { /* ignore */ }
      }
    }
  }

  function applyBrand() {
    var root = global.document.documentElement;
    root.style.setProperty('--brand-primary', state.brand.primaryColor);
    root.style.setProperty('--brand-accent', state.brand.accentColor);
  }

  function renderNavbar() { setHtml($('navbar'), V.navbar()); }

  function renderView() {
    var y = global.scrollY;
    setHtml($('view'), state.route === 'admin' ? V.adminPortal() : V.storefront());
    if (state.route === 'storefront' || true) global.scrollTo({ top: y, behavior: 'instant' });
  }

  function renderProduct() { setHtml($('ov-product'), V.productModal()); }
  function renderCart() { setHtml($('ov-cart'), V.cartDrawer()); }
  function renderCheckout() { setHtml($('ov-checkout'), V.checkoutModal()); }
  function renderTracker() { setHtml($('ov-tracker'), V.trackerModal()); }
  function renderProductForm() { setHtml($('ov-admin-product'), V.productFormModal()); }
  function renderCookie() { setHtml($('ov-cookie'), V.cookieBanner()); }

  function renderOverlays() {
    renderProduct(); renderCart(); renderCheckout(); renderTracker(); renderProductForm(); renderCookie();
  }
  function renderAll() { renderNavbar(); renderView(); renderOverlays(); }

  function refreshGrid() { setHtml($('product-grid'), V.productGrid()); }
  function refreshAdminProductRows() {
    setHtml($('admin-prod-rows'), V.productRows(state.ad));
    var c = $('admin-prod-count');
    if (c) c.textContent = V.adminFilteredCount(state.ad) + ' items in catalogue';
  }

  /* ============================ CART ============================ */
  function persistCart() { lsSet(CART_STORAGE_KEY, JSON.stringify(state.cart)); }

  function handleAddToCart(product, optionId, quantity) {
    var option = product.options.find(function (o) { return o.id === optionId; }) || product.options[0];
    if (!option || product.stock <= 0) return;

    var idx = state.cart.findIndex(function (i) { return i.productId === product.id && i.optionId === option.id; });
    if (idx !== -1) {
      var nextQty = Math.min(product.stock, state.cart[idx].quantity + quantity);
      state.cart[idx] = Object.assign({}, state.cart[idx], { quantity: nextQty });
    } else {
      state.cart.push({
        productId: product.id, optionId: option.id, productName: product.name, optionLabel: option.label,
        unitPriceCents: option.priceCents, quantity: Math.min(product.stock, quantity),
        imageUrl: product.imageUrl, category: product.category,
      });
    }
    persistCart();
    state.cartOpen = true;
    renderNavbar(); renderCart();
  }

  function handleUpdateCartQuantity(productId, optionId, delta) {
    var product = state.products.find(function (p) { return p.id === productId; });
    var maxStock = product ? product.stock : 99;
    state.cart = state.cart.map(function (item) {
      if (item.productId !== productId || item.optionId !== optionId) return item;
      return Object.assign({}, item, { quantity: Math.min(maxStock, item.quantity + delta) });
    }).filter(function (item) { return item.quantity > 0; });
    persistCart();
    renderNavbar(); renderCart(); renderCheckout();
  }

  function handleRemoveCartItem(productId, optionId) {
    state.cart = state.cart.filter(function (i) { return !(i.productId === productId && i.optionId === optionId); });
    persistCart();
    renderNavbar(); renderCart(); renderCheckout();
  }

  /* ============================ STOREFRONT DATA ============================ */
  function fetchStorefrontBootstrap() {
    return api.bootstrap().then(function (res) {
      if (res.ok) {
        if (Array.isArray(res.products)) state.products = res.products;
        if (res.brand) state.brand = res.brand;
        if (res.integrations) state.stripeConfigured = Boolean(res.integrations.stripeConfigured);
      }
    }).then(function () {
      state.loading = false;
      applyBrand();
      renderNavbar();
      renderView();
    });
  }

  /* ============================ NAVIGATION ============================ */
  function handleNavigate(route, sectionId) {
    var wasAdmin = state.route === 'admin';
    state.route = route;
    state.mobileMenuOpen = false;

    if (route === 'admin') {
      if (!wasAdmin) state.ad = newAdminState();
      global.location.hash = 'admin';
      renderNavbar(); renderView(); renderProductForm();
      global.scrollTo({ top: 0, behavior: 'smooth' });
      checkAuthStatus();
    } else {
      if (wasAdmin) state.ad = newAdminState(); // admin portal unmounts -> signed out (same as original)
      if (global.location.hash === '#admin') global.history.replaceState(null, '', '#top');
      renderNavbar(); renderView(); renderProductForm();
      if (sectionId) {
        global.setTimeout(function () {
          var el = global.document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 40);
      }
    }
  }

  /* ============================ COOKIES ============================ */
  function saveCookies(prefs) {
    state.cookiePrefs = prefs;
    state.cookieBannerVisible = false;
    lsSet(COOKIE_STORAGE_KEY, JSON.stringify(prefs));
    renderCookie();
  }

  /* ============================ CHECKOUT ============================ */
  function closeCheckout() {
    state.co.confirmed = null;
    state.co.showEmailPreview = false;
    state.co.fieldErrors = {};
    state.co.serverError = null;
    state.checkoutOpen = false;
    renderCheckout();
  }

  function submitCheckout() {
    var co = state.co;
    co.serverError = null;
    var input = {
      customerName: co.customerName, customerEmail: co.customerEmail, customerPhone: co.customerPhone,
      fulfillmentType: co.fulfillmentType, deliveryAddress: co.deliveryAddress, pickupWindow: co.pickupWindow,
      orderNotes: co.orderNotes, paymentMethod: co.paymentMethod,
    };
    var errors = BL.validateCheckoutInput(input, state.cart.length);
    if (Object.keys(errors).length > 0) { co.fieldErrors = errors; renderCheckout(); return; }

    co.fieldErrors = {};
    co.submitting = true;
    renderCheckout();

    var items = state.cart.map(function (i) { return { productId: i.productId, optionId: i.optionId, quantity: i.quantity }; });
    api.createOrder(input, items).then(function (res) {
      if (!res.ok) {
        if (res.fieldErrors) co.fieldErrors = res.fieldErrors;
        co.serverError = res.error || 'Could not place order.';
        return;
      }
      co.confirmed = { order: res.order, email: res.emailNotification };
      state.cart = [];
      persistCart();
      renderNavbar();
      return fetchStorefrontBootstrap();
    }).catch(function () {
      co.serverError = 'Network error while submitting your order. Please try again.';
    }).then(function () {
      co.submitting = false;
      renderCheckout();
    });
  }

  /* ============================ TRACKER ============================ */
  function submitTracker() {
    var t = state.tr;
    t.error = null; t.result = null; t.loading = true;
    renderTracker();
    api.trackOrder(t.orderNumber.trim(), t.email.trim()).then(function (res) {
      if (!res.ok) { t.error = res.error || 'Order not found.'; return; }
      t.result = { order: res.order, emails: res.emails };
    }).catch(function () {
      t.error = 'Unable to check order status right now.';
    }).then(function () {
      t.loading = false;
      renderTracker();
    });
  }

  /* ============================ ADMIN ============================ */
  function checkAuthStatus() {
    return api.admin.authStatus(state.ad.token).then(function (res) {
      state.ad.authStatus = { configuredViaEnv: res.configuredViaEnv, claimed: res.claimed, authenticated: res.authenticated };
    }).catch(function () {
      state.ad.authStatus = { configuredViaEnv: false, claimed: false, authenticated: false };
    }).then(function () {
      if (state.route === 'admin' && !state.ad.token) renderView();
    });
  }

  function loadOverview() {
    var token = state.ad.token;
    if (!token) return Promise.resolve();
    state.ad.dataLoading = true;
    if (!state.ad.report) renderView();
    return api.admin.overview(token).then(function (res) {
      if (res.status === 401) { state.ad.token = null; return; }
      state.ad.products = res.products || [];
      state.ad.orders = res.orders || [];
      state.ad.emailLogs = res.emailLogs || [];
      state.ad.report = res.report || null;
      if (res.brand) state.ad.brandDraft = clone(res.brand);
    }).then(function () {
      state.ad.dataLoading = false;
      if (state.route === 'admin') renderView();
    });
  }

  function setAdminToken(token) {
    state.ad.token = token;
    checkAuthStatus();
    if (token) loadOverview();
    else renderView();
  }

  function submitAdminAuth() {
    var ad = state.ad;
    ad.authError = null;
    var st = ad.authStatus;
    var isClaim = Boolean(st && !st.configuredViaEnv && !st.claimed);
    if (isClaim) {
      if (ad.passwordInput.length < 6) { ad.authError = 'Password must be at least 6 characters.'; renderView(); return; }
      if (ad.passwordInput !== ad.confirmPasswordInput) { ad.authError = 'Passwords do not match.'; renderView(); return; }
    }
    ad.authLoading = true;
    renderView();
    var call = isClaim ? api.admin.claim(ad.passwordInput) : api.admin.login(ad.passwordInput);
    call.then(function (res) {
      if (!res.ok) { ad.authError = res.error || 'Authentication failed.'; return; }
      ad.passwordInput = ''; ad.confirmPasswordInput = '';
      setAdminToken(res.token);
    }).catch(function () {
      ad.authError = 'Unable to reach authentication server.';
    }).then(function () {
      ad.authLoading = false;
      renderView();
    });
  }

  function afterCatalogChange() {
    return loadOverview().then(fetchStorefrontBootstrap);
  }

  function adminStock(id, delta) {
    var ad = state.ad;
    var product = ad.products.find(function (p) { return p.id === id; });
    if (!ad.token || !product) return;
    api.admin.updateProduct(ad.token, id, { stock: Math.max(0, product.stock + delta) }).then(function (res) {
      if (res.ok) afterCatalogChange();
    });
  }

  function adminToggleActive(id) {
    var ad = state.ad;
    var product = ad.products.find(function (p) { return p.id === id; });
    if (!ad.token || !product) return;
    api.admin.updateProduct(ad.token, id, { isActive: !product.isActive }).then(function (res) {
      if (res.ok) afterCatalogChange();
    });
  }

  function adminDeleteProduct(id) {
    var ad = state.ad;
    var product = ad.products.find(function (p) { return p.id === id; });
    if (!ad.token || !product) return;
    api.admin.deleteProduct(ad.token, id).then(function (res) {
      if (res.ok) {
        ad.feedback = 'Removed "' + product.name + '" from catalogue.';
        afterCatalogChange();
      }
    });
  }

  function adminOrderStatus(id, nextStatus) {
    var ad = state.ad;
    var order = ad.orders.find(function (o) { return o.id === id; });
    if (!ad.token || !order) return;
    api.admin.updateOrderStatus(ad.token, id, nextStatus).then(function (res) {
      if (res.ok) {
        ad.feedback = 'Order #' + order.orderNumber + ' updated to ' + BL.formatOrderStatusLabel(nextStatus, order.fulfillmentType) +
          '. Status email dispatched to ' + order.customerEmail + '.';
        if (res.emailNotification) ad.selectedEmail = res.emailNotification;
        afterCatalogChange();
      }
    });
  }

  function adminCsv() {
    var ad = state.ad;
    if (!ad.token) return;
    api.admin.csv(ad.token).then(function (res) {
      if (!res.ok) return;
      var blob = new Blob([res.text], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = global.document.createElement('a');
      link.href = url;
      link.download = 'ai-bakers-life-sales.csv';
      global.document.body.appendChild(link);
      link.click();
      global.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  function submitBrand() {
    var ad = state.ad;
    if (!ad.token) return;
    ad.brandMsg = null;
    api.admin.updateBrand(ad.token, ad.brandDraft).then(function (res) {
      if (res.ok) {
        state.brand = res.brand;
        ad.brandDraft = clone(res.brand);
        ad.brandMsg = 'Brand palette and storefront settings saved.';
        applyBrand();
        renderNavbar();
      }
      renderView();
    });
  }

  function openProductForm(product) {
    var ad = state.ad;
    ad.editingProduct = product || null;
    var pm = defaultPm();
    if (product) {
      pm.name = product.name; pm.category = product.category; pm.description = product.description;
      pm.flavorNotes = product.flavorNotes; pm.allergensText = product.allergens.join(', ');
      pm.stock = String(product.stock); pm.imageUrl = product.imageUrl; pm.isLimitedTime = product.isLimitedTime;
      pm.limitedLabel = product.limitedLabel || 'Limited Run'; pm.isActive = product.isActive;
      pm.options = product.options.map(function (o) { return { id: o.id, label: o.label, priceDollars: (o.priceCents / 100).toFixed(2) }; });
    }
    ad.pm = pm;
    ad.productModalOpen = true;
    renderProductForm();
  }

  function submitProductForm() {
    var ad = state.ad;
    var pm = ad.pm;
    pm.error = null;

    var parsedStock = Number.parseInt(pm.stock, 10);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      pm.error = 'Stock must be a whole number (0 or greater).'; renderProductForm(); return;
    }
    var parsedOptions = pm.options.map(function (opt) {
      return { id: opt.id, label: opt.label.trim(), priceCents: Math.round(Number.parseFloat(opt.priceDollars) * 100) };
    });
    if (parsedOptions.length === 0 || parsedOptions.some(function (o) { return !o.label || !Number.isFinite(o.priceCents) || o.priceCents <= 0; })) {
      pm.error = 'Each price option needs a label and a positive dollar price.'; renderProductForm(); return;
    }

    pm.saving = true;
    renderProductForm();

    var payload = {
      name: pm.name.trim(), category: pm.category, description: pm.description.trim(), flavorNotes: pm.flavorNotes.trim(),
      allergens: pm.allergensText.split(',').map(function (a) { return a.trim(); }).filter(Boolean),
      stock: parsedStock, imageUrl: pm.imageUrl.trim(), isLimitedTime: pm.isLimitedTime,
      limitedLabel: pm.isLimitedTime ? (pm.limitedLabel.trim() || 'Limited Run') : undefined,
      isActive: pm.isActive, options: parsedOptions,
    };

    var call = ad.editingProduct
      ? api.admin.updateProduct(ad.token, ad.editingProduct.id, payload)
      : api.admin.createProduct(ad.token, payload);

    call.then(function (res) {
      if (!res.ok) { pm.error = res.error || 'Could not save product.'; return; }
      ad.productModalOpen = false;
      afterCatalogChange();
    }).catch(function () {
      pm.error = 'Network error while saving product.';
    }).then(function () {
      pm.saving = false;
      renderProductForm();
    });
  }

  /* ============================ ACTIONS ============================ */
  function productById(id) { return state.products.find(function (p) { return p.id === id; }); }

  var actions = {
    nav: function (el) { handleNavigate(el.getAttribute('data-route'), el.getAttribute('data-section') || undefined); },
    'toggle-mobile-menu': function () { state.mobileMenuOpen = !state.mobileMenuOpen; renderNavbar(); },

    'open-tracker': function () { state.mobileMenuOpen = false; state.trackerOpen = true; renderNavbar(); renderTracker(); },
    'close-tracker': function () { state.trackerOpen = false; renderTracker(); },

    'open-cart': function () { state.cartOpen = true; renderCart(); },
    'close-cart': function () { state.cartOpen = false; renderCart(); },
    'proceed-checkout': function () { state.cartOpen = false; state.checkoutOpen = true; renderCart(); renderCheckout(); },
    'cart-qty': function (el) { handleUpdateCartQuantity(el.getAttribute('data-product'), el.getAttribute('data-option'), Number(el.getAttribute('data-delta'))); },
    'cart-remove': function (el) { handleRemoveCartItem(el.getAttribute('data-product'), el.getAttribute('data-option')); },

    'select-product': function (el) {
      var p = productById(el.getAttribute('data-id'));
      if (!p) return;
      state.selectedProduct = p;
      if (p.options.length > 0) state.pdp = { optionId: p.options[0].id, qty: 1 };
      renderProduct();
    },
    'close-product': function () { state.selectedProduct = null; renderProduct(); },
    'pdp-qty': function (el) {
      var p = state.selectedProduct; if (!p) return;
      var delta = Number(el.getAttribute('data-delta'));
      var maxQty = Math.max(1, p.stock);
      state.pdp.qty = Math.max(1, Math.min(maxQty, state.pdp.qty + delta));
      renderProduct();
    },
    'pdp-add': function () {
      var p = state.selectedProduct; if (!p || p.stock <= 0) return;
      var opt = p.options.find(function (o) { return o.id === state.pdp.optionId; }) || p.options[0];
      if (!opt) return;
      var qty = Math.min(state.pdp.qty, p.stock);
      state.selectedProduct = null;
      renderProduct();
      handleAddToCart(p, opt.id, qty);
    },
    'quick-add': function (el) {
      var p = productById(el.getAttribute('data-id'));
      if (!p || p.options.length === 0 || p.stock <= 0) return;
      handleAddToCart(p, p.options[0].id, 1);
    },

    'set-category': function (el) { state.category = el.getAttribute('data-category'); renderView(); },
    'toggle-limited': function () { state.onlyLimited = !state.onlyLimited; renderView(); },
    'reset-filters': function () { state.category = 'All'; state.onlyLimited = false; state.search = ''; renderView(); },

    'set-fulfillment': function (el) { state.co.fulfillmentType = el.getAttribute('data-type'); renderCheckout(); },
    'toggle-email-preview': function () { state.co.showEmailPreview = !state.co.showEmailPreview; renderCheckout(); },
    'close-checkout': closeCheckout,

    'open-cookie-settings': function () {
      state.ck = { showCustomize: false, functional: state.cookiePrefs.functional, analytics: state.cookiePrefs.analytics };
      state.cookieBannerVisible = true;
      renderCookie();
    },
    'cookie-customize': function () { state.ck.showCustomize = true; renderCookie(); },
    'cookie-back': function () { state.ck.showCustomize = false; renderCookie(); },
    'cookie-close': function () { state.ck.showCustomize = false; state.cookieBannerVisible = false; renderCookie(); },
    'cookie-accept-all': function () { saveCookies({ essential: true, functional: true, analytics: true, consentedAt: new Date().toISOString() }); },
    'cookie-essential': function () { saveCookies({ essential: true, functional: false, analytics: false, consentedAt: new Date().toISOString() }); },
    'cookie-save': function () {
      saveCookies({ essential: true, functional: state.ck.functional, analytics: state.ck.analytics, consentedAt: new Date().toISOString() });
      state.ck.showCustomize = false;
    },

    /* admin */
    'admin-exit': function () { handleNavigate('storefront', 'top'); },
    'admin-signout': function () { setAdminToken(null); },
    'admin-tab': function (el) { state.ad.tab = el.getAttribute('data-tab'); renderView(); },
    'admin-csv': adminCsv,
    'admin-add-product': function () { openProductForm(null); },
    'admin-edit-product': function (el) {
      var p = state.ad.products.find(function (x) { return x.id === el.getAttribute('data-id'); });
      if (p) openProductForm(p);
    },
    'admin-delete-product': function (el) { adminDeleteProduct(el.getAttribute('data-id')); },
    'admin-stock': function (el) { adminStock(el.getAttribute('data-id'), Number(el.getAttribute('data-delta'))); },
    'admin-toggle-active': function (el) { adminToggleActive(el.getAttribute('data-id')); },
    'admin-toggle-emails': function () { state.ad.showEmailDrawer = !state.ad.showEmailDrawer; renderView(); },
    'admin-select-email': function (el) {
      var em = state.ad.emailLogs.find(function (x) { return x.id === el.getAttribute('data-id'); });
      if (em) { state.ad.selectedEmail = em; renderView(); }
    },
    'admin-order-filter': function (el) { state.ad.orderFilter = el.getAttribute('data-status'); renderView(); },
    'admin-order-status': function (el) { adminOrderStatus(el.getAttribute('data-id'), el.getAttribute('data-status')); },
    'admin-dismiss-feedback': function () { state.ad.feedback = null; renderView(); },

    'pm-close': function () { state.ad.productModalOpen = false; renderProductForm(); },
    'pm-add-option': function () { state.ad.pm.options.push({ label: '', priceDollars: '12.00' }); renderProductForm(); },
    'pm-remove-option': function (el) {
      var idx = Number(el.getAttribute('data-index'));
      state.ad.pm.options = state.ad.pm.options.filter(function (_, i) { return i !== idx; });
      renderProductForm();
    },
  };

  var forms = {
    checkout: submitCheckout,
    tracker: submitTracker,
    'admin-auth': submitAdminAuth,
    'admin-brand': submitBrand,
    'admin-product': submitProductForm,
  };

  var rerenderers = {
    product: renderProduct,
    checkout: renderCheckout,
    'product-form': renderProductForm,
  };

  /* ============================ EVENTS ============================ */
  function setPath(root, path, value) {
    var parts = path.split('.');
    var obj = root;
    for (var i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = value;
  }

  global.document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el) return;
    if (el.hasAttribute('data-backdrop') && e.target !== el) return; // clicks inside the dialog don't close it
    var fn = actions[el.getAttribute('data-action')];
    if (!fn) return;
    if (el.tagName === 'A') e.preventDefault();
    fn(el, e);
  });

  function onModelEvent(e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;

    var changeAction = el.getAttribute('data-action-change');
    if (changeAction === 'pm-preset' && e.type === 'change') {
      if (el.value) { state.ad.pm.imageUrl = el.value; renderProductForm(); }
      return;
    }

    var path = el.getAttribute('data-model');
    if (!path) return;
    var isToggle = el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT';
    if (e.type === 'input' && isToggle) return; // handled on 'change'
    // Text-like fields are already handled by 'input'. Ignoring their 'change' (fired on blur)
    // avoids re-rendering lists between mousedown and mouseup of a click, which would swallow it.
    if (e.type === 'change' && !isToggle) return;

    var value = el.type === 'checkbox' ? el.checked : el.value;
    setPath(state, path, value);

    // keep paired controls (colour picker <-> hex text) in sync
    var twins = global.document.querySelectorAll('[data-model="' + path + '"]');
    Array.prototype.forEach.call(twins, function (t) {
      if (t !== el && t.type !== 'radio' && t.type !== 'checkbox') t.value = value;
    });

    if (path === 'search') refreshGrid();
    else if (path === 'ad.productSearch') refreshAdminProductRows();
    else if (path === 'ad.pm.imageUrl') {
      var sel = $('prod-image-preset');
      if (sel) {
        var isPreset = BL.IMAGE_PRESETS.some(function (p) { return p.url === value; });
        sel.value = isPreset ? value : '';
      }
    }

    var rr = el.getAttribute('data-rerender');
    if (rr && rerenderers[rr]) rerenderers[rr]();
  }
  global.document.addEventListener('input', onModelEvent);
  global.document.addEventListener('change', onModelEvent);

  global.document.addEventListener('submit', function (e) {
    var name = e.target && e.target.getAttribute && e.target.getAttribute('data-form');
    if (!name || !forms[name]) return;
    e.preventDefault();
    forms[name]();
  });

  global.document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.selectedProduct) { state.selectedProduct = null; renderProduct(); }
  });

  /* Image fallback: <img data-img-fallback> -> styled placeholder (error doesn't bubble, so capture) */
  global.document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.hasAttribute('data-img-fallback')) {
      t.outerHTML = BL.fallbackHtml(t.getAttribute('alt') || '', t.getAttribute('class') || '');
    }
  }, true);

  global.addEventListener('hashchange', function () {
    var isAdminHash = global.location.hash === '#admin';
    if (isAdminHash && state.route !== 'admin') handleNavigate('admin');
    else if (!isAdminHash && state.route === 'admin') handleNavigate('storefront');
  });

  /* ============================ BOOT ============================ */
  applyBrand();
  renderAll();
  fetchStorefrontBootstrap();
  if (state.route === 'admin') checkAuthStatus();
})(typeof window !== 'undefined' ? window : globalThis);

/*
 * Baker Admin views: sign-in / first-run claim, dashboard (Sales & Reports,
 * Products & Stock, Orders & Emails, Brand & Handover) and the product modal.
 */
(function (global) {
  'use strict';
  var BL = (global.BL = global.BL || {});
  var I = BL.icon;
  var fmt = BL.formatCurrency;
  var esc = BL.esc;
  var img = BL.img;
  var PRIMARY_BG = 'style="background-color: var(--brand-primary)"';

  var IMAGE_PRESETS = [
    { label: 'Country Sourdough Photography', url: 'assets/images/product_sourdough_loaf_1795412057458.jpg' },
    { label: 'Croissants & Cardamom Buns', url: 'assets/images/product_cardamom_croissant_1795412057428.jpg' },
    { label: 'Pistachio Celebration Cake', url: 'assets/images/product_pistachio_cake_1795412057875.jpg' },
    { label: 'Brown-Butter Chocolate Cookies', url: 'assets/images/product_brown_butter_cookies_1795412057822.jpg' },
    { label: 'Honey Fig & Yuzu Tarts', url: 'assets/images/product_lemon_tart_1795412057616.jpg' },
  ];
  BL.IMAGE_PRESETS = IMAGE_PRESETS;

  var TAB_LABELS = { reports: 'Sales & Reports', products: 'Products & Stock', orders: 'Orders & Emails', brand: 'Brand & Handover' };
  var TAB_TITLES = {
    reports: 'Sales Performance Overview',
    products: 'Catalogue & Inventory Management',
    orders: 'Orders & Customer Notifications',
    brand: 'Brand Palette & Owner Handover',
  };

  var FIELD = 'w-full h-10 px-3 border border-[#E6E2DA] rounded-md bg-[#FAF9F6]';

  /* ---------- sign-in / first-run claim ---------- */
  function loginView() {
    var ad = BL.state.ad;
    var st = ad.authStatus;
    var claim = Boolean(st && !st.configuredViaEnv && !st.claimed);

    return '<main class="max-w-md mx-auto px-4 py-16"><div class="bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg p-6 sm:p-8 space-y-5">' +
      '<div class="flex items-center gap-2.5 text-[#1C1917]">' + I('Lock', 'w-5 h-5') +
        '<h1 class="font-display text-2xl font-semibold">' + (claim ? 'Claim Baker Admin Access' : 'Baker Admin Sign In') + '</h1></div>' +
      '<p class="text-sm text-[#57524C] leading-relaxed">' + (claim
        ? 'Set your private baker admin password to manage daily stock, prices, limited-time items, order statuses, and sales reports.'
        : 'Enter your baker admin password to access inventory, orders, and sales analytics.') + '</p>' +
      (ad.authError ? '<div role="alert" class="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800">' + esc(ad.authError) + '</div>' : '') +
      '<form data-form="admin-auth" class="space-y-4">' +
        '<div><label for="admin-password" class="block text-xs font-medium text-[#4A453F] mb-1">' + (claim ? 'Create Admin Password (min. 6 characters)' : 'Admin Password') + '</label>' +
          '<input id="admin-password" type="password" required data-model="ad.passwordInput" value="' + esc(ad.passwordInput) + '" placeholder="Enter password" class="w-full h-10 px-3 text-sm border border-[#E6E2DA] rounded-md bg-[#FAF9F6] focus:outline-none focus:border-[#1C1917]"></div>' +
        (claim
          ? '<div><label for="admin-password-confirm" class="block text-xs font-medium text-[#4A453F] mb-1">Confirm Password</label>' +
            '<input id="admin-password-confirm" type="password" required data-model="ad.confirmPasswordInput" value="' + esc(ad.confirmPasswordInput) + '" placeholder="Re-enter password" class="w-full h-10 px-3 text-sm border border-[#E6E2DA] rounded-md bg-[#FAF9F6] focus:outline-none focus:border-[#1C1917]"></div>'
          : '') +
        '<button type="submit" ' + (ad.authLoading ? 'disabled' : '') + ' class="w-full h-11 px-4 text-sm font-medium text-white rounded-md hover:opacity-90 disabled:opacity-50 cursor-pointer" ' + PRIMARY_BG + '>' +
          (ad.authLoading ? 'Verifying...' : claim ? 'Set Password &amp; Open Dashboard' : 'Sign In to Dashboard') + '</button>' +
      '</form>' +
      '<button type="button" data-action="admin-exit" class="w-full text-center text-xs text-[#6B655E] hover:text-[#1C1917] underline underline-offset-4 cursor-pointer">Back to Customer Storefront</button>' +
    '</div></main>';
  }

  /* ---------- tabs ---------- */
  function reportsTab(ad) {
    var report = ad.report;
    if (!report) return '';
    function stat(label, value) {
      return '<div class="p-4 bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg"><p class="text-xs text-[#6B655E]">' + label + '</p>' +
        '<p class="mt-1.5 text-2xl font-mono-tabular font-semibold text-[#1C1917]">' + value + '</p></div>';
    }
    var catRows = report.byCategory.map(function (row) {
      return '<tr class="hover:bg-[#FAF9F6]"><td class="px-5 py-3 font-medium text-[#1C1917]">' + esc(row.category) + '</td>' +
        '<td class="px-5 py-3 text-right font-mono-tabular text-[#57524C]">' + row.unitsSold + '</td>' +
        '<td class="px-5 py-3 text-right font-mono-tabular font-medium text-[#1C1917]">' + fmt(row.revenueCents) + '</td></tr>';
    }).join('');

    var top = report.topProducts.length === 0
      ? '<p class="p-5 text-xs text-[#6B655E]">No completed sales recorded yet.</p>'
      : '<table class="w-full text-xs"><thead><tr class="border-b border-[#E6E2DA] text-[#6B655E]">' +
          '<th class="text-left font-medium px-5 py-2.5">Product</th><th class="text-right font-medium px-5 py-2.5">Units</th><th class="text-right font-medium px-5 py-2.5">Revenue</th></tr></thead>' +
          '<tbody class="divide-y divide-[#F3F1EC]">' + report.topProducts.map(function (item) {
            return '<tr class="hover:bg-[#FAF9F6]"><td class="px-5 py-3"><div class="font-medium text-[#1C1917]">' + esc(item.productName) + '</div><div class="text-[#6B655E]">' + esc(item.category) + '</div></td>' +
              '<td class="px-5 py-3 text-right font-mono-tabular text-[#57524C]">' + item.unitsSold + '</td>' +
              '<td class="px-5 py-3 text-right font-mono-tabular font-medium text-[#1C1917]">' + fmt(item.revenueCents) + '</td></tr>';
          }).join('') + '</tbody></table>';

    return '<div class="space-y-6">' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">' +
        stat('Total Revenue', fmt(report.totalRevenueCents)) +
        stat('Active &amp; Completed Orders', report.totalOrders) +
        stat('Average Order Value', fmt(report.averageOrderValueCents)) +
        stat('Low Stock Items (≤ 5)', report.lowStockCount) +
      '</div>' +
      '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">' +
        '<section class="bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg overflow-hidden"><div class="px-5 py-3.5 border-b border-[#E6E2DA]"><h2 class="text-sm font-semibold text-[#1C1917]">Revenue by Category</h2></div>' +
          '<table class="w-full text-xs"><thead><tr class="border-b border-[#E6E2DA] text-[#6B655E]"><th class="text-left font-medium px-5 py-2.5">Category</th><th class="text-right font-medium px-5 py-2.5">Units</th><th class="text-right font-medium px-5 py-2.5">Revenue</th></tr></thead>' +
          '<tbody class="divide-y divide-[#F3F1EC]">' + catRows + '</tbody></table></section>' +
        '<section class="bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg overflow-hidden"><div class="px-5 py-3.5 border-b border-[#E6E2DA]"><h2 class="text-sm font-semibold text-[#1C1917]">Top Selling Bakes</h2></div>' + top + '</section>' +
      '</div></div>';
  }

  function filteredProducts(ad) {
    var q = ad.productSearch.trim().toLowerCase();
    if (!q) return ad.products;
    return ad.products.filter(function (p) {
      return p.name.toLowerCase().indexOf(q) !== -1 || p.category.toLowerCase().indexOf(q) !== -1;
    });
  }

  function productRows(ad) {
    return filteredProducts(ad).map(function (product) {
      var stockCls = product.stock === 0 ? 'text-[#B91C1C]' : product.stock <= 5 ? 'text-[#B45309]' : 'text-[#1C1917]';
      return '<tr class="hover:bg-[#FAF9F6]">' +
        '<td class="px-4 py-3"><div class="flex items-center gap-3">' +
          '<div class="w-12 h-9 rounded overflow-hidden bg-[#F3F1EC] border border-[#E6E2DA] shrink-0">' + img(product.imageUrl, product.name, 'w-full h-full object-cover') + '</div>' +
          '<div><div class="font-semibold text-[#1C1917]">' + esc(product.name) + '</div><div class="text-[#6B655E]">' + esc(product.category) +
            (product.isLimitedTime ? ' · ' + esc(product.limitedLabel || 'Limited Run') : '') + '</div></div></div></td>' +
        '<td class="px-4 py-3 text-[#4A453F]">' + product.options.map(function (opt) {
          return '<div class="font-mono-tabular">' + esc(opt.label) + ': ' + fmt(opt.priceCents) + '</div>';
        }).join('') + '</td>' +
        '<td class="px-4 py-3"><div class="flex items-center justify-center gap-1.5">' +
          '<button type="button" aria-label="Decrease stock for ' + esc(product.name) + '" data-action="admin-stock" data-id="' + esc(product.id) + '" data-delta="-1" class="w-7 h-7 flex items-center justify-center border border-[#E6E2DA] rounded hover:bg-[#F3F1EC] cursor-pointer">' + I('Minus', 'w-3 h-3') + '</button>' +
          '<span class="w-9 text-center font-mono-tabular font-semibold ' + stockCls + '">' + product.stock + '</span>' +
          '<button type="button" aria-label="Increase stock for ' + esc(product.name) + '" data-action="admin-stock" data-id="' + esc(product.id) + '" data-delta="1" class="w-7 h-7 flex items-center justify-center border border-[#E6E2DA] rounded hover:bg-[#F3F1EC] cursor-pointer">' + I('Plus', 'w-3 h-3') + '</button>' +
        '</div></td>' +
        '<td class="px-4 py-3"><button type="button" data-action="admin-toggle-active" data-id="' + esc(product.id) + '" class="px-2.5 py-1 rounded border text-xs font-medium cursor-pointer ' +
          (product.isActive ? 'border-[#2F5241]/30 text-[#2F5241] bg-[#2F5241]/5' : 'border-[#E6E2DA] text-[#6B655E] bg-[#FAF9F6]') + '">' + (product.isActive ? 'Live on Menu' : 'Hidden') + '</button></td>' +
        '<td class="px-4 py-3 text-right"><div class="inline-flex items-center gap-1.5">' +
          '<button type="button" aria-label="Edit ' + esc(product.name) + '" data-action="admin-edit-product" data-id="' + esc(product.id) + '" class="p-2 border border-[#E6E2DA] rounded hover:bg-[#F3F1EC] text-[#1C1917] cursor-pointer">' + I('Pencil', 'w-3.5 h-3.5') + '</button>' +
          '<button type="button" aria-label="Delete ' + esc(product.name) + '" data-action="admin-delete-product" data-id="' + esc(product.id) + '" class="p-2 border border-[#E6E2DA] rounded hover:bg-red-50 text-[#6B655E] hover:text-[#B91C1C] cursor-pointer">' + I('Trash2', 'w-3.5 h-3.5') + '</button>' +
        '</div></td></tr>';
    }).join('');
  }

  function productsTab(ad) {
    return '<div class="space-y-4">' +
      '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">' +
        '<div class="w-full sm:w-72"><label for="admin-prod-search" class="sr-only">Filter products</label>' +
          '<input id="admin-prod-search" type="search" data-model="ad.productSearch" value="' + esc(ad.productSearch) + '" placeholder="Filter inventory by name or category..." class="w-full h-9 px-3 text-xs border border-[#E6E2DA] rounded-md bg-[#FFFFFF] focus:outline-none focus:border-[#1C1917]"></div>' +
        '<span id="admin-prod-count" class="text-xs text-[#6B655E]">' + filteredProducts(ad).length + ' items in catalogue</span>' +
      '</div>' +
      '<div class="bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg overflow-x-auto"><table class="w-full text-xs min-w-[680px]">' +
        '<thead><tr class="border-b border-[#E6E2DA] text-[#6B655E]"><th class="text-left font-medium px-4 py-3">Item</th><th class="text-left font-medium px-4 py-3">Pricing Options</th>' +
          '<th class="text-center font-medium px-4 py-3">Daily Stock</th><th class="text-left font-medium px-4 py-3">Visibility</th><th class="text-right font-medium px-4 py-3">Actions</th></tr></thead>' +
        '<tbody id="admin-prod-rows" class="divide-y divide-[#F3F1EC]">' + productRows(ad) + '</tbody></table></div></div>';
  }

  function ordersTab(ad) {
    if (ad.showEmailDrawer) {
      var list = ad.emailLogs.length === 0
        ? '<p class="p-5 text-xs text-[#6B655E]">No email notifications logged yet.</p>'
        : ad.emailLogs.map(function (em) {
            return '<button type="button" data-action="admin-select-email" data-id="' + esc(em.id) + '" class="w-full text-left p-4 hover:bg-[#FAF9F6] cursor-pointer ' + (ad.selectedEmail && ad.selectedEmail.id === em.id ? 'bg-[#F3F1EC]' : '') + '">' +
              '<div class="flex items-center justify-between text-xs text-[#6B655E]"><span class="font-mono-tabular font-medium text-[#1C1917]">#' + esc(em.orderNumber) + '</span><span>' + esc(new Date(em.sentAt).toLocaleString()) + '</span></div>' +
              '<p class="text-xs font-semibold text-[#1C1917] mt-1 truncate">' + esc(em.subject) + '</p>' +
              '<p class="text-xs text-[#57524C] truncate">To: ' + esc(em.recipientEmail) + '</p></button>';
          }).join('');
      var email = ad.selectedEmail || ad.emailLogs[0];
      var detail = email
        ? '<div class="space-y-3"><div class="pb-3 border-b border-[#E6E2DA] space-y-1 text-xs"><p class="font-semibold text-sm text-[#1C1917]">' + esc(email.subject) + '</p>' +
            '<p class="text-[#57524C]">Recipient: ' + esc(email.recipientName) + ' (' + esc(email.recipientEmail) + ')</p>' +
            '<p class="text-[#2F5241] font-medium">Channel: ' + (email.deliveryChannel === 'resend_live' ? 'Live Resend API' : 'Automated Email Outbox') + '</p></div>' +
            '<pre class="text-xs font-sans text-[#4A453F] whitespace-pre-wrap leading-relaxed">' + esc(email.bodyText) + '</pre></div>'
        : '<p class="text-xs text-[#6B655E]">Select a notification to inspect.</p>';
      return '<div class="space-y-4"><div class="grid grid-cols-1 lg:grid-cols-12 gap-5">' +
        '<div class="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg divide-y divide-[#F3F1EC] max-h-[520px] overflow-y-auto">' + list + '</div>' +
        '<div class="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg p-5">' + detail + '</div></div></div>';
    }

    var filters = ['all', 'confirmed', 'baking', 'ready', 'completed', 'cancelled'].map(function (key) {
      return '<button type="button" data-action="admin-order-filter" data-status="' + key + '" class="px-3 py-1.5 text-xs font-medium rounded-md capitalize whitespace-nowrap cursor-pointer ' +
        (ad.orderFilter === key ? 'bg-[#FFFFFF] text-[#1C1917] shadow-sm' : 'text-[#57524C] hover:text-[#1C1917]') + '">' + key + '</button>';
    }).join('');

    var orders = ad.orderFilter === 'all' ? ad.orders : ad.orders.filter(function (o) { return o.status === ad.orderFilter; });
    var cards = orders.length === 0
      ? '<div class="p-8 bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg text-center text-xs text-[#6B655E]">No orders match this status filter.</div>'
      : orders.map(function (order) {
          var next = BL.getNextAllowedStatuses(order.status);
          var actions = next.length > 0
            ? '<div class="pt-2 flex flex-wrap items-center gap-2"><span class="text-[11px] text-[#6B655E] mr-1">Update &amp; notify customer:</span>' + next.map(function (ns) {
                var label = ns === 'baking' ? 'Start Baking'
                  : ns === 'ready' ? (order.fulfillmentType === 'pickup' ? 'Mark Ready for Pickup' : 'Mark Out for Delivery')
                  : ns === 'completed' ? (order.fulfillmentType === 'pickup' ? 'Mark Picked Up' : 'Mark Delivered')
                  : 'Cancel & Restock';
                return '<button type="button" data-action="admin-order-status" data-id="' + esc(order.id) + '" data-status="' + ns + '" class="px-3 py-1.5 text-xs font-medium rounded-md border cursor-pointer ' +
                  (ns === 'cancelled' ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-[#E6E2DA] bg-[#FAF9F6] text-[#1C1917] hover:bg-[#F3F1EC]') + '">' + esc(label) + '</button>';
              }).join('') + '</div>'
            : '';
          return '<div class="p-5 bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg space-y-3">' +
            '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F3F1EC]">' +
              '<div class="flex flex-wrap items-center gap-2 text-xs"><span class="font-mono-tabular font-semibold text-sm text-[#1C1917]">#' + esc(order.orderNumber) + '</span><span aria-hidden="true">·</span>' +
                '<span class="font-medium text-[#1C1917]">' + esc(order.customerName) + '</span><span aria-hidden="true">·</span>' +
                '<span class="text-[#57524C]">' + esc(order.customerEmail) + '</span><span aria-hidden="true">·</span>' +
                '<span class="text-[#57524C] capitalize">' + esc(order.fulfillmentType) + '</span></div>' +
              '<div class="flex items-center gap-3"><span class="text-xs font-semibold text-[#2F5241]">' + esc(BL.formatOrderStatusLabel(order.status, order.fulfillmentType)) + '</span>' +
                '<span class="font-mono-tabular text-sm font-semibold text-[#1C1917]">' + fmt(order.totalCents) + '</span></div>' +
            '</div>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#4A453F]">' +
              '<ul class="space-y-1">' + order.items.map(function (item) { return '<li>' + item.quantity + 'x ' + esc(item.productName) + ' (' + esc(item.optionLabel) + ')</li>'; }).join('') + '</ul>' +
              '<div class="space-y-1 text-[#57524C]">' +
                '<p>' + (order.fulfillmentType === 'pickup' ? 'Pickup Window: ' + esc(order.pickupWindow) : 'Delivery Address: ' + esc(order.deliveryAddress)) + '</p>' +
                '<p>Payment: ' + (order.paymentMethod === 'stripe_card' ? 'Stripe Card' : 'PayPal') + ' (<span class="font-mono-tabular">' + esc(order.paymentReference) + '</span>)</p>' +
                (order.orderNotes ? '<p>Notes: ' + esc(order.orderNotes) + '</p>' : '') +
              '</div>' +
            '</div>' + actions + '</div>';
        }).join('');

    return '<div class="space-y-4"><div class="flex items-center gap-1.5 p-1 bg-[#F3F1EC] rounded-lg w-fit max-w-full overflow-x-auto">' + filters + '</div><div class="space-y-3">' + cards + '</div></div>';
  }

  function colorField(id, label, ariaLabel, path, value) {
    return '<div><label for="' + id + '" class="block text-xs text-[#4A453F] mb-1">' + label + '</label><div class="flex items-center gap-2">' +
      '<input type="color" aria-label="' + ariaLabel + '" data-model="' + path + '" value="' + esc(value) + '" class="w-10 h-10 rounded border border-[#E6E2DA] cursor-pointer">' +
      '<input id="' + id + '" type="text" data-model="' + path + '" value="' + esc(value) + '" class="flex-1 h-10 px-3 font-mono-tabular border border-[#E6E2DA] rounded-md bg-[#FAF9F6]"></div></div>';
  }
  function textField(id, label, path, value, type) {
    return '<div><label for="' + id + '" class="block text-xs text-[#4A453F] mb-1">' + label + '</label>' +
      '<input id="' + id + '" type="' + (type || 'text') + '" data-model="' + path + '" value="' + esc(value) + '" class="' + FIELD + '"></div>';
  }

  function brandTab(ad) {
    var b = ad.brandDraft;
    return '<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">' +
      '<form data-form="admin-brand" class="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg p-6 space-y-4 text-sm">' +
        '<h2 class="font-display text-lg font-semibold text-[#1C1917]">Brand Palette &amp; Storefront Details</h2>' +
        (ad.brandMsg ? '<div class="p-3 rounded-md bg-[#F3F1EC] border border-[#E6E2DA] text-xs text-[#2F5241] font-medium">' + esc(ad.brandMsg) + '</div>' : '') +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' + textField('brand-name', 'Bakery Name', 'ad.brandDraft.bakeryName', b.bakeryName) + textField('brand-email', 'Contact Email', 'ad.brandDraft.contactEmail', b.contactEmail, 'email') + '</div>' +
        textField('brand-tagline', 'Hero Tagline', 'ad.brandDraft.tagline', b.tagline) +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
          colorField('brand-primary', 'Primary Brand Color (Hex)', 'Primary color picker', 'ad.brandDraft.primaryColor', b.primaryColor) +
          colorField('brand-accent', 'Accent Color (Hex)', 'Accent color picker', 'ad.brandDraft.accentColor', b.accentColor) +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' + textField('brand-address', 'Bakery Pickup Address', 'ad.brandDraft.pickupAddress', b.pickupAddress) + textField('brand-hours', 'Opening Hours', 'ad.brandDraft.openingHours', b.openingHours) + '</div>' +
        '<div class="pt-2 flex justify-end"><button type="submit" class="px-5 py-2.5 text-xs font-medium text-white rounded-md hover:opacity-90 cursor-pointer" ' + PRIMARY_BG + '>Apply Brand Settings</button></div>' +
      '</form>' +
      '<aside class="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg p-6 space-y-4">' +
        '<h2 class="font-display text-lg font-semibold text-[#1C1917]">Owner Quick-Start Handover Guide</h2>' +
        '<p class="text-xs text-[#57524C] leading-relaxed">Manage your entire storefront without touching code using these four workflows:</p>' +
        '<ol class="space-y-3 text-xs text-[#4A453F] list-decimal pl-4 leading-relaxed">' +
          '<li><strong class="text-[#1C1917]">Add Limited-Time Items:</strong> Open <em>Products &amp; Stock → Add Product</em>, check <em>Limited-Time Item</em>, and set size/price options.</li>' +
          '<li><strong class="text-[#1C1917]">Update Daily Stock &amp; Prices:</strong> Use the inline <span class="font-mono-tabular">− / +</span> stock steppers or click the pencil icon on any item to adjust prices or pause seasonal bakes.</li>' +
          '<li><strong class="text-[#1C1917]">Process Orders &amp; Send Emails:</strong> Open <em>Orders &amp; Emails</em> and click <em>In the Oven</em> or <em>Ready for Pickup</em>. Customer status emails send and log automatically.</li>' +
          '<li><strong class="text-[#1C1917]">Pull Sales Reports &amp; Connect Live Keys:</strong> Use <em>Sales &amp; Reports → Export Sales CSV</em> for accounting, and add <span class="font-mono-tabular">STRIPE_SECRET_KEY</span> and <span class="font-mono-tabular">RESEND_API_KEY</span> in Environment Secrets when ready for live billing and email delivery.</li>' +
        '</ol>' +
      '</aside></div>';
  }

  /* ---------- dashboard shell ---------- */
  function dashboard() {
    var s = BL.state;
    var ad = s.ad;
    var tab = ad.tab;

    function sideBtn(key, iconName) {
      return '<button type="button" data-action="admin-tab" data-tab="' + key + '" class="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-md whitespace-nowrap cursor-pointer ' +
        (tab === key ? 'bg-[#F3F1EC] text-[#1C1917]' : 'text-[#57524C] hover:bg-[#FAF9F6] hover:text-[#1C1917]') + '">' + I(iconName, 'w-4 h-4') + TAB_LABELS[key].replace(/&/g, '&amp;') + '</button>';
    }

    var primaryAction = '';
    if (tab === 'reports') {
      primaryAction = '<button type="button" data-action="admin-csv" class="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white rounded-md hover:opacity-90 cursor-pointer whitespace-nowrap" ' + PRIMARY_BG + '>' + I('Download', 'w-3.5 h-3.5') + 'Export Sales CSV</button>';
    } else if (tab === 'products') {
      primaryAction = '<button type="button" data-action="admin-add-product" class="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white rounded-md hover:opacity-90 cursor-pointer whitespace-nowrap" ' + PRIMARY_BG + '>' + I('Plus', 'w-3.5 h-3.5') + 'Add Product</button>';
    } else if (tab === 'orders') {
      primaryAction = '<button type="button" data-action="admin-toggle-emails" class="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-[#E6E2DA] bg-[#FFFFFF] rounded-md hover:bg-[#F3F1EC] cursor-pointer whitespace-nowrap">' + I('Mail', 'w-3.5 h-3.5') +
        (ad.showEmailDrawer ? 'Show Order Queue' : 'Email Outbox (' + ad.emailLogs.length + ')') + '</button>';
    }

    var content = '';
    if (tab === 'reports') content = reportsTab(ad);
    else if (tab === 'products') content = productsTab(ad);
    else if (tab === 'orders') content = ordersTab(ad);
    else content = brandTab(ad);

    return '<div class="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex flex-col lg:flex-row">' +
      '<aside class="lg:w-64 shrink-0 bg-[#FFFFFF] border-b lg:border-b-0 lg:border-r border-[#E6E2DA] p-4 flex flex-col justify-between gap-4">' +
        '<div class="space-y-1"><p class="px-3 py-1.5 text-xs font-medium text-[#6B655E]">Operations Console</p>' +
          '<div class="flex lg:flex-col gap-1 overflow-x-auto">' + sideBtn('reports', 'BarChart3') + sideBtn('products', 'Package') + sideBtn('orders', 'ShoppingBag') + sideBtn('brand', 'Palette') + '</div></div>' +
        '<div class="pt-3 border-t border-[#E6E2DA] flex lg:flex-col gap-2">' +
          '<button type="button" data-action="admin-exit" class="px-3 py-2 text-xs font-medium border border-[#E6E2DA] rounded-md text-[#1C1917] hover:bg-[#F3F1EC] cursor-pointer text-left">View Live Storefront</button>' +
          '<button type="button" data-action="admin-signout" class="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#6B655E] hover:text-[#1C1917] cursor-pointer">' + I('LogOut', 'w-3.5 h-3.5') + 'Sign Out</button>' +
        '</div>' +
      '</aside>' +
      '<main class="flex-1 p-4 sm:p-8 max-w-[1160px] space-y-6">' +
        '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E2DA]"><div>' +
          '<p class="text-xs text-[#6B655E]">' + esc(s.brand.bakeryName) + ' / Baker Admin / <span class="text-[#1C1917] font-medium">' + esc(TAB_LABELS[tab]) + '</span></p>' +
          '<h1 class="font-display text-2xl font-semibold text-[#1C1917] mt-1">' + esc(TAB_TITLES[tab]) + '</h1></div>' +
          '<div class="flex items-center gap-2 shrink-0">' + primaryAction + '</div></div>' +
        (ad.feedback ? '<div class="p-3 rounded-md bg-[#F3F1EC] border border-[#E6E2DA] text-xs text-[#1C1917] flex items-center justify-between gap-2"><span>' + esc(ad.feedback) + '</span>' +
          '<button type="button" data-action="admin-dismiss-feedback" class="text-[#6B655E] hover:text-[#1C1917] underline cursor-pointer">Dismiss</button></div>' : '') +
        (ad.dataLoading && !ad.report ? '<div class="p-8 border border-[#E6E2DA] rounded-lg bg-[#FFFFFF] text-sm text-[#6B655E]">Loading bakery operations data...</div>' : '') +
        content +
      '</main></div>';
  }

  function adminPortal() {
    return BL.state.ad.token ? dashboard() : loginView();
  }

  /* ---------- product modal ---------- */
  function productFormModal() {
    var s = BL.state;
    var ad = s.ad;
    if (!ad.productModalOpen) return '';
    var pm = ad.pm;
    var editing = ad.editingProduct;
    var presetMatch = IMAGE_PRESETS.some(function (p) { return p.url === pm.imageUrl; });
    var F = 'w-full h-10 px-3 border border-[#E6E2DA] rounded-md bg-[#FAF9F6] focus:outline-none focus:border-[#1C1917]';

    var optionRows = pm.options.map(function (opt, idx) {
      return '<div class="flex items-center gap-2">' +
        '<input type="text" required aria-label="Option ' + (idx + 1) + ' label" data-model="ad.pm.options.' + idx + '.label" value="' + esc(opt.label) + '" placeholder="Box of 4" class="flex-1 h-9 px-3 text-xs border border-[#E6E2DA] rounded-md bg-[#FAF9F6]">' +
        '<div class="relative w-28"><span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B655E]">$</span>' +
          '<input type="number" step="0.01" min="0.50" required aria-label="Option ' + (idx + 1) + ' price" data-model="ad.pm.options.' + idx + '.priceDollars" value="' + esc(opt.priceDollars) + '" class="w-full h-9 pl-6 pr-2 text-xs font-mono-tabular border border-[#E6E2DA] rounded-md bg-[#FAF9F6]"></div>' +
        (pm.options.length > 1
          ? '<button type="button" aria-label="Remove option ' + (idx + 1) + '" data-action="pm-remove-option" data-index="' + idx + '" class="w-9 h-9 flex items-center justify-center rounded-md border border-[#E6E2DA] text-[#6B655E] hover:text-[#B91C1C] cursor-pointer">' + I('Trash2', 'w-3.5 h-3.5') + '</button>'
          : '') +
      '</div>';
    }).join('');

    return '<div role="dialog" aria-modal="true" aria-labelledby="admin-product-modal-title" data-action="pm-close" data-backdrop class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">' +
      '<div class="w-full max-w-2xl bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg shadow-2xl max-h-[92vh] overflow-y-auto">' +
        '<div class="px-6 py-4 border-b border-[#E6E2DA] flex items-center justify-between sticky top-0 bg-[#FFFFFF] z-10">' +
          '<h2 id="admin-product-modal-title" class="font-display text-lg font-semibold text-[#1C1917]">' + (editing ? 'Edit: ' + esc(editing.name) : 'Add New Bakery Item') + '</h2>' +
          '<button type="button" data-action="pm-close" aria-label="Close product form" class="w-9 h-9 flex items-center justify-center rounded-md border border-[#E6E2DA] hover:bg-[#F3F1EC] cursor-pointer">' + I('X', 'w-4 h-4') + '</button>' +
        '</div>' +
        '<form data-form="admin-product" class="p-6 space-y-4 text-sm">' +
          (pm.error ? '<div role="alert" class="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800">' + esc(pm.error) + '</div>' : '') +
          '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
            '<div><label for="prod-name" class="block text-xs font-medium text-[#4A453F] mb-1">Product Name *</label><input id="prod-name" type="text" required data-model="ad.pm.name" value="' + esc(pm.name) + '" placeholder="Maple Pecan Kouign-Amann" class="' + F + '"></div>' +
            '<div><label for="prod-category" class="block text-xs font-medium text-[#4A453F] mb-1">Category *</label><select id="prod-category" data-model="ad.pm.category" class="' + F + '">' +
              ['Cakes', 'Pastries', 'Breads', 'Cookies'].map(function (c) { return '<option value="' + c + '"' + (pm.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
          '</div>' +
          '<div><label for="prod-desc" class="block text-xs font-medium text-[#4A453F] mb-1">Description *</label>' +
            '<textarea id="prod-desc" rows="2" required data-model="ad.pm.description" placeholder="Caramelized laminated pastry folded with Vermont maple and toasted Georgia pecans." class="w-full p-3 border border-[#E6E2DA] rounded-md bg-[#FAF9F6] focus:outline-none focus:border-[#1C1917]">' + esc(pm.description) + '</textarea></div>' +
          '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
            '<div><label for="prod-flavor" class="block text-xs font-medium text-[#4A453F] mb-1">Flavour Notes</label><input id="prod-flavor" type="text" data-model="ad.pm.flavorNotes" value="' + esc(pm.flavorNotes) + '" placeholder="Caramelized crust, toasted pecan, sea salt" class="' + F + '"></div>' +
            '<div><label for="prod-allergens" class="block text-xs font-medium text-[#4A453F] mb-1">Allergens (comma-separated)</label><input id="prod-allergens" type="text" data-model="ad.pm.allergensText" value="' + esc(pm.allergensText) + '" placeholder="Wheat, Dairy, Tree Nuts" class="' + F + '"></div>' +
          '</div>' +
          '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">' +
            '<div><label for="prod-stock" class="block text-xs font-medium text-[#4A453F] mb-1">Available Stock *</label><input id="prod-stock" type="number" min="0" required data-model="ad.pm.stock" value="' + esc(pm.stock) + '" class="w-full h-10 px-3 font-mono-tabular border border-[#E6E2DA] rounded-md bg-[#FAF9F6] focus:outline-none focus:border-[#1C1917]"></div>' +
            '<label class="flex items-center gap-2 h-10 px-3 border border-[#E6E2DA] rounded-md bg-[#FAF9F6] cursor-pointer text-xs font-medium"><input type="checkbox" data-model="ad.pm.isLimitedTime" data-rerender="product-form" ' + (pm.isLimitedTime ? 'checked' : '') + ' class="accent-[#1C1917]">Limited-Time Item</label>' +
            '<label class="flex items-center gap-2 h-10 px-3 border border-[#E6E2DA] rounded-md bg-[#FAF9F6] cursor-pointer text-xs font-medium"><input type="checkbox" data-model="ad.pm.isActive" ' + (pm.isActive ? 'checked' : '') + ' class="accent-[#1C1917]">Visible in Storefront</label>' +
          '</div>' +
          (pm.isLimitedTime
            ? '<div><label for="prod-limited-label" class="block text-xs font-medium text-[#4A453F] mb-1">Seasonal / Limited-Time Label</label><input id="prod-limited-label" type="text" data-model="ad.pm.limitedLabel" value="' + esc(pm.limitedLabel) + '" placeholder="Weekend Special" class="' + F + '"></div>'
            : '') +
          '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
            '<div><label for="prod-image-preset" class="block text-xs font-medium text-[#4A453F] mb-1">Studio Photo Preset</label>' +
              '<select id="prod-image-preset" data-action-change="pm-preset" class="' + F + '"><option value="">Custom HTTPS Image URL</option>' +
                IMAGE_PRESETS.map(function (p) { return '<option value="' + esc(p.url) + '"' + (presetMatch && pm.imageUrl === p.url ? ' selected' : '') + '>' + esc(p.label) + '</option>'; }).join('') + '</select></div>' +
            '<div><label for="prod-image-url" class="block text-xs font-medium text-[#4A453F] mb-1">Image Path or HTTPS URL</label><input id="prod-image-url" type="text" data-model="ad.pm.imageUrl" value="' + esc(pm.imageUrl) + '" class="w-full h-10 px-3 text-xs border border-[#E6E2DA] rounded-md bg-[#FAF9F6] focus:outline-none focus:border-[#1C1917]"></div>' +
          '</div>' +
          '<div class="pt-2 border-t border-[#E6E2DA] space-y-2.5">' +
            '<div class="flex items-center justify-between"><span class="text-xs font-semibold text-[#1C1917]">Size &amp; Price Options *</span>' +
              '<button type="button" data-action="pm-add-option" class="inline-flex items-center gap-1 text-xs font-medium text-[#1C1917] hover:underline cursor-pointer">' + I('Plus', 'w-3.5 h-3.5') + 'Add Price Option</button></div>' +
            optionRows +
          '</div>' +
          '<div class="pt-4 border-t border-[#E6E2DA] flex justify-end gap-2">' +
            '<button type="button" data-action="pm-close" class="px-4 py-2 text-xs font-medium border border-[#E6E2DA] rounded-md hover:bg-[#F3F1EC] cursor-pointer">Cancel</button>' +
            '<button type="submit" ' + (pm.saving ? 'disabled' : '') + ' class="px-5 py-2 text-xs font-medium text-white rounded-md hover:opacity-90 disabled:opacity-50 cursor-pointer" ' + PRIMARY_BG + '>' +
              (pm.saving ? 'Saving...' : editing ? 'Save Changes' : 'Publish to Storefront') + '</button>' +
          '</div>' +
        '</form>' +
      '</div></div>';
  }

  BL.views = BL.views || {};
  BL.views.adminPortal = adminPortal;
  BL.views.productFormModal = productFormModal;
  BL.views.productRows = productRows;
  BL.views.adminFilteredCount = function (ad) { return filteredProducts(ad).length; };
})(typeof window !== 'undefined' ? window : globalThis);

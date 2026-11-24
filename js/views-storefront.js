/*
 * Customer-facing views: Navbar, Storefront, Product detail, Cart drawer,
 * Checkout, Order tracker and Cookie banner.
 * Each function returns an HTML string built from BL.state. Event handling
 * lives in app.js (delegated via data-action / data-model attributes).
 * Class names are the same Tailwind utilities used by the React version.
 */
(function (global) {
  'use strict';
  var BL = (global.BL = global.BL || {});
  var I = BL.icon;
  var fmt = BL.formatCurrency;

  /* ---------- helpers ---------- */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var PRIMARY_BG = 'style="background-color: var(--brand-primary)"';

  function fallbackHtml(alt, className) {
    return '<div role="img" aria-label="' + esc(alt) + '" class="flex flex-col items-center justify-center bg-gradient-to-br from-[#F3F1EC] to-[#E6E2DA] text-[#6B655E] p-4 text-center ' + esc(className) + '">' +
      I('Croissant', 'w-8 h-8 mb-2 opacity-60') +
      '<span class="text-xs font-medium leading-snug max-w-[180px]">' + esc(alt) + '</span></div>';
  }

  /* Image with graceful fallback (see the capture-phase error listener in app.js) */
  function img(src, alt, className, eager) {
    if (!src) return fallbackHtml(alt, className || '');
    return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="' + (eager ? 'eager' : 'lazy') +
      '" referrerpolicy="no-referrer" data-img-fallback class="' + esc(className || '') + '">';
  }

  BL.esc = esc;
  BL.img = img;
  BL.fallbackHtml = fallbackHtml;

  function cartTotals(items) {
    return items.reduce(function (s, i) { return s + i.unitPriceCents * i.quantity; }, 0);
  }
  function cartCount(items) {
    return items.reduce(function (s, i) { return s + i.quantity; }, 0);
  }

  /* ======================= NAVBAR ======================= */
  function navbar() {
    var s = BL.state;
    var count = cartCount(s.cart);
    var adminActive = s.route === 'admin' ? 'text-[#1C1917] underline underline-offset-4 font-semibold' : '';

    var mobile = s.mobileMenuOpen
      ? '<nav aria-label="Mobile Navigation" class="md:hidden border-t border-[#E6E2DA] bg-[#FAF9F6] px-4 py-3 flex flex-col gap-1">' +
          '<a href="#menu" data-action="nav" data-route="storefront" data-section="menu" class="py-2.5 px-2 text-sm font-medium text-[#1C1917] rounded hover:bg-[#F3F1EC]">Daily Menu</a>' +
          '<a href="#craft" data-action="nav" data-route="storefront" data-section="craft" class="py-2.5 px-2 text-sm font-medium text-[#1C1917] rounded hover:bg-[#F3F1EC]">Our Craft</a>' +
          '<button type="button" data-action="open-tracker" class="text-left py-2.5 px-2 text-sm font-medium text-[#1C1917] rounded hover:bg-[#F3F1EC] cursor-pointer">Track Order</button>' +
          '<a href="#admin" data-action="nav" data-route="admin" class="py-2.5 px-2 text-sm font-medium text-[#1C1917] rounded hover:bg-[#F3F1EC]">Baker Admin</a>' +
        '</nav>'
      : '';

    return '<header class="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E6E2DA]">' +
      '<div class="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">' +
        '<a href="#top" data-action="nav" data-route="storefront" data-section="top" class="font-display text-lg sm:text-xl font-semibold tracking-tight text-[var(--brand-primary)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-accent)]">' + esc(s.brand.bakeryName) + '</a>' +
        '<nav aria-label="Primary Navigation" class="hidden md:flex items-center gap-7 text-sm font-medium text-[#57524C]">' +
          '<a href="#menu" data-action="nav" data-route="storefront" data-section="menu" class="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">Daily Menu</a>' +
          '<a href="#craft" data-action="nav" data-route="storefront" data-section="craft" class="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">Our Craft</a>' +
          '<button type="button" data-action="open-tracker" class="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer">Track Order</button>' +
          '<a href="#admin" data-action="nav" data-route="admin" class="hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ' + adminActive + '">Baker Admin</a>' +
        '</nav>' +
        '<div class="flex items-center gap-2 shrink-0">' +
          '<button type="button" data-action="open-cart" aria-label="Open shopping bag, ' + count + ' items" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]" ' + PRIMARY_BG + '>' +
            I('ShoppingBag', 'w-4 h-4') + '<span>Bag</span><span class="font-mono-tabular text-xs opacity-90">(' + count + ')</span>' +
          '</button>' +
          '<button type="button" data-action="toggle-mobile-menu" aria-label="' + (s.mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu') + '" aria-expanded="' + s.mobileMenuOpen + '" class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-[#E6E2DA] text-[#1C1917] hover:bg-[#F3F1EC] cursor-pointer">' +
            (s.mobileMenuOpen ? I('X', 'w-5 h-5') : I('Menu', 'w-5 h-5')) +
          '</button>' +
        '</div>' +
      '</div>' + mobile + '</header>';
  }

  /* ======================= STOREFRONT ======================= */
  var CATEGORY_TABS = ['All', 'Cakes', 'Pastries', 'Breads', 'Cookies'];

  function filteredProducts() {
    var s = BL.state;
    var q = s.search.trim().toLowerCase();
    return s.products.filter(function (p) {
      if (s.category !== 'All' && p.category !== s.category) return false;
      if (s.onlyLimited && !p.isLimitedTime) return false;
      if (q) {
        var match = p.name.toLowerCase().indexOf(q) !== -1 ||
          p.description.toLowerCase().indexOf(q) !== -1 ||
          p.flavorNotes.toLowerCase().indexOf(q) !== -1;
        if (!match) return false;
      }
      return true;
    });
  }

  function productGrid() {
    var s = BL.state;
    if (s.loading) {
      var sk = '';
      for (var n = 1; n <= 6; n++) {
        sk += '<div class="border border-[#E6E2DA] rounded-lg bg-[#FFFFFF] overflow-hidden animate-pulse">' +
          '<div class="aspect-[4/3] bg-[#F3F1EC]"></div><div class="p-5 space-y-3">' +
          '<div class="h-3 w-28 bg-[#F3F1EC] rounded"></div><div class="h-5 w-48 bg-[#F3F1EC] rounded"></div>' +
          '<div class="h-4 w-full bg-[#F3F1EC] rounded"></div></div></div>';
      }
      return '<div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">' + sk + '</div>';
    }

    var list = filteredProducts();
    if (list.length === 0) {
      return '<div class="mt-8 p-12 border border-[#E6E2DA] rounded-lg bg-[#FFFFFF] text-center">' +
        '<p class="font-display text-lg font-medium text-[#1C1917]">No matching bakes found</p>' +
        '<p class="text-sm text-[#6B655E] mt-1">Try clearing your search or switching back to all bakery categories.</p>' +
        '<button type="button" data-action="reset-filters" class="mt-4 px-4 py-2 text-xs font-medium border border-[#E6E2DA] rounded-md hover:bg-[#F3F1EC] cursor-pointer">Reset Filters</button>' +
        '</div>';
    }

    return '<div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">' + list.map(function (product) {
      var lowest = Math.min.apply(null, product.options.map(function (o) { return o.priceCents; }));
      var soldOut = product.stock <= 0;
      var kickerTag = soldOut
        ? '<span aria-hidden="true">·</span><span class="font-medium text-[#B91C1C]">Sold Out</span>'
        : product.stock <= 5
          ? '<span aria-hidden="true">·</span><span class="font-medium text-[#B45309]">Only ' + product.stock + ' left</span>'
          : '';
      var nOpts = product.options.length;
      return '<article class="group border border-[#E6E2DA] rounded-lg bg-[#FFFFFF] overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">' +
        '<button type="button" data-action="select-product" data-id="' + esc(product.id) + '" class="text-left block w-full bg-[#F3F1EC] overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--brand-accent)]">' +
          img(product.imageUrl, product.name, 'w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-[1.02]') +
        '</button>' +
        '<div class="p-5 flex-1 flex flex-col justify-between gap-4">' +
          '<div class="space-y-1.5">' +
            '<div class="flex items-center gap-2 text-xs text-[#6B655E]">' +
              '<span>' + esc(product.category) + '</span><span aria-hidden="true">·</span>' +
              '<span class="' + (product.isLimitedTime ? 'font-medium text-[var(--brand-accent)]' : '') + '">' +
                esc(product.isLimitedTime ? (product.limitedLabel || 'Limited Run') : 'Daily Bake') + '</span>' + kickerTag +
            '</div>' +
            '<h3 class="text-base font-semibold text-[#1C1917] leading-snug"><button type="button" data-action="select-product" data-id="' + esc(product.id) + '" class="text-left hover:underline underline-offset-4 cursor-pointer">' + esc(product.name) + '</button></h3>' +
            '<p class="text-sm text-[#57524C] line-clamp-2 leading-relaxed">' + esc(product.flavorNotes) + '</p>' +
          '</div>' +
          '<div class="pt-3 border-t border-[#F3F1EC] flex items-center justify-between gap-3">' +
            '<div><span class="text-sm font-mono-tabular font-semibold text-[#1C1917]">' + (nOpts > 1 ? 'From ' + fmt(lowest) : fmt(lowest)) + '</span>' +
              '<span class="block text-[11px] text-[#6B655E]">' + nOpts + ' ' + (nOpts === 1 ? 'size option' : 'size options') + '</span></div>' +
            '<div class="flex items-center gap-2">' +
              '<button type="button" data-action="select-product" data-id="' + esc(product.id) + '" class="h-10 px-3 text-xs font-medium border border-[#E6E2DA] rounded-md text-[#1C1917] hover:bg-[#F3F1EC] transition-colors whitespace-nowrap cursor-pointer">Options</button>' +
              '<button type="button" ' + (soldOut ? 'disabled' : '') + ' data-action="quick-add" data-id="' + esc(product.id) + '" aria-label="Add ' + esc(product.name) + ' to bag" class="h-10 px-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-white rounded-md transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap cursor-pointer" ' + PRIMARY_BG + '>' +
                I('ShoppingBag', 'w-3.5 h-3.5') + 'Add</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('') + '</div>';
  }

  function storefront() {
    var s = BL.state;
    var brand = s.brand;

    var tabs = CATEGORY_TABS.map(function (category) {
      var active = s.category === category;
      return '<button role="tab" type="button" aria-selected="' + active + '" data-action="set-category" data-category="' + category + '" class="px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ' +
        (active ? 'bg-[#FFFFFF] text-[#1C1917] shadow-sm' : 'text-[#57524C] hover:text-[#1C1917]') + '">' + category + '</button>';
    }).join('');

    return '<main id="top">' +
      /* Hero */
      '<section class="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-10 lg:pt-12 lg:pb-14">' +
        '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">' +
          '<div class="lg:col-span-5 flex flex-col justify-center py-2">' +
            '<p class="text-xs font-medium text-[#6B655E] mb-3">' + esc(brand.openingHours) + ' · ' + esc(brand.pickupAddress) + '</p>' +
            '<h1 class="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#1C1917] leading-[1.08]" style="text-wrap: balance">Warm from our stone deck oven to your table.</h1>' +
            '<p class="mt-4 text-base text-[#4A453F] leading-relaxed max-w-[46ch]">' + esc(brand.tagline) + ' Order online for counter pickup or same-day local delivery.</p>' +
            '<div class="mt-7 flex flex-wrap items-center gap-3">' +
              '<a href="#menu" data-action="nav" data-route="storefront" data-section="menu" class="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white rounded-md transition-opacity hover:opacity-90 whitespace-nowrap" ' + PRIMARY_BG + '>Explore Daily Menu</a>' +
              '<button type="button" data-action="open-tracker" class="inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-[#1C1917] border border-[#E6E2DA] bg-[#FFFFFF] rounded-md hover:bg-[#F3F1EC] transition-colors whitespace-nowrap cursor-pointer">Track an Order</button>' +
            '</div>' +
          '</div>' +
          '<div class="lg:col-span-7"><div class="w-full h-full min-h-[280px] sm:min-h-[360px] rounded-lg overflow-hidden border border-[#E6E2DA] bg-[#F3F1EC]">' +
            img('assets/images/hero_artisan_bakery_1795412057748.jpg', "Sunlit artisan bakery counter at AI Baker's Life with croissants, sourdough loaves, and vanilla bean cake", 'w-full h-full aspect-[16/9] lg:aspect-auto object-cover', true) +
          '</div></div>' +
        '</div>' +
        '<div class="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-[#E6E2DA] divide-y sm:divide-y-0 sm:divide-x divide-[#E6E2DA]">' +
          '<div class="py-4 sm:px-5 first:pl-0"><p class="text-xs font-semibold text-[#1C1917]">Morning Hearth</p><p class="text-xs text-[#6B655E] mt-1">Fresh batches out at 7:30 AM daily</p></div>' +
          '<div class="py-4 sm:px-5"><p class="text-xs font-semibold text-[#1C1917]">36-Hour Ferment</p><p class="text-xs text-[#6B655E] mt-1">Organic stone-milled grains &amp; cultured butter</p></div>' +
          '<div class="py-4 sm:px-5"><p class="text-xs font-semibold text-[#1C1917]">Pickup or Delivery</p><p class="text-xs text-[#6B655E] mt-1">Free local delivery over ' + fmt(brand.freeDeliveryThresholdCents) + '</p></div>' +
          '<div class="py-4 sm:px-5 last:pr-0"><p class="text-xs font-semibold text-[#1C1917]">Instant Confirmation</p><p class="text-xs text-[#6B655E] mt-1">Automated email receipt &amp; oven updates</p></div>' +
        '</div>' +
      '</section>' +

      /* Menu */
      '<section id="menu" class="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">' +
        '<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E6E2DA]">' +
          '<div><h2 class="font-display text-3xl font-semibold text-[#1C1917]">Today’s Bake Menu</h2>' +
            '<p class="text-sm text-[#57524C] mt-1">Select a size or box option to customize your order, or quick-add single bakes.</p></div>' +
          '<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">' +
            '<div class="relative"><label for="menu-search" class="sr-only">Search bakery products</label>' +
              I('Search', 'w-4 h-4 text-[#6B655E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none') +
              '<input id="menu-search" type="search" data-model="search" value="' + esc(s.search) + '" placeholder="Search cakes, breads..." class="w-full sm:w-64 h-10 pl-9 pr-3 text-sm border border-[#E6E2DA] rounded-md bg-[#FFFFFF] focus:outline-none focus:border-[#1C1917]"></div>' +
            '<button type="button" data-action="toggle-limited" aria-pressed="' + s.onlyLimited + '" class="h-10 px-3.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ' +
              (s.onlyLimited ? 'border-[#1C1917] bg-[#1C1917] text-white' : 'border-[#E6E2DA] bg-[#FFFFFF] text-[#4A453F] hover:text-[#1C1917]') + '">Limited Run Only</button>' +
          '</div>' +
        '</div>' +
        '<div role="tablist" aria-label="Product Categories" class="mt-6 flex items-center gap-1.5 p-1 bg-[#F3F1EC] rounded-lg w-fit max-w-full overflow-x-auto">' + tabs + '</div>' +
        '<div id="product-grid">' + productGrid() + '</div>' +
      '</section>' +

      /* Craft */
      '<section id="craft" class="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 border-t border-[#E6E2DA]">' +
        '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">' +
          '<div class="lg:col-span-6"><div class="w-full h-full rounded-lg overflow-hidden border border-[#E6E2DA] bg-[#F3F1EC]">' +
            img('assets/images/craft_baker_kneading_1795412058091.jpg', 'Baker shaping sourdough loaves by hand on a maple bench', 'w-full h-full aspect-[4/3] object-cover') +
          '</div></div>' +
          '<div class="lg:col-span-6 flex flex-col justify-center space-y-5 py-2">' +
            '<p class="text-xs font-medium text-[var(--brand-accent)]">Small-Batch Craftsmanship</p>' +
            '<h2 class="font-display text-3xl font-semibold text-[#1C1917] leading-tight" style="text-wrap: balance">Stone-milled grains, slow fermentation, zero shortcuts.</h2>' +
            '<p class="text-sm sm:text-base text-[#4A453F] leading-relaxed">Every loaf, croissant, and celebration cake at ' + esc(brand.bakeryName) + ' begins days before it reaches the counter. Our sourdough rests 36 hours in cold fermentation; our pastry dough is laminated with cultured butter; and seasonal tarts are built around peak-harvest orchard fruit.</p>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E6E2DA] text-sm">' +
              '<div><h3 class="font-semibold text-[#1C1917]">Bakery Counter</h3><p class="text-[#57524C] mt-1">' + esc(brand.pickupAddress) + '</p><p class="text-[#6B655E] text-xs mt-0.5">' + esc(brand.openingHours) + '</p></div>' +
              '<div><h3 class="font-semibold text-[#1C1917]">Orders &amp; Special Requests</h3><p class="text-[#57524C] mt-1">' + esc(brand.contactEmail) + '</p>' +
                '<p class="text-[#6B655E] text-xs mt-0.5">Delivery fee ' + fmt(brand.deliveryFeeCents) + ' · Free over ' + fmt(brand.freeDeliveryThresholdCents) + '</p></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      /* Footer */
      '<footer class="border-t border-[#E6E2DA] bg-[#F3F1EC]">' +
        '<div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#57524C]">' +
          '<div><span class="font-display text-sm font-semibold text-[#1C1917]">' + esc(brand.bakeryName) + '</span><span class="mx-2" aria-hidden="true">·</span><span>© ' + new Date().getFullYear() + ' All rights reserved.</span></div>' +
          '<div class="flex flex-wrap items-center gap-5">' +
            '<button type="button" data-action="open-tracker" class="hover:text-[#1C1917] underline-offset-4 hover:underline cursor-pointer">Track Order</button>' +
            '<button type="button" data-action="open-cookie-settings" class="hover:text-[#1C1917] underline-offset-4 hover:underline cursor-pointer">Cookie Preferences</button>' +
            '<button type="button" data-action="nav" data-route="admin" class="hover:text-[#1C1917] underline-offset-4 hover:underline cursor-pointer">Baker Admin Portal</button>' +
          '</div>' +
        '</div>' +
      '</footer>' +
    '</main>';
  }

  /* ======================= PRODUCT DETAIL ======================= */
  function productModal() {
    var s = BL.state;
    var product = s.selectedProduct;
    if (!product) return '';
    var d = s.pdp;
    var selected = product.options.find(function (o) { return o.id === d.optionId; }) || product.options[0];
    var soldOut = product.stock <= 0;
    var maxQty = Math.max(1, product.stock);

    var optionsHtml = product.options.map(function (opt) {
      var active = selected && selected.id === opt.id;
      return '<label class="flex items-center justify-between px-3 py-2.5 rounded-md border text-sm cursor-pointer transition-colors ' +
        (active ? 'border-[#1C1917] bg-[#FAF9F6] font-medium' : 'border-[#E6E2DA] hover:bg-[#FAF9F6]') + '">' +
        '<span class="flex items-center gap-2.5"><input type="radio" name="product-option" value="' + esc(opt.id) + '" data-model="pdp.optionId" data-rerender="product" ' + (active ? 'checked' : '') + ' class="accent-[#1C1917]"><span>' + esc(opt.label) + '</span></span>' +
        '<span class="font-mono-tabular text-[#1C1917]">' + fmt(opt.priceCents) + '</span></label>';
    }).join('');

    return '<div role="dialog" aria-modal="true" aria-labelledby="pdp-title" data-action="close-product" data-backdrop class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">' +
      '<div class="relative w-full max-w-3xl bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">' +
        '<button type="button" data-action="close-product" aria-label="Close details for ' + esc(product.name) + '" class="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-md bg-white/90 border border-[#E6E2DA] text-[#1C1917] hover:bg-[#F3F1EC] cursor-pointer">' + I('X', 'w-4 h-4') + '</button>' +
        '<div class="bg-[#F3F1EC] flex items-center justify-center">' + img(product.imageUrl, product.name, 'w-full aspect-[4/3] md:h-full object-cover', true) + '</div>' +
        '<div class="p-6 flex flex-col justify-between gap-5">' +
          '<div class="space-y-3">' +
            '<div class="flex items-center gap-2 text-xs text-[#6B655E]">' +
              '<span>' + esc(product.category) + '</span><span aria-hidden="true">·</span>' +
              '<span>' + esc(product.isLimitedTime ? (product.limitedLabel || 'Limited Run') : 'Daily Bake') + '</span><span aria-hidden="true">·</span>' +
              '<span class="' + (soldOut ? 'text-[#B91C1C] font-medium' : 'text-[#2F5241] font-medium') + '">' + (soldOut ? 'Sold Out Today' : product.stock + ' left') + '</span>' +
            '</div>' +
            '<h2 id="pdp-title" class="font-display text-2xl font-semibold text-[#1C1917] leading-snug">' + esc(product.name) + '</h2>' +
            '<p class="text-sm text-[#4A453F] leading-relaxed">' + esc(product.description) + '</p>' +
            '<div class="pt-1 border-t border-[#E6E2DA] text-xs space-y-1.5">' +
              '<div><span class="font-semibold text-[#1C1917]">Tasting Notes: </span><span class="text-[#57524C]">' + esc(product.flavorNotes) + '</span></div>' +
              (product.allergens.length > 0 ? '<div><span class="font-semibold text-[#1C1917]">Contains: </span><span class="text-[#57524C]">' + esc(product.allergens.join(' · ')) + '</span></div>' : '') +
            '</div>' +
            '<fieldset class="pt-2"><legend class="text-xs font-semibold text-[#1C1917] mb-2">Select Size / Box Option</legend><div class="space-y-2">' + optionsHtml + '</div></fieldset>' +
          '</div>' +
          '<div class="pt-3 border-t border-[#E6E2DA] flex items-center gap-3">' +
            '<div class="inline-flex items-center border border-[#E6E2DA] rounded-md bg-[#FAF9F6]">' +
              '<button type="button" aria-label="Decrease quantity" ' + (soldOut || d.qty <= 1 ? 'disabled' : '') + ' data-action="pdp-qty" data-delta="-1" class="w-10 h-11 flex items-center justify-center text-[#1C1917] disabled:opacity-40 cursor-pointer">' + I('Minus', 'w-4 h-4') + '</button>' +
              '<span class="w-8 text-center text-sm font-mono-tabular font-medium">' + d.qty + '</span>' +
              '<button type="button" aria-label="Increase quantity" ' + (soldOut || d.qty >= maxQty ? 'disabled' : '') + ' data-action="pdp-qty" data-delta="1" class="w-10 h-11 flex items-center justify-center text-[#1C1917] disabled:opacity-40 cursor-pointer">' + I('Plus', 'w-4 h-4') + '</button>' +
            '</div>' +
            '<button type="button" ' + (soldOut ? 'disabled' : '') + ' data-action="pdp-add" class="flex-1 h-11 px-4 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-45 cursor-pointer whitespace-nowrap" ' + PRIMARY_BG + '>' +
              (soldOut ? 'Sold Out Today' : 'Add to Bag · ' + fmt((selected ? selected.priceCents : 0) * d.qty)) + '</button>' +
          '</div>' +
        '</div>' +
      '</div></div>';
  }

  /* ======================= CART DRAWER ======================= */
  function cartDrawer() {
    var s = BL.state;
    if (!s.cartOpen) return '';
    var items = s.cart;
    var subtotal = cartTotals(items);
    var remaining = Math.max(0, s.brand.freeDeliveryThresholdCents - subtotal);

    var banner = items.length > 0
      ? '<div class="px-6 py-2.5 bg-[#F3F1EC] border-b border-[#E6E2DA] text-xs text-[#4A453F]">' +
          (remaining === 0
            ? '<span class="font-medium text-[#2F5241]">Your order qualifies for free local delivery.</span>'
            : '<span>Add <span class="font-mono-tabular font-semibold text-[#1C1917]">' + fmt(remaining) + '</span> more for free local delivery (or pick up free anytime).</span>') +
        '</div>'
      : '';

    var body;
    if (items.length === 0) {
      body = '<div class="h-full flex flex-col items-center justify-center text-center py-12 px-4">' +
        I('ShoppingBag', 'w-10 h-10 text-[#9C948A] mb-3') +
        '<p class="font-display text-lg font-medium text-[#1C1917] mb-1">Your bag is empty</p>' +
        '<p class="text-sm text-[#6B655E] mb-5 max-w-[260px]">Add freshly baked loaves, flaky pastries, or celebration cakes to start an order.</p>' +
        '<button type="button" data-action="close-cart" class="px-5 py-2.5 text-sm font-medium text-white rounded-md hover:opacity-90 cursor-pointer" ' + PRIMARY_BG + '>Browse Today’s Menu</button></div>';
    } else {
      body = items.map(function (item) {
        var key = 'data-product="' + esc(item.productId) + '" data-option="' + esc(item.optionId) + '"';
        return '<div class="flex gap-4 pb-4 border-b border-[#E6E2DA] last:border-b-0">' +
          '<div class="w-20 h-16 rounded-md overflow-hidden bg-[#F3F1EC] shrink-0 border border-[#E6E2DA]">' + img(item.imageUrl, item.productName, 'w-full h-full object-cover', true) + '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-start justify-between gap-2"><h3 class="text-sm font-semibold text-[#1C1917] truncate">' + esc(item.productName) + '</h3>' +
              '<button type="button" data-action="cart-remove" ' + key + ' aria-label="Remove ' + esc(item.productName) + ' (' + esc(item.optionLabel) + ') from bag" class="text-[#6B655E] hover:text-[#B91C1C] p-1 cursor-pointer">' + I('Trash2', 'w-3.5 h-3.5') + '</button></div>' +
            '<p class="text-xs text-[#6B655E] mt-0.5">' + esc(item.optionLabel) + '</p>' +
            '<div class="mt-2.5 flex items-center justify-between">' +
              '<div class="inline-flex items-center border border-[#E6E2DA] rounded bg-[#FFFFFF]">' +
                '<button type="button" aria-label="Decrease quantity for ' + esc(item.productName) + '" data-action="cart-qty" data-delta="-1" ' + key + ' class="w-8 h-8 flex items-center justify-center text-[#1C1917] hover:bg-[#F3F1EC] cursor-pointer">' + I('Minus', 'w-3 h-3') + '</button>' +
                '<span class="w-7 text-center text-xs font-mono-tabular font-medium">' + item.quantity + '</span>' +
                '<button type="button" aria-label="Increase quantity for ' + esc(item.productName) + '" data-action="cart-qty" data-delta="1" ' + key + ' class="w-8 h-8 flex items-center justify-center text-[#1C1917] hover:bg-[#F3F1EC] cursor-pointer">' + I('Plus', 'w-3 h-3') + '</button>' +
              '</div>' +
              '<span class="text-sm font-mono-tabular font-medium text-[#1C1917]">' + fmt(item.unitPriceCents * item.quantity) + '</span>' +
            '</div>' +
          '</div></div>';
      }).join('');
    }

    var footer = items.length > 0
      ? '<div class="p-6 border-t border-[#E6E2DA] bg-[#FFFFFF] space-y-4">' +
          '<div class="flex items-center justify-between text-sm"><span class="text-[#57524C]">Subtotal</span><span class="font-mono-tabular text-base font-semibold text-[#1C1917]">' + fmt(subtotal) + '</span></div>' +
          '<p class="text-xs text-[#6B655E]">Delivery fee and tax calculated at checkout.</p>' +
          '<button type="button" data-action="proceed-checkout" class="w-full h-11 px-4 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer" ' + PRIMARY_BG + '>Proceed to Checkout</button>' +
        '</div>'
      : '';

    return '<div role="dialog" aria-modal="true" aria-label="Shopping Bag" data-action="close-cart" data-backdrop class="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">' +
      '<div class="w-full max-w-md bg-[#FAF9F6] border-l border-[#E6E2DA] h-full flex flex-col shadow-2xl">' +
        '<div class="px-6 py-4 border-b border-[#E6E2DA] bg-[#FFFFFF] flex items-center justify-between">' +
          '<div class="flex items-center gap-2.5">' + I('ShoppingBag', 'w-4 h-4 text-[#1C1917]') + '<h2 class="font-display text-lg font-semibold text-[#1C1917]">Your Bakery Bag</h2></div>' +
          '<button type="button" data-action="close-cart" aria-label="Close shopping bag" class="w-10 h-10 flex items-center justify-center rounded-md border border-[#E6E2DA] text-[#1C1917] hover:bg-[#F3F1EC] cursor-pointer">' + I('X', 'w-4 h-4') + '</button>' +
        '</div>' + banner +
        '<div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">' + body + '</div>' + footer +
      '</div></div>';
  }

  /* ======================= CHECKOUT ======================= */
  var PICKUP_WINDOWS = [
    'Today · 08:30 AM – 09:30 AM',
    'Today · 11:00 AM – 12:30 PM',
    'Today · 02:00 PM – 04:00 PM',
    'Tomorrow · 08:00 AM – 10:00 AM',
  ];
  BL.PICKUP_WINDOWS = PICKUP_WINDOWS;

  var INPUT_CLS = 'w-full h-10 px-3 text-sm border border-[#E6E2DA] rounded-md bg-[#FFFFFF] focus:outline-none focus:border-[#1C1917]';

  function fieldError(msg) {
    return msg ? '<p class="text-xs text-[#B91C1C] mt-1">' + esc(msg) + '</p>' : '';
  }

  function checkoutModal() {
    var s = BL.state;
    if (!s.checkoutOpen) return '';
    var co = s.co;
    var brand = s.brand;
    var items = s.cart;
    var summary = BL.calculateCartSummary(items, co.fulfillmentType, brand.deliveryFeeCents, brand.freeDeliveryThresholdCents, brand.taxRateBasisPoints);
    var confirmed = co.confirmed;

    var inner;
    if (confirmed) {
      var o = confirmed.order;
      var em = confirmed.email;
      var emailPreview = co.showEmailPreview
        ? '<div class="border border-[#E6E2DA] rounded-lg overflow-hidden">' +
            '<div class="px-4 py-2.5 bg-[#FAF9F6] border-b border-[#E6E2DA] text-xs flex flex-wrap items-center justify-between gap-2">' +
              '<span><strong class="text-[#1C1917]">Subject:</strong> ' + esc(em.subject) + '</span>' +
              '<span class="text-[#2F5241] font-medium">' + (em.deliveryChannel === 'resend_live' ? 'Delivered via Email Provider' : 'Dispatched to Automated Outbox') + '</span>' +
            '</div>' +
            '<pre class="p-4 max-h-48 overflow-y-auto text-xs font-sans text-[#4A453F] whitespace-pre-wrap leading-relaxed bg-[#FFFFFF]">' + esc(em.bodyText) + '</pre>' +
          '</div>'
        : '';
      var lines = o.items.map(function (item) {
        return '<div class="flex justify-between gap-2 text-xs"><span class="text-[#4A453F]">' + item.quantity + 'x ' + esc(item.productName) + ' (' + esc(item.optionLabel) + ')</span>' +
          '<span class="font-mono-tabular text-[#1C1917]">' + fmt(item.lineTotalCents) + '</span></div>';
      }).join('');

      inner = '<div class="p-6 space-y-6">' +
        '<div class="p-5 rounded-lg bg-[#F3F1EC] border border-[#E6E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">' +
          '<div class="flex items-start gap-3">' + I('CheckCircle2', 'w-6 h-6 text-[#2F5241] shrink-0 mt-0.5') +
            '<div><h3 class="font-display text-lg font-semibold text-[#1C1917]">Thank you, ' + esc(o.customerName) + '</h3>' +
              '<p class="text-sm text-[#4A453F] mt-0.5">Confirmation sent to <span class="font-medium text-[#1C1917]">' + esc(o.customerEmail) + '</span> · Payment Reference <span class="font-mono-tabular text-xs">' + esc(o.paymentReference) + '</span></p></div></div>' +
          '<button type="button" data-action="toggle-email-preview" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border border-[#E6E2DA] bg-[#FFFFFF] rounded-md hover:bg-[#FAF9F6] cursor-pointer whitespace-nowrap shrink-0">' +
            I('Mail', 'w-3.5 h-3.5') + (co.showEmailPreview ? 'Hide Confirmation Email' : 'View Confirmation Email') + '</button>' +
        '</div>' + emailPreview +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">' +
          '<div class="space-y-3 text-sm"><h4 class="font-semibold text-[#1C1917]">Fulfillment Details</h4>' +
            '<div class="p-4 rounded-md border border-[#E6E2DA] space-y-1.5 text-[#4A453F]">' +
              '<p class="font-medium text-[#1C1917]">' + (o.fulfillmentType === 'pickup' ? 'Bakery Pickup' : 'Local Delivery') + '</p>' +
              (o.fulfillmentType === 'pickup'
                ? '<p>' + esc(brand.pickupAddress) + '</p><p>Window: ' + esc(o.pickupWindow) + '</p>'
                : '<p>' + esc(o.deliveryAddress) + '</p>') +
              (o.orderNotes ? '<p class="text-xs text-[#6B655E] pt-1">Note: ' + esc(o.orderNotes) + '</p>' : '') +
            '</div></div>' +
          '<div class="space-y-3 text-sm"><h4 class="font-semibold text-[#1C1917]">Receipt Summary</h4>' +
            '<div class="p-4 rounded-md border border-[#E6E2DA] space-y-2">' + lines +
              '<div class="pt-2 border-t border-[#E6E2DA] space-y-1 text-xs text-[#57524C]">' +
                '<div class="flex justify-between"><span>Subtotal</span><span class="font-mono-tabular">' + fmt(o.subtotalCents) + '</span></div>' +
                '<div class="flex justify-between"><span>Delivery</span><span class="font-mono-tabular">' + (o.deliveryFeeCents === 0 ? 'Free' : fmt(o.deliveryFeeCents)) + '</span></div>' +
                '<div class="flex justify-between"><span>Tax</span><span class="font-mono-tabular">' + fmt(o.taxCents) + '</span></div>' +
                '<div class="flex justify-between pt-1 border-t border-[#E6E2DA] text-sm font-semibold text-[#1C1917]"><span>Total Paid</span><span class="font-mono-tabular">' + fmt(o.totalCents) + '</span></div>' +
              '</div></div></div>' +
        '</div>' +
        '<div class="flex justify-end"><button type="button" data-action="close-checkout" class="px-6 py-2.5 text-sm font-medium text-white rounded-md hover:opacity-90 cursor-pointer" ' + PRIMARY_BG + '>Return to Storefront</button></div>' +
      '</div>';
    } else {
      var fe = co.fieldErrors || {};
      var pickupOrAddress = co.fulfillmentType === 'pickup'
        ? '<div><label for="checkout-pickup-window" class="block text-xs text-[#4A453F] mb-1">Pickup Window (' + esc(brand.pickupAddress) + ') *</label>' +
            '<select id="checkout-pickup-window" data-model="co.pickupWindow" class="' + INPUT_CLS + '">' +
              PICKUP_WINDOWS.map(function (w) { return '<option value="' + esc(w) + '"' + (w === co.pickupWindow ? ' selected' : '') + '>' + esc(w) + '</option>'; }).join('') +
            '</select></div>'
        : '<div><label for="checkout-address" class="block text-xs text-[#4A453F] mb-1">Street Delivery Address *</label>' +
            '<input id="checkout-address" type="text" required data-model="co.deliveryAddress" value="' + esc(co.deliveryAddress) + '" placeholder="128 Oakwood Avenue, Apt 3" class="' + INPUT_CLS + '">' +
            fieldError(fe.deliveryAddress) + '</div>';

      function toggleBtn(type, iconName, label) {
        var on = co.fulfillmentType === type;
        return '<button type="button" data-action="set-fulfillment" data-type="' + type + '" class="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer ' +
          (on ? 'bg-[#FFFFFF] text-[#1C1917] shadow-sm' : 'text-[#57524C] hover:text-[#1C1917]') + '">' + I(iconName, 'w-4 h-4') + label + '</button>';
      }
      function payOption(value, inner2) {
        var on = co.paymentMethod === value;
        return '<label class="flex items-center gap-2.5 p-3 rounded-md border text-xs cursor-pointer ' + (on ? 'border-[#1C1917] bg-[#FAF9F6] font-medium' : 'border-[#E6E2DA]') + '">' +
          '<input type="radio" name="paymentMethod" value="' + value + '" data-model="co.paymentMethod" data-rerender="checkout" ' + (on ? 'checked' : '') + ' class="accent-[#1C1917]">' + inner2 + '</label>';
      }

      var summaryLines = items.map(function (item) {
        return '<div class="flex justify-between gap-2 text-xs"><div class="text-[#4A453F]"><span class="font-medium text-[#1C1917]">' + item.quantity + 'x ' + esc(item.productName) + '</span>' +
          '<div class="text-[#6B655E]">' + esc(item.optionLabel) + '</div></div>' +
          '<span class="font-mono-tabular text-[#1C1917] shrink-0">' + fmt(item.unitPriceCents * item.quantity) + '</span></div>';
      }).join('');

      inner = '<form data-form="checkout" novalidate class="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">' +
        '<div class="md:col-span-7 space-y-5">' +
          (co.serverError ? '<div role="alert" class="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800">' + esc(co.serverError) + '</div>' : '') +
          '<div><span class="block text-xs font-semibold text-[#1C1917] mb-2">1. Pickup or Local Delivery</span>' +
            '<div class="grid grid-cols-2 gap-2 p-1 bg-[#F3F1EC] rounded-lg">' +
              toggleBtn('pickup', 'Store', 'Bakery Pickup (Free)') + toggleBtn('delivery', 'MapPin', 'Local Delivery') +
            '</div></div>' +
          '<div class="space-y-3"><span class="block text-xs font-semibold text-[#1C1917]">2. Contact Details</span>' +
            '<div><label for="checkout-name" class="block text-xs text-[#4A453F] mb-1">Full Name *</label>' +
              '<input id="checkout-name" type="text" required data-model="co.customerName" value="' + esc(co.customerName) + '" placeholder="Maya Lin" class="' + INPUT_CLS + '">' + fieldError(fe.customerName) + '</div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
              '<div><label for="checkout-email" class="block text-xs text-[#4A453F] mb-1">Email for Receipt *</label>' +
                '<input id="checkout-email" type="email" required data-model="co.customerEmail" value="' + esc(co.customerEmail) + '" placeholder="maya@example.com" class="' + INPUT_CLS + '">' + fieldError(fe.customerEmail) + '</div>' +
              '<div><label for="checkout-phone" class="block text-xs text-[#4A453F] mb-1">Mobile Phone *</label>' +
                '<input id="checkout-phone" type="tel" required data-model="co.customerPhone" value="' + esc(co.customerPhone) + '" placeholder="(415) 555-0192" class="' + INPUT_CLS + '">' + fieldError(fe.customerPhone) + '</div>' +
            '</div>' + pickupOrAddress +
            '<div><label for="checkout-notes" class="block text-xs text-[#4A453F] mb-1">Bakery Notes (slicing, gift message, allergies)</label>' +
              '<input id="checkout-notes" type="text" data-model="co.orderNotes" value="' + esc(co.orderNotes) + '" placeholder="Optional instructions for our bakers" class="' + INPUT_CLS + '"></div>' +
          '</div>' +
          '<div class="space-y-2.5"><span class="block text-xs font-semibold text-[#1C1917]">3. Payment Method</span>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">' +
              payOption('stripe_card', I('CreditCard', 'w-4 h-4 text-[#1C1917]') + '<span>Card via Stripe ' + (!s.stripeConfigured ? '<span class="text-[#6B655E] font-normal">(Test Mode)</span>' : '') + '</span>') +
              payOption('paypal', '<span>PayPal Express</span>') +
            '</div></div>' +
        '</div>' +
        '<div class="md:col-span-5"><div class="p-5 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] space-y-4">' +
          '<h3 class="font-display text-base font-semibold text-[#1C1917]">Order Summary</h3>' +
          '<div class="space-y-2.5 max-h-52 overflow-y-auto pr-1">' + summaryLines + '</div>' +
          '<div class="pt-3 border-t border-[#E6E2DA] space-y-1.5 text-xs text-[#57524C]">' +
            '<div class="flex justify-between"><span>Subtotal</span><span class="font-mono-tabular">' + fmt(summary.subtotalCents) + '</span></div>' +
            '<div class="flex justify-between"><span>' + (co.fulfillmentType === 'pickup' ? 'Bakery Pickup' : 'Local Delivery') + '</span><span class="font-mono-tabular">' + (summary.deliveryFeeCents === 0 ? 'Free' : fmt(summary.deliveryFeeCents)) + '</span></div>' +
            '<div class="flex justify-between"><span>Estimated Tax</span><span class="font-mono-tabular">' + fmt(summary.taxCents) + '</span></div>' +
            '<div class="flex justify-between pt-2 border-t border-[#E6E2DA] text-sm font-semibold text-[#1C1917]"><span>Total</span><span class="font-mono-tabular">' + fmt(summary.totalCents) + '</span></div>' +
          '</div>' +
          '<button type="submit" ' + (co.submitting || items.length === 0 ? 'disabled' : '') + ' class="w-full h-11 px-4 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" ' + PRIMARY_BG + '>' +
            (co.submitting ? 'Processing Order...' : 'Pay &amp; Place Order · ' + fmt(summary.totalCents)) + '</button>' +
        '</div></div>' +
      '</form>';
    }

    return '<div role="dialog" aria-modal="true" aria-labelledby="checkout-heading" data-action="close-checkout" data-backdrop class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">' +
      '<div class="w-full max-w-3xl bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg shadow-2xl max-h-[92vh] overflow-y-auto">' +
        '<div class="px-6 py-4 border-b border-[#E6E2DA] flex items-center justify-between sticky top-0 bg-[#FFFFFF] z-10">' +
          '<h2 id="checkout-heading" class="font-display text-xl font-semibold text-[#1C1917]">' + (confirmed ? 'Order ' + esc(confirmed.order.orderNumber) + ' Confirmed' : 'Checkout') + '</h2>' +
          '<button type="button" data-action="close-checkout" aria-label="Close checkout" class="w-10 h-10 flex items-center justify-center rounded-md border border-[#E6E2DA] text-[#1C1917] hover:bg-[#F3F1EC] cursor-pointer">' + I('X', 'w-4 h-4') + '</button>' +
        '</div>' + inner +
      '</div></div>';
  }

  /* ======================= ORDER TRACKER ======================= */
  function trackerModal() {
    var s = BL.state;
    if (!s.trackerOpen) return '';
    var t = s.tr;
    var result = '';
    if (t.result) {
      var r = t.result;
      result = '<div class="p-4 rounded-md bg-[#FAF9F6] border border-[#E6E2DA] space-y-3 text-sm">' +
        '<div class="flex items-center justify-between gap-2 border-b border-[#E6E2DA] pb-2"><span class="font-mono-tabular font-semibold text-[#1C1917]">#' + esc(r.order.orderNumber) + '</span>' +
          '<span class="text-xs font-semibold text-[#2F5241]">' + esc(BL.formatOrderStatusLabel(r.order.status, r.order.fulfillmentType)) + '</span></div>' +
        '<div class="text-xs text-[#4A453F] space-y-1">' + r.order.items.map(function (i) {
          return '<div class="flex justify-between"><span>' + i.quantity + 'x ' + esc(i.productName) + ' (' + esc(i.optionLabel) + ')</span><span class="font-mono-tabular">' + fmt(i.lineTotalCents) + '</span></div>';
        }).join('') + '</div>' +
        '<div class="pt-2 border-t border-[#E6E2DA] flex justify-between text-xs font-semibold text-[#1C1917]"><span>Total Paid</span><span class="font-mono-tabular">' + fmt(r.order.totalCents) + '</span></div>' +
        (r.emails.length > 0
          ? '<div class="pt-2 border-t border-[#E6E2DA]"><p class="text-xs font-semibold text-[#1C1917] mb-1">Notifications Sent (' + r.emails.length + ')</p>' +
            '<ul class="space-y-1 text-xs text-[#57524C]">' + r.emails.map(function (em) {
              return '<li>' + esc(em.subject) + ' · ' + esc(new Date(em.sentAt).toLocaleString()) + '</li>';
            }).join('') + '</ul></div>'
          : '') +
      '</div>';
    }

    return '<div role="dialog" aria-modal="true" aria-labelledby="tracker-title" data-action="close-tracker" data-backdrop class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">' +
      '<div class="w-full max-w-lg bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg shadow-2xl overflow-hidden">' +
        '<div class="px-6 py-4 border-b border-[#E6E2DA] flex items-center justify-between">' +
          '<h2 id="tracker-title" class="font-display text-lg font-semibold text-[#1C1917]">Track Your Bakery Order</h2>' +
          '<button type="button" data-action="close-tracker" aria-label="Close order tracker" class="w-9 h-9 flex items-center justify-center rounded-md border border-[#E6E2DA] text-[#1C1917] hover:bg-[#F3F1EC] cursor-pointer">' + I('X', 'w-4 h-4') + '</button>' +
        '</div>' +
        '<div class="p-6 space-y-5">' +
          '<form data-form="tracker" class="space-y-3"><div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
            '<div><label for="track-order-num" class="block text-xs text-[#4A453F] mb-1">Order Number</label>' +
              '<input id="track-order-num" type="text" required data-model="tr.orderNumber" value="' + esc(t.orderNumber) + '" placeholder="ABL-1042" class="w-full h-10 px-3 text-sm font-mono-tabular border border-[#E6E2DA] rounded-md bg-[#FAF9F6] focus:outline-none focus:border-[#1C1917]"></div>' +
            '<div><label for="track-order-email" class="block text-xs text-[#4A453F] mb-1">Customer Email</label>' +
              '<input id="track-order-email" type="email" required data-model="tr.email" value="' + esc(t.email) + '" placeholder="julian.park@example.com" class="w-full h-10 px-3 text-sm border border-[#E6E2DA] rounded-md bg-[#FAF9F6] focus:outline-none focus:border-[#1C1917]"></div>' +
          '</div>' +
          '<button type="submit" ' + (t.loading ? 'disabled' : '') + ' class="w-full h-10 px-4 inline-flex items-center justify-center gap-2 text-sm font-medium text-white rounded-md hover:opacity-90 disabled:opacity-50 cursor-pointer" ' + PRIMARY_BG + '>' +
            I('Search', 'w-4 h-4') + (t.loading ? 'Checking Oven Schedule...' : 'Check Order Status') + '</button></form>' +
          (t.error ? '<div role="alert" class="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800">' + esc(t.error) + '</div>' : '') +
          result +
        '</div>' +
      '</div></div>';
  }

  /* ======================= COOKIE BANNER ======================= */
  function cookieBanner() {
    var s = BL.state;
    if (!s.cookieBannerVisible) return '';
    var ck = s.ck;
    var inner;
    if (!ck.showCustomize) {
      inner = '<div class="flex flex-col gap-1.5 sm:gap-2.5">' +
        '<p class="text-[11px] sm:text-sm text-[#4A453F] leading-tight sm:leading-snug">Essential cookies power your bag; optional cookies save pickup preferences.</p>' +
        '<div class="flex items-center justify-end gap-1.5 sm:gap-2">' +
          '<button type="button" data-action="cookie-customize" class="px-2 py-1 text-[11px] sm:text-xs font-medium text-[#57524C] hover:text-[#1C1917] underline underline-offset-2 cursor-pointer whitespace-nowrap shrink-0">Preferences</button>' +
          '<button type="button" data-action="cookie-essential" class="px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium border border-[#E6E2DA] rounded-md text-[#1C1917] hover:bg-[#F3F1EC] cursor-pointer whitespace-nowrap shrink-0">Essential Only</button>' +
          '<button type="button" data-action="cookie-accept-all" class="px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-white rounded-md hover:opacity-90 cursor-pointer whitespace-nowrap shrink-0" ' + PRIMARY_BG + '>Accept All</button>' +
        '</div></div>';
    } else {
      inner = '<div class="flex flex-col gap-3">' +
        '<div class="flex items-center justify-between"><h2 class="text-sm font-semibold text-[#1C1917]">Cookie Preferences</h2>' +
          '<button type="button" data-action="cookie-close" class="text-xs text-[#6B655E] hover:text-[#1C1917] cursor-pointer">Close</button></div>' +
        '<div class="space-y-2 text-xs">' +
          '<div class="flex items-center justify-between py-1 border-b border-[#F3F1EC]"><div><span class="font-medium text-[#1C1917]">Essential Cart &amp; Checkout</span><p class="text-[#6B655E]">Required for cart items and order submission.</p></div><span class="text-[#2F5241] font-medium">Always on</span></div>' +
          '<label class="flex items-center justify-between py-1 border-b border-[#F3F1EC] cursor-pointer"><div><span class="font-medium text-[#1C1917]">Functional Preferences</span><p class="text-[#6B655E]">Remembers your preferred pickup or delivery mode.</p></div>' +
            '<input type="checkbox" data-model="ck.functional" ' + (ck.functional ? 'checked' : '') + ' class="w-4 h-4 accent-[#1C1917]"></label>' +
          '<label class="flex items-center justify-between py-1 cursor-pointer"><div><span class="font-medium text-[#1C1917]">Storefront Analytics</span><p class="text-[#6B655E]">Helps us plan daily bake quantities.</p></div>' +
            '<input type="checkbox" data-model="ck.analytics" ' + (ck.analytics ? 'checked' : '') + ' class="w-4 h-4 accent-[#1C1917]"></label>' +
        '</div>' +
        '<div class="flex justify-end gap-2">' +
          '<button type="button" data-action="cookie-back" class="px-3 py-1.5 text-xs font-medium border border-[#E6E2DA] rounded-md hover:bg-[#F3F1EC] cursor-pointer">Back</button>' +
          '<button type="button" data-action="cookie-save" class="px-3 py-1.5 text-xs font-medium text-white rounded-md hover:opacity-90 cursor-pointer" ' + PRIMARY_BG + '>Save Preferences</button>' +
        '</div></div>';
    }
    return '<aside aria-label="Cookie consent notice" class="fixed bottom-2 left-2 right-2 sm:left-auto sm:right-6 sm:bottom-5 sm:max-w-md z-30 bg-[#FFFFFF] border border-[#E6E2DA] rounded-lg shadow-lg p-2.5 sm:p-4 text-[#1C1917]">' + inner + '</aside>';
  }

  BL.views = BL.views || {};
  BL.views.navbar = navbar;
  BL.views.storefront = storefront;
  BL.views.productGrid = productGrid;
  BL.views.productModal = productModal;
  BL.views.cartDrawer = cartDrawer;
  BL.views.checkoutModal = checkoutModal;
  BL.views.trackerModal = trackerModal;
  BL.views.cookieBanner = cookieBanner;
})(typeof window !== 'undefined' ? window : globalThis);

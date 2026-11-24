/*
 * Pure business logic (prices, tax, validation, stock checks, reports, CSV).
 * Ported 1:1 from src/utils/bakeryLogic.ts. Works in the browser (window.BL)
 * and in Node (module.exports) so it can be unit-tested.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BL = root.BL || {};
  Object.keys(api).forEach(function (k) { root.BL[k] = api[k]; });
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var CATEGORIES = ['Cakes', 'Pastries', 'Breads', 'Cookies'];

  function formatCurrency(cents) {
    var safeCents = Number.isFinite(cents) ? cents : 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(safeCents / 100);
  }

  function calculateCartSummary(items, fulfillmentType, deliveryFeeCents, freeDeliveryThresholdCents, taxRateBasisPoints) {
    if (taxRateBasisPoints === undefined) taxRateBasisPoints = 825;
    var subtotalCents = items.reduce(function (sum, item) {
      var qty = Math.max(0, Math.floor(item.quantity));
      var unit = Math.max(0, Math.round(item.unitPriceCents));
      return sum + unit * qty;
    }, 0);

    var qualifiesForFreeDelivery = subtotalCents >= freeDeliveryThresholdCents && subtotalCents > 0;

    var effectiveDeliveryFeeCents =
      fulfillmentType === 'delivery' && subtotalCents > 0 && !qualifiesForFreeDelivery
        ? Math.max(0, Math.round(deliveryFeeCents))
        : 0;

    var amountToFreeDeliveryCents =
      fulfillmentType === 'delivery' && !qualifiesForFreeDelivery
        ? Math.max(0, freeDeliveryThresholdCents - subtotalCents)
        : 0;

    var taxCents = Math.round((subtotalCents * taxRateBasisPoints) / 10000);
    var totalCents = subtotalCents + effectiveDeliveryFeeCents + taxCents;

    return {
      subtotalCents: subtotalCents,
      deliveryFeeCents: effectiveDeliveryFeeCents,
      taxCents: taxCents,
      totalCents: totalCents,
      amountToFreeDeliveryCents: amountToFreeDeliveryCents,
      qualifiesForFreeDelivery: qualifiesForFreeDelivery,
    };
  }

  function validateCheckoutInput(input, cartCount) {
    var errors = {};

    if (cartCount <= 0) errors.cart = 'Your shopping bag is empty.';

    if (!input.customerName || input.customerName.trim().length < 2) {
      errors.customerName = 'Please enter your full name.';
    }

    var email = (input.customerEmail || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.customerEmail = 'Please enter a valid email address for your receipt.';
    }

    var phoneDigits = (input.customerPhone || '').replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      errors.customerPhone = 'Please enter a valid contact phone number.';
    }

    if (input.fulfillmentType === 'delivery') {
      if (!input.deliveryAddress || input.deliveryAddress.trim().length < 8) {
        errors.deliveryAddress = 'Please enter a complete street delivery address.';
      }
    } else {
      if (!input.pickupWindow || input.pickupWindow.trim().length < 3) {
        errors.pickupWindow = 'Please select a bakery pickup time window.';
      }
    }

    return errors;
  }

  function canFulfillOrderItems(cartItems, products) {
    if (cartItems.length === 0) return { ok: false, reason: 'Order must contain at least one item.' };

    var requestedByProduct = {};

    for (var i = 0; i < cartItems.length; i++) {
      var item = cartItems[i];
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return { ok: false, reason: 'Item quantity must be a positive whole number.' };
      }
      var product = products.find(function (p) { return p.id === item.productId && p.isActive; });
      if (!product) {
        return { ok: false, reason: 'One or more selected products are no longer available.' };
      }
      var option = product.options.find(function (o) { return o.id === item.optionId; });
      if (!option) {
        return { ok: false, reason: 'Selected size option for ' + product.name + ' is unavailable.' };
      }
      var prev = requestedByProduct[product.id] || 0;
      var nextTotal = prev + item.quantity;
      if (nextTotal > product.stock) {
        return {
          ok: false,
          reason: product.stock === 0
            ? product.name + ' is currently sold out.'
            : 'Only ' + product.stock + ' left in stock for ' + product.name + '.',
        };
      }
      requestedByProduct[product.id] = nextTotal;
    }

    return { ok: true };
  }

  function getNextAllowedStatuses(currentStatus) {
    switch (currentStatus) {
      case 'confirmed': return ['baking', 'ready', 'cancelled'];
      case 'baking': return ['ready', 'completed', 'cancelled'];
      case 'ready': return ['completed', 'cancelled'];
      case 'completed': return [];
      case 'cancelled': return [];
      default: return [];
    }
  }

  function formatOrderStatusLabel(status, fulfillmentType) {
    switch (status) {
      case 'confirmed': return 'Order Confirmed';
      case 'baking': return 'In the Oven';
      case 'ready': return fulfillmentType === 'pickup' ? 'Ready for Pickup' : 'Out for Delivery';
      case 'completed': return fulfillmentType === 'pickup' ? 'Picked Up' : 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return String(status);
    }
  }

  function buildSalesReport(orders, products) {
    var validOrders = orders.filter(function (o) { return o.status !== 'cancelled'; });
    var totalRevenueCents = validOrders.reduce(function (sum, o) { return sum + o.totalCents; }, 0);
    var totalOrders = validOrders.length;
    var averageOrderValueCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0;

    var categoryMap = {};
    CATEGORIES.forEach(function (cat) { categoryMap[cat] = { revenueCents: 0, unitsSold: 0 }; });

    var productMap = {};
    var productOrder = [];
    var dailyMap = {};
    var dailyOrder = [];

    var totalUnitsSold = 0;

    validOrders.forEach(function (order) {
      var dayKey = order.createdAt.slice(0, 10);
      var prevDay = dailyMap[dayKey];
      if (!prevDay) { prevDay = { orders: 0, revenueCents: 0 }; dailyOrder.push(dayKey); }
      dailyMap[dayKey] = {
        orders: prevDay.orders + 1,
        revenueCents: prevDay.revenueCents + order.totalCents,
      };

      order.items.forEach(function (item) {
        totalUnitsSold += item.quantity;
        var catBucket = categoryMap[item.category];
        if (catBucket) {
          catBucket.revenueCents += item.lineTotalCents;
          catBucket.unitsSold += item.quantity;
        }

        var prodBucket = productMap[item.productId];
        if (!prodBucket) {
          prodBucket = {
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            unitsSold: 0,
            revenueCents: 0,
          };
          productOrder.push(item.productId);
        }
        prodBucket.unitsSold += item.quantity;
        prodBucket.revenueCents += item.lineTotalCents;
        productMap[item.productId] = prodBucket;
      });
    });

    var lowStockCount = products.filter(function (p) { return p.isActive && p.stock <= 5; }).length;

    return {
      totalRevenueCents: totalRevenueCents,
      totalOrders: totalOrders,
      averageOrderValueCents: averageOrderValueCents,
      totalUnitsSold: totalUnitsSold,
      lowStockCount: lowStockCount,
      byCategory: CATEGORIES.map(function (category) {
        return {
          category: category,
          revenueCents: categoryMap[category].revenueCents,
          unitsSold: categoryMap[category].unitsSold,
        };
      }),
      topProducts: productOrder
        .map(function (id) { return productMap[id]; })
        .sort(function (a, b) { return b.revenueCents - a.revenueCents; })
        .slice(0, 6),
      dailySeries: dailyOrder
        .map(function (date) {
          return { date: date, orders: dailyMap[date].orders, revenueCents: dailyMap[date].revenueCents };
        })
        .sort(function (a, b) { return a.date.localeCompare(b.date); }),
    };
  }

  function escapeCsvCell(value) {
    var raw = String(value == null ? '' : value);
    var sanitized = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
    if (/[",\n\r]/.test(sanitized)) {
      return '"' + sanitized.replace(/"/g, '""') + '"';
    }
    return sanitized;
  }

  function buildSalesCsv(orders) {
    var headers = [
      'Order Number', 'Date', 'Customer', 'Email', 'Fulfillment', 'Status', 'Payment Method',
      'Items', 'Subtotal USD', 'Delivery USD', 'Tax USD', 'Total USD',
    ];

    var rows = orders.map(function (o) {
      return [
        o.orderNumber,
        o.createdAt,
        o.customerName,
        o.customerEmail,
        o.fulfillmentType,
        o.status,
        o.paymentMethod,
        o.items.map(function (i) { return i.quantity + 'x ' + i.productName + ' (' + i.optionLabel + ')'; }).join('; '),
        (o.subtotalCents / 100).toFixed(2),
        (o.deliveryFeeCents / 100).toFixed(2),
        (o.taxCents / 100).toFixed(2),
        (o.totalCents / 100).toFixed(2),
      ];
    });

    return [headers].concat(rows)
      .map(function (row) { return row.map(escapeCsvCell).join(','); })
      .join('\n');
  }

  /* Local studio photos live in assets/images/. The original app used the
     "/src/assets/images/" prefix; both spellings are accepted here. */
  var LOCAL_IMAGE_PREFIX = 'assets/images/';

  function validateSafeImageUrl(url) {
    var trimmed = (url || '').trim();
    if (!trimmed) return null;
    if (trimmed.indexOf(LOCAL_IMAGE_PREFIX) === 0) return trimmed;
    if (trimmed.indexOf('/src/assets/images/') === 0) {
      return LOCAL_IMAGE_PREFIX + trimmed.slice('/src/assets/images/'.length);
    }
    try {
      var parsed = new URL(trimmed);
      if (parsed.protocol === 'https:') return parsed.toString();
    } catch (e) {
      return null;
    }
    return null;
  }

  function validateHexColor(hex, fallback) {
    var trimmed = (hex || '').trim();
    return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : fallback;
  }

  return {
    CATEGORIES: CATEGORIES,
    formatCurrency: formatCurrency,
    calculateCartSummary: calculateCartSummary,
    validateCheckoutInput: validateCheckoutInput,
    canFulfillOrderItems: canFulfillOrderItems,
    getNextAllowedStatuses: getNextAllowedStatuses,
    formatOrderStatusLabel: formatOrderStatusLabel,
    buildSalesReport: buildSalesReport,
    escapeCsvCell: escapeCsvCell,
    buildSalesCsv: buildSalesCsv,
    validateSafeImageUrl: validateSafeImageUrl,
    validateHexColor: validateHexColor,
  };
});

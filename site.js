/* Himalaya Navudhyan – shared behaviour for every page */
(function () {
  "use strict";

  /* ---------- Store details (edit here) ---------- */
  var STORE = {
    whatsapp: "917836058491",           // country code + number, no "+"
    email: "sghildiyal08@gmail.com"
  };

  /* ---------- Product catalogue (single source of truth) ---------- */
  var CATALOG = {
    "milky": {
      name: "Milky Mushroom", price: 1099, img: "images/milky.jpg", page: "milckymushroom.html",
      desc: "Firm, snow-white fresh mushrooms with a mild, naturally sweet flavour."
    },
    "dry-oyster": {
      name: "Dry Oyster Mushroom", price: 1199, img: "images/dry-oyster.jpg", page: "dryoyster.html",
      desc: "Sun-dried oyster mushroom with deep umami flavour for soups, curries and noodles."
    },
    "mixed-dry": {
      name: "Mixed Dry Mushroom", price: 1299, img: "images/mixed-dry.jpg", page: "mixeddrymushroom.html",
      desc: "A rich blend of dried mushrooms for stocks, gravies and stir-fries."
    },
    "pickle": {
      name: "Mushroom Pickle", price: 499, img: "images/pickle.jpg", page: "mushroompickle.html",
      desc: "Spicy, tangy mushroom pickle - a flavourful side for any meal."
    }
  };

  var KEY = "hn_cart_v2";
  var rupee = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Cart storage ---------- */
  function readCart() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY)) || [];
      return c.filter(function (i) { return CATALOG[i.id] && i.qty > 0; });
    } catch (e) { return []; }
  }
  function writeCart(c) {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* private mode */ }
    updateBadge();
  }
  function cartCount() { return readCart().reduce(function (n, i) { return n + i.qty; }, 0); }
  function cartTotal() { return readCart().reduce(function (n, i) { return n + i.qty * CATALOG[i.id].price; }, 0); }

  function updateBadge() {
    var n = cartCount();
    $$(".cart-count").forEach(function (el) {
      el.textContent = n > 99 ? "99+" : n;
      el.hidden = n === 0;
    });
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    void t.offsetWidth;
    t.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-show"); }, 2400);
  }

  function addToCart(id) {
    var c = readCart(), found = c.find(function (i) { return i.id === id; });
    if (found) found.qty += 1; else c.push({ id: id, qty: 1 });
    writeCart(c);
    toast("✓ " + CATALOG[id].name + " added to cart");
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add]");
    if (b) { e.preventDefault(); addToCart(b.getAttribute("data-add")); }
  });

  /* ---------- Mobile nav ---------- */
  var toggle = $(".nav-toggle"), nav = $(".site-nav");
  function closeNav() {
    if (!nav) return;
    nav.classList.remove("is-open"); toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open);
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".site-header")) closeNav();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 900) closeNav(); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: .12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add("is-in"); }); }

  /* ---------- Detail page: highlight active chip ---------- */
  var chips = $$(".chip");
  if (chips.length && "IntersectionObserver" in window) {
    var map = {};
    chips.forEach(function (c) { map[c.getAttribute("href").slice(1)] = c; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          chips.forEach(function (c) { c.classList.remove("is-active"); });
          var c = map[en.target.id];
          if (c) {
            c.classList.add("is-active");
            var bar = c.parentElement;
            bar.scrollTo({ left: c.offsetLeft - bar.clientWidth / 2 + c.clientWidth / 2, behavior: "smooth" });
          }
        }
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }

  /* ---------- Cart page ---------- */
  var cartList = $("#cart-items");
  if (cartList) {
    var summary = $("#cart-summary-box"), emptyBox = $("#cart-empty"), layout = $("#cart-layout");

    var renderCart = function () {
      var c = readCart();
      cartList.innerHTML = "";
      if (!c.length) { layout.hidden = true; emptyBox.hidden = false; return; }
      layout.hidden = false; emptyBox.hidden = true;

      c.forEach(function (i) {
        var p = CATALOG[i.id], li = document.createElement("article");
        li.className = "cart-item"; li.dataset.id = i.id;
        li.innerHTML =
          '<a href="' + p.page + '"><img src="' + p.img + '" alt="' + p.name + '" width="84" height="84"></a>' +
          '<div><h3>' + p.name + '</h3>' +
          '<p class="unit">' + rupee(p.price) + ' / Kg</p>' +
          '<div class="cart-item-foot">' +
          '<div class="qty" role="group" aria-label="Quantity in Kg for ' + p.name + '">' +
          '<button type="button" data-q="-1" aria-label="Decrease">−</button>' +
          '<output aria-live="polite">' + i.qty + '</output>' +
          '<button type="button" data-q="1" aria-label="Increase">+</button></div>' +
          '<span class="line-total">' + rupee(p.price * i.qty) + '</span>' +
          '<button type="button" class="remove-btn" data-remove>Remove</button>' +
          '</div></div>';
        cartList.appendChild(li);
      });
      $("#sum-items").textContent = cartCount() + (cartCount() === 1 ? " Kg" : " Kg");
      $("#sum-subtotal").textContent = rupee(cartTotal());
      $("#sum-total").textContent = rupee(cartTotal());
    };

    cartList.addEventListener("click", function (e) {
      var row = e.target.closest(".cart-item"); if (!row) return;
      var c = readCart(), it = c.find(function (i) { return i.id === row.dataset.id; });
      if (!it) return;
      var q = e.target.closest("[data-q]");
      if (q) { it.qty = Math.min(50, Math.max(1, it.qty + Number(q.dataset.q))); writeCart(c); renderCart(); }
      if (e.target.closest("[data-remove]")) {
        writeCart(c.filter(function (i) { return i !== it; })); renderCart();
        toast(CATALOG[it.id].name + " removed");
      }
    });

    /* Checkout: no payment server yet, so the order is sent to the seller on WhatsApp */
    var form = $("#delivery-form"), modal = $("#order-modal"), lastWa = "";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var c = readCart(); if (!c.length) return;
      var f = new FormData(form);
      var ref = "HN" + Date.now().toString().slice(-6);
      var lines = c.map(function (i) {
        var p = CATALOG[i.id];
        return "• " + p.name + " × " + i.qty + " Kg = " + rupee(p.price * i.qty);
      });
      var msg = "Hello Himalaya Navudhyan! I'd like to place an order (Ref " + ref + ").\n\n" +
        lines.join("\n") + "\n\nTotal: " + rupee(cartTotal()) + "\n\n" +
        "Name: " + f.get("name") + "\nPhone: " + f.get("phone") + "\nEmail: " + f.get("email") +
        "\nAddress: " + f.get("address") + ", " + f.get("city") + " – " + f.get("pincode");
      lastWa = "https://wa.me/" + STORE.whatsapp + "?text=" + encodeURIComponent(msg);
      $("#order-ref").textContent = ref;
      $("#order-wa").href = lastWa;
      modal.classList.add("is-open");
      $("#order-wa").focus();
    });
    $("#order-wa").addEventListener("click", function () {
      writeCart([]); form.reset();
      setTimeout(function () { modal.classList.remove("is-open"); renderCart(); }, 400);
    });
    $("#order-close").addEventListener("click", function () { modal.classList.remove("is-open"); });
    modal.addEventListener("click", function (e) { if (e.target === modal) modal.classList.remove("is-open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") modal.classList.remove("is-open"); });

    renderCart();
  }

  /* ---------- Contact form -> opens visitor's email app ---------- */
  var cf = $("#contact-form");
  if (cf) {
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!cf.reportValidity()) return;
      var f = new FormData(cf);
      var body = f.get("message") + "\n\n— " + f.get("name") + " (" + f.get("email") + ")";
      var note = $("#contact-note");
      note.hidden = false; note.className = "notice is-ok";
      note.textContent = "Opening your email app… if nothing opens, write to " + STORE.email + " or message us on WhatsApp.";
      window.location.href = "mailto:" + STORE.email + "?subject=" + encodeURIComponent("Website enquiry from " + f.get("name")) +
        "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- Login / sign-up (front-end only for now) ---------- */
  $$("[data-auth]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = $("#auth-note");
      var pw = f.querySelector("[name=password]"), cf2 = f.querySelector("[name=confirm]");
      if (cf2) {
        if (pw.value.length < 8) { cf2.setCustomValidity(""); pw.setCustomValidity("Use at least 8 characters."); pw.reportValidity(); pw.setCustomValidity(""); return; }
        if (pw.value !== cf2.value) { cf2.setCustomValidity("Passwords do not match."); cf2.reportValidity(); cf2.setCustomValidity(""); return; }
      }
      note.hidden = false; note.className = "notice";
      note.textContent = "Online accounts are coming soon. You don't need one — you can order as a guest from your cart.";
    });
  });
  $$(".pw-toggle").forEach(function (b) {
    b.addEventListener("click", function () {
      var input = b.parentElement.querySelector("input");
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      b.textContent = show ? "Hide" : "Show";
      b.setAttribute("aria-pressed", show);
    });
  });

  updateBadge();
  window.addEventListener("storage", updateBadge);
  window.addEventListener("pageshow", updateBadge);

  window.HN = { CATALOG: CATALOG, STORE: STORE };
})();

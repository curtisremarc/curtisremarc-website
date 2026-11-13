/* ------------------------------------------------------------------
   CurtisRemarc.com — static restoration layer
   Replaces the WordPress / Elementor Pro scripts the original page used:
   stretched sections, YouTube background video, sticky header, mobile
   menu, photo gallery + lightbox, testimonial carousel, booking form.
   ------------------------------------------------------------------ */

/* Booking form delivery.
   Leave empty to open the visitor's email app with the form filled in.
   To receive submissions without email apps (recommended), create a free
   form at https://formspree.io and paste its endpoint here, e.g.
   "https://formspree.io/f/abcdwxyz". */
var CR_FORM_ENDPOINT = "";
var CR_BOOKING_EMAIL = "curtis@curtisremarc.com";

(function () {
  "use strict";

  function settingsOf(el) {
    try { return JSON.parse(el.getAttribute("data-settings") || "{}"); } catch (e) { return {}; }
  }
  function device() {
    var w = window.innerWidth;
    return w >= 1025 ? "desktop" : w >= 768 ? "tablet" : "mobile";
  }
  function onResize(fn) {
    var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(fn, 60); });
  }

  /* ---------- Stretched sections (full browser width) ---------- */
  function stretch() {
    var w = document.documentElement.clientWidth;
    document.querySelectorAll(".elementor-section-stretched").forEach(function (s) {
      s.style.width = ""; s.style.left = "";
      var left = s.getBoundingClientRect().left + window.pageXOffset;
      s.style.width = w + "px";
      s.style.left = -left + "px";
    });
  }

  /* ---------- YouTube background video ---------- */
  var videos = [];
  function setupVideos() {
    document.querySelectorAll("[data-settings*='background_video_link']").forEach(function (sec) {
      var link = settingsOf(sec).background_video_link || "";
      var m = link.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      var box = sec.querySelector(":scope > .elementor-background-video-container");
      if (!m || !box) return;
      if (getComputedStyle(box).display === "none") return; // hidden on phones in the original design
      var id = m[1];
      var f = document.createElement("iframe");
      f.className = "elementor-background-video-embed";
      f.setAttribute("title", "Background video");
      f.setAttribute("tabindex", "-1");
      f.setAttribute("aria-hidden", "true");
      f.setAttribute("allow", "autoplay; encrypted-media");
      f.src = "https://www.youtube-nocookie.com/embed/" + id +
        "?autoplay=1&mute=1&controls=0&loop=1&playlist=" + id +
        "&playsinline=1&rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&fs=0";
      f.addEventListener("load", function () { setTimeout(function () { f.classList.add("cr-ready"); }, 600); });
      var old = box.querySelector(".elementor-background-video-embed");
      if (old) old.replaceWith(f); else box.appendChild(f);
      videos.push({ box: box, frame: f });
    });
    sizeVideos();
  }
  function sizeVideos() {
    videos.forEach(function (v) {
      var W = v.box.offsetWidth, H = v.box.offsetHeight, r = 16 / 9, w, h;
      if (W / H > r) { w = W; h = W / r; } else { h = H; w = H * r; }
      w = Math.ceil(w * 1.02); h = Math.ceil(h * 1.02);           // hide YouTube edge letterboxing
      v.frame.style.width = w + "px"; v.frame.style.height = h + "px";
      v.frame.style.left = (W - w) / 2 + "px"; v.frame.style.top = (H - h) / 2 + "px";
    });
  }

  /* ---------- Sticky header widgets ---------- */
  var stickies = [];
  function setupSticky() {
    document.querySelectorAll("[data-settings*='\"sticky\":\"top\"']").forEach(function (el) {
      var s = settingsOf(el);
      var spacer = document.createElement("div");
      spacer.className = "cr-sticky-spacer";
      spacer.style.display = "none";
      el.parentNode.insertBefore(spacer, el);
      stickies.push({ el: el, on: s.sticky_on || ["desktop", "tablet", "mobile"], spacer: spacer });
    });
    updateSticky();
    window.addEventListener("scroll", updateSticky, { passive: true });
  }
  function release(o) {
    o.el.classList.remove("cr-sticky-active", "elementor-sticky--active", "elementor-sticky--effects");
    o.el.style.width = ""; o.el.style.left = "";
    o.spacer.style.display = "none";
  }
  function updateSticky(forceMeasure) {
    var dev = device();
    stickies.forEach(function (o) {
      if (o.on.indexOf(dev) === -1) { release(o); return; }
      var active = o.el.classList.contains("cr-sticky-active");
      var ref = active ? o.spacer : o.el;
      var r = ref.getBoundingClientRect();
      if (!active && r.top <= 0) {
        o.spacer.style.height = o.el.offsetHeight + "px";
        o.spacer.style.width = o.el.offsetWidth + "px";
        o.spacer.style.display = "block";
        o.el.style.width = r.width + "px";
        o.el.style.left = r.left + "px";
        o.el.classList.add("cr-sticky-active", "elementor-sticky--active", "elementor-sticky--effects");
      } else if (active && r.top > 0) {
        release(o);
      } else if (active && forceMeasure === true) {
        o.el.style.width = r.width + "px"; o.el.style.left = r.left + "px";
      }
    });
  }

  /* ---------- Mobile (burger) menu ---------- */
  function setupMenu() {
    document.querySelectorAll(".elementor-widget-nav-menu").forEach(function (w) {
      var toggle = w.querySelector(".elementor-menu-toggle");
      var drop = w.querySelector(".elementor-nav-menu--dropdown");
      if (!toggle || !drop) return;
      var stretchMenu = settingsOf(w).full_width === "stretch";
      function place() {
        if (!stretchMenu) return;
        drop.style.width = document.documentElement.clientWidth + "px";
        drop.style.left = -(w.getBoundingClientRect().left) + "px";
      }
      function set(open) {
        toggle.classList.toggle("elementor-active", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        drop.setAttribute("aria-hidden", open ? "false" : "true");
        drop.querySelectorAll("a").forEach(function (a) { a.tabIndex = open ? 0 : -1; });
        if (open) place();
      }
      toggle.addEventListener("click", function () { set(!toggle.classList.contains("elementor-active")); });
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle.click(); }
      });
      drop.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
      onResize(function () { if (toggle.classList.contains("elementor-active")) place(); });
    });
  }

  /* ---------- Gallery + lightbox ---------- */
  function setupGallery() {
    document.querySelectorAll(".elementor-gallery__container").forEach(function (g) {
      g.classList.add("cr-gallery");
      var widget = g.closest(".elementor-widget-gallery");
      var items = Array.prototype.slice.call(g.querySelectorAll(".e-gallery-item"));
      var pending = items.length;
      function done() {
        if (--pending === 0 && !g.querySelector(".e-gallery-item") && widget) widget.style.display = "none";
      }
      items.forEach(function (a) {
        var div = a.querySelector(".e-gallery-image");
        var src = div && div.getAttribute("data-thumbnail");
        if (!src) { a.remove(); done(); return; }
        var img = new Image();
        img.onload = function () { div.style.backgroundImage = "url('" + src + "')"; done(); };
        img.onerror = function () { a.remove(); done(); };   // photo not restored yet: hide the tile
        img.src = src;
      });
    });

    var lb, lbImg, list = [], idx = 0;
    function build() {
      lb = document.createElement("div");
      lb.className = "cr-lightbox";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.setAttribute("aria-label", "Photo viewer");
      lb.innerHTML = '<button class="cr-lb-close" aria-label="Close">&times;</button>' +
        '<button class="cr-lb-prev" aria-label="Previous photo">&#8249;</button>' +
        '<img alt=""><button class="cr-lb-next" aria-label="Next photo">&#8250;</button>';
      document.body.appendChild(lb);
      lbImg = lb.querySelector("img");
      lb.querySelector(".cr-lb-close").onclick = close;
      lb.querySelector(".cr-lb-prev").onclick = function () { show(idx - 1); };
      lb.querySelector(".cr-lb-next").onclick = function () { show(idx + 1); };
      lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
      document.addEventListener("keydown", function (e) {
        if (!lb.classList.contains("open")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(idx - 1);
        if (e.key === "ArrowRight") show(idx + 1);
      });
    }
    function show(i) { idx = (i + list.length) % list.length; lbImg.src = list[idx]; }
    function close() { lb.classList.remove("open"); document.body.style.overflow = ""; }
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-elementor-open-lightbox='yes']");
      if (!a) return;
      e.preventDefault();
      if (!lb) build();
      var group = a.getAttribute("data-elementor-lightbox-slideshow");
      list = Array.prototype.map.call(
        document.querySelectorAll("a[data-elementor-lightbox-slideshow='" + group + "']"),
        function (x) { return x.getAttribute("href"); });
      show(list.indexOf(a.getAttribute("href")));
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      lb.querySelector(".cr-lb-close").focus();
    });
  }

  /* ---------- Testimonial carousel ---------- */
  function setupSlider() {
    document.querySelectorAll(".elementor-widget-reviews, .elementor-widget-testimonial-carousel").forEach(function (w) {
      var s = settingsOf(w);
      var box = w.querySelector(".elementor-main-swiper");
      var track = box && box.querySelector(".swiper-wrapper");
      if (!track) return;
      var slides = track.querySelectorAll(".swiper-slide");
      var n = slides.length, i = 0, timer = null;
      box.classList.add("cr-slider");
      var pag = w.querySelector(".swiper-pagination");
      var bullets = [];
      if (pag) {
        pag.innerHTML = "";
        for (var k = 0; k < n; k++) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "swiper-pagination-bullet";
          b.setAttribute("aria-label", "Go to testimonial " + (k + 1));
          b.addEventListener("click", (function (k) { return function () { go(k); restart(); }; })(k));
          pag.appendChild(b); bullets.push(b);
        }
        if (pag.parentNode !== box) box.appendChild(pag);
      }
      function go(k) {
        i = (k + n) % n;
        track.style.transform = "translateX(" + (-100 * i) + "%)";
        bullets.forEach(function (b, j) { b.classList.toggle("swiper-pagination-bullet-active", j === i); });
        slides.forEach(function (sl, j) { sl.setAttribute("aria-hidden", j === i ? "false" : "true"); });
      }
      function restart() {
        clearInterval(timer);
        if (s.autoplay === "yes" && !matchMedia("(prefers-reduced-motion: reduce)").matches)
          timer = setInterval(function () { go(i + 1); }, +s.autoplay_speed || 5000);
      }
      var prev = w.querySelector(".elementor-swiper-button-prev");
      var next = w.querySelector(".elementor-swiper-button-next");
      [prev, next].forEach(function (btn, j) {
        if (!btn) return;
        btn.setAttribute("role", "button"); btn.setAttribute("tabindex", "0");
        function act() { go(i + (j ? 1 : -1)); restart(); }
        btn.addEventListener("click", act);
        btn.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
      });
      if (s.pause_on_hover === "yes") {
        w.addEventListener("mouseenter", function () { clearInterval(timer); });
        w.addEventListener("mouseleave", restart);
      }
      // swipe on touch screens
      var x0 = null;
      box.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      box.addEventListener("touchend", function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); }
      });
      go(0); restart();
    });
  }

  /* ---------- Booking form ---------- */
  function setupForm() {
    document.querySelectorAll("form[data-cr-form]").forEach(function (form) {
      var msg = document.createElement("div");
      msg.className = "cr-form-msg";
      msg.setAttribute("role", "status");
      form.appendChild(msg);
      var select = form.querySelector("select");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        msg.className = "cr-form-msg"; msg.textContent = "";
        if (select && select.selectedIndex === 0) {
          msg.className = "cr-form-msg err"; msg.textContent = "Please select the type of event."; select.focus(); return;
        }
        var get = function (name) { var f = form.querySelector("[name='form_fields[" + name + "]']"); return f ? f.value.trim() : ""; };
        var data = {
          name: get("name"), phone: get("field_fc12970"), email: get("email"),
          event_type: get("field_37919d6"), message: get("message")
        };
        if (CR_FORM_ENDPOINT) {
          var btn = form.querySelector("button[type=submit]");
          btn.disabled = true;
          fetch(CR_FORM_ENDPOINT, {
            method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" },
            body: JSON.stringify(Object.assign({ _subject: "Booking inquiry: " + data.event_type }, data))
          }).then(function (r) {
            if (!r.ok) throw new Error();
            form.reset();
            msg.className = "cr-form-msg ok"; msg.textContent = "Thanks! Your message was sent. Curtis will be in touch soon.";
          }).catch(function () {
            msg.className = "cr-form-msg err";
            msg.textContent = "Sorry, something went wrong. Please email " + CR_BOOKING_EMAIL + " directly.";
          }).then(function () { btn.disabled = false; });
          return;
        }
        var body = "Name: " + data.name + "\nPhone: " + data.phone + "\nEmail: " + data.email +
          "\nEvent type: " + data.event_type + "\n\n" + data.message;
        window.location.href = "mailto:" + CR_BOOKING_EMAIL +
          "?subject=" + encodeURIComponent("Booking inquiry: " + data.event_type) +
          "&body=" + encodeURIComponent(body);
        msg.className = "cr-form-msg ok";
        msg.textContent = "Your email app should open with your message ready to send. If it doesn't, email " + CR_BOOKING_EMAIL + ".";
      });
    });
  }

  function init() {
    stretch();
    setupVideos();
    setupSticky();
    setupMenu();
    setupGallery();
    setupSlider();
    setupForm();
    onResize(function () { stretch(); sizeVideos(); updateSticky(true); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

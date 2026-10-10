/* 8x.life redesign — clocks (with the ×8 easter egg), collage settle, video lightbox. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- clocks ---------- */

  var clocks = Array.prototype.slice.call(document.querySelectorAll(".clock"));
  var offset = 0;   // ms added to the real clock (accumulates while accelerated)
  var speed = 1;    // 1 → ×8 after "8" is pressed
  var lastTick = performance.now();

  function tick() {
    var now = performance.now();
    var dt = now - lastTick;
    lastTick = now;
    if (speed !== 1 && !document.hidden) offset += dt * (speed - 1);
    var virtual = new Date(Date.now() + offset);
    clocks.forEach(function (el) {
      var tz = el.getAttribute("data-tz");
      var time = el.querySelector(".time");
      if (!tz || !time) return;
      var hh = "--", mm = "--";
      try {
        var parts = new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz,
        }).formatToParts(virtual);
        parts.forEach(function (p) {
          if (p.type === "hour") hh = p.value;
          if (p.type === "minute") mm = p.value;
        });
      } catch (e) {
        hh = String(virtual.getHours()).padStart(2, "0");
        mm = String(virtual.getMinutes()).padStart(2, "0");
      }
      time.textContent = hh + ":" + mm;
      time.classList.toggle("x8", speed !== 1);
    });
  }
  setInterval(tick, 500);
  tick();

  document.addEventListener("keydown", function (e) {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === "8") {
      speed = 8;
      tick();
    } else if (e.key === "r" || e.key === "R") {
      speed = 1;
      offset = 0;
      tick();
    }
  });

  /* ---------- collage: scatter, settle once, straighten on hover ---------- */

  var collage = document.getElementById("collage");
  if (collage) {
    var figs = Array.prototype.slice.call(collage.querySelectorAll("figure"));
    var tilts = [-7, 5, -3, 8, -6, 4, -9, 6];
    var dys = [10, 26, -6, 18, 34, 2, 22, 12];
    figs.forEach(function (f, i) {
      f.style.setProperty("--tilt", tilts[i % tilts.length] + "deg");
      f.style.setProperty("--dy", dys[i % dys.length] + "px");
      if (!reduceMotion) {
        f.addEventListener("animationend", function onlyOnce() {
          f.removeEventListener("animationend", onlyOnce);
          f.classList.add("settled");
        });
        f.classList.add("settling");
      }
    });
  }

  /* ---------- lightbox video ---------- */

  var lb = document.getElementById("lb");
  var lbVideo = document.getElementById("lb-video");
  var lbX = document.getElementById("lb-x");
  var lastFocus = null;

  function openVideo(src) {
    if (!lb || !lbVideo) return;
    lastFocus = document.activeElement;
    lbVideo.src = src;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lbVideo.play().catch(function () {});
    lbX.focus();
  }
  function closeVideo() {
    if (!lb) return;
    lbVideo.pause();
    lbVideo.removeAttribute("src");
    if (lbVideo.load) lbVideo.load();
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-video]"), function (el) {
    if (el.tagName === "FIGURE") {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openVideo(el.getAttribute("data-video"));
        }
      });
    }
    el.addEventListener("click", function () {
      openVideo(el.getAttribute("data-video"));
    });
  });

  if (lbX) lbX.addEventListener("click", closeVideo);
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeVideo(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lb && !lb.hidden) closeVideo();
  });
})();
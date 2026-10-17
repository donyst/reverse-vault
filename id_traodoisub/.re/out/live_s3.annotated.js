/**
 * ============================================================================
 *  id.traodoisub.com — script UI (inline <script> #3, 39.397 B)
 * ============================================================================
 *  Vai trò: form "Lấy ID Facebook" — validate link, gọi hàm challenge ở script
 *           #2 (window["_0x9f2c"]), hiển thị UID + nút copy.
 *           KHÔNG chứa logic bảo mật, KHÔNG có token/session.
 *  Nguồn  : .re/out/live_s3.js (tách nguyên văn từ trang chủ)
 *  Deobf  : webcrack (bỏ string array + số hex) rồi đổi tên theo ngữ nghĩa.
 *           Bản này KHÔNG đổi hành vi.
 * ============================================================================
 */
(function () {
  "use strict";

  // Tên hàm mà script #2 gắn vào global: window["_0x9f2c"](link)
  var EXPORT_NAME = String.fromCharCode(95, 48, 120, 57, 102, 50, 99);

  function byId(id) { return document.getElementById(id); }

  function nowMs() {
    if (typeof performance !== "undefined" && performance.now) return performance.now();
    return Date.now();
  }

  // --- nav: thêm class "scrolled" khi cuộn quá 12px ------------------------
  var navEl = byId("nav");
  if (navEl) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 12) navEl.classList.add("scrolled");
      else navEl.classList.remove("scrolled");
    });
  }

  // --- FAQ accordion: mở 1 mục, đóng các mục còn lại -----------------------
  var faqItems = document.querySelectorAll("[data-faq]");
  Array.prototype.forEach.call(faqItems, function (item) {
    item.addEventListener("click", function () {
      var wasOpen = item.classList.contains("open");
      Array.prototype.forEach.call(faqItems, function (other) {
        other.classList.remove("open");
      });
      if (!wasOpen) item.classList.add("open");
    });
  });

  // --- các phần tử của form ------------------------------------------------
  var linkInput       = byId("link");
  var form            = byId("extractForm");
  var submitBtn       = byId("submitBtn");
  var btnText         = byId("btnText");
  var btnIcon         = byId("btnIcon");
  var helper          = byId("helper");
  var serverError     = byId("serverError");
  var serverErrorText = byId("serverErrorText");
  var resultArea      = byId("resultArea");
  var resultUid       = byId("resultUid");
  var resultType      = byId("resultType");
  var resultTime      = byId("resultTime");
  var copyBtn         = byId("copyBtn");
  var toast           = byId("toast");

  var lastUid = "";

  // --- trạng thái nút submit ----------------------------------------------
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      btnText.textContent = "Đang xử lý";
      btnIcon.className = "spinner";
      btnIcon.textContent = "";
    } else {
      btnText.textContent = "Lấy ID ngay";
      btnIcon.className = "arrow";
      btnIcon.textContent = "→";
    }
  }

  // --- reset lỗi + helper text --------------------------------------------
  function clearErrors() {
    serverError.style.display = "none";
    serverErrorText.textContent = "";
    linkInput.classList.remove("error");
    helper.className = "helper-text";
    helper.innerHTML = "<span>💡 Hỗ trợ profile, group, fanpage, post, video, ảnh và share link.</span>";
  }

  function showInputError(msg) {
    linkInput.classList.add("error");
    helper.className = "helper-text error";
    helper.textContent = "⚠ " + msg;
  }

  function showServerError(msg) {
    serverError.style.display = "flex";
    serverErrorText.textContent = msg;
  }

  // --- nút copy ------------------------------------------------------------
  function resetCopyBtn() {
    copyBtn.classList.remove("copied");
    copyBtn.innerHTML = "<span>📋 Copy</span>";
  }

  function showResult(uid, type, elapsedMs) {
    lastUid = uid;
    resultUid.textContent = uid;
    resultType.textContent = type;
    resultTime.textContent = "xử lý trong " + elapsedMs + "ms";
    resetCopyBtn();
    resultArea.style.display = "block";
  }

  // --- phân loại link Facebook theo path ----------------------------------
  function detectLinkType(url) {
    var u = url.toLowerCase();
    if (u.indexOf("/posts/") >= 0 || u.indexOf("/permalink") >= 0 ||
        u.indexOf("story_fbid") >= 0 || u.indexOf("multi_permalinks") >= 0) return "post";
    if (u.indexOf("/groups/") >= 0) return "group";
    if (u.indexOf("/photo") >= 0) return "photo";
    if (u.indexOf("/videos/") >= 0 || u.indexOf("/watch") >= 0) return "video";
    return "profile";
  }

  // --- submit: validate -> gọi script #2 -> hiện kết quả -------------------
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    clearErrors();
    resultArea.style.display = "none";

    var link = (linkInput.value || "").trim();
    if (!link) {
      showInputError("Vui lòng nhập link Facebook");
      return;
    }
    if (!/(facebook\.com|fb\.watch)/i.test(link)) {
      showInputError("Link không hợp lệ. Vui lòng nhập link Facebook (facebook.com / fb.watch).");
      return;
    }

    setLoading(true);
    var t0 = nowMs();
    Promise.resolve()
      .then(function () {
        var solve = window[EXPORT_NAME];
        if (typeof solve !== "function") throw new Error("x0"); // script #2 chưa load
        return solve(link);
      })
      .then(function (res) {
        var elapsed = Math.round(nowMs() - t0);
        if (res && res.success) {
          showResult(res.id, detectLinkType(link), elapsed);
        } else {
          showServerError(
            res && res.error
              ? res.error + (res.countdown ? " (" + res.countdown + "s)" : "")
              : "Có lỗi xảy ra, vui lòng thử lại."
          );
        }
      })
      .catch(function () {
        showServerError("Không kết nối được tới máy chủ. Vui lòng thử lại sau.");
      })
      .then(function () {
        setLoading(false);
      });
  });

  // --- copy UID vào clipboard (có fallback cho context không secure) -------
  function copyUid() {
    if (!lastUid) return;
    var uid = lastUid;

    function onCopySuccess() {
      copyBtn.classList.add("copied");
      copyBtn.innerHTML = "<span>✓ Đã copy</span>";
      toast.style.display = "flex";
      setTimeout(function () {
        copyBtn.classList.remove("copied");
        copyBtn.innerHTML = "<span>📋 Copy</span>";
      }, 2000);
      setTimeout(function () { toast.style.display = "none"; }, 2200);
    }

    function fallbackCopy() {
      var ta = document.createElement("textarea");
      ta.value = uid;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        onCopySuccess();
      } catch (e) {}
      document.body.removeChild(ta);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(uid).then(onCopySuccess, fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  resultArea.addEventListener("click", copyUid);
  copyBtn.addEventListener("click", function (ev) {
    ev.stopPropagation();
    copyUid();
  });

  setLoading(false);
})();

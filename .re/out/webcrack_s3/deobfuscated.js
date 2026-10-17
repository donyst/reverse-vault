(function () {
  'use strict';

  var _0x951e76 = String.fromCharCode(95, 48, 120, 57, 102, 50, 99);
  function _0x2158a4(_0x420bb0) {
    return document.getElementById(_0x420bb0);
  }
  function _0x5b70d9() {
    if (typeof performance !== "undefined" && performance.now) {
      return performance.now();
    } else {
      return Date.now();
    }
  }
  var _0x56b148 = _0x2158a4("nav");
  if (_0x56b148) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 12) {
        _0x56b148.classList.add("scrolled");
      } else {
        _0x56b148.classList.remove("scrolled");
      }
    });
  }
  var _0x340dad = document.querySelectorAll("[data-faq]");
  Array.prototype.forEach.call(_0x340dad, function (_0x24b230) {
    _0x24b230.addEventListener("click", function () {
      var _0x2586c7 = _0x24b230.classList.contains("open");
      Array.prototype.forEach.call(_0x340dad, function (_0x11aa32) {
        _0x11aa32.classList.remove("open");
      });
      if (!_0x2586c7) {
        _0x24b230.classList.add("open");
      }
    });
  });
  var _0x55edc3 = _0x2158a4("link");
  var _0xef2123 = _0x2158a4("extractForm");
  var _0x38532e = _0x2158a4("submitBtn");
  var _0x1b46c5 = _0x2158a4("btnText");
  var _0x510de0 = _0x2158a4("btnIcon");
  var _0x30658d = _0x2158a4("helper");
  var _0x32ddef = _0x2158a4("serverError");
  var _0x5e8653 = _0x2158a4("serverErrorText");
  var _0x2ba9f5 = _0x2158a4("resultArea");
  var _0x11cd93 = _0x2158a4("resultUid");
  var _0x25a220 = _0x2158a4("resultType");
  var _0x2e8405 = _0x2158a4("resultTime");
  var _0x44bf5d = _0x2158a4("copyBtn");
  var _0x5f8f77 = _0x2158a4("toast");
  var _0x1842b4 = "";
  function _0x4ddd59(_0x37d14d) {
    _0x38532e.disabled = _0x37d14d;
    if (_0x37d14d) {
      _0x1b46c5.textContent = "Đang xử lý";
      _0x510de0.className = "spinner";
      _0x510de0.textContent = "";
    } else {
      _0x1b46c5.textContent = "Lấy ID ngay";
      _0x510de0.className = "arrow";
      _0x510de0.textContent = "→";
    }
  }
  function _0x1ff394() {
    _0x32ddef.style.display = "none";
    _0x5e8653.textContent = "";
    _0x55edc3.classList.remove("error");
    _0x30658d.className = "helper-text";
    _0x30658d.innerHTML = "<span>💡 Hỗ trợ profile, group, fanpage, post, video, ảnh và share link.</span>";
  }
  function _0x5ddbb1(_0x22210d) {
    _0x55edc3.classList.add("error");
    _0x30658d.className = "helper-text error";
    _0x30658d.textContent = "⚠ " + _0x22210d;
  }
  function _0x1ceb81(_0xd5b20d) {
    _0x32ddef.style.display = "flex";
    _0x5e8653.textContent = _0xd5b20d;
  }
  function _0x491951() {
    _0x44bf5d.classList.remove("copied");
    _0x44bf5d.innerHTML = "<span>📋 Copy</span>";
  }
  function _0x9c545d(_0x1ade6d, _0x1807c0, _0x4fda16) {
    _0x1842b4 = _0x1ade6d;
    _0x11cd93.textContent = _0x1ade6d;
    _0x25a220.textContent = _0x1807c0;
    _0x2e8405.textContent = "xử lý trong " + _0x4fda16 + "ms";
    _0x491951();
    _0x2ba9f5.style.display = "block";
  }
  function _0xa75a8e(_0x498904) {
    var _0xf2ee6a = _0x498904.toLowerCase();
    if (_0xf2ee6a.indexOf("/posts/") >= 0 || _0xf2ee6a.indexOf("/permalink") >= 0 || _0xf2ee6a.indexOf("story_fbid") >= 0 || _0xf2ee6a.indexOf("multi_permalinks") >= 0) {
      return "post";
    }
    if (_0xf2ee6a.indexOf("/groups/") >= 0) {
      return "group";
    }
    if (_0xf2ee6a.indexOf("/photo") >= 0) {
      return "photo";
    }
    if (_0xf2ee6a.indexOf("/videos/") >= 0 || _0xf2ee6a.indexOf("/watch") >= 0) {
      return "video";
    }
    return "profile";
  }
  _0xef2123.addEventListener("submit", function (_0x8c6a20) {
    _0x8c6a20.preventDefault();
    _0x1ff394();
    _0x2ba9f5.style.display = "none";
    var _0xfa305a = (_0x55edc3.value || "").trim();
    if (!_0xfa305a) {
      _0x5ddbb1("Vui lòng nhập link Facebook");
      return;
    }
    if (!/(facebook\.com|fb\.watch)/i.test(_0xfa305a)) {
      _0x5ddbb1("Link không hợp lệ. Vui lòng nhập link Facebook (facebook.com / fb.watch).");
      return;
    }
    _0x4ddd59(true);
    var _0x43edf1 = _0x5b70d9();
    Promise.resolve().then(function () {
      var _0x19c07e = window[_0x951e76];
      if (typeof _0x19c07e !== "function") {
        throw new Error("x0");
      }
      return _0x19c07e(_0xfa305a);
    }).then(function (_0x1d93ab) {
      var _0x24e504 = Math.round(_0x5b70d9() - _0x43edf1);
      if (_0x1d93ab && _0x1d93ab.success) {
        _0x9c545d(_0x1d93ab.id, _0xa75a8e(_0xfa305a), _0x24e504);
      } else {
        _0x1ceb81(_0x1d93ab && _0x1d93ab.error ? _0x1d93ab.error + (_0x1d93ab.countdown ? " (" + _0x1d93ab.countdown + "s)" : "") : "Có lỗi xảy ra, vui lòng thử lại.");
      }
    }).catch(function () {
      _0x1ceb81("Không kết nối được tới máy chủ. Vui lòng thử lại sau.");
    }).then(function () {
      _0x4ddd59(false);
    });
  });
  function _0xe201f4() {
    if (!_0x1842b4) {
      return;
    }
    var _0x19fd30 = _0x1842b4;
    function _0x4b28dd() {
      _0x44bf5d.classList.add("copied");
      _0x44bf5d.innerHTML = "<span>✓ Đã copy</span>";
      _0x5f8f77.style.display = "flex";
      setTimeout(function () {
        _0x44bf5d.classList.remove("copied");
        _0x44bf5d.innerHTML = "<span>📋 Copy</span>";
      }, 2000);
      setTimeout(function () {
        _0x5f8f77.style.display = "none";
      }, 2200);
    }
    function _0x3de0c7() {
      var _0x10deeb = document.createElement("textarea");
      _0x10deeb.value = _0x19fd30;
      _0x10deeb.style.position = "fixed";
      _0x10deeb.style.opacity = "0";
      document.body.appendChild(_0x10deeb);
      _0x10deeb.select();
      try {
        document.execCommand("copy");
        _0x4b28dd();
      } catch (_0x4745ed) {}
      document.body.removeChild(_0x10deeb);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(_0x19fd30).then(_0x4b28dd, _0x3de0c7);
    } else {
      _0x3de0c7();
    }
  }
  _0x2ba9f5.addEventListener("click", _0xe201f4);
  _0x44bf5d.addEventListener("click", function (_0x4f2125) {
    _0x4f2125.stopPropagation();
    _0xe201f4();
  });
  _0x4ddd59(false);
})();
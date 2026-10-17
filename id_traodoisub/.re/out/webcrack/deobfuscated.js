(function (_0xf783a5, _0xb04ae1) {
  if (typeof module === "object" && module.exports) {
    module.exports = _0xb04ae1();
  } else {
    _0xb04ae1(_0xf783a5);
  }
})(typeof self !== "undefined" ? self : this, function (_0x4258ba) {
  'use strict';

  function _0x5c4ffe() {
    if (_0x4258ba && _0x4258ba.__o) {
      return _0x4258ba.__o;
    } else {
      return null;
    }
  }
  function _0x362f54(_0x3e6eee) {
    _OV = _0x3e6eee;
  }
  function _0x190235(_0x5af4e9, _0x542708) {
    return _0x5af4e9 >>> _0x542708 | _0x5af4e9 << 32 - _0x542708;
  }
  var _0x57c949 = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];
  function _0x3df78e(_0x4f0dd1) {
    var _0x3c8adc = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];
    var _0x29cd02 = _0x4f0dd1.length;
    var _0x1141c3 = _0x29cd02 * 8;
    var _0x52faa4 = _0x29cd02 + 1;
    var _0x3d11f8 = (56 - _0x52faa4 % 64 + 64) % 64;
    var _0x238033 = _0x52faa4 + _0x3d11f8 + 8;
    var _0x54ce10 = new Uint8Array(_0x238033);
    _0x54ce10.set(_0x4f0dd1, 0);
    _0x54ce10[_0x29cd02] = 128;
    var _0x53f5b8 = new DataView(_0x54ce10.buffer);
    _0x53f5b8.setUint32(_0x238033 - 8, Math.floor(_0x1141c3 / 4294967296));
    _0x53f5b8.setUint32(_0x238033 - 4, _0x1141c3 >>> 0);
    var _0x1086c6 = new Uint32Array(64);
    var _0x46ed8d;
    var _0x2ae705;
    for (_0x2ae705 = 0; _0x2ae705 < _0x238033; _0x2ae705 += 64) {
      for (_0x46ed8d = 0; _0x46ed8d < 16; _0x46ed8d++) {
        _0x1086c6[_0x46ed8d] = _0x53f5b8.getUint32(_0x2ae705 + _0x46ed8d * 4);
      }
      for (_0x46ed8d = 16; _0x46ed8d < 64; _0x46ed8d++) {
        var _0x406328 = _0x190235(_0x1086c6[_0x46ed8d - 15], 7) ^ _0x190235(_0x1086c6[_0x46ed8d - 15], 18) ^ _0x1086c6[_0x46ed8d - 15] >>> 3;
        var _0x1d6773 = _0x190235(_0x1086c6[_0x46ed8d - 2], 17) ^ _0x190235(_0x1086c6[_0x46ed8d - 2], 19) ^ _0x1086c6[_0x46ed8d - 2] >>> 10;
        _0x1086c6[_0x46ed8d] = _0x1086c6[_0x46ed8d - 16] + _0x406328 + _0x1086c6[_0x46ed8d - 7] + _0x1d6773 >>> 0;
      }
      var _0x14ff60 = _0x3c8adc[0];
      var _0x456320 = _0x3c8adc[1];
      var _0x56e3b7 = _0x3c8adc[2];
      var _0x192cc5 = _0x3c8adc[3];
      var _0x5c2854 = _0x3c8adc[4];
      var _0x3200b0 = _0x3c8adc[5];
      var _0x401c84 = _0x3c8adc[6];
      var _0xaab677 = _0x3c8adc[7];
      for (_0x46ed8d = 0; _0x46ed8d < 64; _0x46ed8d++) {
        var _0x5f3947 = _0x190235(_0x5c2854, 6) ^ _0x190235(_0x5c2854, 11) ^ _0x190235(_0x5c2854, 25);
        var _0x1a068e = _0x5c2854 & _0x3200b0 ^ ~_0x5c2854 & _0x401c84;
        var _0x1a9acf = _0xaab677 + _0x5f3947 + _0x1a068e + _0x57c949[_0x46ed8d] + _0x1086c6[_0x46ed8d] >>> 0;
        var _0x44fc53 = _0x190235(_0x14ff60, 2) ^ _0x190235(_0x14ff60, 13) ^ _0x190235(_0x14ff60, 22);
        var _0x2e2d67 = _0x14ff60 & _0x456320 ^ _0x14ff60 & _0x56e3b7 ^ _0x456320 & _0x56e3b7;
        var _0x19ade3 = _0x44fc53 + _0x2e2d67 >>> 0;
        _0xaab677 = _0x401c84;
        _0x401c84 = _0x3200b0;
        _0x3200b0 = _0x5c2854;
        _0x5c2854 = _0x192cc5 + _0x1a9acf >>> 0;
        _0x192cc5 = _0x56e3b7;
        _0x56e3b7 = _0x456320;
        _0x456320 = _0x14ff60;
        _0x14ff60 = _0x1a9acf + _0x19ade3 >>> 0;
      }
      _0x3c8adc[0] = _0x3c8adc[0] + _0x14ff60 >>> 0;
      _0x3c8adc[1] = _0x3c8adc[1] + _0x456320 >>> 0;
      _0x3c8adc[2] = _0x3c8adc[2] + _0x56e3b7 >>> 0;
      _0x3c8adc[3] = _0x3c8adc[3] + _0x192cc5 >>> 0;
      _0x3c8adc[4] = _0x3c8adc[4] + _0x5c2854 >>> 0;
      _0x3c8adc[5] = _0x3c8adc[5] + _0x3200b0 >>> 0;
      _0x3c8adc[6] = _0x3c8adc[6] + _0x401c84 >>> 0;
      _0x3c8adc[7] = _0x3c8adc[7] + _0xaab677 >>> 0;
    }
    var _0x18fcc1 = new Uint8Array(32);
    var _0x4bce06 = new DataView(_0x18fcc1.buffer);
    for (_0x46ed8d = 0; _0x46ed8d < 8; _0x46ed8d++) {
      _0x4bce06.setUint32(_0x46ed8d * 4, _0x3c8adc[_0x46ed8d]);
    }
    return _0x18fcc1;
  }
  function _0x53db08(_0x494a67, _0x573c3b) {
    if (_0x494a67.length > 64) {
      _0x494a67 = _0x3df78e(_0x494a67);
    }
    var _0x4d72a6 = new Uint8Array(64);
    _0x4d72a6.set(_0x494a67, 0);
    var _0x271d2f = new Uint8Array(64 + _0x573c3b.length);
    var _0x50ce03 = new Uint8Array(96);
    var _0x40be4b;
    for (_0x40be4b = 0; _0x40be4b < 64; _0x40be4b++) {
      _0x271d2f[_0x40be4b] = _0x4d72a6[_0x40be4b] ^ 54;
      _0x50ce03[_0x40be4b] = _0x4d72a6[_0x40be4b] ^ 92;
    }
    _0x271d2f.set(_0x573c3b, 64);
    _0x50ce03.set(_0x3df78e(_0x271d2f), 64);
    return _0x3df78e(_0x50ce03);
  }
  function _0x132dad(_0x230d01, _0xd33a6a) {
    var _0x3bd143 = new Uint8Array(256);
    var _0x37ce28;
    var _0xea117c = 0;
    var _0xa38f14;
    for (_0x37ce28 = 0; _0x37ce28 < 256; _0x37ce28++) {
      _0x3bd143[_0x37ce28] = _0x37ce28;
    }
    for (_0x37ce28 = 0; _0x37ce28 < 256; _0x37ce28++) {
      _0xea117c = _0xea117c + _0x3bd143[_0x37ce28] + _0x230d01[_0x37ce28 % _0x230d01.length] & 255;
      _0xa38f14 = _0x3bd143[_0x37ce28];
      _0x3bd143[_0x37ce28] = _0x3bd143[_0xea117c];
      _0x3bd143[_0xea117c] = _0xa38f14;
    }
    var _0xe9a063 = new Uint8Array(_0xd33a6a.length);
    var _0x29acd5;
    _0x37ce28 = 0;
    _0xea117c = 0;
    for (_0x29acd5 = 0; _0x29acd5 < _0xd33a6a.length; _0x29acd5++) {
      _0x37ce28 = _0x37ce28 + 1 & 255;
      _0xea117c = _0xea117c + _0x3bd143[_0x37ce28] & 255;
      _0xa38f14 = _0x3bd143[_0x37ce28];
      _0x3bd143[_0x37ce28] = _0x3bd143[_0xea117c];
      _0x3bd143[_0xea117c] = _0xa38f14;
      _0xe9a063[_0x29acd5] = _0xd33a6a[_0x29acd5] ^ _0x3bd143[_0x3bd143[_0x37ce28] + _0x3bd143[_0xea117c] & 255];
    }
    return _0xe9a063;
  }
  var _0x284e05 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  var _0x5373fd = null;
  function _0x1ba442(_0xdfb64a) {
    var _0x3468bf = "";
    var _0x449bd6;
    var _0x44a4ae;
    for (_0x449bd6 = 0; _0x449bd6 + 3 <= _0xdfb64a.length; _0x449bd6 += 3) {
      _0x44a4ae = _0xdfb64a[_0x449bd6] << 16 | _0xdfb64a[_0x449bd6 + 1] << 8 | _0xdfb64a[_0x449bd6 + 2];
      _0x3468bf += _0x284e05[_0x44a4ae >>> 18 & 63] + _0x284e05[_0x44a4ae >>> 12 & 63] + _0x284e05[_0x44a4ae >>> 6 & 63] + _0x284e05[_0x44a4ae & 63];
    }
    var _0x1c9282 = _0xdfb64a.length - _0x449bd6;
    if (_0x1c9282 === 1) {
      _0x44a4ae = _0xdfb64a[_0x449bd6] << 16;
      _0x3468bf += _0x284e05[_0x44a4ae >>> 18 & 63] + _0x284e05[_0x44a4ae >>> 12 & 63];
    } else if (_0x1c9282 === 2) {
      _0x44a4ae = _0xdfb64a[_0x449bd6] << 16 | _0xdfb64a[_0x449bd6 + 1] << 8;
      _0x3468bf += _0x284e05[_0x44a4ae >>> 18 & 63] + _0x284e05[_0x44a4ae >>> 12 & 63] + _0x284e05[_0x44a4ae >>> 6 & 63];
    }
    return _0x3468bf;
  }
  function _0x29b7c2(_0x685474) {
    if (!_0x5373fd) {
      _0x5373fd = {};
      for (var _0x507e68 = 0; _0x507e68 < _0x284e05.length; _0x507e68++) {
        _0x5373fd[_0x284e05[_0x507e68]] = _0x507e68;
      }
    }
    var _0x4a271d = [];
    var _0x3ef1b9 = 0;
    var _0x59483a = 0;
    var _0x1cb624;
    var _0x29c84b;
    for (_0x1cb624 = 0; _0x1cb624 < _0x685474.length; _0x1cb624++) {
      _0x29c84b = _0x685474[_0x1cb624];
      if (!(_0x29c84b in _0x5373fd)) {
        continue;
      }
      _0x3ef1b9 = _0x3ef1b9 << 6 | _0x5373fd[_0x29c84b];
      _0x59483a += 6;
      if (_0x59483a >= 8) {
        _0x59483a -= 8;
        _0x4a271d.push(_0x3ef1b9 >>> _0x59483a & 255);
      }
    }
    return new Uint8Array(_0x4a271d);
  }
  function _0x3c986f(_0x4981ba) {
    return new TextEncoder().encode(_0x4981ba);
  }
  function _0x4ca571(_0x5756ce) {
    var _0x56a0de = new Uint8Array(6);
    var _0x1aa97d;
    for (_0x1aa97d = 5; _0x1aa97d >= 0; _0x1aa97d--) {
      _0x56a0de[_0x1aa97d] = _0x5756ce & 255;
      _0x5756ce = Math.floor(_0x5756ce / 256);
    }
    return _0x56a0de;
  }
  function _0x4b9448(_0x47d4c5) {
    var _0xd6c67d = 0;
    var _0x38c2ae;
    for (_0x38c2ae = 0; _0x38c2ae < _0x47d4c5.length; _0x38c2ae++) {
      _0xd6c67d += _0x47d4c5[_0x38c2ae].length;
    }
    var _0x5cf8f5 = new Uint8Array(_0xd6c67d);
    var _0x374697 = 0;
    for (_0x38c2ae = 0; _0x38c2ae < _0x47d4c5.length; _0x38c2ae++) {
      _0x5cf8f5.set(_0x47d4c5[_0x38c2ae], _0x374697);
      _0x374697 += _0x47d4c5[_0x38c2ae].length;
    }
    return _0x5cf8f5;
  }
  function _0x15968c(_0x491bd7) {
    var _0x5df01f = 2166136261;
    var _0xa85732;
    for (_0xa85732 = 0; _0xa85732 < _0x491bd7.length; _0xa85732++) {
      _0x5df01f ^= _0x491bd7[_0xa85732];
      _0x5df01f = Math.imul(_0x5df01f, 16777619) >>> 0;
    }
    return _0x5df01f >>> 0;
  }
  function _0x432f1c() {
    if (_0x5c4ffe() && _0x5c4ffe().n != null) {
      return _0x5c4ffe().n;
    } else if (typeof performance !== "undefined" && performance.now) {
      return Date.now();
    } else {
      return Date.now();
    }
  }
  function _0x3858f9() {
    var _0xdc0611 = new Uint8Array(4);
    var _0x3f0adf = _0x5c4ffe() && _0x5c4ffe().w != null ? _0x5c4ffe().w ? 1 : 0 : typeof navigator !== "undefined" && navigator.webdriver === true ? 1 : 0;
    _0xdc0611[0] = _0x3f0adf;
    var _0x1968bd = _0x5c4ffe() && _0x5c4ffe().s != null ? _0x5c4ffe().s : typeof navigator !== "undefined" ? [navigator.userAgent, navigator.language, typeof screen !== "undefined" ? screen.width + "x" + screen.height : "", new Date().getTimezoneOffset(), navigator.hardwareConcurrency, navigator.platform].join("|") : "node";
    var _0x195399 = _0x15968c(_0x3c986f(_0x1968bd));
    _0xdc0611[1] = _0x195399 >>> 16 & 255;
    _0xdc0611[2] = _0x195399 >>> 8 & 255;
    _0xdc0611[3] = _0x195399 & 255;
    if (_0xdc0611[0] === 0 && _0xdc0611[1] === 0 && _0xdc0611[2] === 0 && _0xdc0611[3] === 0) {
      _0xdc0611[3] = 1;
    }
    return _0xdc0611;
  }
  var _0x181119 = [_0x29b7c2, _0x3c986f, _0x3df78e, _0x53db08, _0x132dad, _0x4ca571, _0x1ba442, _0x432f1c, _0x3858f9];
  function _0x4a4d3a(_0x49c289, _0x169b62, _0x52116a) {
    var _0x2dbdb3 = [];
    var _0x2de8d4 = 0;
    var _0x379327;
    while (_0x2de8d4 < _0x49c289.length) {
      var _0x1b13d6 = _0x49c289[_0x2de8d4++];
      if (_0x1b13d6 === 58) {
        var _0x2f2cfe = _0x49c289[_0x2de8d4++];
        _0x2dbdb3[_0x2f2cfe] = _0x52116a[_0x49c289[_0x2de8d4++]];
      } else if (_0x1b13d6 === 17) {
        var _0x2f2cfe = _0x49c289[_0x2de8d4++];
        _0x2dbdb3[_0x2f2cfe] = _0x169b62[_0x49c289[_0x2de8d4++]];
      } else if (_0x1b13d6 === 126) {
        var _0x2f2cfe = _0x49c289[_0x2de8d4++];
        var _0x56872e = _0x49c289[_0x2de8d4++];
        var _0x4e3400 = _0x49c289[_0x2de8d4++];
        var _0x5c022f = [];
        for (_0x379327 = 0; _0x379327 < _0x4e3400; _0x379327++) {
          _0x5c022f.push(_0x2dbdb3[_0x49c289[_0x2de8d4++]]);
        }
        _0x2dbdb3[_0x2f2cfe] = _0x181119[_0x56872e].apply(null, _0x5c022f);
      } else if (_0x1b13d6 === 82) {
        var _0x2f2cfe = _0x49c289[_0x2de8d4++];
        var _0x4e3400 = _0x49c289[_0x2de8d4++];
        var _0x258b8d = [];
        for (_0x379327 = 0; _0x379327 < _0x4e3400; _0x379327++) {
          _0x258b8d.push(_0x2dbdb3[_0x49c289[_0x2de8d4++]]);
        }
        _0x2dbdb3[_0x2f2cfe] = _0x4b9448(_0x258b8d);
      } else if (_0x1b13d6 === 195) {
        var _0x2f2cfe = _0x49c289[_0x2de8d4++];
        var _0x16bae1 = _0x49c289[_0x2de8d4++];
        var _0x1abc72 = _0x49c289[_0x2de8d4++];
        _0x2dbdb3[_0x2f2cfe] = _0x2dbdb3[_0x16bae1].subarray(_0x1abc72, _0x49c289[_0x2de8d4++]);
      } else if (_0x1b13d6 === 240) {
        return _0x2dbdb3[_0x49c289[_0x2de8d4++]];
      } else {
        throw 0;
      }
    }
  }
  function _0x5cc1bb(_0x2b1fb1) {
    return async function () {
      var _0x4d1176 = {
        "Content-Type": "application/x-www-form-urlencoded"
      };
      var _0xb573e9 = await fetch("api.php", {
        method: "POST",
        headers: _0x4d1176,
        body: "m=c"
      });
      var _0x558601 = await _0xb573e9.json();
      if (!_0x558601) {
        return {};
      }
      if (_0x558601.error || !_0x558601.g || !_0x558601.p) {
        return _0x558601;
      }
      var _0x4c6d4b = _0x29b7c2(_0x558601.p);
      var _0x2aa71f = _0x558601.c.map(function (_0x50b48b) {
        return _0x29b7c2(_0x50b48b);
      });
      var _0x4ae0a4 = _0x4a4d3a(_0x4c6d4b, _0x2aa71f, [_0x558601.g.n, _0x558601.g.s, _0x558601.g.t, _0x2b1fb1]);
      var _0x568688 = "link=" + encodeURIComponent(_0x2b1fb1) + "&sid=" + encodeURIComponent(_0x558601.g.n);
      var _0x42ef9d = {
        "Content-Type": "application/x-www-form-urlencoded"
      };
      _0x42ef9d[String.fromCharCode(88, 45, 71, 97, 110, 108, 121)] = _0x4ae0a4;
      var _0x4dfffd = await fetch("api.php", {
        method: "POST",
        headers: _0x42ef9d,
        body: _0x568688
      });
      return await _0x4dfffd.json();
    }();
  }
  var _0xde1ea4 = String.fromCharCode(95, 48, 120, 57, 102, 50, 99);
  try {
    if (_0x4258ba) {
      _0x4258ba[_0xde1ea4] = _0x5cc1bb;
    }
  } catch (_0x53e3e6) {}
  return _0x5cc1bb;
});
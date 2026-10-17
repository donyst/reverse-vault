/**
 * ============================================================================
 *  id.traodoisub.com — client giải challenge chống bot ("Ganly")
 * ============================================================================
 *  Nguồn     : index.js (108.911 B / 1.765 dòng) trên Desktop
 *  Xác minh  : normalize whitespace -> sha1 = f0bf45fb104a, TRÙNG KHỚP 100%
 *              với <script> inline #2 của https://id.traodoisub.com/ (78.363 B).
 *              => index.js CHÍNH LÀ file site đang phục vụ.
 *  Obfuscator: javascript-obfuscator — string array `_0x272f` (531 mục) + rotate,
 *              decoder `_0x1b65` (base64 -> RC4), số hex hoá, dead code.
 *  Deobf     : webcrack (string array/decoder/inline) rồi đổi tên theo ngữ nghĩa.
 *              Bản này KHÔNG đổi hành vi so với bản chạy thật.
 *
 *  KIẾN TRÚC: script KHÔNG chứa thuật toán. Nó là một VM nhỏ với 9 hàm native
 *  (sha256/hmac/rc4/base64url/time/fingerprint). Mỗi request server trả về 1
 *  chương trình bytecode (`p`) + 4 hằng (`c[]`); client chỉ thực thi.
 *  => Thuật toán sinh proof do server định nghĩa lại từng lần gọi.
 *  Xem .re/NOTES.md để có bản disassemble của 1 chương trình thật.
 * ============================================================================
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    factory(root);
  }
})(typeof self !== "undefined" ? self : this, function (globalObject) {
  "use strict";

  /** Hook cấu hình runtime: trang có thể gán `window.__o = {...}` để ép giá trị
   *  dùng khi sinh proof (phục vụ test). Không set thì trả null. */
  function getRuntimeConfig() {
    if (globalObject && globalObject.__o) return globalObject.__o;
    return null;
  }
  /** Dead code do obfuscator chèn — không được gọi ở đâu. */
  function unusedSetter(x) { _OV = x; }

  function rotr32(x, n) { return (x >>> n) | (x << (32 - n)); }

  // ---------------------------------------------------------------- SHA-256
  const SHA256_K = [1116352408, 1899447441, 3049323471, 3921009573, 961987163,
    1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278,
    1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401,
    4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692,
    1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891,
    3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372,
    1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921,
    2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909,
    275423344, 430227734, 506948616, 659060556, 883997877, 958139571,
    1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452,
    2361852424, 2428436474, 2756734187, 3204031479, 3329325298];

  /** SHA-256 thuần JS, trả Uint8Array(32). */
  function sha256(input) {
    const h = [1779033703, 3144134277, 1013904242, 2773480762,
               1359893119, 2600822924, 528734635, 1541459225];
    const len = input.length;
    const bitLen = len * 8;
    const padded = len + 1;
    const zeros = (56 - padded % 64 + 64) % 64;
    const total = padded + zeros + 8;
    const buf = new Uint8Array(total);
    buf.set(input, 0);
    buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 8, Math.floor(bitLen / 4294967296));
    dv.setUint32(total - 4, bitLen >>> 0);
    const w = new Uint32Array(64);
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr32(w[i - 15], 7) ^ rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr32(w[i - 2], 17) ^ rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3];
      let e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let i = 0; i < 64; i++) {
        const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
        const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0;
      h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0;
      h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    const out = new Uint8Array(32);
    const odv = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) odv.setUint32(i * 4, h[i]);
    return out;
  }

  /** HMAC-SHA256: key > 64 byte thì băm trước; ipad 0x36 / opad 0x5c. */
  function hmacSha256(key, msg) {
    if (key.length > 64) key = sha256(key);
    const k = new Uint8Array(64); k.set(key, 0);
    const inner = new Uint8Array(64 + msg.length);
    const outer = new Uint8Array(96);
    for (let i = 0; i < 64; i++) {
      inner[i] = k[i] ^ 0x36;
      outer[i] = k[i] ^ 0x5c;
    }
    inner.set(msg, 64);
    outer.set(sha256(inner), 64);
    return sha256(outer);
  }

  /** RC4 cổ điển (KSA + PRGA). */
  function rc4(keyBytes, data) {
    const S = new Uint8Array(256);
    for (let i = 0; i < 256; i++) S[i] = i;
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + keyBytes[i % keyBytes.length]) & 255;
      const t = S[i]; S[i] = S[j]; S[j] = t;
    }
    const out = new Uint8Array(data.length);
    let i2 = 0; j = 0;
    for (let n = 0; n < data.length; n++) {
      i2 = (i2 + 1) & 255;
      j = (j + S[i2]) & 255;
      const t = S[i2]; S[i2] = S[j]; S[j] = t;
      out[n] = data[n] ^ S[(S[i2] + S[j]) & 255];
    }
    return out;
  }

  // ------------------------------------------------------------- base64url
  const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let decodeTable = null;

  function base64UrlEncode(bytes) {
    let s = "";
    let i;
    for (i = 0; i + 3 <= bytes.length; i += 3) {
      const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      s += B64URL[(n >>> 18) & 63] + B64URL[(n >>> 12) & 63] +
           B64URL[(n >>> 6) & 63] + B64URL[n & 63];
    }
    const rem = bytes.length - i;
    if (rem === 1) {
      const n = bytes[i] << 16;
      s += B64URL[(n >>> 18) & 63] + B64URL[(n >>> 12) & 63];
    } else if (rem === 2) {
      const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
      s += B64URL[(n >>> 18) & 63] + B64URL[(n >>> 12) & 63] + B64URL[(n >>> 6) & 63];
    }
    return s;
  }

  function base64UrlDecode(str) {
    if (!decodeTable) {
      decodeTable = {};
      for (let i = 0; i < B64URL.length; i++) decodeTable[B64URL[i]] = i;
    }
    const out = [];
    let acc = 0, bits = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (!(ch in decodeTable)) continue;
      acc = (acc << 6) | decodeTable[ch];
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out.push((acc >>> bits) & 255);
      }
    }
    return new Uint8Array(out);
  }

  // --------------------------------------------------------------- helpers
  function utf8Encode(str) { return new TextEncoder().encode(str); }

  /** Số nguyên -> 6 byte big-endian (đủ chứa timestamp ms). */
  function u48be(n) {
    const b = new Uint8Array(6);
    for (let i = 5; i >= 0; i--) { b[i] = n & 255; n = Math.floor(n / 256); }
    return b;
  }

  function concatBytes(parts) {
    let total = 0;
    for (const p of parts) total += p.length;
    const out = new Uint8Array(total);
    let off = 0;
    for (const p of parts) { out.set(p, off); off += p.length; }
    return out;
  }

  /** FNV-1a 32-bit. */
  function fnv1a32(bytes) {
    let h = 2166136261;
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /** Thời điểm hiện tại (ms) — ưu tiên `__o.n` nếu trang set. */
  function nowMs() {
    const cfg = getRuntimeConfig();
    if (cfg && cfg.n != null) return cfg.n;
    return Date.now();
  }

  /** Fingerprint 4 byte: [0] = cờ webdriver; [1..3] = 3 byte thấp của FNV-1a
   *  trên chuỗi UA|language|screen|timezoneOffset|hardwareConcurrency|platform. */
  function fingerprint() {
    const b = new Uint8Array(4);
    const cfg = getRuntimeConfig();
    const isWebdriver = cfg && cfg.w != null
      ? (cfg.w ? 1 : 0)
      : (typeof navigator !== "undefined" && navigator.webdriver === true ? 1 : 0);
    b[0] = isWebdriver;
    const seed = cfg && cfg.s != null
      ? cfg.s
      : (typeof navigator !== "undefined"
          ? [navigator.userAgent, navigator.language,
             typeof screen !== "undefined" ? screen.width + "x" + screen.height : "",
             new Date().getTimezoneOffset(), navigator.hardwareConcurrency,
             navigator.platform].join("|")
          : "node");
    const h = fnv1a32(utf8Encode(seed));
    b[1] = (h >>> 16) & 255;
    b[2] = (h >>> 8) & 255;
    b[3] = h & 255;
    if (b[0] === 0 && b[1] === 0 && b[2] === 0 && b[3] === 0) b[3] = 1;
    return b;
  }

  // ------------------------------------------------------------------- VM
  /** Bảng hàm native mà bytecode server được phép gọi (theo index). */
  const NATIVE_FNS = [
    base64UrlDecode,  // 0
    utf8Encode,       // 1
    sha256,           // 2
    hmacSha256,       // 3
    rc4,              // 4
    u48be,            // 5
    base64UrlEncode,  // 6
    nowMs,            // 7
    fingerprint,      // 8
  ];

  const OP_PUSH_ARG = 58;    // r[slot] = args[imm]
  const OP_PUSH_CONST = 17;  // r[slot] = consts[imm]
  const OP_CALL = 126;       // r[slot] = NATIVE_FNS[imm1](r[imm2..imm2+argc])
  const OP_CONCAT = 82;      // r[slot] = concat(r[imm..])
  const OP_SLICE = 195;      // r[slot] = r[src].subarray(start, end)
  const OP_RETURN = 240;     // return r[slot]

  /** Thực thi 1 chương trình bytecode do server trả về.
   *  @param program Uint8Array   bytecode (`p` đã base64url-decode)
   *  @param consts  Uint8Array[] hằng số (`c[]` đã decode)
   *  @param args    [nonce, serverSecret, serverTime, link]
   */
  function runProgram(program, consts, args) {
    const r = [];
    let pc = 0;
    while (pc < program.length) {
      const op = program[pc++];
      if (op === OP_PUSH_ARG) {
        const slot = program[pc++];
        r[slot] = args[program[pc++]];
      } else if (op === OP_PUSH_CONST) {
        const slot = program[pc++];
        r[slot] = consts[program[pc++]];
      } else if (op === OP_CALL) {
        const slot = program[pc++];
        const fnIdx = program[pc++];
        const argc = program[pc++];
        const a = [];
        for (let i = 0; i < argc; i++) a.push(r[program[pc++]]);
        r[slot] = NATIVE_FNS[fnIdx].apply(null, a);
      } else if (op === OP_CONCAT) {
        const slot = program[pc++];
        const argc = program[pc++];
        const a = [];
        for (let i = 0; i < argc; i++) a.push(r[program[pc++]]);
        r[slot] = concatBytes(a);
      } else if (op === OP_SLICE) {
        const slot = program[pc++];
        const src = program[pc++];
        const start = program[pc++];
        r[slot] = r[src].subarray(start, program[pc++]);
      } else if (op === OP_RETURN) {
        return r[program[pc++]];
      } else {
        throw 0;
      }
    }
  }

  // ----------------------------------------------------------- luồng chính
  /**
   * Lấy proof cho 1 link rồi gửi lên api.php.
   *   1) POST api.php  body: m=c             -> { g:{n,t,s}, p, c[], fp, v }
   *   2) giải `p`, `c[]` (base64url); proof = runProgram(p, c, [n, s, t, link])
   *   3) POST api.php  body: link=..&sid=<g.n>   header: X-Ganly: <proof>
   *   -> { success:true, id:<facebook UID> } | { error, countdown }
   * Lưu ý: challenge có thêm `fp` và `v` nhưng bản client này KHÔNG dùng.
   */
  async function fetchFacebookId(link) {
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    const res1 = await fetch("api.php", { method: "POST", headers, body: "m=c" });
    const challenge = await res1.json();
    if (!challenge) return {};
    if (challenge.error || !challenge.g || !challenge.p) return challenge;

    const program = base64UrlDecode(challenge.p);
    const consts = challenge.c.map((s) => base64UrlDecode(s));
    const proof = runProgram(program, consts, [
      challenge.g.n, challenge.g.s, challenge.g.t, link,
    ]);

    const body = "link=" + encodeURIComponent(link) +
                 "&sid=" + encodeURIComponent(challenge.g.n);
    const headers2 = { "Content-Type": "application/x-www-form-urlencoded" };
    headers2[String.fromCharCode(88, 45, 71, 97, 110, 108, 121)] = proof; // "X-Ganly"
    const res2 = await fetch("api.php", { method: "POST", headers: headers2, body });
    return await res2.json();
  }

  // Tên xuất ra global mà script UI (inline #3) gọi: window["_0x9f2c"](link)
  const EXPORT_NAME = String.fromCharCode(95, 48, 120, 57, 102, 50, 99);
  try {
    if (globalObject) globalObject[EXPORT_NAME] = fetchFacebookId;
  } catch (e) {}
  return fetchFacebookId;
});

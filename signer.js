#!/usr/bin/env node
/**
 * ============================================================================
 * TraoDoiSub (id.traodoisub.com) - X-Ganly Proof Signer & Client
 * ============================================================================
 * Dựa trên bản Reverse Engineering bytecode VM:
 * - Server cấp challenge qua endpoint POST /api.php (m=c)
 * - Client thực thi bytecode VM nhỏ (9 hàm native crypto/codec)
 * - Sinh chuỗi proof (base64url) gắn vào header X-Ganly
 * - Gửi POST /api.php kèm link + sid=<g.n>
 * ============================================================================
 */

const https = require('https');

// --- Helper HTTP Request (Zero Dependencies) ---
function sendHttpRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: json, rawBody: body });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: null, rawBody: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// --- Crypto & Codec Primitives ---
function rotr32(x, n) {
  return (x >>> n) | (x << (32 - n));
}

const SHA256_K = [
  1116352408, 1899447441, 3049323471, 3921009573, 961987163,
  1508970993, 2453635748, 2870763221, 3624381080, 310598401,
  607225278, 1426881987, 1925078388, 2162078206, 2614888103,
  3248222580, 3835390401, 4022224774, 264347078, 604807628,
  770255983, 1249150122, 1555081692, 1996064986, 2554220882,
  2821834349, 2952996808, 3210313671, 3336571891, 3584528711,
  113926993, 338241895, 666307205, 773529912, 1294757372,
  1396182291, 1695183700, 1986661051, 2177026350, 2456956037,
  2730485921, 2820302411, 3259730800, 3345764771, 3516065817,
  3600352804, 4094571909, 275423344, 430227734, 506948616,
  659060556, 883997877, 958139571, 1322822218, 1537002063,
  1747873779, 1955562222, 2024104815, 2227730452, 2361852424,
  2428436474, 2756734187, 3204031479, 3329325298
];

function sha256(input) {
  const h = [
    1779033703, 3144134277, 1013904242, 2773480762,
    1359893119, 2600822924, 528734635, 1541459225
  ];
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

function hmacSha256(key, msg) {
  if (key.length > 64) key = sha256(key);
  const k = new Uint8Array(64);
  k.set(key, 0);
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

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
let decodeTable = null;

function base64UrlEncode(bytes) {
  let s = '';
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

function utf8Encode(str) {
  return new TextEncoder().encode(str);
}

function u48be(n) {
  const b = new Uint8Array(6);
  for (let i = 5; i >= 0; i--) {
    b[i] = n & 255;
    n = Math.floor(n / 256);
  }
  return b;
}

function concatBytes(parts) {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function fnv1a32(bytes) {
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function getFingerprint(ua) {
  const b = new Uint8Array(4);
  b[0] = 0; // isWebdriver = false
  const userAgent = ua || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';
  const seed = `${userAgent}|vi,en-US;q=0.9|1920x1080|-420|8|Win32`;
  const h = fnv1a32(utf8Encode(seed));
  b[1] = (h >>> 16) & 255;
  b[2] = (h >>> 8) & 255;
  b[3] = h & 255;
  if (b[0] === 0 && b[1] === 0 && b[2] === 0 && b[3] === 0) b[3] = 1;
  return b;
}

// --- Bytecode VM Runner ---
function runProgram(program, consts, args, options = {}) {
  const nativeFns = [
    base64UrlDecode,                                           // 0
    utf8Encode,                                                // 1
    sha256,                                                    // 2
    hmacSha256,                                                // 3
    rc4,                                                       // 4
    u48be,                                                     // 5
    base64UrlEncode,                                           // 6
    () => (options.now != null ? options.now : Date.now()),    // 7
    () => (options.fingerprint != null ? options.fingerprint : getFingerprint(options.ua)) // 8
  ];

  const r = [];
  let pc = 0;
  while (pc < program.length) {
    const op = program[pc++];
    if (op === 58) { // OP_PUSH_ARG
      r[program[pc++]] = args[program[pc++]];
    } else if (op === 17) { // OP_PUSH_CONST
      r[program[pc++]] = consts[program[pc++]];
    } else if (op === 126) { // OP_CALL
      const slot = program[pc++];
      const fnIdx = program[pc++];
      const argc = program[pc++];
      const callArgs = [];
      for (let i = 0; i < argc; i++) callArgs.push(r[program[pc++]]);
      r[slot] = nativeFns[fnIdx].apply(null, callArgs);
    } else if (op === 82) { // OP_CONCAT
      const slot = program[pc++];
      const argc = program[pc++];
      const parts = [];
      for (let i = 0; i < argc; i++) parts.push(r[program[pc++]]);
      r[slot] = concatBytes(parts);
    } else if (op === 195) { // OP_SLICE
      const slot = program[pc++];
      const src = program[pc++];
      const start = program[pc++];
      const end = program[pc++];
      r[slot] = r[src].subarray(start, end);
    } else if (op === 240) { // OP_RETURN
      return r[program[pc++]];
    } else {
      throw new Error(`TraoDoiSub VM Error: Unknown opcode ${op} at pc=${pc}`);
    }
  }
}

/**
 * Hàm ký tạo chuỗi X-Ganly proof từ challenge data và target link.
 * @param {Object} challenge - Đối tượng JSON trả về từ POST /api.php (m=c)
 * @param {string} link - Link Facebook cần lấy UID
 * @param {Object} options - Tùy chọn (ua, now, fingerprint)
 * @returns {string} Chuỗi X-Ganly proof base64url (~130 ký tự)
 */
function signGanly(challenge, link, options = {}) {
  if (!challenge || !challenge.g || !challenge.p || !challenge.c) {
    throw new Error('Dữ liệu challenge không hợp lệ!');
  }
  const program = base64UrlDecode(challenge.p);
  const consts = challenge.c.map(base64UrlDecode);
  const args = [challenge.g.n, challenge.g.s, challenge.g.t, link];
  return runProgram(program, consts, args, options);
}

const DEFAULT_HEADERS = {
  'content-type': 'application/x-www-form-urlencoded',
  'origin': 'https://id.traodoisub.com',
  'referer': 'https://id.traodoisub.com/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"'
};

/**
 * Lấy challenge từ server id.traodoisub.com
 */
async function fetchChallenge(customHeaders = {}) {
  const headers = { ...DEFAULT_HEADERS, ...customHeaders };
  const res = await sendHttpRequest('https://id.traodoisub.com/api.php', {
    method: 'POST',
    headers
  }, 'm=c');
  if (!res.data || !res.data.g) {
    throw new Error(`Không lấy được challenge: ${res.rawBody}`);
  }
  return res.data;
}

/**
 * Toàn bộ flow: Lấy challenge -> Ký X-Ganly -> Gửi link -> Trả về kết quả
 * @param {string} link - Link Facebook
 * @param {Object} options - Tùy chọn
 */
async function fetchFacebookId(link, options = {}) {
  const headers = { ...DEFAULT_HEADERS, ...(options.headers || {}) };

  // 1. Lấy challenge
  const challenge = await fetchChallenge(headers);

  // 2. Ký proof
  const proof = signGanly(challenge, link, options);

  // 3. Gửi request tra cứu ID
  const body = `link=${encodeURIComponent(link)}&sid=${encodeURIComponent(challenge.g.n)}`;
  const submitHeaders = {
    ...headers,
    'x-ganly': proof
  };

  const res = await sendHttpRequest('https://id.traodoisub.com/api.php', {
    method: 'POST',
    headers: submitHeaders
  }, body);

  return {
    challenge,
    proof,
    result: res.data || res.rawBody
  };
}

module.exports = {
  signGanly,
  fetchChallenge,
  fetchFacebookId,
  runProgram,
  getFingerprint,
  base64UrlDecode,
  base64UrlEncode,
  sha256,
  hmacSha256,
  rc4
};

// --- CLI Execution ---
if (require.main === module) {
  const targetLink = process.argv[2] || 'https://www.facebook.com/groups/1528487012172019/permalink/1684774203209965/';
  console.log(`\n=== TraoDoiSub X-Ganly Signer ===`);
  console.log(`Target Link: ${targetLink}`);

  fetchFacebookId(targetLink).then(({ challenge, proof, result }) => {
    console.log(`\n[+] Nonce (sid): ${challenge.g.n}`);
    console.log(`[+] X-Ganly Proof: ${proof}`);
    console.log(`\n[+] Response API:`);
    console.log(JSON.stringify(result, null, 2));
  }).catch(err => {
    console.error('[-] Lỗi:', err);
    process.exit(1);
  });
}

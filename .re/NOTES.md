# RE: https://id.traodoisub.com/ — deobfuscate + phân tích

Ngày: 2026-10-18 · Target: `index.js` (108.911 B, 1.765 dòng) trên Desktop

## 1. Kết luận nhanh

`index.js` **không phải** app logic. Nó là **client giải challenge chống bot**
(~200 dòng sau deobf) cho endpoint `api.php`. Site là công cụ **lấy Facebook UID
từ link FB** (`id.traodoisub.com` = "lấy ID"), bảo vệ bằng challenge
proof-of-work do server sinh riêng cho từng request.

Điểm cốt lõi: **thuật toán sinh proof KHÔNG nằm trong client.** Server trả về
một chương trình bytecode nhỏ; client chạy nó trên một VM 9 hàm native
(sha256 / hmac / rc4 / base64url / time / fingerprint). Vì vậy chỉ đọc code
tĩnh là không thể suy ra thuật toán — bắt buộc phải *thực thi* bytecode.

## 2. Nguồn gốc & xác minh

| Kiểm tra | Kết quả |
|---|---|
| normalize whitespace `index.js` | sha1 `f0bf45fb104a`, 78.005 ký tự |
| `<script>` inline #2 của trang chủ | sha1 `f0bf45fb104a`, 78.005 ký tự |
| Kết luận | **index.js CHÍNH LÀ file site đang phục vụ** (không phải bản sao từ nguồn khác) |

Trang chủ còn 1 script inline nữa (39.397 B, sha1 `66a378e36fcf`) = **script UI**,
đã deobf ở `.re/out/webcrack_s3/deobfuscated.js`.

## 3. Các lớp obfuscation

1. **String array** `_0x272f()` — 531 mục, có rotate.
2. **Decoder** `_0x1b65(i, key)` — base64 (`_0x57d238`) rồi **RC4** (`_0xb6ea5b`).
3. Số nguyên hex hoá (`-0x139a + -0xb4f + -0x1b3 * -0x13` → dạng `a - (b + c + d*e)`).
4. Tên biến `_0x…`, dead code (`_0x362f54` không được gọi).
5. Không có control-flow flattening → webcrack xử lý sạch trong 1 pass.

## 4. Kiến trúc client sau deobf

Bảng hàm native mà bytecode được phép gọi (`NATIVE_FNS`):

| # | Hàm | Vai trò |
|---|---|---|
| 0 | `base64UrlDecode` | giải `p`, `c[]` |
| 1 | `utf8Encode` | TextEncoder |
| 2 | `sha256` | SHA-256 thuần JS |
| 3 | `hmacSha256` | HMAC-SHA256 (ipad 0x36 / opad 0x5c) |
| 4 | `rc4` | RC4 KSA+PRGA |
| 5 | `u48be` | int → 6 byte big-endian |
| 6 | `base64UrlEncode` | mã hoá proof |
| 7 | `nowMs` | `__o.n ?? Date.now()` |
| 8 | `fingerprint` | 4 byte (xem §7) |

Tập opcode của VM (`runProgram`):

| Opcode | Tên | Ý nghĩa |
|---|---|---|
| 58 | `PUSH_ARG` | `r[slot] = args[imm]` |
| 17 | `PUSH_CONST` | `r[slot] = consts[imm]` |
| 126 | `CALL` | `r[slot] = NATIVE_FNS[i](...)` |
| 82 | `CONCAT` | nối n bytearray |
| 195 | `SLICE` | `r[dst] = r[src].subarray(a, b)` |
| 240 | `RETURN` | trả `r[slot]` |

## 5. Giao thức (đã verify bằng request thật)

**Bước 1** — lấy challenge:

```http
POST /api.php HTTP/1.1
Content-Type: application/x-www-form-urlencoded

m=c
```

Response (đã fetch thật, lưu ở `.re/out/challenge.json`):

```json
{ "g": { "n": "<nonce 16B>", "t": 1792261446188, "s": "<secret 32B>" },
  "p": "<bytecode 116B>", "c": ["<1B>", "<16B>", "<12B>", "<16B>"],
  "fp": "2d702632", "v": "d0eaea10" }
```

**Bước 2** — chạy VM: `proof = runProgram(b64u(p), c[].map(b64u), [g.n, g.s, g.t, link])`

**Bước 3** — gửi:

```http
POST /api.php HTTP/1.1
Content-Type: application/x-www-form-urlencoded
X-Ganly: <proof>

link=<url-encoded facebook link>&sid=<g.n>
```

→ `{"success":true,"id":"<facebook UID>"}` hoặc `{"error":"…","countdown":<giây>}`

## 6. Disassemble chương trình thật của server

`p` (116 byte) giải mã ra 26 lệnh — **thuật toán thật**, không nằm trong client:

```
0000: LOAD_ARG   r1  = g.n (nonce)
0003: CALL       r2  = b64urlDecode(r1)
0008: LOAD_ARG   r3  = g.s (secret)
000b: CALL       r4  = b64urlDecode(r3)
0010: LOAD_ARG   r5  = g.t (server time)
0013: CALL       r6  = u48be(r5)
0018: CALL       r7  = now()                 <- đồng hồ CLIENT
001c: CALL       r8  = u48be(r7)
0021: CALL       r9  = fingerprint()
0025: LOAD_CONST r10 = c[0]
0028: LOAD_ARG   r11 = link
002b: CALL       r12 = utf8Encode(r11)
0030: CONCAT     r13 = r9, r2, r4, r10, r8, r6
0039: LOAD_CONST r14 = c[1]
003c: CONCAT     r15 = r14, r2
0041: CALL       r16 = sha256(r15)
0046: LOAD_CONST r17 = c[2]
0049: CONCAT     r18 = r13, r17, r12
004f: CALL       r19 = hmacSha256(r16, r18)
0055: CONCAT     r20 = r13, r19
005a: LOAD_CONST r21 = c[3]
005d: CALL       r22 = sha256(r21)
0062: SLICE      r23 = r22[0:16]
0067: CALL       r24 = rc4(r23, r20)
006d: CALL       r25 = b64urlEncode(r24)
0072: RETURN     r25
```

Pseudocode:

```
A    = fp(4) || nonce(16) || secret(32) || c[0](1)
       || u48(clientTime)(6) || u48(serverTime)(6)          # = 65 byte
mac  = hmac_sha256( sha256(c[1](16) || nonce), A || c[2](12) || utf8(link) )   # 32 byte
proof = base64url( rc4( sha256(c[3])[0:16], A || mac ) )    # = 97 byte / 130 ký tự

# LƯU Ý: proof CHỈ chứa A||mac. `c[2]` và `link` KHÔNG nằm trong proof —
# chúng chỉ được xác thực qua HMAC. link truyền riêng ở form field.
```

Server giải mã bằng khoá suy từ `c[3]` (hằng riêng của từng request), lấy lại
`nonce/secret/timestamp/link/fp`, verify HMAC và kiểm tra cửa sổ thời gian.

## 7. Fingerprint (4 byte) — client gửi lên

| Byte | Nguồn |
|---|---|
| 0 | `navigator.webdriver === true ? 1 : 0` (hoặc `__o.w`) |
| 1-3 | 3 byte thấp của **FNV-1a 32-bit** trên `UA\|language\|WxH\|tzOffset\|cores\|platform` (hoặc `__o.s`) |

Nếu cả 4 byte bằng 0 thì byte[3] bị ép = 1. Server nhận được cờ webdriver →
đây là dấu hiệu **phát hiện headless/automation**.

## 8. Ghi chú kỹ thuật

- `fp` và `v` trong response **không được client dùng** — có thể là field của
  phiên bản khác / server dùng để log.
- Proof trộn **đồng hồ client** (`nowMs`) với `g.t` của server → chống replay,
  đồng thời đo được độ lệch giờ/latency phía server.
- Hook `window.__o = { n, w, s }` cho phép ép clock / cờ webdriver / seed
  fingerprint — rõ ràng là **hook phục vụ test** nhưng cũng là điểm chỉnh sửa
  fingerprint nếu ai đó muốn giả.
- Trong Node CJS, UMD gọi `factory()` **không tham số** → `__o` bị bỏ qua.
  Muốn tất định phải chạy qua `vm` với `self` tồn tại (xem `.re/verify3.js`).
- VM chỉ có 6 opcode, không có syscall/escape → bề mặt an toàn, không phải lỗ hổng.
- **Script UI (inline #3)** không có logic bảo mật: validate `facebook.com|fb.watch`,
  phân loại link (post/group/photo/video/profile), gọi `window["_0x9f2c"](link)`,
  hiện UID + nút copy. Không có token/session nào — **không có tầng auth**.

## 9. Xác minh tính trung thực của bản deobf

Chạy `index.js` gốc, bản webcrack và bản annotated trong cùng một sandbox
`vm` (clock + fingerprint cố định qua `__o`, `fetch` bị stub, **không gọi mạng**):

```
ec4abcdc32abf43657f5fe6db0b8dba67361764551e00d00eb214897a7b614f7  len=130  index.js
ec4abcdc32abf43657f5fe6db0b8dba67361764551e00d00eb214897a7b614f7  len=130  webcrack/deobfuscated.js
ec4abcdc32abf43657f5fe6db0b8dba67361764551e00d00eb214897a7b614f7  len=130  index.annotated.js
```

→ proof + body request **trùng khớp byte-for-byte**. Bản deobf không đổi hành vi.

## 10. Chưa làm

- **Không** gửi `link=…&sid=…` thật → chưa từng "tiêu thụ" dịch vụ (không tạo
  task/tra cứu UID nào trên hệ thống của họ). Chỉ 1 request `m=c` để xác minh.
- Chưa dịch ngược `c[3]` → server key (không cần: client không giữ nó).

## 11. File

| File | Nội dung |
|---|---|
| `.re/out/index.annotated.js` | **Deliverable chính** — bản deobf đã đặt tên + chú thích |
| `.re/out/webcrack/deobfuscated.js` | Output thô của webcrack (script #2) |
| `.re/out/webcrack_s3/deobfuscated.js` | Script UI (#3) sau deobf |
| `.re/out/live_s2.js`, `live_s3.js` | 2 script inline tách từ trang chủ |
| `.re/out/challenge.json` | Challenge thật dùng để verify |
| `.re/verify3.js` | Harness so proof (deterministic, offline) |
| `.re/root.html`, `root_headers.txt` | Response trang chủ |

## 12. Bản annotated cho script UI (#3)

`.re/out/live_s3.annotated.js` — 213 dòng, đã đặt tên + chú thích toàn bộ:
nav scroll, FAQ accordion, form validate (`facebook.com|fb.watch`),
`detectLinkType()` (post/group/photo/video/profile), gọi `window["_0x9f2c"]`,
hiện UID + copy clipboard (có fallback `execCommand`), hiện `countdown` khi
server báo lỗi.

## 13. Xác minh end-to-end cả 2 script (offline, không gọi mạng)

`.re/verify_ui.js` — dựng DOM stub, chạy **cặp (index.js + live_s3.js) gốc**
so với **cặp (index.annotated.js + live_s3.annotated.js)**, cùng challenge thật,
`fetch` bị stub, clock/fingerprint cố định qua `__o`:

```
BẢN GỐC    sha256(snapshot) = 15c428017bafd034d5b5511db247a293295f3795caf59f25b54cdf04f17b745a
ANNOTATED  sha256(snapshot) = 15c428017bafd034d5b5511db247a293295f3795caf59f25b54cdf04f17b745a
KHỚP HOÀN TOÀN: true
```

Snapshot gồm: hash của proof, body POST, `resultUid`, `resultType`, trạng thái
nút/helper/error, DOM đã cập nhật. Cùng `proof_sha256` và cùng body
`link=…&sid=_JoeoTZwEa-PXhRQGbPC1w`.

## 14. Đã quét hết JS của site chưa?

| Kiểm tra | Kết quả |
|---|---|
| `<script>` inline trên trang chủ | 2 (ld+json bỏ qua, rocket-loader của Cloudflare) |
| `robots.txt` | `Allow: /`, không trỏ sitemap |
| `sitemap.xml` | trả về chính trang chủ (SPA rewrite) |

→ Site chỉ có **2 script obfuscated**, không có route nào khác. Đây là toàn bộ JS.

## 15. Đối chiếu với capture thật của user (browser, Chrome 152)

User cung cấp 2 request copy-as-cmd từ devtools. **Không replay** (xem §16).

**Request 1** — `m=c` → challenge (giống §5).
**Request 2** — `link=https%3A%2F%2Fwww.facebook.com%2Fgroups%2F1528487012172019%2Fpermalink%2F1684774203209965%2F&sid=4bC3MngjjywDbXyPuNtx1w`
header `x-ganly: eN28ZDvH0gWODPYtagqfVzvjcUCERWQ_BSJRaFnEkFngdkSq7l9QN_unMWLlpAIFUNMOOKn6or_VQOesxISYBhsGLkP3QxcG24Xw920ObzFedP1ab1l6Hc2OwvTg96Z_7A`

Đối chiếu với disassembly §6:

| Dự đoán từ disassembly | Capture thật | |
|---|---|---|
| `sid` = nonce `g.n`, 16 byte | `4bC3MngjjywDbXyPuNtx1w` → 16 byte | ✓ |
| proof = `A(65B) \|\| mac(32B)` = **97 byte / 130 ký tự**, **không phụ thuộc độ dài link** | 130 ký tự → 97 byte (link dài 76 ký tự) | ✓ |
| Cùng capture có header `x-ganly` viết thường | `x-ganly` | ✓ |

Kiểm chứng thêm bằng cách chạy chính client đã deobf với 3 link dài khác nhau
(`.re/verify4.js`, offline, challenge đã lưu):

```
link_len= 29  proof_chars=130  proof_bytes=97
link_len= 76  proof_chars=130  proof_bytes=97
link_len=135  proof_chars=130  proof_bytes=97
```

→ Độ dài proof **bất biến theo link**, đúng như capture. Đây là bằng chứng độc
lập rằng bản disassembly khớp với code đang chạy thật trên production.

**Hệ quả bảo mật:** `link` và `c[2]` chỉ được HMAC xác thực chứ không nằm trong
proof, nên server phải đọc `link` từ form field rồi verify MAC trên
`A || c[2] || link`. Nghĩa là tính toàn vẹn của `link` phụ thuộc hoàn toàn vào
việc server ghép đúng — nếu server quên đưa `link` vào input HMAC thì MAC vẫn
hợp lệ với link bất kỳ (không kiểm chứng được từ ngoài, cần test có kiểm soát).

## 16. Vì sao không replay capture

1. Proof trộn `u48(clientTime)` **và** `u48(serverTime)` → gần như chắc chắn có
   cửa sổ thời gian; capture đã cũ nên khả năng cao bị từ chối.
2. `sid`/nonce sinh theo từng request — nhiều khả năng dùng 1 lần.
3. Replay = thực hiện tra cứu UID thật trên hệ thống họ = tiêu thụ dịch vụ.
   Không cần thiết cho RE, nên tôi không gửi.

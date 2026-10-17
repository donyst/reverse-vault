# id_traodoisub - Reverse Engineering & Challenge Solver

Nghiên cứu & phân tích cơ chế bảo vệ challenge chống bot (`X-Ganly`) của endpoint `https://id.traodoisub.com/api.php`.

## 1. Cơ chế hoạt động (Reverse Engineering)
Target: `id.traodoisub.com` (công cụ get Facebook UID từ link Facebook).
- Endpoint được bảo vệ bằng challenge proof-of-work do server sinh động theo từng request.
- Client (`index.js`) không chứa thuật toán tĩnh mà đóng vai trò như một máy ảo (Bytecode VM) với 9 hàm native (`base64UrlDecode`, `utf8Encode`, `sha256`, `hmacSha256`, `rc4`, `u48be`, `base64UrlEncode`, `nowMs`, `fingerprint`).
- Luồng thực thi:
  1. `POST /api.php` với body `m=c` để nhận challenge `{ g: { n, t, s }, p, c[], fp, v }`.
  2. Bytecode `p` được giải mã và thực thi trên VM cùng các hằng số `c[]` và tham số `[nonce, secret, serverTime, link]`.
  3. VM tính toán chuỗi proof (~97 bytes sau mã hóa base64url ~130 ký tự).
  4. Client gửi request thứ hai kèm header `X-Ganly: <proof>` cùng body `link=<fb_link>&sid=<nonce>`.

Chi tiết phân tích đầy đủ và bản disassemble bytecode xem tại [`.re/NOTES.md`](.re/NOTES.md).

---

## 2. Cấu trúc thư mục
```
├── main.go               # Client Go hoàn chỉnh (Zero external dependencies)
├── signer.js             # Client & SDK Node.js (Zero external dependencies)
├── go.mod                # Module Go
├── .re/                  # Toàn bộ tài liệu RE & artifacts
│   ├── NOTES.md          # Ghi chú phân tích chi tiết & VM disassembly
│   ├── out/              # Code sau deobfuscate (webcrack + annotated)
│   ├── verify3.js        # Script kiểm thử độ toàn vẹn offline
│   └── verify_ui.js      # Script kiểm thử UI sandbox
└── README.md
```

---

## 3. Hướng dẫn sử dụng

### 3.1 Chạy bằng Go (Khuyên dùng)
Yêu cầu: Go 1.20+ (không cần cài thêm thư viện ngoài).

```bash
# Chạy với link mặc định
go run main.go

# Chạy với link Facebook tùy chọn
go run main.go "https://www.facebook.com/groups/1528487012172019/permalink/1684774203209965/"
```

### 3.2 Chạy bằng Node.js
Yêu cầu: Node.js 18+ (không cần `npm install`).

```bash
# Chạy CLI
node signer.js "https://www.facebook.com/groups/1528487012172019/permalink/1684774203209965/"

# Hoặc import vào project Node.js
const { fetchFacebookId, signGanly } = require('./signer');
const result = await fetchFacebookId("https://www.facebook.com/zuck");
console.log(result);
```

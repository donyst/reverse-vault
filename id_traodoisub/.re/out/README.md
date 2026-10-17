# id.traodoisub.com — bản deobfuscate (đầy đủ)

| File | Nội dung |
|---|---|
| `index.annotated.js` | **Script #2** (= `index.js` gốc) — client challenge `api.php`, đã đặt tên + chú thích. 338 dòng |
| `live_s3.annotated.js` | **Script #3** — UI form lấy Facebook UID, đã đặt tên + chú thích. 213 dòng |
| `webcrack/deobfuscated.js` | Output thô webcrack của script #2 (321 dòng) |
| `webcrack_s3/deobfuscated.js` | Output thô webcrack của script #3 (183 dòng) |
| `live_s2.js` | Script #2 nguyên văn, tách từ trang chủ (78.365 B) = `../../index.js` |
| `live_s3.js` | Script #3 nguyên văn, tách từ trang chủ (39.403 B) |
| `challenge.json` | Challenge thật từ `api.php` (dùng để verify) |

Bản annotated **không đổi hành vi** — đã chứng minh bằng
`../verify3.js` (so proof) và `../verify_ui.js` (so end-to-end cả 2 script).
Chi tiết: `../NOTES.md`.

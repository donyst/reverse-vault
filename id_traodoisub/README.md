# 🔍 id.traodoisub.com — Dynamic VM Challenge Solver & Reverse Engineering

Comprehensive reverse engineering documentation and standalone reference implementations (Go & Node.js) for `id.traodoisub.com` anti-bot challenge (`X-Ganly`).

---

## 📑 Table of Contents
- [1. Security Mechanism Overview](#1-security-mechanism-overview)
- [2. Bytecode Virtual Machine Architecture](#2-bytecode-virtual-machine-architecture)
  - [Opcode Table](#opcode-table)
  - [Native Functions (NATIVE_FNS)](#native-functions-native_fns)
- [3. Cryptographic Pipeline (Disassembly)](#3-cryptographic-pipeline-disassembly)
- [4. Implementation & Benchmarks](#4-implementation--benchmarks)
- [5. Usage](#5-usage)

---

## 1. Security Mechanism Overview
Target: `https://id.traodoisub.com/api.php`

When requesting Facebook UID resolutions from a link, the site does not rely on static signature keys or hardcoded hashes. Instead:
1. Client requests a challenge: `POST /api.php` with `m=c`.
2. Server responds with an ephemeral challenge:
   ```json
   {
     "g": {
       "n": "epUu9D3EpHKagppHtw_eaQ",
       "t": 1792261446188,
       "s": "ZnjJ55IoD-4hUkLzr13WUxijsl6_aNg0ThkVaoDzJx0"
     },
     "p": "OgEAfgIAAQE6AwF-BAABAzoFAn4GBQEFfgcHAH4IBQEHfgkIABEKADoLA34MAQELUg0GBAoJBgIIEQ4BUg8CDgJ-EAIBDxERAlISAw0RDH4TAwIQElIUAg0TERUDfhYCARXDFxYAEH4YBAIXFH4ZBgEY8Bk",
     "c": ["AQ", "Yjq2GQyOhxHBTY-PT2hfFQ", "4TtDr32PVcXNpDyv", "4-UER2tSQM4s1qjN4Gi6_w"],
     "fp": "2d702632",
     "v": "d0eaea10"
   }
   ```
3. Client executes the bytecode payload `p` in an isolated 6-opcode VM with access to 9 cryptographic primitives.
4. Output proof is attached to the `X-Ganly` header.

---

## 2. Bytecode Virtual Machine Architecture

### Opcode Table
The virtual machine implements a register-based stackless architecture:

| Opcode | Mnemonic | Format | Description |
| :---: | :--- | :--- | :--- |
| `58` | `PUSH_ARG` | `[58, slot, arg_index]` | Stores argument `args[arg_index]` into register `r[slot]` |
| `17` | `PUSH_CONST` | `[17, slot, const_index]` | Stores constant `consts[const_index]` into register `r[slot]` |
| `126` | `CALL` | `[126, slot, fn_index, argc, ...args]` | Calls native function `NATIVE_FNS[fn_index]` with arguments |
| `82` | `CONCAT` | `[82, slot, argc, ...slots]` | Concatenates multiple byte arrays into register `r[slot]` |
| `195` | `SLICE` | `[195, slot, src_slot, start, end]` | Slices byte array `r[src_slot][start:end]` into register `r[slot]` |
| `240` | `RETURN` | `[240, slot]` | Halts VM execution and yields `r[slot]` as final proof |

### Native Functions (`NATIVE_FNS`)

| Index | Name | Signature / Operation |
| :---: | :--- | :--- |
| `0` | `base64UrlDecode` | `str -> Uint8Array` |
| `1` | `utf8Encode` | `str -> Uint8Array` (TextEncoder) |
| `2` | `sha256` | `Uint8Array -> Uint8Array(32)` |
| `3` | `hmacSha256` | `(key, msg) -> Uint8Array(32)` |
| `4` | `rc4` | `(key, data) -> Uint8Array` (KSA + PRGA stream cipher) |
| `5` | `u48be` | `int64 -> Uint8Array(6)` (48-bit big-endian timestamp) |
| `6` | `base64UrlEncode` | `Uint8Array -> string` (Raw URL-safe Base64) |
| `7` | `nowMs` | `() -> int64` (Client timestamp in milliseconds) |
| `8` | `fingerprint` | `() -> Uint8Array(4)` (WebDriver boolean + FNV-1a 32-bit hash) |

---

## 3. Cryptographic Pipeline (Disassembly)

Disassembling the server's bytecode `p` yields the exact algorithm executed per request:

```text
A     = fingerprint(4) || nonce(16) || secret(32) || c[0](1)
        || u48(client_time)(6) || u48(server_time)(6)           # Length = 65 bytes

mac   = HMAC_SHA256(
            key = SHA256(c[1](16) || nonce),
            msg = A || c[2](12) || utf8(facebook_link)
        )                                                       # Length = 32 bytes

proof = Base64Url_Encode(
            RC4(
                key  = SHA256(c[3])[0:16],
                data = A || mac                                 # Total 97 bytes
            )
        )                                                       # Result: ~130 ASCII characters
```

> **Note**: `c[2]` and the target `link` are authenticated into the HMAC tag but omitted from the RC4 payload to prevent redundancy. The server recovers parameters and validates the cryptographic authentication tag upon submission.

---

## 4. Implementation & Benchmarks

| Metric | Golang (`main.go`) | Node.js (`signer.js`) |
| :--- | :--- | :--- |
| **Dependencies** | 0 external libraries (`std/crypto`, `std/net`) | 0 external packages (`node:https`) |
| **VM Execution Time** | `< 0.05 ms` | `< 0.20 ms` |
| **Total Roundtrip Latency** | `~450ms - 550ms` (2 HTTP POSTs) | `~500ms - 650ms` |
| **Binary / Footprint** | Single static binary | Single portable JS script |

---

## 5. Usage

### Golang
```bash
# Query default target
go run main.go

# Query specific Facebook URL
go run main.go "https://www.facebook.com/groups/1528487012172019/permalink/1684774203209965/"
```

### Node.js
```bash
node signer.js "https://www.facebook.com/groups/1528487012172019/permalink/1684774203209965/"
```

Sample output:
```json
{
  "success": 200,
  "id": "1684774203209965",
  "link": "https://www.facebook.com/groups/1528487012172019/permalink/1684774203209965/",
  "share_type": 37,
  "name": "",
  "code": 200,
  "post_id": "1684774203209965"
}
```

---

## 📂 Artifacts & Raw Dumps
See [`.re/NOTES.md`](.re/NOTES.md) for full deobfuscation logs, static AST transformations, and bytecode verification records.

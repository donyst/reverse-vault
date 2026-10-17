const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const ROOT = __dirname;
const challenge = JSON.parse(fs.readFileSync(path.join(ROOT, "out/challenge.json"), "utf8"));

function el(id) {
  return {
    id, className: "", innerHTML: "", textContent: "", value: "", disabled: false,
    style: {}, _handlers: {},
    classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
                 contains(c) { return this._s.has(c); } },
    addEventListener(t, h) { (this._handlers[t] = this._handlers[t] || []).push(h); },
    select() {},
  };
}

function buildSandbox(script2Path, script3Path) {
  const els = {};
  let cap = null;
  const document = {
    getElementById: (id) => els[id] || (els[id] = el(id)),
    querySelectorAll: () => [],
    createElement: () => el("tmp"),
    body: { appendChild() {}, removeChild() {} },
    execCommand: () => true,
  };
  const sandbox = {
    console, TextEncoder, Date, Math, Uint8Array, Uint32Array, DataView,
    String, Number, Boolean, Array, Object, JSON, Error, Promise, RegExp,
    encodeURIComponent, decodeURIComponent, setTimeout, performance: { now: () => 0 },
    document, navigator: { clipboard: null },
    addEventListener(t, h) { sandbox._scroll = h; },
    scrollY: 0, isSecureContext: true,
  };
  sandbox.self = sandbox;
  sandbox.window = sandbox;
  sandbox.__o = { n: 1792261446188, w: 0, s: "fixed-seed-for-verify" };
  sandbox.fetch = async (u, o) => {
    if (o.body === "m=c") return { json: async () => challenge };
    cap = { body: o.body, ganly: o.headers["X-Ganly"] };
    return { json: async () => ({ success: true, id: "100012345678901" }) };
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.resolve(ROOT, script2Path), "utf8"), sandbox, { filename: script2Path });
  vm.runInContext(fs.readFileSync(path.resolve(ROOT, script3Path), "utf8"), sandbox, { filename: script3Path });
  return { sandbox, els, getCap: () => cap };
}

async function snapshot(script2Path, script3Path) {
  const { els, getCap } = buildSandbox(script2Path, script3Path);
  els.link.value = "  https://www.facebook.com/zuck  ";
  const h = els.extractForm._handlers.submit[0];
  h({ preventDefault() {} });
  await new Promise((r) => setTimeout(r, 50));
  const cap = getCap();
  return {
    proof_sha256: crypto.createHash("sha256").update(cap.ganly).digest("hex"),
    post_body: cap.body,
    resultUid: els.resultUid.textContent,
    resultType: els.resultType.textContent,
    resultTime: els.resultTime.textContent.replace(/[\d.]+ms/, "<ms>"),
    resultAreaShown: els.resultArea.style.display,
    btnText: els.btnText.textContent,
    btnDisabled: els.submitBtn.disabled,
    helper: els.helper.innerHTML,
    serverErrorShown: els.serverError.style.display,
  };
}

(async () => {
  const pairs = [
    ["BẢN GỐC     ", "../index.js", "out/live_s3.js"],
    ["ANNOTATED   ", "out/index.annotated.js", "out/live_s3.annotated.js"],
  ];
  const results = [];
  for (const [label, s2, s3] of pairs) {
    const snap = await snapshot(s2, s3);
    results.push(snap);
    console.log(label + " sha256(snapshot)=" + crypto.createHash("sha256").update(JSON.stringify(snap)).digest("hex"));
    console.log(JSON.stringify(snap, null, 1));
  }
  console.log("KHỚP HOÀN TOÀN: " + (JSON.stringify(results[0]) === JSON.stringify(results[1])));
})();

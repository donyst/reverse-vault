const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const challenge = JSON.parse(fs.readFileSync(path.join(__dirname, "out/challenge.json"), "utf8"));
const src = fs.readFileSync(path.resolve(process.argv[2]), "utf8");
let cap = null;
const sandbox = {
  console, TextEncoder, Date, Math, Uint8Array, Uint32Array, DataView,
  String, Number, Boolean, Array, Object, JSON, Error, Promise,
  encodeURIComponent, decodeURIComponent, setTimeout,
};
sandbox.self = sandbox;
sandbox.__o = { n: 1792261446188, w: 0, s: "fixed-seed-for-verify" };
sandbox.fetch = async (u, o) => {
  if (o.body === "m=c") return { json: async () => challenge };
  cap = { body: o.body, ganly: o.headers["X-Ganly"] };
  return { json: async () => ({ success: true, id: "100012345678901" }) };
};
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: process.argv[2] });
sandbox.self["_0x9f2c"]("https://www.facebook.com/zuck").then(() => {
  const h = crypto.createHash("sha256").update(cap.ganly).digest("hex");
  console.log(h + "  len=" + cap.ganly.length + "  " + process.argv[2]);
});

const fs=require("fs"),path=require("path"),vm=require("vm"),crypto=require("crypto");
const challenge=JSON.parse(fs.readFileSync(path.join(__dirname,"out/challenge.json"),"utf8"));
const src=fs.readFileSync(path.resolve(__dirname,process.argv[2]),"utf8");
const link=process.argv[3];
let cap=null;
const sandbox={console,TextEncoder,Date,Math,Uint8Array,Uint32Array,DataView,String,Number,
  Boolean,Array,Object,JSON,Error,Promise,encodeURIComponent,decodeURIComponent,setTimeout};
sandbox.self=sandbox;
sandbox.__o={n:1792261446188,w:0,s:"fixed-seed-for-verify"};
sandbox.fetch=async(u,o)=>{
  if(o.body==="m=c") return {json:async()=>challenge};
  cap={body:o.body,ganly:o.headers["X-Ganly"]};
  return {json:async()=>({success:true,id:"1"})};
};
vm.createContext(sandbox);
vm.runInContext(src,sandbox,{filename:process.argv[2]});
sandbox.self["_0x9f2c"](link).then(()=>{
  const raw=Buffer.from(cap.ganly.replace(/-/g,"+").replace(/_/g,"/"),"base64");
  console.log(`link_len=${String(link.length).padStart(3)}  proof_chars=${String(cap.ganly.length).padStart(3)}  proof_bytes=${raw.length}`);
});

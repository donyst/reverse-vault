const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'raw/index.html'), 'utf8');
console.log('HTML size:', html.length, 'bytes');

const scripts = [];
const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
let inlineCount = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  const attrs = match[1];
  const content = match[2].trim();
  const srcMatch = /src=["']([^"']+)["']/i.exec(attrs);
  if (srcMatch) {
    scripts.push({ type: 'external', src: srcMatch[1], attrs: attrs.trim() });
  } else {
    inlineCount++;
    const filename = `raw/inline_${inlineCount}.js`;
    fs.writeFileSync(path.join(__dirname, filename), content, 'utf8');
    scripts.push({
      type: 'inline',
      file: filename,
      length: content.length,
      snippet: content.slice(0, 100).replace(/\r?\n/g, ' ')
    });
  }
}

console.log('Script count:', scripts.length);
console.log(JSON.stringify(scripts, null, 2));

// Check meta tags or embedded JSON (like __NEXT_DATA__, nuxt, or nonces)
const nonceMatches = [...html.matchAll(/nonce=["']([^"']+)["']/gi)].map(m => m[1]);
console.log('Found nonces in HTML:', nonceMatches);

const hiddenInputs = [...html.matchAll(/<input[^>]+type=["']hidden["'][^>]*>/gi)].map(m => m[0]);
console.log('Hidden inputs:', hiddenInputs);

// Check if there are script links like /_next/ or static chunks
const linkRegex = /<link\b([^>]*)>/gi;
const links = [];
while ((match = linkRegex.exec(html)) !== null) {
  const attrs = match[1];
  if (/as=["']script["']/i.test(attrs) || /rel=["']modulepreload["']/i.test(attrs)) {
    const hrefMatch = /href=["']([^"']+)["']/i.exec(attrs);
    if (hrefMatch) links.push(hrefMatch[1]);
  }
}
console.log('Preloaded script links:', links);

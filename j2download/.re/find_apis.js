const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'raw');
const files = fs.readdirSync(dir);

const apiMap = {};
for (const f of files) {
  if (!f.endsWith('.js')) continue;
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const matches = [...content.matchAll(/["'](\/(?:api|static)\/[a-zA-Z0-9_\-\/]+)["']/g)].map(m => m[1]);
  if (matches.length > 0) {
    apiMap[f] = [...new Set(matches)];
  }
}

console.log(JSON.stringify(apiMap, null, 2));

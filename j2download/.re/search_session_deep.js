const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'raw');
const files = fs.readdirSync(dir);

for (const f of files) {
  if (!f.endsWith('.js')) continue;
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const matches = [...content.matchAll(/([^a-zA-Z0-9_]session[^a-zA-Z0-9_].{0,100})/g)];
  if (matches.length > 0) {
    console.log(`Found in: ${f}`);
    for (const m of matches.slice(0, 5)) {
      console.log('   ...', m[1].replace(/\r?\n/g, ' '), '...');
    }
  }
}

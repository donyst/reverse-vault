const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'raw');
const files = fs.readdirSync(dir);

for (const f of files) {
  if (!f.endsWith('.js')) continue;
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  if (content.includes('session=') || content.includes('document.cookie')) {
    console.log(`Found in: ${f}`);
    const matches = [...content.matchAll(/(.{0,80}(?:session=|document\.cookie).{0,80})/g)];
    for (const m of matches) {
      console.log('   ...', m[1].replace(/\r?\n/g, ' '), '...');
    }
  }
}

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'raw');
const files = fs.readdirSync(dir);

for (const file of files) {
  if (!file.endsWith('.js') && !file.endsWith('.html')) continue;
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  if (content.includes('powChallenge') || content.includes('__BOOTSTRAP__') || content.includes('powDifficulty')) {
    console.log(`Found in: ${file}`);
    const matches = [...content.matchAll(/(.{0,100}(?:powChallenge|__BOOTSTRAP__|powDifficulty).{0,100})/g)];
    for (const m of matches) {
      console.log('   ...', m[1].replace(/\r?\n/g, ' '), '...');
    }
  }
}

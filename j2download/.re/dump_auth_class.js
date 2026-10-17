const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, 'raw/app-B9ZSfaY9.js'), 'utf8');

const startIdx = code.indexOf('class{constructor(){this.accessToken=""');
console.log('Start index:', startIdx);
if (startIdx !== -1) {
  // Grab 4000 characters
  console.log(code.slice(startIdx, startIdx + 4500));
}

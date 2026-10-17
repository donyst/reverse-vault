const fs = require('fs');
const path = require('path');
const https = require('https');

const COOKIE = "session=68718ecc191b88aee567179b3169cd78; cf_clearance=DnHQws86oqmiMsibFPe_0c1.MUuU0XMf8EeUPNlfdsA-1792263995-1.2.1.1-e81g2cXWI6yjanJD4xwOxxM9w_i279JS83It0Z3W6mk5tdq2iI04RGOc2IUQlZNgkqRNKknj4Ev8rYFoyW21rJ8vy6mi1.v7JZXCDzEKRzthStUf2w2PMIFXHVXnWErkeQUpkP2BetxA4JsC35Lhr0lUN5QvUExEgoplyJwId3gSx9d.FUuLdy2znVRHFyNBrcktQ9Q8c.pEUzf0eU3iuWQFfp2rwIkPUevx5pi023cSKpo.QFcrkHog0baMI4djknPFgeRGrsBLDmDYHDjbOiXKT35Gu8sK1TIXmtEpS7muPiO8pTmb5OZD1d0j83.wChNsnbKke4A0ndGjt9krZzZhG7qjAyf7WvlFDRg10R1KjmzEfcLMeXaJJgbPUPpeG5nc1k9DNA_bjSvESeuYJxz.je.WkoyZ_c8qBPfIGgu_ggSMClSdfUTIZGnvvAIX6qsrnnuADaPsmE0YtESrYQ";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

function downloadFile(urlPath, targetFile) {
  return new Promise((resolve, reject) => {
    const fullUrl = urlPath.startsWith('http') ? urlPath : `https://j2download.com${urlPath}`;
    console.log(`[+] Downloading: ${fullUrl}`);
    const req = https.get(fullUrl, {
      headers: {
        'user-agent': UA,
        'cookie': COOKIE,
        'referer': 'https://j2download.com/vi'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, targetFile).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${fullUrl}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(targetFile, buf);
        console.log(`    -> Saved ${targetFile} (${buf.length} bytes)`);
        resolve(buf.toString('utf8'));
      });
    });
    req.on('error', reject);
  });
}

const rawDir = path.join(__dirname, 'raw');
if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

const initialList = [
  '/assets/app-B9ZSfaY9.js',
  '/assets/vendor-vue-CyRRKMXb.js',
  '/assets/i18n-core-SW5zhhxG.js',
  '/assets/vendor-vue-loading-BR8HObxk.js',
  '/assets/vendor-unhead-BB1-HQHg.js',
  '/assets/vendor-vue-router-CB7NlpgI.js',
  '/assets/vendor-axios-DuLq-1_y.js',
  '/assets/Home-x3fYF7c2.js',
  '/assets/Footer-CThZx_ZD.js'
];

async function main() {
  const downloaded = new Set();
  const queue = [...initialList];

  while (queue.length > 0) {
    const assetPath = queue.shift();
    if (downloaded.has(assetPath)) continue;
    downloaded.add(assetPath);

    const filename = path.basename(assetPath);
    const targetFile = path.join(rawDir, filename);

    try {
      const code = await downloadFile(assetPath, targetFile);

      // Search for more chunks: e.g. /assets/[a-zA-Z0-9_-]+\.js or import("./...")
      const chunkMatches = code.matchAll(/["'](\/assets\/[a-zA-Z0-9_\-]+\.js)["']/g);
      for (const m of chunkMatches) {
        if (!downloaded.has(m[1]) && !queue.includes(m[1])) {
          queue.push(m[1]);
        }
      }
      // Also look for relative "./filename.js" or "filename.js"
      const relativeMatches = code.matchAll(/["'](\.\/([a-zA-Z0-9_\-]+\.js))["']/g);
      for (const m of relativeMatches) {
        const full = `/assets/${m[2]}`;
        if (!downloaded.has(full) && !queue.includes(full)) {
          queue.push(full);
        }
      }
    } catch (err) {
      console.error(`[-] Failed ${assetPath}:`, err.message);
    }
  }

  console.log(`\n[✓] Done! Total scripts downloaded: ${downloaded.size}`);
}

main();

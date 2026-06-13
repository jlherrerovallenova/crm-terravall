const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  const html = await fetch('https://terravallpromociones.com/');
  const cssRegex = /href="([^"]+\.css[^"]*)"/g;
  let match;
  let colors = {};
  
  while ((match = cssRegex.exec(html)) !== null) {
    let url = match[1];
    if (url.startsWith('/')) url = 'https://terravallpromociones.com' + url;
    if (!url.startsWith('http')) continue;
    
    try {
      const css = await fetch(url);
      const hexRegex = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
      const matches = css.match(hexRegex) || [];
      matches.forEach(m => {
        colors[m.toLowerCase()] = (colors[m.toLowerCase()] || 0) + 1;
      });
    } catch (e) {
      // ignore
    }
  }

  const sorted = Object.entries(colors).sort((a,b) => b[1] - a[1]);
  console.log(sorted.slice(0, 30));
}

run();

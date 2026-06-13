const https = require('https');

https.get('https://terravallpromociones.com/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const hexRegex = /#[0-9a-fA-F]{3,6}/g;
    const matches = data.match(hexRegex) || [];
    const colors = {};
    matches.forEach(m => {
      colors[m.toLowerCase()] = (colors[m.toLowerCase()] || 0) + 1;
    });
    
    // Check for inline css variables or other colors like rgb
    const rgbRegex = /rgb\([^)]+\)/g;
    const rgbMatches = data.match(rgbRegex) || [];
    rgbMatches.forEach(m => {
      colors[m] = (colors[m] || 0) + 1;
    });

    const sorted = Object.entries(colors).sort((a,b) => b[1] - a[1]);
    console.log(sorted.slice(0, 20));
  });
});

const https = require('https');
https.get('https://terravallpromociones.com/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Just regex the html for any inline color or background-color
    const colorMatch = data.match(/color:\s*(#[0-9a-fA-F]{3,6})/g) || [];
    const bgMatch = data.match(/background-color:\s*(#[0-9a-fA-F]{3,6})/g) || [];
    const colors = [...colorMatch, ...bgMatch];
    console.log("Found colors:", [...new Set(colors)]);
  });
});

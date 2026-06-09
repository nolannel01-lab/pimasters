#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build
console.log('🏗️ Building PiVault project...');
execSync('npm run build', { stdio: 'inherit' });

// Find the generated bundles
const assetsDir = path.join(__dirname, 'dist', 'client', 'assets');
const jsFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));
const cssFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('styles-') && f.endsWith('.css'));

if (jsFiles.length === 0) {
  console.error('❌ No JavaScript bundles found in dist/client/assets');
  process.exit(1);
}

// Get the largest JS file (the main app bundle)
const mainBundle = jsFiles.sort((a, b) => {
  const sizeA = fs.statSync(path.join(assetsDir, a)).size;
  const sizeB = fs.statSync(path.join(assetsDir, b)).size;
  return sizeB - sizeA;
})[0];

const cssFile = cssFiles[0] || 'styles.css';

console.log(`✅ Main bundle: ${mainBundle} (${(fs.statSync(path.join(assetsDir, mainBundle)).size / 1024 / 1024).toFixed(2)}MB)`);
console.log(`✅ CSS file: ${cssFile}`);

// Create index.html in dist/client
const indexPath = path.join(__dirname, 'dist', 'client', 'index.html');
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>PiVault — Multi-wallet Pi balance & transactions</title>
    <meta name="author" content="PiVault">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">
    <meta name="theme-color" content="#000000">
    <link rel="stylesheet" href="/assets/${cssFile}">
    <style>
        body { margin: 0; padding: 0; }
        #root { display: flex; min-height: 100vh; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/assets/${mainBundle}"><\/script>
    <script>
        // Fallback message if JavaScript fails to load
        window.addEventListener('load', function() {
            if (!document.getElementById('root').firstChild) {
                console.error('Failed to load application');
            }
        }, { once: true });
    <\/script>
</body>
</html>`;

fs.writeFileSync(indexPath, indexHtml);
console.log(`✅ Generated index.html at ${indexPath}`);
console.log('🎉 Build complete! Ready for deployment.');

</head>
<body>
    <div id="root"></div>
    <script type="module" src="/assets/${mainBundle}"></script>
</body>
</html>`;

fs.writeFileSync(indexPath, indexHtml);
console.log(`✅ Generated index.html at ${indexPath}`);
console.log('🎉 Build complete! Ready for deployment.');

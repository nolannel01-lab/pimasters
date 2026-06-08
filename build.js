#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build
console.log('Building...');
execSync('npm run build', { stdio: 'inherit' });

// Create index.html in dist/client
const indexPath = path.join(__dirname, 'dist', 'client', 'index.html');
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PiVault — Multi-wallet Pi balance & transactions</title>
    <meta name="author" content="Lovable">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">
    <meta name="theme-color" content="#000000">
    <link rel="stylesheet" href="/assets/styles-B6YQhjiv.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/assets/index-DKIazoO8.js"></script>
</body>
</html>`;

fs.writeFileSync(indexPath, indexHtml);
console.log('✅ Built successfully!');

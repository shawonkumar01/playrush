const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
let errors = 0;
let warnings = 0;

function checkFileExists(relPath) {
  const full = path.join(rootDir, relPath);
  if (!fs.existsSync(full)) {
    console.error(`[ERROR] Missing file: ${relPath}`);
    errors++;
    return false;
  }
  return true;
}

console.log('--- Checking File Existence ---');
const requiredFiles = [
  'index.html',
  'style.css',
  'script.js',
  'games/neon-dodge.html',
  'games/neon-dodge.css',
  'games/neon-dodge.js',
  'privacy.html',
  'about.html',
  'robots.txt',
  'sitemap.xml',
  'server.js'
];

requiredFiles.forEach(checkFileExists);

console.log('\n--- Checking index.html ID References in script.js ---');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const scriptJs = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');

// Extract getElementById calls
const scriptIds = [...scriptJs.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
scriptIds.forEach(id => {
  if (!indexHtml.includes(`id="${id}"`)) {
    console.error(`[ERROR] ID "${id}" in script.js not found in index.html`);
    errors++;
  } else {
    console.log(`[OK] ID "${id}" verified in index.html`);
  }
});

console.log('\n--- Checking neon-dodge.html ID References in neon-dodge.js ---');
const gameHtml = fs.readFileSync(path.join(rootDir, 'games/neon-dodge.html'), 'utf8');
const gameJs = fs.readFileSync(path.join(rootDir, 'games/neon-dodge.js'), 'utf8');

const gameIds = [...gameJs.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
gameIds.forEach(id => {
  if (!gameHtml.includes(`id="${id}"`)) {
    console.error(`[ERROR] ID "${id}" in neon-dodge.js not found in games/neon-dodge.html`);
    errors++;
  } else {
    console.log(`[OK] ID "${id}" verified in games/neon-dodge.html`);
  }
});

console.log('\n--- Checking Links in index.html ---');
const links = [...indexHtml.matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map(m => m[1]);
links.forEach(l => {
  if (l.startsWith('http') || l.startsWith('data:')) return;
  const target = path.join(rootDir, l);
  if (!fs.existsSync(target)) {
    console.error(`[ERROR] Broken link in index.html: ${l}`);
    errors++;
  } else {
    console.log(`[OK] Link "${l}" resolves to ${target}`);
  }
});

console.log('\n--- Checking Links in games/neon-dodge.html ---');
const gameLinks = [...gameHtml.matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map(m => m[1]);
gameLinks.forEach(l => {
  if (l.startsWith('http') || l.startsWith('data:')) return;
  const target = path.join(rootDir, 'games', l);
  if (!fs.existsSync(target)) {
    console.error(`[ERROR] Broken link in games/neon-dodge.html: ${l}`);
    errors++;
  } else {
    console.log(`[OK] Link "${l}" resolves to ${target}`);
  }
});

console.log(`\n================================`);
console.log(`Validation Complete: ${errors} Errors, ${warnings} Warnings`);
console.log(`================================`);
process.exit(errors === 0 ? 0 : 1);

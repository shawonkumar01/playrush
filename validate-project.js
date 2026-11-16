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
  'games/cyber-runner.html',
  'games/cyber-runner.css',
  'games/cyber-runner.js',
  'games/killer-killer.html',
  'games/killer-killer.css',
  'games/killer-killer.js',
  'privacy.html',
  'about.html',
  'about.js',
  'robots.txt',
  'sitemap.xml',
  'server.js',
  'vercel.json',
  '.gitignore',
  'SECURITY_AUDIT.md',
  'FINAL_SITE_AUDIT.md',
  'FINAL_SECURITY_REVIEW.md'
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

console.log('\n--- Checking cyber-runner.html ID References in cyber-runner.js ---');
const crHtml = fs.readFileSync(path.join(rootDir, 'games/cyber-runner.html'), 'utf8');
const crJs = fs.readFileSync(path.join(rootDir, 'games/cyber-runner.js'), 'utf8');

const crIds = [...crJs.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
crIds.forEach(id => {
  if (!crHtml.includes(`id="${id}"`)) {
    console.error(`[ERROR] ID "${id}" in cyber-runner.js not found in games/cyber-runner.html`);
    errors++;
  } else {
    console.log(`[OK] ID "${id}" verified in games/cyber-runner.html`);
  }
});

console.log('\n--- Checking killer-killer.html ID References in killer-killer.js ---');
const kkHtml = fs.readFileSync(path.join(rootDir, 'games/killer-killer.html'), 'utf8');
const kkJs = fs.readFileSync(path.join(rootDir, 'games/killer-killer.js'), 'utf8');

const kkIds = [...kkJs.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
kkIds.forEach(id => {
  if (id.startsWith('editPlayerInput_') || id.startsWith('btnSaveEdit_') || id.startsWith('btnEditPlayer_') || id.startsWith('btnRemovePlayer_')) {
    return;
  }
  if (!kkHtml.includes(`id="${id}"`)) {
    console.error(`[ERROR] ID "${id}" in killer-killer.js not found in games/killer-killer.html`);
    errors++;
  } else {
    console.log(`[OK] ID "${id}" verified in games/killer-killer.html`);
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
  if (l.startsWith('http') || l.startsWith('data:') || l.startsWith('mailto:')) return;
  const target = path.join(rootDir, 'games', l);
  if (!fs.existsSync(target)) {
    console.error(`[ERROR] Broken link in games/neon-dodge.html: ${l}`);
    errors++;
  } else {
    console.log(`[OK] Link "${l}" resolves to ${target}`);
  }
});

console.log('\n--- Checking Links in games/cyber-runner.html ---');
const crLinks = [...crHtml.matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map(m => m[1]);
crLinks.forEach(l => {
  if (l.startsWith('http') || l.startsWith('data:') || l.startsWith('mailto:')) return;
  const target = path.join(rootDir, 'games', l);
  if (!fs.existsSync(target)) {
    console.error(`[ERROR] Broken link in games/cyber-runner.html: ${l}`);
    errors++;
  } else {
    console.log(`[OK] Link "${l}" resolves to ${target}`);
  }
});

console.log('\n--- Checking Links in games/killer-killer.html ---');
const kkLinks = [...kkHtml.matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map(m => m[1]);
kkLinks.forEach(l => {
  if (l.startsWith('http') || l.startsWith('data:') || l.startsWith('mailto:')) return;
  const target = path.join(rootDir, 'games', l);
  if (!fs.existsSync(target)) {
    console.error(`[ERROR] Broken link in games/killer-killer.html: ${l}`);
    errors++;
  } else {
    console.log(`[OK] Link "${l}" resolves to ${target}`);
  }
});

console.log('\n--- Checking Links in about.html ---');
const aboutHtml = fs.readFileSync(path.join(rootDir, 'about.html'), 'utf8');
const aboutLinks = [...aboutHtml.matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map(m => m[1]);
aboutLinks.forEach(l => {
  if (l.startsWith('http') || l.startsWith('data:') || l.startsWith('mailto:')) return;
  const target = path.join(rootDir, l);
  if (!fs.existsSync(target)) {
    console.error(`[ERROR] Broken link in about.html: ${l}`);
    errors++;
  } else {
    console.log(`[OK] Link "${l}" resolves to ${target}`);
  }
});

console.log('\n--- Checking Links in privacy.html ---');
const privacyHtml = fs.readFileSync(path.join(rootDir, 'privacy.html'), 'utf8');
const privacyLinks = [...privacyHtml.matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map(m => m[1]);
privacyLinks.forEach(l => {
  if (l.startsWith('http') || l.startsWith('data:') || l.startsWith('mailto:')) return;
  const target = path.join(rootDir, l);
  if (!fs.existsSync(target)) {
    console.error(`[ERROR] Broken link in privacy.html: ${l}`);
    errors++;
  } else {
    console.log(`[OK] Link "${l}" resolves to ${target}`);
  }
});

console.log('\n--- Checking Script Src in HTML Files ---');
['index.html', 'about.html', 'privacy.html', 'games/neon-dodge.html', 'games/cyber-runner.html', 'games/killer-killer.html'].forEach(htmlFile => {
  const content = fs.readFileSync(path.join(rootDir, htmlFile), 'utf8');
  const baseDir = path.dirname(path.join(rootDir, htmlFile));
  const scripts = [...content.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  scripts.forEach(s => {
    if (s.startsWith('http')) return;
    const target = path.join(baseDir, s);
    if (!fs.existsSync(target)) {
      console.error(`[ERROR] Script "${s}" in ${htmlFile} not found at ${target}`);
      errors++;
    } else {
      console.log(`[OK] Script "${s}" in ${htmlFile} resolves to ${target}`);
    }
  });
});

console.log(`\n================================`);
console.log(`Validation Complete: ${errors} Errors, ${warnings} Warnings`);
console.log(`================================`);
process.exit(errors === 0 ? 0 : 1);

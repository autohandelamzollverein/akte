#!/usr/bin/env node
// Build script: bundles ./source into a single AES-GCM encrypted index.html.
// Usage:  PW='dein-passwort' node build.js
// Output: ./index.html  (für GitHub Pages: einfach committen + Pages aktivieren)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SOURCE = path.join(__dirname, 'source');
const TEMPLATE = path.join(__dirname, 'template.html');
const OUT = path.join(__dirname, 'index.html');
const PASSWORD = process.env.PW || 'CHANGE_ME';
const ITER = 250000;

function mimeFor(p) {
  const e = path.extname(p).toLowerCase();
  if (e === '.pdf') return 'application/pdf';
  if (e === '.png') return 'image/png';
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.gif') return 'image/gif';
  if (e === '.webp') return 'image/webp';
  if (e === '.md') return 'text/markdown';
  if (e === '.txt') return 'text/plain';
  return 'application/octet-stream';
}

function kindFor(p) {
  const e = path.extname(p).toLowerCase();
  if (e === '.md') return 'md';
  if (e === '.txt') return 'text';
  if (e === '.pdf') return 'pdf';
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(e)) return 'image';
  return 'binary';
}

function walk(dir, rel = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const out = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    // Normalize to NFC so Markdown references (typed in NFC) match macOS NFD filenames
    const nfcName = e.name.normalize('NFC');
    const relPath = rel ? rel + '/' + nfcName : nfcName;
    if (e.isDirectory()) {
      out.push({ type: 'dir', name: nfcName, path: relPath, children: walk(full, relPath) });
    } else {
      out.push({ type: 'file', name: nfcName, path: relPath, kind: kindFor(e.name), mime: mimeFor(e.name) });
    }
  }
  return out;
}

const tree = walk(SOURCE);
const files = {};

(function collect(nodes) {
  for (const n of nodes) {
    if (n.type === 'dir') { collect(n.children); continue; }
    const buf = fs.readFileSync(path.join(SOURCE, n.path));
    if (n.kind === 'md' || n.kind === 'text') {
      files[n.path] = { mime: n.mime, kind: n.kind, content: buf.toString('utf8') };
    } else {
      files[n.path] = { mime: n.mime, kind: n.kind, b64: buf.toString('base64') };
    }
  }
})(tree);

const manifest = {
  generated: new Date().toISOString(),
  title: 'Akte Auto-Tausch Kia/Suzuki — Anwaltsdokumentation',
  notes: [
    'Werkstattrechnung Kia Picanto wird noch korrigiert (aktuell vorläufige Version).',
    'TÜV-Bericht (HU) wird vom Prüfer neu ausgestellt — wird nachgereicht.'
  ],
  tree,
  files
};

const json = Buffer.from(JSON.stringify(manifest), 'utf8');
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(PASSWORD, salt, ITER, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cipher.update(json), cipher.final()]);
const tag = cipher.getAuthTag();

const blob = {
  v: 1,
  iter: ITER,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ct: Buffer.concat([ct, tag]).toString('base64')
};

const template = fs.readFileSync(TEMPLATE, 'utf8');
const html = template.replace('__PAYLOAD__', JSON.stringify(blob));
fs.writeFileSync(OUT, html);

const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
console.log('✓ Built', OUT);
console.log('  Size:', sizeMB, 'MB');
console.log('  Files bundled:', Object.keys(files).length);
console.log('  Password:', PASSWORD === 'CHANGE_ME' ? '⚠️  CHANGE_ME (Platzhalter — neu bauen mit:  PW="dein-pw" node build.js )' : '✓ gesetzt');

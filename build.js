// Rebuilds torah-abbreviations.js (and .min.js if terser is installed) from abbreviations.json.
// Usage:  node build.js        (optional minified build: npm install terser  first)
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const rows = JSON.parse(fs.readFileSync('abbreviations.json', 'utf8'));
const data = rows.map(r => ({ a: r.abbreviation, e: r.expansion, m: r.meaning, c: r.category, s: r.source }));
let src = fs.readFileSync('torah-abbreviations.src.js', 'utf8').split('__VERSION__').join(pkg.version);
const out = src.replace('/*DATA*/[]', JSON.stringify(data));
fs.writeFileSync('torah-abbreviations.js', out);
console.log('wrote torah-abbreviations.js with', data.length, 'entries');
let terser = null; try { terser = require('terser'); } catch (e) {}
if (terser) terser.minify(out, { format: { comments: /^!/ } }).then(r => { fs.writeFileSync('torah-abbreviations.min.js', r.code); console.log('wrote torah-abbreviations.min.js'); });
else console.log('terser not installed: skipped .min.js (run: npm install terser)');

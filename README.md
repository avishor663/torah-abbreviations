# Torah Abbreviations (ראשי תיבות) — searchable CDN library

A free, dependency-free JavaScript library and dataset of **1303 Torah, Talmud and rabbinic abbreviations**, with **automatic prefix handling**. Drop one `<script>` tag into any web page and look up abbreviations like `רש״י`, `ב״ק`, `תוד״ה` or `ת״ר` in Hebrew or English, with a ready-made search box, a text annotator, and plain functions you can call from your own code.

It works with prefixes automatically. Search `ולב״ד` and you get the entry for `ב״ד` (בית דין, "Court") plus the meaning of the prefixes: **ו** = and, **ל** = to/for, giving *"and + to/for + Court"*.

Everything runs in the browser (or Node). No server, no API key, no network calls after the file loads. The data is built into the script.

---

## Contents

1. [Quick start](#quick-start)
2. [Setting up your own CDN on GitHub](#setting-up-your-own-cdn-on-github)
3. [API reference](#api-reference)
4. [How matching works](#how-matching-works)
5. [How prefix handling works](#how-prefix-handling-works)
6. [The data](#the-data)
7. [Updating and adding abbreviations](#updating-and-adding-abbreviations)
8. [Data sources and licensing](#data-sources-and-licensing)
9. [Limitations](#limitations)
10. [Troubleshooting](#troubleshooting)
11. [Repository files](#repository-files)

---

## Quick start

Replace `USERNAME` and `REPO` with your GitHub username and repository name (see [Setting up your own CDN](#setting-up-your-own-cdn-on-github)).

### 1. Add the script

```html
<script src="https://cdn.jsdelivr.net/gh/USERNAME/REPO@v1.0.0/torah-abbreviations.min.js"></script>
```

For production, add a Subresource Integrity hash so the browser rejects the file if it was ever tampered with. This hash matches the v1.0.0 minified file in this repository:

```html
<script
  src="https://cdn.jsdelivr.net/gh/USERNAME/REPO@v1.0.0/torah-abbreviations.min.js"
  integrity="sha384-kkQqZt5AVPPl2fTJaXCCUg/6WVAANKMHNHj4nZ/KmPHAyh2VFFvvOEuyVkCKZGHK"
  crossorigin="anonymous"></script>
```

The script creates one global object, `TorahAbbr`.

### 2. Use it

```html
<!-- A complete search box in one line -->
<div id="search"></div>
<script>TorahAbbr.widget('#search');</script>
```

```js
// Look up one abbreviation (prefixes handled for you)
const r = TorahAbbr.define('ולב״ד');
console.log(r.expansion);   // "בית דין"
console.log(r.english);     // "and + to/for + Court"
console.log(r.hebrew);      // "ול־בית דין"
```

```html
<!-- Underline every abbreviation in a paragraph; hover or tap for the meaning -->
<p id="text">כתב רש״י בפירושו עה״ת שהרמב״ם פסק בהל׳ שבת</p>
<script>TorahAbbr.annotate('#text');</script>
```

A working demo is in `index.html`.

---

## Setting up your own CDN on GitHub

A GitHub repository becomes a CDN through [jsDelivr](https://www.jsdelivr.com/), which serves any public GitHub repository for free. You do not need to install anything. You can do all of this from the GitHub website or app.

1. **Create a public repository** on GitHub, for example named `torah-abbreviations`.
2. **Upload the files** from this package to the repository root (see [Repository files](#repository-files)). On the website: *Add file → Upload files*. The files that matter for the CDN are `torah-abbreviations.min.js`, `torah-abbreviations.js` and `abbreviations.json`. Upload all of them so the repository is complete.
3. **Create a release** so you get a fixed, cache-friendly version: *Releases → Create a new release → Choose a tag → type `v1.0.0` → Create new tag → Publish release*.
4. **Use the CDN URL.** jsDelivr serves files straight from your repository:

| What you want | URL pattern |
|---|---|
| A pinned version (recommended) | `https://cdn.jsdelivr.net/gh/USERNAME/REPO@v1.0.0/torah-abbreviations.min.js` |
| The latest release | `https://cdn.jsdelivr.net/gh/USERNAME/REPO/torah-abbreviations.min.js` |
| The `main` branch (changes often, cached for a while) | `https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/torah-abbreviations.min.js` |
| The raw data | `https://cdn.jsdelivr.net/gh/USERNAME/REPO@v1.0.0/abbreviations.json` |

5. **Optional: host the demo page.** In the repository go to *Settings → Pages*, choose *Deploy from a branch*, select `main` and `/ (root)`. After a minute `index.html` is live at `https://USERNAME.github.io/REPO/`.

**Why use a pinned version?** A URL with `@v1.0.0` always returns the same file, so your site never changes unexpectedly and the integrity hash always matches. When you publish an update, create a new release (`v1.1.0`) and change the version in your URL.

**If you update a file but the CDN still shows the old one:** jsDelivr caches branch URLs. Purge with `https://purge.jsdelivr.net/gh/USERNAME/REPO@main/torah-abbreviations.min.js` (open the link in a browser). Pinned release URLs do not need purging.

**npm / Node (optional):** you can also install straight from GitHub: `npm install github:USERNAME/REPO`, then `const TorahAbbr = require('torah-abbreviations');`

---

## API reference

All functions are on the global `TorahAbbr` object (or the module export in Node).

### `TorahAbbr.define(query, options?)`
The easiest function. Returns the **single best result** or `null`.

```js
TorahAbbr.define('לרש״י');
// {
//   type: "prefix",                 // "exact" | "prefix" | "latin" | "related"
//   alternatives: 0,                // how many other meanings exist (see lookup)
//   abbreviation: "רש״י",
//   expansion: "רבי שלמה יצחקי",
//   meaning: "Rashi",
//   category: "Rishonim and Acharonim (people)",
//   source: "Original compiled list",
//   prefixes: [ { letter: "ל", meaning: "to/for" } ],
//   hebrew: "ל־רבי שלמה יצחקי",       // prefix + expansion
//   english: "to/for + Rashi"         // prefix meaning + English meaning
// }
```
`prefixes`, `hebrew` and `english` appear only when a prefix was found. `alternatives` tells you when an abbreviation has more than one meaning, use `lookup` to see them all.

### `TorahAbbr.lookup(query, options?)`
Full result with every meaning, grouped by how it matched.

```js
TorahAbbr.lookup('ולב״ד');
// {
//   query: "ולב״ד",
//   normalized: "ולבד",
//   matches: [
//     { type: "prefix",
//       prefixes: [ {letter:"ו",meaning:"and"}, {letter:"ל",meaning:"to/for"} ],
//       entries: [ { abbreviation:"ב״ד", expansion:"בית דין", meaning:"Court",
//                    category:"…", source:"…",
//                    prefixes:[…], hebrew:"ול־בית דין", english:"and + to/for + Court" } ] }
//   ],
//   related: [ … ]        // looser matches (see below)
// }
```
- `matches` are **real hits**: an exact match, and/or every valid prefix split.
- `related` are **looser hits**: abbreviations that start with your letters, or whose Hebrew expansion or English meaning contains your text. Capped at 60.
- A single abbreviation with several meanings appears as several `entries` in one match.

Options: `{ category: "Name", related: true, maxRelated: 60 }`

### `TorahAbbr.search(query, options?)`
A flat array of everything: real matches first, then related. Each item has a `type` field. Handy for rendering a simple list.

### `TorahAbbr.splitPrefixes(word)`
Shows how a word can be split into prefixes plus a known abbreviation.

```js
TorahAbbr.splitPrefixes('ובב״ק');
// [ { prefixes: [ {letter:"ו",meaning:"and"}, {letter:"ב",meaning:"in/with"} ], rest: "בק" } ]
```
`rest` is the normalized abbreviation that was found.

### `TorahAbbr.normalize(text)`
Reduces Hebrew text to bare letters: removes vowel marks, quotes, geresh and gershayim, spaces and punctuation, and converts final letters (ך ם ן ף ץ) to regular ones. `normalize('רמב״ם')` gives `"רמבמ"`.

### `TorahAbbr.annotateText(text, options?)`
Finds abbreviations in a block of text and returns segments:

```js
TorahAbbr.annotateText('כתב רש״י ובב״ק');
// [ { text: "כתב ", match: null },
//   { text: "רש״י",  match: { …same shape as define() } },
//   { text: " ", match: null },
//   { text: "ובב״ק", match: { … } } ]
```
By default only words that **contain a quote mark** (״ " ” inside the word, or ׳ ' at the end) are treated as abbreviations. That prevents ordinary words from being mistaken for abbreviations. Pass `{ requireMarker: false }` to test every Hebrew word instead (more matches, more false positives).

### `TorahAbbr.toHTML(text, options?)`
Same as `annotateText`, but returns a safe HTML string where each abbreviation is wrapped in `<abbr class="torah-abbr" title="…">`. The text is HTML-escaped. Option: `{ className: "my-class" }`.

### `TorahAbbr.annotate(elementOrSelector, options?)`
Modifies the page: wraps abbreviations inside an element's text in `<abbr>` tags with the meaning as a tooltip. Skips `<script>`, `<style>`, `<textarea>`, `<input>`, `<code>`, `<pre>` and existing `<abbr>` tags. Returns the number of abbreviations marked. Style them with CSS:

```css
abbr.torah-abbr { text-decoration: underline dotted; cursor: help; }
```

### `TorahAbbr.widget(elementOrSelector, options?)`
Renders the full search interface (search box, category filter, result cards, prefix explanation) inside an element. Returns `{ search(q), destroy() }`.

```js
const w = TorahAbbr.widget('#search', { placeholder: 'Search…' });
w.search('רש״י');   // run a search from code
```
Colors adapt to your page. You can override them with CSS variables on the container: `--ta-fg`, `--ta-bg`, `--ta-bd`, `--ta-ac`.

### `TorahAbbr.categories()` and `TorahAbbr.all()`
`categories()` returns `{ "Category name": count, … }`. `all()` returns every entry as a plain object.

### `TorahAbbr.version` and `TorahAbbr.count`
The library version and the number of entries.

---

## How matching works

- **Punctuation is ignored.** `רש״י`, `רש"י`, `רש'י` and `רשי` all find Rashi. Vowel marks are ignored. Final letters are treated the same as regular ones, so `רמב״ם` and `רמבמ` match.
- **Quote marks narrow results when you type them.** If you type a gershayim (״ or `"`), only abbreviations written with a gershayim are shown first. For example `ת״ר` returns *תנו רבנן* and not *תר׳* (Terumot). Type `תר׳` for Terumot. Type no punctuation to see both.
- **Hebrew or English.** Searching an English word or part of a name (`Rashi`, `court`, `Bava Kamma`) matches the English meanings. Searching Hebrew text matches the expansions too, so `בית דין` finds `ב״ד`.
- **Latin-letter abbreviations.** Scholarly abbreviations used in Jastrow's dictionary (`Ber.`, `Sabb.`, `B. Kam.`, `Y.`) are included. Their Latin spelling matches case-insensitively and ignores dots and spaces.
- **Multiple meanings.** Many abbreviations have more than one meaning (for example `ר״ל`). All of them are returned.

---

## How prefix handling works

Before looking for related matches, the library tries to peel Hebrew prefix letters off the front of the word. It only accepts a split if **what remains is a known abbreviation**, so it never invents one.

| Prefix | Meaning | Prefix | Meaning |
|---|---|---|---|
| ו | and | כ | like / as |
| ה | the | ש | that / which / who |
| ב | in / with / by | ד | of / that (Aramaic) |
| ל | to / for | מ | from |

**Order rule.** Prefixes must appear in this order, which follows Hebrew grammar: **ו**, then **ל / מ / ב**, then **כ**, then **ש / ד**, then **ה**. That allows real combinations such as `וה` (and the), `ול` (and to), `מש` (from that), `כש` (when/like that), `לכש` (to when), `וכשה`, and rejects impossible ones. A remaining abbreviation must be at least 2 letters long. Up to 5 prefixes can be stacked.

**Output.** Each prefix is returned with its meaning. The library also builds a combined Hebrew form and combined English form:

- `ל` + `ב״ד` → `ל־בית דין`, "to/for + Court"
- `וב` + `ב״ק` → `וב־בבא קמא`, "and + in/with + Bava Kamma"

When `ה` follows ב, ל or כ, it is dropped from the combined Hebrew form, since Hebrew writes that combination with a single letter (the vowel changes instead).

**Ambiguity.** A word can sometimes be read more than one way (for example `ולכשבא` could split as ו + ל + כש + `ב״א`). All valid readings are returned, ordered with the fewest prefixes first. Pick the one that makes sense in context.

---

## The data

`abbreviations.json` is an array of objects:

| Field | Description |
|---|---|
| `abbreviation` | The abbreviation as written, with gershayim or geresh |
| `expansion` | The full Hebrew or Aramaic words |
| `meaning` | English meaning or translation |
| `category` | Topic grouping (see below) |
| `source` | Where the entry came from (see [sources](#data-sources-and-licensing)) |

`abbreviations.xlsx` has the same data as a spreadsheet, plus a "Sources & Notes" sheet.

### Categories

| Category | Entries |
|---|---|
| Chazal (Tannaim/Amoraim) | 45 |
| Gemara discourse and Talmudic terms | 458 |
| Halachic and ethical terminology | 4 |
| Halachic and theological terminology | 1 |
| Halachic terminology | 81 |
| Hebrew titles and honorifics | 32 |
| Jastrow dictionary abbreviations (Latin letters) | 109 |
| Midrashic terminology | 3 |
| Mishnah / tractate abbreviations | 57 |
| Places and geography | 2 |
| Places and institutions | 4 |
| Prayer and liturgy | 31 |
| Rishonim and Acharonim (people) | 154 |
| Tanach and biblical terminology | 1 |
| Tanach and theological terminology | 1 |
| Tanach books | 21 |
| Temple terminology | 1 |
| Textual and citation terminology | 117 |
| Textual and editorial terminology | 2 |
| Textual and linguistic terminology | 1 |
| Textual and manuscript terminology | 7 |
| Theological terminology | 69 |
| Works and commentaries | 102 |

---

## Updating and adding abbreviations

The library file contains a copy of the data, so after you change the data you rebuild it:

1. Edit `abbreviations.json`. Add an object with the five fields. Keep the format exactly as in the other entries.
2. If you are bumping the version, edit `version` in `package.json`.
3. Rebuild (needs [Node.js](https://nodejs.org/)):
   ```
   npm install terser     # one time, for the minified file
   node build.js
   ```
   This regenerates `torah-abbreviations.js` and `torah-abbreviations.min.js`. The library logic lives in `torah-abbreviations.src.js`; do not edit the generated files by hand.
4. Commit and push, then create a new release (for example `v1.1.0`) and update the version in your CDN URL. The SRI hash changes whenever the file changes, so recompute it:
   ```
   openssl dgst -sha384 -binary torah-abbreviations.min.js | openssl base64 -A
   ```
   and use `sha384-` followed by the result.

Duplicates are harmless in the search, but try to avoid exact repeats. If one abbreviation has several meanings, add one entry per meaning.

---

## Data sources and licensing

**Short version:** the code is MIT. The data is CC BY-SA 4.0 (credit required, share adaptations of the data under the same license). Full details and attributions are in [`DATA-LICENSE.md`](DATA-LICENSE.md). Please read it before publishing, and replace `[YOUR NAME]`, `USERNAME` and `REPO` in it and in `LICENSE`.

Entry counts by source label for this version:

| Source label | Entries |
|---|---|
| Original compiled list | 440 |
| Wikipedia: List of Hebrew / Aramaic abbreviations (CC BY-SA), cross-checked with standard sources | 258 |
| Added (Jastrow / Sefaria / standard sources) | 173 |
| Jastrow / Sefaria | 158 |
| Standard citation pattern | 114 |
| Jastrow, List of Abbreviations (public domain; via Sefaria) | 109 |
| Sefaria dictionary | 42 |
| My Jewish Learning: A Guide to Jewish Acronyms and Abbreviations | 6 |
| Standard sources | 2 |
| Sefaria dictionary / scholarly conventions | 1 |

- **Original compiled list.** The starting spreadsheet supplied by the repository owner. **The owner must be sure they have the right to publish it** (see below).
- **Wikipedia (List of Hebrew abbreviations, List of Aramaic acronyms, List of rabbis known by acronyms).** CC BY-SA 4.0. Wikipedia's own guidance is that facts cannot be copyrighted but the way a list is selected and arranged can be, so these entries were re-written and merged, and the data is released under the same license with attribution.
- **Jastrow (1903), "List of Abbreviations", via Sefaria.** Public domain.
- **My Jewish Learning guide.** A copyrighted article, consulted only to cross-check a few common entries. No wording was copied.
- **Standard sources and conventions.** Widely used abbreviations whose expansions are common knowledge in rabbinic literature.

**Using the CDN in your own site:** loading this library from your page does not require you to license your site under CC BY-SA. If you copy and redistribute the *data* (the JSON or spreadsheet), keep the credit line from `DATA-LICENSE.md` and release your copy under CC BY-SA 4.0.

**Not legal advice.** This section describes the licenses as understood when the package was prepared. It cannot guarantee that no one will ever object. If this will be commercial, or you have doubts about where any source came from, ask a lawyer who handles copyright or open-source licensing.

---

## Limitations

- **Not exhaustive.** Rabbinic literature has many thousands of abbreviations. This is a strong starting set, not a complete one. Coverage is thinner for some letters and for obscure local or very recent abbreviations.
- **Not every entry has been independently verified.** Entries were compiled from the sources above and from standard knowledge. If you find an error, fix it in `abbreviations.json` and rebuild.
- **Prefixes only, not suffixes.** The library handles prefix letters. It does not strip suffixes such as plural or possessive endings.
- **Abbreviations that look like words.** In free text, a short abbreviation can coincide with an ordinary word. That is why `annotateText` and `annotate` require a quote mark by default.
- **One meaning is not always the right one.** `define()` returns the first match. Check `alternatives` and use `lookup()` when an abbreviation has several meanings.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `TorahAbbr is not defined` | The script did not load. Check the URL (username, repo name, tag), and that the repository is public. Put your own script after the library script. |
| The CDN returns 404 | The release tag does not exist yet, or the filename is wrong. Names are case-sensitive. |
| Old version still appears | You are using a branch URL. Purge it (see above) or switch to a pinned release URL. |
| Integrity check fails | The file changed since the hash was computed. Recompute the hash for the exact file you published and the exact URL you use. |
| `widget` or `annotate` does nothing | The element must exist when the code runs. Put the script after the element, or run it on `DOMContentLoaded`. |
| Hebrew shows backwards or oddly | Add `dir="rtl"` to the element showing Hebrew text. |
| An ordinary word is marked as an abbreviation | Keep `requireMarker` at its default (`true`). |

---

## Repository files

| File | Purpose |
|---|---|
| `torah-abbreviations.min.js` | **Use this one on websites.** Library plus data, minified |
| `torah-abbreviations.js` | Same library, readable build |
| `torah-abbreviations.src.js` | Library source without data. Edit this, then rebuild |
| `abbreviations.json` | The data. Edit this to add or fix entries |
| `abbreviations.xlsx` | The data as a spreadsheet |
| `build.js` | Rebuilds the library files from the source and data |
| `index.html` | Demo page (search box and annotator) |
| `package.json` | Package information and version |
| `LICENSE` | MIT license for the code |
| `DATA-LICENSE.md` | CC BY-SA 4.0 license, credit line and source attributions for the data |
| `README.md` | This file |

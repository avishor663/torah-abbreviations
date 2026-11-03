/*! torah-abbreviations v__VERSION__ | code: MIT | data: CC BY-SA 4.0, see DATA-LICENSE.md */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TorahAbbr = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '__VERSION__';
  var DATA = /*DATA*/[];
  var FIN = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  // letter -> [rank, English gloss]. Prefixes must appear in rank order (ו < ל/מ/ב < כ < ש/ד < ה).
  var PRE = { 'ו': [0, 'and'], 'ל': [1, 'to/for'], 'מ': [1, 'from'], 'ב': [1, 'in/with'], 'כ': [2, 'like/as'], 'ש': [3, 'that/which'], 'ד': [3, 'of/that'], 'ה': [4, 'the'] };
  var GER2 = /[״"”“]/, GER1 = /[׳'’‘]/;

  function normalize(s) {
    return String(s == null ? '' : s).replace(/[\u0591-\u05C7]/g, '').replace(/[^\u05D0-\u05EA]/g, '').replace(/[ךםןףץ]/g, function (c) { return FIN[c]; });
  }

  var IDX = new Map();
  DATA.forEach(function (e) {
    e.k = normalize(e.a); e.x = normalize(e.e);
    e.la = (e.a || '').toLowerCase().replace(/[^a-z]/g, '');
    e.kl = ((e.a || '') + ' ' + (e.m || '') + ' ' + (e.c || '')).toLowerCase();
    if (e.k) { if (!IDX.has(e.k)) IDX.set(e.k, []); IDX.get(e.k).push(e); }
  });

  function split(k) {
    var out = [];
    (function rec(rest, chain) {
      if (chain.length >= 5) return;
      var c = rest[0], p = PRE[c];
      if (!p) return;
      var prev = chain[chain.length - 1];
      if (prev) {
        var pr = PRE[prev];
        if (!(p[0] > pr[0]) || (pr[0] === 1 && p[0] === 2 && prev !== 'ל')) return;
      }
      var r = rest.slice(1), ch = chain.concat(c);
      if (r.length < 2) return;
      if (IDX.has(r)) out.push({ prefixes: ch, rest: r, entries: IDX.get(r) });
      rec(r, ch);
    })(k, []);
    return out.sort(function (a, b) { return a.prefixes.length - b.prefixes.length; });
  }

  function compose(chain, e) {
    var he = chain.filter(function (c, i) { return !(c === 'ה' && 'בלכ'.indexOf(chain[i - 1] || 'x') > -1); }).join('') + '־' + e.e;
    return { he: he, en: chain.map(function (c) { return PRE[c][1]; }).join(' + ') + ' + ' + e.m };
  }

  function pub(e, chain) {
    var o = { abbreviation: e.a, expansion: e.e, meaning: e.m, category: e.c, source: e.s };
    if (chain && chain.length) {
      var c = compose(chain, e);
      o.prefixes = chain.map(function (l) { return { letter: l, meaning: PRE[l][1] }; });
      o.hebrew = c.he; o.english = c.en;
    }
    return o;
  }

  function lookup(query, opts) {
    opts = opts || {};
    var q = String(query == null ? '' : query), k = normalize(q), latin = /[a-z]/i.test(q), cat = opts.category;
    var ok = function (e) { return !cat || e.c === cat; };
    var g2 = GER2.test(q), g1 = !g2 && GER1.test(q);
    var matches = [], seen = new Set();
    function add(type, chain, list) {
      list.forEach(function (e) { seen.add(e); });
      var t = g2 ? GER2 : g1 ? GER1 : null, es = list;
      if (t) { var f = list.filter(function (e) { return t.test(e.a); }); if (f.length) es = f; }
      es = es.filter(ok);
      if (es.length) matches.push({ type: type, prefixes: chain.map(function (l) { return { letter: l, meaning: PRE[l][1] }; }), entries: es.map(function (e) { return pub(e, chain); }) });
    }
    if (k && IDX.has(k)) add('exact', [], IDX.get(k));
    if (k) split(k).forEach(function (s) { add('prefix', s.prefixes, s.entries); });
    if (latin) {
      var lk = q.toLowerCase().replace(/[^a-z]/g, '');
      var ex = DATA.filter(function (e) { return e.la && e.la === lk; });
      if (ex.length) add('latin', [], ex);
    }
    var related = [];
    if (opts.related !== false && (k || latin)) {
      var lat = latin ? q.trim().toLowerCase() : '', max = opts.maxRelated || 60;
      for (var i = 0; i < DATA.length && related.length < max; i++) {
        var e = DATA[i];
        if (seen.has(e) || !ok(e)) continue;
        if ((k.length >= 3 && e.k.indexOf(k) === 0) || (k.length >= 3 && e.x.indexOf(k) > -1) || (lat.length >= 3 && e.kl.indexOf(lat) > -1)) related.push(e);
      }
      if (lat) related.sort(function (a, b) { var r = function (e) { var m = (e.m || '').toLowerCase(); return m === lat ? 0 : m.indexOf(lat) === 0 ? 1 : 2; }; return r(a) - r(b); });
    }
    return { query: q, normalized: k, matches: matches, related: related.map(function (e) { return pub(e); }) };
  }

  function define(query, opts) {
    var r = lookup(query, Object.assign({}, opts, { related: /[a-z]/i.test(String(query)) })), m = r.matches[0];
    if (!m) return r.related.length ? Object.assign({ type: 'related', alternatives: r.related.length - 1 }, r.related[0]) : null;
    var total = r.matches.reduce(function (n, x) { return n + x.entries.length; }, 0);
    return Object.assign({ type: m.type, alternatives: total - 1 }, m.entries[0]);
  }

  function search(query, opts) {
    var r = lookup(query, opts), out = [];
    r.matches.forEach(function (m) { m.entries.forEach(function (e) { out.push(Object.assign({ type: m.type }, e)); }); });
    r.related.forEach(function (e) { out.push(Object.assign({ type: 'related' }, e)); });
    return out;
  }

  var RE_MARK = /[\u05D0-\u05EA]+(?:["״”][\u05D0-\u05EA]+)+['׳’]?|[\u05D0-\u05EA]+['׳’]/g;
  var RE_ANY = /[\u05D0-\u05EA]+(?:["״”'׳’][\u05D0-\u05EA]*)*/g;

  function annotateText(text, opts) {
    opts = opts || {};
    text = String(text == null ? '' : text);
    var re = new RegExp((opts.requireMarker === false ? RE_ANY : RE_MARK).source, 'g'), segs = [], last = 0, m;
    while ((m = re.exec(text))) {
      var d = define(m[0], opts);
      if (!d) continue;
      if (m.index > last) segs.push({ text: text.slice(last, m.index), match: null });
      segs.push({ text: m[0], match: d });
      last = m.index + m[0].length;
    }
    if (last < text.length) segs.push({ text: text.slice(last), match: null });
    return segs;
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function titleOf(d) { return (d.hebrew || d.expansion) + ' — ' + (d.english || d.meaning); }

  function toHTML(text, opts) {
    var cls = (opts && opts.className) || 'torah-abbr';
    return annotateText(text, opts).map(function (s) {
      return s.match ? '<abbr class="' + esc(cls) + '" title="' + esc(titleOf(s.match)) + '">' + esc(s.text) + '</abbr>' : esc(s.text);
    }).join('');
  }

  function annotate(root, opts) {
    opts = opts || {};
    root = typeof root === 'string' ? document.querySelector(root) : (root || document.body);
    var skip = /^(SCRIPT|STYLE|TEXTAREA|INPUT|ABBR|CODE|PRE|SELECT)$/, nodes = [], count = 0;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = w.nextNode())) { if (!skip.test(n.parentNode.nodeName)) nodes.push(n); }
    nodes.forEach(function (node) {
      var segs = annotateText(node.nodeValue, opts);
      if (!segs.some(function (s) { return s.match; })) return;
      var frag = document.createDocumentFragment();
      segs.forEach(function (s) {
        if (!s.match) { frag.appendChild(document.createTextNode(s.text)); return; }
        var a = document.createElement('abbr');
        a.className = opts.className || 'torah-abbr'; a.title = titleOf(s.match); a.textContent = s.text;
        frag.appendChild(a); count++;
      });
      node.parentNode.replaceChild(frag, node);
    });
    return count;
  }

  function categories() { var c = {}; DATA.forEach(function (e) { c[e.c] = (c[e.c] || 0) + 1; }); return c; }
  function all() { return DATA.map(function (e) { return pub(e); }); }

  var CSS = '.ta-widget{font:16px/1.45 system-ui,sans-serif;color:var(--ta-fg,inherit)}.ta-widget *{box-sizing:border-box}.ta-q,.ta-cat{width:100%;font:inherit;padding:10px;margin:0 0 8px;border:1px solid var(--ta-bd,#ccc);border-radius:10px;background:var(--ta-bg,transparent);color:inherit}.ta-q{font-size:20px}.ta-card{border:1px solid var(--ta-bd,#ccc);border-radius:12px;padding:10px;margin:8px 0}.ta-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.ta-ab{font:700 22px "SBL Hebrew","Times New Roman",serif;color:var(--ta-ac,#8a5a14)}.ta-chip{font-size:12px;opacity:.7}.ta-ex{font:20px "SBL Hebrew","Times New Roman",serif;margin-top:4px}.ta-pre{margin-top:6px;padding:8px;border-radius:8px;font-size:14px;background:rgba(128,128,128,.15)}.ta-lab{font-weight:600;margin:12px 2px 0;color:var(--ta-ac,#8a5a14)}.ta-more{font:inherit;font-size:14px;padding:6px 12px;border:1px solid var(--ta-bd,#ccc);border-radius:99px;background:none;color:var(--ta-ac,#8a5a14);cursor:pointer}.ta-sm{font-size:13px;opacity:.7}';

  function widget(target, opts) {
    opts = opts || {};
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) throw new Error('TorahAbbr.widget: container not found');
    if (!document.getElementById('ta-style')) { var st = document.createElement('style'); st.id = 'ta-style'; st.textContent = CSS; document.head.appendChild(st); }
    el.classList.add('ta-widget');
    var cats = categories();
    el.innerHTML = '<input class="ta-q" dir="auto" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(opts.placeholder || 'Type an abbreviation, Hebrew word, or English…') + '"><select class="ta-cat"><option value="">All categories (' + DATA.length + ')</option>' + Object.keys(cats).sort().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select><div class="ta-out"></div>';
    var qi = el.querySelector('.ta-q'), cs = el.querySelector('.ta-cat'), out = el.querySelector('.ta-out');
    function card(e) {
      var p = e.prefixes ? '<div class="ta-pre">Prefix <b dir="rtl">' + esc(e.prefixes.map(function (x) { return x.letter + ' = ' + x.meaning; }).join(' · ')) + '</b><br>Full meaning: <b dir="rtl">' + esc(e.hebrew) + '</b><br>' + esc(e.english) + '</div>' : '';
      return '<div class="ta-card"><div class="ta-top"><span class="ta-ab" dir="auto">' + esc(e.abbreviation) + '</span><span class="ta-chip">' + esc(e.category) + '</span></div>' + p + '<div class="ta-ex" dir="auto">' + esc(e.expansion) + '</div><div>' + esc(e.meaning) + '</div><div class="ta-sm">' + esc(e.source || '') + '</div></div>';
    }
    function render() {
      var q = qi.value.trim(), cat = cs.value;
      if (!q) {
        out.innerHTML = cat ? DATA.filter(function (e) { return e.c === cat; }).sort(function (a, b) { return a.k < b.k ? -1 : 1; }).map(function (e) { return card(pub(e)); }).join('') : '<p class="ta-sm">Prefixes (ו ה ב ל מ כ ש ד) are handled automatically. Hebrew and English both work.</p>';
        return;
      }
      var r = lookup(q, { category: cat }), h = '';
      r.matches.forEach(function (m) {
        h += '<div class="ta-lab">' + (m.prefixes.length ? 'Prefix split: ' + esc(m.prefixes.map(function (x) { return x.letter; }).join('־')) + ' + ' + esc(m.entries[0].abbreviation) : 'Exact match' + (m.entries.length > 1 ? ' — ' + m.entries.length + ' meanings' : '')) + '</div>' + m.entries.map(card).join('');
      });
      if (r.related.length) {
        var rc = r.related.map(card).join('');
        h += r.matches.length ? '<div class="ta-lab"><button class="ta-more">Show ' + r.related.length + ' related matches</button></div><div hidden>' + rc + '</div>' : '<div class="ta-lab">Related matches</div>' + rc;
      }
      out.innerHTML = h || '<p class="ta-sm">No match. Try fewer letters, or the Hebrew/English meaning.</p>';
      var b = out.querySelector('.ta-more');
      if (b) b.onclick = function () { var p = b.parentNode, d = p.nextElementSibling; d.hidden = false; p.parentNode.removeChild(p); };
    }
    qi.oninput = render; cs.onchange = render; render();
    return { search: function (q) { qi.value = q; render(); }, destroy: function () { el.innerHTML = ''; el.classList.remove('ta-widget'); } };
  }

  return { version: VERSION, count: DATA.length, normalize: normalize, splitPrefixes: function (w) { return split(normalize(w)).map(function (s) { return { prefixes: s.prefixes.map(function (l) { return { letter: l, meaning: PRE[l][1] }; }), rest: s.rest }; }); }, lookup: lookup, define: define, search: search, annotateText: annotateText, toHTML: toHTML, annotate: annotate, widget: widget, categories: categories, all: all };
});

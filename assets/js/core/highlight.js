/* dsa.py — tiny Python highlighter with VS Code "Dark Modern" token classes.
 * DSA.parseCode(code)  -> { lines: [plain text], anchors: {name: lineNo} }
 * DSA.highlightPython(text) -> [html per line]
 * Lines may end with an anchor marker `#@name` that the animation refers to;
 * markers are stripped before display.
 */
(function (root) {
  'use strict';
  const DSA = root.DSA;

  const KW_CTRL = new Set('if elif else for while return break continue pass try except finally raise with yield import from as match case'.split(' '));
  const KW_DECL = new Set('def class lambda None True False and or not is in global nonlocal del assert async await'.split(' '));
  const TYPES = new Set('int float str bool list dict set tuple frozenset bytes object type range deque defaultdict Counter OrderedDict heapq collections bisect math functools itertools Optional List Dict Tuple Set'.split(' '));
  const BUILTINS = new Set('len print sorted min max sum abs enumerate zip map filter reversed iter next isinstance ord chr hash id divmod pow round super any all open input callable getattr setattr hasattr format repr vars'.split(' '));

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const RE = {
    comment: /#[^\n]*/y,
    string: /(?:[rRbBuUfF]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y,
    number: /(?:0[xXbBoO][\da-fA-F_]+|\d[\d_]*(?:\.\d*)?(?:[eE][+-]?\d+)?j?|\.\d+)/y,
    ident: /[A-Za-z_][A-Za-z0-9_]*/y,
    deco: /@[A-Za-z_][\w.]*/y,
    ws: /[ \t]+/y,
    op: /(?:\*\*=?|\/\/=?|<<=?|>>=?|->|:=|[-+*/%&|^~<>!=]=?|[()[\]{}:,.;])/y,
  };

  function tokenize(src) {
    const toks = [];
    let i = 0;
    let prevSig = null; // previous significant token
    let prevPrev = null;
    while (i < src.length) {
      const c = src[i];
      if (c === '\n') { toks.push({ t: 'nl', s: '\n' }); i++; continue; }
      let m = null;
      let type = null;
      for (const k of ['ws', 'comment', 'string', 'deco', 'ident', 'number', 'op']) {
        RE[k].lastIndex = i;
        const r = RE[k].exec(src);
        if (r && r.index === i && r[0].length) { m = r[0]; type = k; break; }
      }
      if (!m) { m = c; type = 'op'; }
      // an identifier directly followed by a quote could be a string prefix: handled by string regex order
      if (type === 'ident') {
        // lookahead for '('
        let j = i + m.length;
        while (src[j] === ' ') j++;
        const call = src[j] === '(';
        let cls = 'var';
        if (prevSig && prevSig.s === 'def') cls = 'fn';
        else if (prevSig && prevSig.s === 'class') cls = 'cls';
        else if (KW_CTRL.has(m)) cls = 'kw2';
        else if (KW_DECL.has(m)) cls = 'kw';
        else if (m === 'self' || m === 'cls') cls = 'self';
        else if (prevSig && prevSig.s === '.') cls = call ? 'fn' : 'prop';
        else if (TYPES.has(m)) cls = 'cls';
        else if (BUILTINS.has(m)) cls = call ? 'fn' : 'var';
        else if (call) cls = /^[A-Z]/.test(m) ? 'cls' : 'fn';
        else if (/^[A-Z][A-Z0-9_]+$/.test(m)) cls = 'const';
        else if (/^[A-Z]/.test(m)) cls = 'cls';
        toks.push({ t: cls, s: m });
      } else if (type === 'ws') {
        toks.push({ t: 'ws', s: m });
      } else if (type === 'op') {
        toks.push({ t: /[()[\]{}]/.test(m) ? 'br' : 'op', s: m });
      } else {
        toks.push({ t: type === 'deco' ? 'fn' : type === 'number' ? 'num' : type === 'string' ? 'str' : 'com', s: m });
      }
      if (type !== 'ws') { prevPrev = prevSig; prevSig = { s: m, t: type }; }
      i += m.length;
    }
    return toks;
  }

  // Colour bracket pairs like VS Code's bracket-pair colourisation.
  function highlightPython(src) {
    const toks = tokenize(src);
    const lines = [''];
    let depth = 0;
    for (const tk of toks) {
      if (tk.t === 'nl') { lines.push(''); continue; }
      let cls = tk.t;
      if (tk.t === 'br') {
        if ('([{'.includes(tk.s)) { cls = 'br' + (depth % 3); depth++; }
        else { depth = Math.max(0, depth - 1); cls = 'br' + (depth % 3); }
      }
      // multi-line strings: split across lines
      const parts = tk.s.split('\n');
      parts.forEach((p, k) => {
        if (k > 0) lines.push('');
        if (!p) return;
        lines[lines.length - 1] += cls === 'ws' ? p : `<span class="t-${cls}">${esc(p)}</span>`;
      });
    }
    return lines;
  }

  const ANCHOR = /[ \t]*#@([\w-]+(?:,[\w-]+)*)[ \t]*$/;

  function parseCode(code) {
    const raw = String(code).replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
    // strip common indentation (lets content files indent template literals)
    const ind = Math.min(...raw.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    const anchors = {};
    const lines = raw.map((l, idx) => {
      l = l.slice(Number.isFinite(ind) ? ind : 0);
      const m = l.match(ANCHOR);
      if (m) {
        m[1].split(',').forEach((name) => {
          if (anchors[name] == null) anchors[name] = idx + 1;
        });
        l = l.replace(ANCHOR, '');
      }
      return l;
    });
    return { lines, anchors, text: lines.join('\n') };
  }

  DSA.highlightPython = highlightPython;
  DSA.parseCode = parseCode;
  DSA.escapeHTML = esc;
})(typeof window !== 'undefined' ? window : globalThis);

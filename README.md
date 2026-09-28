# dsa.py

A Python interview refresher. Two sections, **Data Structures** (19 topics) and
**Algorithms** (55 topics). Each page has a short explanation, the Big-O, a picture
or step-by-step animation, and VS Code-style Python code with the running line highlighted.

## Run it locally

You don't need to install or build anything.

- **Easiest:** double-click `index.html`. It opens in your browser.
- **Or serve the folder** (handy if you're editing files):
  ```bash
  cd dsa-py
  python3 -m http.server 8000
  # open http://localhost:8000
  ```

There's also `dist/dsa-py.html`, the whole site in one file you can open or send to someone.

## Keyboard

| Key | Action |
|---|---|
| `Space` | play / pause |
| `←` `→` | step back / forward |
| `[` `]` | previous / next topic |
| `/` or `⌘K` | search every topic |
| `B` | show / hide the topic list |

## Deploy

It's a static site, so any static host works:

- **GitHub Pages:** push the folder to a repo, then turn on Settings → Pages → "Deploy from branch" (root).
- **Netlify / Vercel / Cloudflare Pages:** drag the folder in, or connect the repo. No build command; the output directory is `/`.

## Project layout

```
index.html                 page shell (content <script> list is auto-generated)
assets/css/styles.css      design tokens, liquid-glass controls, VS Code panel, SVG states
assets/js/core/
  registry.js              DSA.addDS / DSA.addAlgo, tracer, helpers (trees, graphs, random input)
  highlight.js             Python syntax highlighter + #@anchor parsing
  viz.js                   SVG renderers: array, graph, tree, grid, linked, stack, buckets, kv
  player.js                play / step / scrub / speed
assets/js/app.js           routing, top-nav dropdowns, collapsible topic list, search, topic pages, variant toggles
assets/js/content/ds/*.js    data structure topics
assets/js/content/algo/*.js  algorithm topics
tools/                     build, validate, screenshot and QA scripts
```

## Add or edit a topic

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full entry format. The short version:

```bash
python3 tools/build.py              # after adding a new content file
node tools/validate.js              # checks code anchors, runs every animation, renders every frame
python3 tools/build.py --single     # rebuild dist/dsa-py.html
```

`tools/qa.py` and `tools/shoot.py` need Playwright (`pip install playwright && playwright install chromium`).

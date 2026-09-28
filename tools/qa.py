#!/usr/bin/env python3
"""Load every topic + variant in headless Chromium, scrub through every frame,
and report JS errors, horizontal page overflow and clipped code lines.
Usage: python3 tools/qa.py [--mobile]"""
import asyncio, pathlib, sys, json
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
MOBILE = "--mobile" in sys.argv

JS_SCRUB = """async () => {
  const out = {frames: 0, errs: []};
  const sc = document.querySelector('#scrub');
  if (!sc) return out;
  const n = +sc.max + 1; out.frames = n;
  for (let i = 0; i < n; i++) {
    sc.value = i; sc.dispatchEvent(new Event('input'));
  }
  return out;
}"""
JS_METRICS = """() => {
  const r = {};
  r.pageOverflow = document.documentElement.scrollWidth - window.innerWidth;
  const ed = document.querySelector('#editor');
  if (ed) { r.codeOverflow = ed.scrollWidth - ed.clientWidth; }
  const va = document.querySelector('#vizArea');
  if (va) { r.vizEmpty = !va.querySelector('svg'); }
  return r;
}"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 860} if MOBILE else {"width": 1440, "height": 950})
        pg = await ctx.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "ERR_TUNNEL" not in m.text and "fonts.g" not in m.text else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto((ROOT / "index.html").as_uri() + "#home")
        await pg.wait_for_timeout(500)
        topics = await pg.evaluate("() => [...DSA.ds.map(e => ['d', e.id, (e.variants||[]).length]), ...DSA.algo.map(e => ['a', e.id, (e.variants||[]).length])]")
        problems = 0
        for k, tid, nv in topics:
            for vi in range(max(1, nv)):
                errs.clear()
                await pg.evaluate(f"() => {{ try {{ localStorage.setItem('dsapy:v:{tid}', '{vi}') }} catch(e) {{}} }}")
                await pg.evaluate(f"() => {{ location.hash = '#home'; }}")
                await pg.wait_for_timeout(30)
                await pg.evaluate(f"() => {{ location.hash = '#{k}.{tid}'; }}")
                await pg.wait_for_timeout(120)
                sc = await pg.evaluate(JS_SCRUB)
                m = await pg.evaluate(JS_METRICS)
                issues = []
                if errs: issues.append("errors: " + " | ".join(errs[:3]))
                if m.get("pageOverflow", 0) > 1: issues.append(f"page overflows by {m['pageOverflow']}px")
                if m.get("codeOverflow", 0) > 2 and not MOBILE: issues.append(f"code clipped by {m['codeOverflow']}px")
                if m.get("vizEmpty"): issues.append("no visual")
                if issues:
                    problems += 1
                    print(f"{k}.{tid}~{vi}: " + "; ".join(issues))
        print(f"checked {len(topics)} topics; {problems} with issues")
        await b.close()
asyncio.run(main())

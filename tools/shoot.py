#!/usr/bin/env python3
"""Screenshot pages for visual QA.
Usage: python3 tools/shoot.py OUT_DIR route[@step][:dark][:mobile] ...
  route  = home | ds | algo | d.<id> | a.<id>   (optionally a.<id>~<variantIndex>)
  @step  = advance the animation N steps (default 6)
Prints console errors.
"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
async def main(out, routes):
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--disable-web-security"])
        for r in routes:
            dark = ":dark" in r; mobile = ":mobile" in r
            r = r.replace(":dark", "").replace(":mobile", "")
            steps = 6
            if "@" in r: r, s = r.split("@"); steps = int(s)
            variant = None
            if "~" in r: r, variant = r.split("~"); variant = int(variant)
            ctx = await b.new_context(viewport={"width": 390, "height": 900} if mobile else {"width": 1440, "height": 1000},
                                      device_scale_factor=1, color_scheme="dark" if dark else "light")
            pg = await ctx.new_page()
            errs = []
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "ERR_TUNNEL" not in m.text and "fonts.g" not in m.text else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto((ROOT / "index.html").as_uri() + "#" + r)
            await pg.wait_for_timeout(700)
            if variant is not None:
                await pg.click(f'#variantSeg button[data-vi="{variant}"]'); await pg.wait_for_timeout(500)
            if await pg.query_selector("#bNext"):
                for _ in range(steps):
                    await pg.keyboard.press("ArrowRight")
                await pg.wait_for_timeout(900)
            name = r.replace(".", "_") + (f"_v{variant}" if variant is not None else "") + ("_dark" if dark else "") + ("_m" if mobile else "") + ".png"
            await pg.screenshot(path=str(out / name), full_page=True)
            print(name, "ERRORS:" if errs else "ok", *errs[:5])
            await ctx.close()
        await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2:]))

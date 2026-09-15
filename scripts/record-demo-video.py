"""Nimmt das Demo-Video «Facility365 in 2 Minuten» in der echten App auf (Playwright → WebM)."""
import asyncio, os, shutil, glob, json
from PIL import Image, ImageDraw, ImageFilter
from playwright.async_api import async_playwright

BASE = "http://localhost:3011"
RAW = "/home/ubuntu/deploy/demo_raw"
PHOTO = "/home/ubuntu/deploy/demo_photo.jpg"
W, H = 1280, 720
shutil.rmtree(RAW, ignore_errors=True)
os.makedirs(RAW, exist_ok=True)

# Realistisches «Schadenfoto» (Wasserfleck an Decke) synthetisch erzeugen.
img = Image.new("RGB", (960, 720), (236, 233, 226))
d = ImageDraw.Draw(img)
for i in range(6):
    d.ellipse((260 - i * 30, 180 - i * 20, 700 + i * 30, 520 + i * 20), fill=(190 - i * 6, 170 - i * 8, 140 - i * 10))
img = img.filter(ImageFilter.GaussianBlur(14))
d = ImageDraw.Draw(img)
d.rectangle((0, 660, 960, 720), fill=(120, 110, 95))
img.save(PHOTO, quality=85)

OVERLAY_JS = """
(() => {
  if (document.getElementById('f365-demo')) return;
  const root = document.createElement('div');
  root.id = 'f365-demo';
  root.innerHTML = `
  <style>
    #f365-demo * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    #f365-sub { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); max-width: 82%; z-index: 99998;
      background: rgba(15,23,42,.88); color: #fff; font-size: 26px; line-height: 1.3; font-weight: 500; padding: 14px 26px;
      border-radius: 14px; text-align: center; opacity: 0; transition: opacity .45s ease; pointer-events: none; box-shadow: 0 8px 30px rgba(0,0,0,.25); }
    #f365-sub.on { opacity: 1; }
    #f365-cur { position: fixed; z-index: 99999; width: 26px; height: 26px; margin: -13px 0 0 -13px; border-radius: 50%;
      background: rgba(37,99,235,.35); border: 3px solid #2563eb; pointer-events: none; transition: left .7s cubic-bezier(.4,0,.2,1), top .7s cubic-bezier(.4,0,.2,1), transform .15s; left: -100px; top: -100px; }
    #f365-cur.click { transform: scale(.6); background: rgba(37,99,235,.7); }
    #f365-card { position: fixed; inset: 0; z-index: 99997; background: linear-gradient(135deg,#0f172a,#1e3a8a); color: #fff;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; opacity: 0; transition: opacity .6s ease; pointer-events: none; }
    #f365-card.on { opacity: 1; }
    #f365-card h1 { font-size: 64px; font-weight: 700; margin: 0; letter-spacing: -.02em; }
    #f365-card p { font-size: 30px; margin: 0; opacity: .85; }
    #f365-card .step { font-size: 22px; opacity: .7; margin-top: 30px; }
    #f365-chapter { position: fixed; top: 18px; left: 50%; transform: translateX(-50%); z-index: 99998; background: #2563eb; color: #fff;
      font-size: 18px; font-weight: 600; padding: 8px 18px; border-radius: 999px; opacity: 0; transition: opacity .4s; pointer-events: none; }
    #f365-chapter.on { opacity: 1; }
  </style>
  <div id="f365-card"><h1></h1><p></p><div class="step"></div></div>
  <div id="f365-chapter"></div>
  <div id="f365-sub"></div>
  <div id="f365-cur"></div>`;
  document.body.appendChild(root);
})();
"""


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(
            viewport={"width": W, "height": H}, device_scale_factor=1, locale="de-CH",
            record_video_dir=RAW, record_video_size={"width": W, "height": H},
        )
        page = await ctx.new_page()
        await page.add_init_script(OVERLAY_JS)
        await page.goto(f"{BASE}/dashboard", wait_until="networkidle")
        if "/login" in page.url:
            await page.get_by_text("Lokal weiterarbeiten").click()
            await page.wait_for_url("**/dashboard")
        await page.wait_for_timeout(3000)
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1500)

        state = {"sub": None, "chapter": None, "card": None}
        marks = []  # (t_ms, text) fuer WebVTT
        t0 = asyncio.get_event_loop().time()

        def now_ms():
            return int((asyncio.get_event_loop().time() - t0) * 1000)

        async def ensure():
            await page.evaluate(OVERLAY_JS)
            # Zustand nach Navigation wiederherstellen
            await page.evaluate(
                """([s,c,card]) => {
                  const sub = document.getElementById('f365-sub'); sub.textContent = s || ''; sub.classList.toggle('on', !!s);
                  const ch = document.getElementById('f365-chapter'); ch.textContent = c || ''; ch.classList.toggle('on', !!c);
                  const cd = document.getElementById('f365-card'); cd.classList.toggle('on', !!card);
                }""",
                [state["sub"], state["chapter"], state["card"]],
            )

        async def sub(text, hold=0):
            state["sub"] = text
            marks.append((now_ms(), text))
            await ensure()
            if hold:
                await page.wait_for_timeout(hold)

        async def chapter(text):
            state["chapter"] = text
            await ensure()

        async def card(title, text, step="", hold=3200):
            state["card"] = True
            state["sub"] = None
            await ensure()
            await page.evaluate(
                """([t,p,s]) => { const c = document.getElementById('f365-card'); c.querySelector('h1').textContent = t; c.querySelector('p').textContent = p; c.querySelector('.step').textContent = s; c.classList.add('on'); }""",
                [title, text, step],
            )
            marks.append((now_ms(), f"{title} – {text}"))
            await page.wait_for_timeout(hold)
            state["card"] = False
            await page.evaluate("document.getElementById('f365-card').classList.remove('on')")
            await page.wait_for_timeout(700)

        async def move_to(locator):
            box = await locator.bounding_box()
            if not box:
                return None
            x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
            await page.evaluate("([x,y]) => { const c = document.getElementById('f365-cur'); c.style.left = x+'px'; c.style.top = y+'px'; }", [x, y])
            await page.wait_for_timeout(800)
            return x, y

        async def click(locator, wait=1400):
            try:
                await locator.first.wait_for(state="visible", timeout=6000)
            except Exception:
                print("skip missing", locator)
                return None
            locator = locator.first
            await locator.scroll_into_view_if_needed()
            await page.wait_for_timeout(300)
            pos = await move_to(locator)
            await page.evaluate("document.getElementById('f365-cur').classList.add('click')")
            await page.wait_for_timeout(150)
            await locator.click()
            await page.wait_for_timeout(150)
            await ensure()
            await page.evaluate("document.getElementById('f365-cur').classList.remove('click')")
            await page.wait_for_timeout(wait)
            return pos

        async def type_into(locator, text):
            if await click(locator, 300) is None:
                return
            await locator.first.press_sequentially(text, delay=45)
            await page.wait_for_timeout(600)

        async def goto(path, wait=1500):
            state["sub"] = None
            await page.goto(f"{BASE}{path}", wait_until="networkidle")
            await ensure()
            await page.wait_for_timeout(wait)

        # ---------- Intro ----------
        await card("Facility365", "in 2 Minuten erklärt", "Öffnen → Aufgabe sehen → antippen → erledigen", 3600)

        # ---------- Dashboard ----------
        await chapter("Dashboard")
        await goto("/dashboard", 800)
        await sub("Das Dashboard zeigt sofort, was heute wichtig ist: offene Aufträge, fällige Wartungen und Schäden.", 4200)
        await sub("Die grossen Schnellaktionen führen mit einem Tipp zur Aufgabe.", 3200)

        # ---------- Schaden melden ----------
        await chapter("Schaden melden")
        await sub("Ein Hauswart meldet einen Schaden – direkt vom Dashboard.")
        await click(page.locator('a[href*="/damages?new=1"]').first, 1500)
        await sub("Nur das Nötigste eingeben: Titel und Beschreibung.")
        await type_into(page.locator("#field-title"), "Wasserfleck Decke Zimmer 204")
        desc = page.locator("#field-description")
        if await desc.count():
            await type_into(desc, "Feuchte Stelle an der Decke, tropft bei Regen.")
        await sub("Speichern – der Schaden ist erfasst.")
        await click(page.locator('[data-testid="form-save"]'), 2200)
        await page.wait_for_url("**/damages/*")
        await ensure()
        await sub("Der Schaden ist erfasst und sofort für alle sichtbar.", 2200)

        # ---------- Auftrag ----------
        await chapter("Auftrag")
        await sub("Aus dem Schaden wird mit einem Klick ein Auftrag.")
        await click(page.locator('[data-testid="follow-up-order"]').first, 2200)
        await sub("Der Auftrag übernimmt Liegenschaft, Gebäude und Beschreibung automatisch.", 3000)

        # ---------- Mitarbeiter ----------
        await chapter("Mitarbeiter")
        await sub("Zuständigen Mitarbeiter zuweisen: Bearbeiten öffnen …")
        await click(page.locator('[data-testid="edit-entity"]').first, 1400)
        more = page.get_by_role("button", name="Weitere Angaben anzeigen")
        if await more.count():
            await click(more, 800)
        rel = page.locator('[data-testid="relation-users"]').first
        if await rel.count():
            await sub("… Mitarbeiter wählen …")
            await click(rel, 900)
            opts = page.locator('[role="option"]:not([data-testid^="relation-create"])')
            n = await opts.count()
            if n > 1:
                await click(opts.nth(1), 800)
            else:
                await page.keyboard.press("Escape")
        await sub("… und speichern.")
        await click(page.locator('[data-testid="form-save"]'), 1600)

        # ---------- Foto ----------
        await chapter("Foto")
        await sub("Vor Ort: Foto aufnehmen.")
        await click(page.get_by_role("tab", name="Fotos"), 1200)
        await move_to(page.locator('[data-testid="photo-camera"]'))
        await page.evaluate("document.getElementById('f365-cur').classList.add('click')")
        await page.locator('[data-testid="photo-gallery"] input[type=file]').first.set_input_files(PHOTO)
        await page.wait_for_timeout(300)
        await page.evaluate("document.getElementById('f365-cur').classList.remove('click')")
        await sub("Das Foto ist direkt beim Auftrag gespeichert.", 2800)

        # ---------- Arbeitszeit ----------
        await chapter("Arbeitszeit")
        await sub("Arbeitszeit erfassen: von – bis, Pause – die Stunden rechnet Facility365 selbst.")
        await click(page.get_by_role("tab", name="Arbeitszeit"), 1200)
        if await page.locator('[data-testid="work-start"]').count():
            await page.locator('[data-testid="work-date"]').fill("2026-09-15")
            for tid, val in (("work-start", "08:30"), ("work-end", "10:15"), ("work-break", "15")):
                await click(page.locator(f'[data-testid="{tid}"]'), 300)
                await page.locator(f'[data-testid="{tid}"]').fill(val)
            await page.wait_for_timeout(900)
            await click(page.locator('[data-testid="work-save"]'), 1800)

        # ---------- Rapport ----------
        await chapter("Rapport")
        await sub("Rapport erstellen – Auftrag, Zeit und Fotos werden übernommen.")
        await click(page.locator('[data-testid="order-create-report"]').first, 2600)
        await sub("Der Rapport kann unterschrieben, als PDF gespeichert oder verrechnet werden.", 3400)

        # ---------- Erledigt ----------
        await chapter("Erledigt")
        await sub("Zurück zum Auftrag – und «Erledigt» antippen.")
        await page.go_back(wait_until="networkidle")
        await ensure()
        await page.wait_for_timeout(1200)
        done = page.locator('[data-testid="mark-done"]').first
        if await done.count():
            await click(done, 2200)
        await sub("Fertig. Der Auftrag ist abgeschlossen.", 1800)

        # ---------- Historie ----------
        await chapter("Historie")
        await sub("Die Historie zeigt lückenlos, wer wann was gemacht hat.")
        await click(page.get_by_role("tab", name="Historie"), 3200)

        # ---------- Weitere Module ----------
        await chapter("Wartung")
        await goto("/maintenances", 600)
        await sub("Wartungen: fällige Arbeiten mit Intervall und Checkliste – erledigen mit einem Tipp.", 3600)
        await chapter("Kontrolle")
        await goto("/inspections", 600)
        await sub("Kontrollen: Rundgänge und Prüfungen mit Nachweis.", 3200)
        await chapter("Reinigung")
        await goto("/cleaning/tasks", 600)
        await sub("Reinigung: Aufgaben pro Raum, Tour und Mitarbeiter.", 3200)
        await chapter("Anlage")
        await goto("/assets", 600)
        await sub("Anlagen: Technik mit Standort, Wartung, Dokumenten und Historie.")
        alink = page.locator('a[href^="/assets/"]').first
        if await alink.count():
            await click(alink, 1800)
            await chapter("QR-Code")
            qr = page.get_by_role("tab", name="QR-Code")
            if await qr.count():
                await sub("QR-Code an der Anlage scannen – und sofort ist alles zur Anlage da.")
                await click(qr, 3200)
        await chapter("Berichte")
        await goto("/analytics", 800)
        await sub("Berichte: Kosten, Stunden und offene Arbeiten auf einen Blick.", 3400)

        # ---------- Outro ----------
        await chapter("")
        await card("So einfach ist Facility365.", "Öffnen → Aufgabe sehen → antippen → erledigt.", "facility365.vercel.app", 4200)

        await ctx.close()
        await browser.close()
        with open("/home/ubuntu/deploy/demo_marks.json", "w") as f:
            json.dump(marks, f, ensure_ascii=False)
        print("done", glob.glob(f"{RAW}/*.webm"))


asyncio.run(main())

"""Audit the demo in isolated Chrome, with desktop/mobile evidence in output/qa."""
import functools
import http.server
import json
import os
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "output/qa"
EVIDENCE.mkdir(parents=True, exist_ok=True)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0),
    functools.partial(Quiet, directory=str(ROOT / "examples/portfolio")),
)
threading.Thread(target=server.serve_forever, daemon=True).start()
checks = []
errors = []
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            **({"channel": "chrome"} if os.name == "nt" else {})
        )
        page = browser.new_page(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
        page.set_default_timeout(10000)
        page.on("pageerror", lambda error: errors.append(str(error)))
        url = os.environ.get("AUDIT_URL", f"http://127.0.0.1:{server.server_port}")
        page.goto(url, wait_until="networkidle")
        page.wait_for_function("window.__hardware?.ready")
        assert page.evaluate("__hardware.total") == 770
        assert page.locator(".lot[aria-pressed='true']").count() == 1
        assert page.locator("#search").input_value() == "RTX"
        assert "RTX 3070" in page.locator("#lot-title").inner_text()
        assert abs(page.evaluate("__hardware.result.maxHammer") - 9.306666666666667) < 1e-9
        assert page.locator("#downside").is_visible()
        assert "Failed outcome" in page.locator("#downside").inner_text()
        checks.append("770 archived lots, selected RTX example, cost trace and failure downside")
        page.screenshot(path=str(EVIDENCE / "desktop.png"), full_page=True)
        page.screenshot(path=str(ROOT / "examples/portfolio/preview.png"), full_page=True)
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        page.set_viewport_size({"width": 390, "height": 844})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Mobile overflow"
        page.screenshot(path=str(EVIDENCE / "mobile.png"), full_page=True)
        page.set_viewport_size({"width": 1280, "height": 900})
        checks.append("1280px / 390px layout without overflow")
        page.locator("#resale").fill("777")
        page.locator("#search").fill("laptop")
        assert page.locator("[data-reveal-selected]").is_visible()
        assert page.locator("#resale").input_value() == "777"
        page.locator("[data-reveal-selected]").click()
        assert page.locator(".lot[aria-pressed='true']").is_visible()
        assert page.locator("#resale").input_value() == "777"
        page.locator("#search").fill("RTX")
        before = page.evaluate("__hardware.result.maxHammer")
        page.locator("#resale").fill("1000")
        assert page.evaluate("__hardware.result.maxHammer") > before
        page.locator("#failure").fill("101")
        assert page.locator("#save").is_disabled()
        assert page.locator("#error").is_visible()
        assert not page.locator("#downside").is_visible()
        page.screenshot(path=str(EVIDENCE / "invalid-input.png"))
        page.locator("#failure").fill("20")
        page.locator("#profit").fill("100000")
        assert "cannot meet" in page.locator("#verdict").inner_text()
        page.locator("#profit").fill("100")
        page.locator("#save").click()
        assert page.evaluate("__hardware.saved") == 1
        page.locator("details.sheet summary").click()
        with page.expect_download() as download:
            page.locator("#export").click()
        text = Path(download.value.path()).read_text()
        assert "max_hammer" in text and "resale_assumption" in text
        page.reload(wait_until="networkidle")
        page.wait_for_function("window.__hardware?.ready")
        assert page.evaluate("__hardware.saved") == 1
        assert page.locator("#resale").input_value() == "1000"
        page.locator("#sale").select_option("exertis_a1")
        page.locator(".lot").first.click()
        assert page.locator("#premium").input_value() == "25"
        assert abs(page.evaluate("__hardware.result.multiplier") - 1.5) < 1e-12
        page.locator("#sale").select_option("no8_pantera")
        page.locator("#search").fill("")
        page.locator(".lot").first.click()
        assert page.locator("#premium").input_value() == "17.5"
        page.locator("#category").select_option("laptops")
        assert 0 < page.evaluate("__hardware.filtered") < 770
        page.locator("#category").select_option("")
        page.locator("#sort").select_option("high")
        first_price = page.locator(".lot .price").first.inner_text()
        page.locator("#sort").select_option("low")
        assert first_price != page.locator(".lot .price").first.inner_text()
        page.locator("#next").click()
        assert page.locator("#page").inner_text().startswith("2")
        page.locator("#previous").click()
        page.locator("#search").fill("no matching hardware at all")
        assert "No lots match" in page.locator("#lots").inner_text()
        page.locator("details.sheet summary").click()
        page.locator("[data-restore]").click()
        assert page.locator("#resale").input_value() == "1000"
        page.locator("#resale").focus()
        assert page.locator("#resale").evaluate("el => getComputedStyle(el).outlineStyle") != "none"
        page.screenshot(path=str(EVIDENCE / "saved-restore.png"))
        page.locator("[data-remove]").click()
        assert page.evaluate("__hardware.saved") == 0
        page.locator("#sale").select_option("")
        page.locator("#search").fill("RTX")
        page.set_viewport_size({"width": 390, "height": 844})
        page.locator(".lot").first.click()
        assert page.locator("#lot-title").bounding_box()["y"] < 500
        page.locator("#resale").focus()
        box = page.locator("#resale").bounding_box()
        assert box and 0 <= box["y"] <= 844
        page.locator(".back-to-results").click()
        page.wait_for_function("document.querySelector('#lots').getBoundingClientRect().top < 100")
        checks.append("Filters, pagination, selection, editable costs, invalid/impossible inputs, fees, save/reload/restore/remove/CSV")
        failed = browser.new_page(viewport={"width": 390, "height": 844})
        failed.on("pageerror", lambda error: errors.append(str(error)))
        failed.route("**/data/lots.json", lambda route: route.abort())
        failed.goto(url, wait_until="networkidle")
        assert failed.locator("#retry").is_visible()
        assert failed.locator("#save").is_disabled()
        assert not failed.locator("#result").is_visible()
        failed.screenshot(path=str(EVIDENCE / "load-failure.png"), full_page=True)
        failed.unroute("**/data/lots.json")
        failed.locator("#retry").click()
        failed.wait_for_function("window.__hardware?.ready")
        assert failed.locator("#save").is_enabled()
        failed.close()
        checks.append("Load failure blocks false calculation and retry recovers")
        assert not errors, errors
        assert page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
        checks.append("No JavaScript errors; reduced motion enabled")
        (EVIDENCE / "audit.json").write_text(json.dumps({"checks": checks, "errors": errors, "viewports": [1280, 390]}, indent=2))
        print("PASS: " + "; ".join(checks))
        browser.close()
except Exception:
    raise
finally:
    server.shutdown()

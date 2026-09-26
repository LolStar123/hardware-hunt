"""Exercise auction browsing and editable bid calculations locally or against its public deployment."""
import functools
import http.server
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT/'examples/portfolio')))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(**({'channel':'chrome'} if os.name=='nt' else {}))
        page=browser.new_page(viewport={'width':1280,'height':1000},reduced_motion='reduce')
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(os.environ.get('AUDIT_URL',f'http://127.0.0.1:{server.server_port}'),wait_until='networkidle')
        page.wait_for_function('window.__hardware?.ready')
        assert page.evaluate('__hardware.total')==770
        before=page.evaluate('__hardware.result.maxHammer')
        page.locator('#resale').fill('1000')
        assert page.evaluate('__hardware.result.maxHammer')>before
        page.locator('#failure').fill('101')
        assert page.locator('#save').is_disabled()
        page.locator('#failure').fill('20')
        page.locator('#search').fill('RTX')
        assert 0<page.evaluate('__hardware.filtered')<770
        page.locator('.lot').first.click()
        page.locator('#save').click()
        assert page.evaluate('__hardware.saved')==1
        page.locator('details.sheet summary').click()
        with page.expect_download() as dl:page.locator('#export').click()
        assert 'max_hammer' in Path(dl.value.path()).read_text()
        page.reload(wait_until='networkidle')
        page.wait_for_function('window.__hardware?.ready')
        assert page.evaluate('__hardware.saved')==1
        page.locator('details.filters summary').click()
        page.locator('#sale').select_option('exertis_a1')
        page.locator('.lot').first.click()
        assert page.locator('#premium').input_value()=='25'
        assert abs(page.evaluate('__hardware.result.multiplier')-1.5)<1e-12
        page.locator('#sale').select_option('')
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(path=str(ROOT/'examples/portfolio/preview.png'))
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'mobile overflow'
        page.locator('#lots [data-id]').first.click()
        assert page.locator('#lot-title').bounding_box()['y'] < 500
        page.locator('.back-to-results').click()
        page.wait_for_function('document.querySelector("#lots").getBoundingClientRect().top < 100')
        assert not errors,errors
        print('PASS: 770 real lots, filters, actual sale fees, custom costs, saved bid sheet, CSV and mobile')
        browser.close()
finally: server.shutdown()

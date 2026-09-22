"""Export public auction fields only. Never copy private bidding limits."""
import argparse
import csv
import json
from pathlib import Path

SALES = {'no8_pantera': {'name':'No.8 Sound & Vision / Pantera','date':'2026-09-16','location':'Dartford','premium':17.5,'vat':20}, 'exertis_a1': {'name':'Exertis / MBV auction 1','date':'2026-09-03','location':'Burnley','premium':25,'vat':20}}

def number(value):
    try: return float(value) if value.strip() else None
    except (ValueError, AttributeError): return None

def export(source):
    lots=[]
    for sale, meta in SALES.items():
        with (source/sale/'data/final_results.csv').open(encoding='utf-8-sig') as f:
            for r in csv.DictReader(f):
                lots.append({'id':sale+':'+r['lot_no'],'sale':sale,'number':r['lot_no'],'title':r['title'],'hammer':number(r['final_hammer']),'bids':number(r['total_bids']),'closed':r['closed'].lower() in ('1','true','yes'),'url':r['url']})
    return {'sales':SALES,'lots':lots,'scope':'Historical public auction observations. A closed lot is not proof of a completed sale or reserve being met.'}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);a=p.parse_args()
    out=Path(__file__).resolve().parents[1]/'examples/portfolio/data/lots.json';out.parent.mkdir(parents=True,exist_ok=True)
    result=export(a.source);out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(len(result['lots']),'public lots exported')

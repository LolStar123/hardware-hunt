import {category,calculate,csv} from './model.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(n);
const fields=['resale','failure','salvage','selling','transport','repair','profit','premium','vat','hammer'];
let data,selected,page=0,sheet=[],computed=null;const pageSize=16;
function inputs(){return Object.fromEntries(fields.map(k=>[k,$('#'+k).value]));}
function renderLots(){
    const q=$('#search').value.toLowerCase().trim(),sale=$('#sale').value,cat=$('#category').value,sort=$('#sort').value;
    const lots=data.lots.filter(l=>(!q||l.title.toLowerCase().includes(q)||l.number===q)&&(!sale||l.sale===sale)&&(!cat||category(l.title)===cat));
    lots.sort(sort==='high'?(a,b)=>(b.hammer??-1)-(a.hammer??-1):sort==='low'?(a,b)=>(a.hammer??Infinity)-(b.hammer??Infinity):(a,b)=>Number(a.number)-Number(b.number));
    page=Math.min(page,Math.max(0,Math.ceil(lots.length/pageSize)-1));
    $('#lots').innerHTML=lots.slice(page*pageSize,(page+1)*pageSize).map(l=>`<button class="lot" data-id="${l.id}" aria-pressed="${selected?.id===l.id}"><span class="lot-no">${l.number}</span><span>${esc(l.title)}<small>${esc(data.sales[l.sale].location)} / ${data.sales[l.sale].date}</small></span><span class="price">${l.hammer===null?'unknown':money(l.hammer)}<small>observed hammer</small></span></button>`).join('')||'<p>No lots match. Try a broader search.</p>';
    $('#count').textContent=`${lots.length} historical lots / select one to cost it`;
    $('#page').textContent=`${lots.length?page+1:0} / ${Math.ceil(lots.length/pageSize)}`;$('#previous').disabled=page===0;$('#next').disabled=(page+1)*pageSize>=lots.length;
    window.__hardware={ready:true,total:data.lots.length,filtered:lots.length,selected:selected?.id,saved:sheet.length,result:computed};
}
function choose(lot){
    selected=lot;const sale=data.sales[lot.sale];$('#lot-sale').textContent=`lot ${lot.number} / ${sale.location} / ${sale.date}`;$('#lot-title').textContent=lot.title;
    $('#lot-result').textContent=`Observed hammer: ${lot.hammer===null?'unknown':money(lot.hammer)} / ${lot.bids??'unknown'} bids / ${lot.closed?'closed':'close not confirmed'}`;
    $('#lot-source').href=lot.url;$('#premium').value=sale.premium;$('#vat').value=sale.vat;$('#hammer').value=lot.hammer??0;
    const saved=sheet.find(x=>x.id===lot.id);if(saved)for(const k of fields)$('#'+k).value=saved.inputs[k];
    $('#saved-status').textContent='';calculateNow();renderLots();
}
function calculateNow(){
    try{
        computed=calculate(inputs());$('#error').textContent='';$('#result').hidden=false;$('#save').disabled=false;
        $('#maximum').textContent=money(Math.floor(computed.maxHammer*100)/100);
        $('#verdict').textContent=computed.feasible?`At this hammer, the expected profit meets your ${money(Number($('#profit').value))} target. Round down to the auction's bid increment.`:'Even a free hammer cannot meet this target under your assumptions.';
        const entries=[['hammer',Number($('#hammer').value)],['premium',computed.premium],['VAT',computed.vat],['collection + repair',Number($('#transport').value)+Number($('#repair').value)]];
        let x=0;const colors=['#b7c2c5','#bfa980','#9c9990','#777f83'];const scale=310/Math.max(1,computed.acquisition);
        $('#waterfall').innerHTML=entries.map(([name,v],i)=>{const w=v*scale,s=`<rect x="${x}" y="10" width="${w}" height="28" fill="${colors[i]}"/><text x="${i%2*165}" y="${64+Math.floor(i/2)*24}" fill="${colors[i]}" font-size="11">${name}: ${money(v)}</text>`;x+=w;return s}).join('');
        $('#breakdown').innerHTML=[['cash cost at test hammer',computed.acquisition],['expected resale after selling fees',computed.proceeds],['expected profit at test hammer',computed.expectedProfit]].map(([k,v])=>`<dt>${k}</dt><dd>${money(v)}</dd>`).join('');
        $('#downside').textContent=`Working outcome: ${money(computed.workingProfit)} profit. Failed outcome: ${money(computed.failedProfit)}. These use your failure probability, not measured condition data.`;
    }catch(e){computed=null;$('#error').textContent=e.message;$('#result').hidden=true;$('#save').disabled=true}
    if(window.__hardware)window.__hardware.result=computed;
}
function renderSheet(){
    $('#sheet-count').textContent=sheet.length;$('#export').disabled=!sheet.length;
    $('#sheet').innerHTML=sheet.map(s=>`<div class="saved-lot"><div>${esc(s.title)}<small>lot ${s.number} / ${esc(data.sales[s.sale].location)} / resale assumption ${money(Number(s.inputs.resale))}</small></div><strong>${money(calculate(s.inputs).maxHammer)}<small>max hammer</small></strong><button data-remove="${s.id}">remove</button></div>`).join('')||'<p>Save a costed lot to start your bid sheet.</p>';
    try{localStorage.setItem('hardware-bid-sheet',JSON.stringify(sheet))}catch{$('#saved-status').textContent='Storage unavailable. Export CSV to keep the sheet.'}
    if(window.__hardware)window.__hardware.saved=sheet.length;
}
$('#calculator').oninput=calculateNow;$('#calculator').onsubmit=e=>e.preventDefault();
for(const id of ['search','sale','category','sort'])$('#'+id).addEventListener(id==='search'?'input':'change',()=>{page=0;renderLots()});
$('#lots').onclick=e=>{const b=e.target.closest('[data-id]');if(b)choose(data.lots.find(l=>l.id===b.dataset.id))};
$('#previous').onclick=()=>{page--;renderLots()};$('#next').onclick=()=>{page++;renderLots()};
$('#save').onclick=()=>{if(!computed||!selected)return;sheet=sheet.filter(x=>x.id!==selected.id);sheet.push({...selected,inputs:inputs()});renderSheet();$('#saved-status').textContent='Saved with your current assumptions.'};
$('#sheet').onclick=e=>{const b=e.target.closest('[data-remove]');if(b){sheet=sheet.filter(x=>x.id!==b.dataset.remove);renderSheet()}};
$('#export').onclick=()=>{const rows=sheet.map(s=>{const r=calculate(s.inputs);return {sale:data.sales[s.sale].name,lot:s.number,title:s.title,observed_hammer:s.hammer,resale_assumption:s.inputs.resale,failure_pct:s.inputs.failure,premium_pct:s.inputs.premium,vat_pct:s.inputs.vat,max_hammer:r.maxHammer.toFixed(2),expected_profit_at_observed:s.hammer===null?'':calculate({...s.inputs,hammer:s.hammer}).expectedProfit.toFixed(2)}});const url=URL.createObjectURL(new Blob([csv(rows)],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='hardware-bid-sheet.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
try{const r=await fetch('data/lots.json');if(!r.ok)throw Error('Lot records could not load');data=await r.json();$('#sale').innerHTML+=Object.entries(data.sales).map(([id,s])=>`<option value="${id}">${esc(s.name)}</option>`).join('');$('#category').innerHTML+=[...new Set(data.lots.map(l=>category(l.title)))].sort().map(c=>`<option>${c}</option>`).join('');try{const stored=JSON.parse(localStorage.getItem('hardware-bid-sheet')||'[]');sheet=stored.filter(s=>data.lots.some(l=>l.id===s.id)&&calculate(s.inputs))}catch{sheet=[]}$('#provenance').textContent=`${data.lots.length} public lot records from the 3 and 16 September 2026 auctions. Original fees: 25% premium at Exertis; 17.5% at Pantera; 20% VAT on hammer and premium. ${data.scope}`;choose(data.lots.find(l=>/RTX/i.test(l.title))||data.lots[0]);renderSheet()}catch(e){$('#count').textContent=e.message;throw e}

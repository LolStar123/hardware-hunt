import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from './model.mjs';
test('workflow invariants and boundary cases',()=>{
const i={...m.defaults,resale:100,units:1,failure:0,sellFee:0,premium:.2,vat:.2,transport:0,targetProfit:28,currentBid:50};const r=m.value(i);assert.ok(Math.abs(r.maxBid-50)<1e-9);assert.ok(Math.abs(r.profit-28)<1e-9);assert.ok(m.value({...i,failure:.5}).maxBid<r.maxBid);assert.equal(m.value({...i,targetProfit:200}).viable,false);assert.throws(()=>m.value({...i,failure:2}));
});

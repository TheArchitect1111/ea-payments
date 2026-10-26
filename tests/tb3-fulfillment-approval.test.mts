import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canConfirmTb3PrintfulOrder} from '../lib/tb3/fulfillment-approval';

const base = {isProduction:true,ownerApproved:true,fundingVerified:true,
 capCents:6000,cost:'40.00',currency:'USD',merchandiseSubtotalCents:10000};
test('production approval permits covered Printful charge',()=>assert.equal(canConfirmTb3PrintfulOrder(base),true));
for (const [name,change] of [
 ['Preview environment',{isProduction:false}],
 ['Owner permission missing',{ownerApproved:false}],
 ['Funding not verified',{fundingVerified:false}],
 ['Cost cap exceeded',{cost:'60.01'}],
 ['No margin',{cost:'100.00',capCents:15000}],
 ['Wrong currency',{currency:'CAD'}],
 ['Missing cost',{cost:null}],
 ['Zero cost',{cost:'0'}],
 ['Negative cost',{cost:'-1.00'}],
 ['Fractional cents',{cost:'39.999'}],
 ['Exponential notation',{cost:'4e1'}],
 ['Noninteger cap',{capCents:6000.5}],
 ['NaN cost',{cost:NaN}],
] as const) {
 test('production gate rejects '+name,()=>assert.equal(canConfirmTb3PrintfulOrder({...base,...change}),false));
}
test('exact cent price accepted',()=>assert.equal(canConfirmTb3PrintfulOrder({...base,cost:'40.12'}),true));

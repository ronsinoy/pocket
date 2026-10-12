import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dateKey} from './budget.js';
import {normalizeWallet,defaultWallet,walletBalance,divisionBalance,kiteTotal,totalFunds,validateTransfer,validateLedger,validateWalletChange,cardAmount,spendingSeries,isExpense} from './wallet.js';
const today=dateKey();
function wallet(){const w=defaultWallet();w.cash.amount=1000;w.gpay.amount=500;w.card.amount=300;w.cash.divisions=[{id:'food',name:'Food',amount:0}];w.kite.credit_card={};w.kite.divisions=[{id:'saving',name:'Saving',amount:200}];return normalizeWallet(w);}
function transfer(id,from,to,amount,extra={}){return {id,title:'Move funds',transaction_type:'transfer',date:today,amount,from_account:from,to_account:to,from_division:null,to_division:null,created_at:'2026-01-01T00:00:0'+id+'Z',...extra};}
test('legacy wallet normalization preserves amounts and supplies unallocated divisions',()=>{
 const raw={cash:{amount:1000,as_of:today},gpay:{amount:500,as_of:today},card:{amount:300,as_of:today},kite:{divisions:[{id:'s',name:'Saving',amount:200}],credit_card:{'2026-01':50}}};
 const normalized=normalizeWallet(raw);
 assert.equal(walletBalance(normalized,'cash',[]),1000);assert.equal(divisionBalance(normalized,'cash',null,[]),1000);
 assert.equal(kiteTotal(normalized),250);assert.equal(totalFunds(normalized,[]),1500);
 assert.equal(normalized.version,2);assert.equal(normalized.kite.as_of,today);assert.deepEqual(raw.cash.divisions,undefined);
});
test('divisions move funds without creating money and transfers conserve account funds',()=>{
 const w=wallet(),allocation=transfer('1','cash','cash',250,{to_division:'food'}),move=transfer('2','cash','kite',100,{from_division:'food',to_division:'saving'}),records=[allocation,move];
 validateLedger(w,records);
 assert.equal(walletBalance(w,'cash',records),900);assert.equal(divisionBalance(w,'cash',null,records),750);assert.equal(divisionBalance(w,'cash','food',records),150);
 assert.equal(kiteTotal(w,records),300);assert.equal(totalFunds(w,records),1400);
 assert.equal(walletBalance(w,'cash',records)+walletBalance(w,'gpay',records)+kiteTotal(w,records),1700);
 assert.equal(spendingSeries(today.slice(0,7),records).points.at(-1).amount,0);assert.ok(records.every(x=>!isExpense(x)));
});
test('Kite incoming targets a division and never counts as spending',()=>{
 const income={id:'i',title:'Deposit',transaction_type:'income',payment_source:'kite',division_id:'saving',amount:75,date:today};
 assert.equal(divisionBalance(wallet(),'kite','saving',[income]),275);assert.equal(kiteTotal(wallet(),[income]),275);assert.equal(totalFunds(wallet(),[income]),1500);
 assert.equal(spendingSeries(today.slice(0,7),[income]).points.at(-1).amount,0);
});
test('Card is a payment destination, with grey-display-compatible signed amounts',()=>{
 const payment=transfer('1','kite','card',100,{from_division:'saving'});
 validateTransfer(payment,wallet(),[]);assert.equal(walletBalance(wallet(),'card',[payment]),200);assert.equal(kiteTotal(wallet(),[payment]),100);
 assert.equal(cardAmount(200),'−₹200');assert.equal(cardAmount(0),'₹0');assert.equal(cardAmount(-20),'+₹20');
 assert.throws(()=>validateTransfer(transfer('2','card','cash',1),wallet(),[]),/Card/);
 assert.throws(()=>validateTransfer(transfer('2','cash','card',301),wallet(),[]),/outstanding/);
});
test('transfer validation rejects duplicate endpoints, insufficient funds, and old dates',()=>{
 assert.throws(()=>validateTransfer(transfer('1','cash','cash',1),wallet(),[]),/different/);
 assert.throws(()=>validateTransfer(transfer('1','cash','gpay',1001),wallet(),[]),/Insufficient/);
 assert.throws(()=>validateTransfer(transfer('1','cash','gpay',1,{date:'2000-01-01'}),wallet(),[]),/opening/);
});
test('edits and deletion recompute both sides and cannot invalidate later transfers',()=>{
 const w=wallet(),a=transfer('1','cash','gpay',100),b=transfer('2','gpay','kite',550,{to_division:'saving'});
 validateLedger(w,[a,b]);assert.equal(walletBalance(w,'gpay',[a,b]),50);
 assert.throws(()=>validateLedger(w,[b]),/Insufficient/);
 assert.throws(()=>validateLedger(w,[{...a,amount:20},b]),/Insufficient/);
 assert.equal(walletBalance(w,'cash',[]),1000);assert.equal(walletBalance(w,'gpay',[]),500);
});
test('empty referenced divisions can be archived while funded ones cannot',()=>{
 const w=wallet(),a=transfer('1','cash','cash',50,{to_division:'food'}),b=transfer('2','cash','cash',50,{from_division:'food'}),after=structuredClone(w);after.cash.divisions[0].archived=true;
 assert.doesNotThrow(()=>validateWalletChange(after,w,[a,b]));assert.doesNotThrow(()=>validateLedger(after,[a,b]));
 assert.throws(()=>validateWalletChange(after,w,[a]),/Empty/);
 assert.throws(()=>validateTransfer(transfer('3','cash','cash',10,{to_division:'food'}),after,[a,b]),/active/);
 const deleted=structuredClone(w);deleted.cash.divisions=[];assert.throws(()=>validateWalletChange(deleted,w,[a,b]),/cannot be deleted/);
});

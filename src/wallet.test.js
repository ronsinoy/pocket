import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultWallet,monthPair,walletBalance,kiteTotal,creditComparison,spendingSeries,validateWallet} from './wallet.js';
const wallet=()=>({...defaultWallet(),cash:{amount:1000,as_of:'2026-10-01'},gpay:{amount:2000,as_of:'2026-10-01'},card:{amount:500,as_of:'2026-10-01'},kite:{divisions:[{id:'1',name:'Savings',amount:300}],credit_card:{'2026-10':400,'2026-09':200}}});
const expenses=[{amount:100,date:'2026-10-02',payment_source:'cash'},{amount:250,date:'2026-10-03',payment_source:'gpay'},{amount:200,date:'2026-10-04',payment_source:'card'},{amount:500,date:'2026-09-01',payment_source:'cash'}];
test('balances deduct cash/GPay spending, add card liability, exclude old spending',()=>{
 assert.equal(walletBalance(wallet(),'cash',expenses,'2026-10-12'),900);
 assert.equal(walletBalance(wallet(),'gpay',expenses,'2026-10-12'),1750);
 assert.equal(walletBalance(wallet(),'card',expenses,'2026-10-12'),700);
 assert.equal(walletBalance(wallet(),'cash',expenses.slice(1),'2026-10-12'),1000);
 assert.equal(walletBalance(wallet(),'card',expenses.map(x=>x.payment_source==='card'?{...x,amount:50}:x),'2026-10-12'),550);
});
test('Kite includes all allocations and card comparison detects a shortfall',()=>{
 assert.equal(kiteTotal(wallet()),900);
 assert.deepEqual(creditComparison(wallet(),expenses,new Date(2026,9,12)),{reserved:600,actual:700,difference:-100});
 const covered=wallet();covered.kite.credit_card['2026-10']=600;
 assert.equal(creditComparison(covered,expenses,new Date(2026,9,12)).difference,100);
});
test('current and prior month cross year boundaries correctly',()=>{
 assert.deepEqual(monthPair(new Date(2027,0,1)),{current:'2027-01',previous:'2026-12'});
});
test('spending graph begins at zero and accumulates cents from month start',()=>{
 const {points,days}=spendingSeries('2026-10',expenses,'2026-10-12');
 assert.equal(points[0].amount,0);assert.equal(points.length,13);assert.equal(days,31);
 assert.equal(points.at(-1).amount,550);assert.equal(points[3].daily,250);
 const decimal=spendingSeries('2026-09',[{date:'2026-09-01',amount:.1},{date:'2026-09-01',amount:.2}],'2026-10-12');
 assert.equal(decimal.points.at(-1).amount,.3);assert.equal(decimal.points.length,31);
});
test('wallet prevents negative allocations and duplicate divisions',()=>{
 assert.doesNotThrow(()=>validateWallet(wallet()));
 const invalid=wallet();invalid.kite.divisions.push({id:'2',name:'Savings',amount:0});
 assert.throws(()=>validateWallet(invalid));
 const negative=wallet();negative.cash.amount=-1;assert.throws(()=>validateWallet(negative));
});

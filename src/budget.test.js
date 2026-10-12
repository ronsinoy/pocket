import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weeksForMonth,sum,validateExpense} from './budget.js';
test('monthly weeks count every day exactly once, including leap years',()=>{
 for(const month of ['2026-10','2026-02','2024-02','2026-03']){
  const [y,m]=month.split('-').map(Number),days=new Date(y,m,0).getDate(),items=Array.from({length:days},(_,i)=>({date:month+'-'+String(i+1).padStart(2,'0'),amount:i+1})),weeks=weeksForMonth(month,items);
  assert.equal(weeks.flatMap(w=>w.items).length,days);assert.equal(sum(weeks.flatMap(w=>w.items)),sum(items));
  for(const w of weeks.slice(0,-1))assert.equal(new Date(w.end+'T12:00:00').getDay(),0);
 }
});
test('expenses require Want/Need and positive amounts',()=>{
 const item={title:'Groceries',amount:100,date:'2026-10-12',kind:'need',payment_source:'gpay'};
 assert.doesNotThrow(()=>validateExpense(item));
 for(const kind of ['',null,'other'])assert.throws(()=>validateExpense({...item,kind}));
 for(const payment_source of ['',null,'bank'])assert.throws(()=>validateExpense({...item,payment_source}));
 for(const amount of [0,-5,'abc',Infinity])assert.throws(()=>validateExpense({...item,amount}));
});
test('incoming requires an account and a positive amount without Want/Need',()=>{
 const income={title:'Salary',amount:15000,date:'2026-10-12',transaction_type:'income',kind:null,payment_source:'gpay'};
 assert.doesNotThrow(()=>validateExpense(income));
 assert.throws(()=>validateExpense({...income,payment_source:''}));
 assert.throws(()=>validateExpense({...income,amount:-1}));
 assert.throws(()=>validateExpense({...income,transaction_type:'unsupported'}));
});

import {dateKey} from './budget.js';
export const paymentSources={card:'Card',gpay:'GPay',cash:'Cash'};
export function monthPair(date=new Date()){
 const current=dateKey(date).slice(0,7),previousDate=new Date(date.getFullYear(),date.getMonth()-1,1);
 return {current,previous:dateKey(previousDate).slice(0,7)};
}
export const monthName=key=>new Date(key+'-01T12:00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'});
export function defaultWallet(){const today=dateKey(),{current,previous}=monthPair();return {cash:{amount:0,as_of:today},gpay:{amount:0,as_of:today},card:{amount:0,as_of:today},kite:{divisions:[],credit_card:{[current]:0,[previous]:0}}};}
export function walletBalance(wallet,source,expenses,today=dateKey()){
 const account=wallet[source],spent=expenses.filter(x=>x.payment_source===source&&x.date>=account.as_of&&x.date<=today).reduce((n,x)=>n+Math.round(Number(x.amount)*100),0)/100;
 return Math.round((Number(account.amount)+(source==='card'?spent:-spent))*100)/100;
}
export function kiteTotal(wallet){return Object.values(wallet.kite.credit_card).reduce((n,x)=>n+Number(x),0)+wallet.kite.divisions.reduce((n,x)=>n+Number(x.amount),0);}
export function creditComparison(wallet,expenses,date=new Date()){
 const {current,previous}=monthPair(date),reserved=Number(wallet.kite.credit_card[current]||0)+Number(wallet.kite.credit_card[previous]||0),actual=walletBalance(wallet,'card',expenses,dateKey(date));
 return {reserved,actual,difference:Math.round((reserved-actual)*100)/100};
}
export function validateWallet(wallet){
 for(const source of ['cash','gpay','card']){const a=wallet[source];if(!Number.isFinite(Number(a.amount))||Number(a.amount)<0||Number(a.amount)>100000000)throw Error('Enter valid account amounts.');if(!/^\d{4}-\d{2}-\d{2}$/.test(a.as_of)||Number.isNaN(Date.parse(a.as_of)))throw Error('Choose a valid balance date.');}
 const divisions=wallet.kite.divisions,names=new Set();
 for(const d of divisions){if(!d.name.trim()||d.name.trim().toLowerCase()==='credit card'||names.has(d.name.trim().toLowerCase()))throw Error('Use a unique division name.');names.add(d.name.trim().toLowerCase());if(!Number.isFinite(Number(d.amount))||Number(d.amount)<0||Number(d.amount)>100000000)throw Error('Enter valid division amounts.');}
 for(const [month,n] of Object.entries(wallet.kite.credit_card))if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!Number.isFinite(Number(n))||Number(n)<0||Number(n)>100000000)throw Error('Enter valid credit card reserve amounts.');
}
export function spendingSeries(month,expenses,today=dateKey()){
 const [y,m]=month.split('-').map(Number),monthEnd=new Date(y,m,0).getDate(),last=month===today.slice(0,7)?Number(today.slice(8)):month<today.slice(0,7)?monthEnd:0;
 const daily=new Map();for(const x of expenses)if(x.date.startsWith(month)&&x.date<=today)daily.set(x.date,(daily.get(x.date)||0)+Math.round(Number(x.amount)*100));
 let running=0;const points=[{day:0,amount:0,daily:0}];for(let day=1;day<=last;day++){const key=month+'-'+String(day).padStart(2,'0'),spent=daily.get(key)||0;running+=spent;points.push({day,amount:running/100,daily:spent/100});}return {points,days:monthEnd};
}

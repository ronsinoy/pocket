import React from 'react';
import {accounts,paymentSources,divisionOptions} from './wallet.js';
export default function AccountSelect({wallet,label,account,setAccount,division,setDivision,source=false,income=false}){
 const available=source?{cash:'Cash',gpay:'GPay',kite:'Kite'}:income?accounts:paymentSources,options=account&&account!=='card'?divisionOptions(wallet,account):[];
 const selectedArchived=account&&division&&!options.some(d=>d.id===division)?divisionOptions(wallet,account,true).find(d=>d.id===division):null;
 return <div className="account-selector"><label>{label}<select required value={account} onChange={e=>{setAccount(e.target.value);setDivision('');}}><option value="" disabled>Select account</option>{Object.entries(available).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>{account&&account!=='card'&&(options.length>0||account==='kite'||Boolean(selectedArchived))&&<label>Division (optional)<select value={division||''} onChange={e=>setDivision(e.target.value)}><option value="">None</option>{selectedArchived&&<option value={selectedArchived.id} disabled>{selectedArchived.name} (archived)</option>}{options.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}</div>;
}

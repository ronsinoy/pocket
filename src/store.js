import {createClient} from '@supabase/supabase-js';
import {defaultWallet,normalizeWallet,validateWallet,validateRecord,validateLedger,validateWalletChange} from './wallet.js';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase=url&&key?createClient(url,key):null;
const localKey=id=>`pocket-data-${id}`;
export async function login(username,{create=false}={}){
 const normalized=username.trim().toLowerCase();
 if(!/^[a-z0-9_]{3,24}$/.test(normalized))throw Error('Use 3–24 letters, numbers, or underscores.');
 if(!supabase){
  const account={id:normalized,username:normalized};
  if(localStorage.getItem(localKey(normalized)))return account;
  if(!create)return null;
  localStorage.setItem(localKey(normalized),JSON.stringify({expenses:[],budget:20000,wallet:defaultWallet()}));
  return account;
 }
 const existing=await supabase.from('users').select('*').eq('username',normalized).maybeSingle();
 if(existing.error)throw existing.error;
 if(existing.data||!create)return existing.data;
 const {data,error}=await supabase.from('users').upsert({username:normalized},{onConflict:'username'}).select().single();
 if(error)throw error;
 return data;
}
export async function loadData(user){if(!supabase){const data=JSON.parse(localStorage.getItem(localKey(user.id))||'{"expenses":[],"budget":20000}');const wallet=normalizeWallet(data.wallet);if(JSON.stringify(wallet)!==JSON.stringify(data.wallet))localStorage.setItem(localKey(user.id),JSON.stringify({...data,wallet}));return {...data,wallet};}const [a,b,c]=await Promise.all([supabase.from('expenses').select('*').eq('user_id',user.id).order('date',{ascending:false}),supabase.from('budgets').select('amount').eq('user_id',user.id).maybeSingle(),supabase.from('wallets').select('data').eq('user_id',user.id).maybeSingle()]);if(a.error||b.error||c.error)throw a.error||b.error||c.error;const wallet=normalizeWallet(c.data?.data);if(JSON.stringify(wallet)!==JSON.stringify(c.data?.data)){const result=await supabase.from('wallets').upsert({user_id:user.id,data:wallet},{onConflict:'user_id'});if(result.error)throw result.error;}return {expenses:a.data,budget:b.data?.amount??20000,wallet};}
export async function saveExpense(user,item,state){validateRecord(item,state.wallet,state.expenses);const next=state.expenses.some(x=>x.id===item.id)?state.expenses.map(x=>x.id===item.id?item:x):[item,...state.expenses];validateLedger(state.wallet,next);if(!supabase){const expenses=state.expenses.some(x=>x.id===item.id)?state.expenses.map(x=>x.id===item.id?item:x):[item,...state.expenses];localStorage.setItem(localKey(user.id),JSON.stringify({...state,expenses}));return item;}const {data,error}=await supabase.from('expenses').upsert({...item,user_id:user.id}).select().single();if(error)throw error;return data;}
export async function deleteExpense(user,id,state){validateLedger(state.wallet,state.expenses.filter(x=>x.id!==id));if(!supabase){localStorage.setItem(localKey(user.id),JSON.stringify({...state,expenses:state.expenses.filter(x=>x.id!==id)}));return;}const {error}=await supabase.from('expenses').delete().eq('id',id).eq('user_id',user.id);if(error)throw error;}
export async function saveBudget(user,amount,state){if(!supabase){localStorage.setItem(localKey(user.id),JSON.stringify({...state,budget:amount}));return;}const {error}=await supabase.from('budgets').upsert({user_id:user.id,amount},{onConflict:'user_id'});if(error)throw error;}
export async function saveWallet(user,wallet,state){validateWallet(wallet);validateWalletChange(wallet,state.wallet,state.expenses);validateLedger(wallet,state.expenses);if(!supabase){localStorage.setItem(localKey(user.id),JSON.stringify({...state,wallet}));return;}const {error}=await supabase.from('wallets').upsert({user_id:user.id,data:wallet},{onConflict:'user_id'});if(error)throw error;}
export async function loadNote(user){if(!supabase)return localStorage.getItem('pocket-note-'+user.id)||'';const {data,error}=await supabase.from('notepads').select('content').eq('user_id',user.id).maybeSingle();if(error)throw error;return data?.content||'';}
export async function saveNote(user,content){if(content.length>20000)throw Error('Notes can contain up to 20,000 characters.');if(!supabase){localStorage.setItem('pocket-note-'+user.id,content);return;}const {error}=await supabase.from('notepads').upsert({user_id:user.id,content,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;}

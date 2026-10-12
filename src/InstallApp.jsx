import React,{useEffect,useRef,useState} from 'react';
import {Download,X} from 'lucide-react';

export default function InstallApp(){
 const [prompt,setPrompt]=useState(null),[installed,setInstalled]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),dialog=useRef(null);
 useEffect(()=>{
  const media=window.matchMedia('(display-mode: standalone)');
  const sync=()=>setInstalled(media.matches||Boolean(navigator.standalone));
  const available=e=>{e.preventDefault();setPrompt(e);};
  const done=()=>{setInstalled(true);setPrompt(null);dialog.current?.close();};
  sync();media.addEventListener('change',sync);window.addEventListener('beforeinstallprompt',available);window.addEventListener('appinstalled',done);
  return()=>{media.removeEventListener('change',sync);window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',done);};
 },[]);
 if(installed)return null;
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 async function install(){setBusy(true);setError('');try{await prompt.prompt();const result=await prompt.userChoice;setPrompt(null);if(result.outcome==='accepted')dialog.current.close();}catch{setError('Use your browser menu to add Pocket to your home screen.');}finally{setBusy(false);}}
 return <><button className="install-trigger" onClick={()=>dialog.current.showModal()} aria-label="Add Pocket to home screen"><Download size={15}/><span>Install</span></button><dialog className="install-dialog" ref={dialog} onClick={e=>{if(e.target===dialog.current){const r=dialog.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.current.close();}}}><header><h2>Add Pocket</h2><button className="icon-button" onClick={()=>dialog.current.close()} aria-label="Close install instructions"><X size={18}/></button></header><img className="install-logo" src="/icons/pocket-white-192.png" alt="Pocket wallet logo"/><p>Open Pocket from your home screen.</p>{prompt?<button className="button dark full" disabled={busy} onClick={install}>{busy?'Opening…':'Install Pocket'}</button>:<p className="install-help">{!window.isSecureContext?'Open Pocket using its HTTPS address to install it.':ios?'In Safari, tap Share, then Add to Home Screen. Leave “Open as Web App” enabled if shown.':'Open your browser menu and choose “Install Pocket” or “Add to Home screen”. If the option is missing, try Chrome or Edge.'}</p>}{error&&<p className="error" role="alert">{error}</p>}</dialog></>;
}

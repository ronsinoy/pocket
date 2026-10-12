let deferredPrompt=null;
const subscribers=new Set();
const notify=()=>{for(const callback of subscribers)callback(deferredPrompt);};

// Capture this before React mounts; a prompt can arrive before component effects run.
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();deferredPrompt=event;notify();
});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;notify();});
export function watchInstallPrompt(callback){subscribers.add(callback);callback(deferredPrompt);return()=>subscribers.delete(callback);}
export function clearInstallPrompt(){deferredPrompt=null;notify();}

let workerSetup;
export function prepareInstallation(){
 if(!window.isSecureContext)return Promise.reject(Error('Installation needs HTTPS. A phone opening an HTTP address such as 192.168.x.x cannot install this app.'));
 if(window.self!==window.top)return Promise.reject(Error('Open Pocket directly in a browser tab. Installation is unavailable inside an embedded preview.'));
 if(!('serviceWorker' in navigator))return Promise.reject(Error('This browser cannot set up Pocket for installation. Open it in Chrome, Edge, or Safari.'));
 if(!workerSetup)workerSetup=navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(error=>{workerSetup=null;throw Error('Pocket could not load its installation files. Refresh the page or redeploy the latest build. '+error.message);});
 return workerSetup;
}

// Do not wait for a load event which may already have fired in a delayed module.
if(window.isSecureContext&&window.self===window.top&&'serviceWorker' in navigator){
 prepareInstallation().catch(error=>console.warn(error.message));
}

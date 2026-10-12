import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import config from '../vite.config.js';

function setup({secure=true,embedded=false}={}){
 const listeners={},registrations=[],window={isSecureContext:secure,addEventListener:(type,callback)=>listeners[type]=callback};
 window.self=window;window.top=embedded?{}:window;
 const navigator={serviceWorker:{register:(...args)=>{registrations.push(args);return Promise.resolve({scope:'/'});}}};
 const source=readFileSync(new URL('./pwa.js',import.meta.url),'utf8').replaceAll('export function','function');
 const context=vm.createContext({window,navigator,console:{warn:()=>{}}});
 vm.runInContext(source+'\nglobalThis.api={watchInstallPrompt,clearInstallPrompt,prepareInstallation};',context);
 return {listeners,registrations,api:context.api};
}
test('worker registers immediately on secure previews and shares its registration',async()=>{
 const {api,registrations}=setup();await api.prepareInstallation();await api.prepareInstallation();
 assert.equal(registrations.length,1);assert.equal(registrations[0][0],'/sw.js');assert.equal(registrations[0][1].updateViaCache,'none');
});
test('an install prompt arriving before React mounts remains available',()=>{
 const {listeners,api}=setup();let prevented=false,received;
 const event={preventDefault:()=>prevented=true};listeners.beforeinstallprompt(event);
 api.watchInstallPrompt(value=>received=value);assert.ok(prevented);assert.equal(received,event);
 api.clearInstallPrompt();assert.equal(received,null);
});
test('HTTP network addresses and embedded previews report the actual blocker',async()=>{
 const unsafe=setup({secure:false});assert.equal(unsafe.registrations.length,0);await assert.rejects(unsafe.api.prepareInstallation(),/HTTPS/);
 const embedded=setup({embedded:true});assert.equal(embedded.registrations.length,0);await assert.rejects(embedded.api.prepareInstallation(),/browser tab/);
});
test('Vite serves a JavaScript worker instead of the HTML app fallback',()=>{
 let middleware;config.plugins[0].configureServer({middlewares:{use:callback=>middleware=callback}});
 const headers={};let body,next=false;
 middleware({url:'/sw.js'},{setHeader:(name,value)=>headers[name]=value,end:value=>body=value},()=>next=true);
 assert.equal(headers['Content-Type'],'application/javascript');assert.equal(headers['Cache-Control'],'no-store');
 assert.match(body,/addEventListener\('fetch'/);assert.equal(next,false);
 middleware({url:'/other.js'},{},()=>next=true);assert.ok(next);
});

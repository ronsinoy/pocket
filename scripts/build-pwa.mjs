import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

async function walk(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const name=path.join(dir,entry.name);if(entry.isDirectory())result.push(...await walk(name));else result.push(name);}return result;}
const files=(await walk('dist')).filter(file=>!file.endsWith('/sw.js')).sort();
const hash=createHash('sha256');for(const file of files)hash.update(await readFile(file));
const urls=files.map(file=>'/'+path.relative('dist',file).split(path.sep).join('/'));
const cache='pocket-shell-'+hash.digest('hex').slice(0,12);
await writeFile('dist/sw.js',`// Generated from the current production build.
const CACHE=${JSON.stringify(cache)};
const ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('pocket-shell-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match('/index.html'))||fetch(request)));
 }else if(ASSETS.includes(url.pathname)){
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.pathname))||fetch(request)));
 }
});
`);
console.log('PWA shell generated with '+urls.length+' assets.');

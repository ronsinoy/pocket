import {defineConfig} from 'vite';

// Make installation work in secure local previews as well as production builds.
// Development requests stay on the network so editing the app never serves stale files.
const developmentWorker=`
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith('pocket-shell-'))await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('fetch',()=>{});
`;

export default defineConfig({
 plugins:[{
  name:'pocket-development-pwa',
  configureServer(server){
   server.middlewares.use((request,response,next)=>{
    if(request.url?.split('?')[0]!=='/sw.js')return next();
    response.setHeader('Content-Type','application/javascript');
    response.setHeader('Cache-Control','no-store');
    response.end(developmentWorker);
   });
  },
 }],
});

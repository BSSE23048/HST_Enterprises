const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'deploy-build/dist');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../firebase.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain','.xml':'application/xml'};
http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
 for(const h of config.hosting.headers[0].headers)res.setHeader(h.key,h.value);
 const redirect=config.hosting.redirects.find(item=>item.source===pathname);
 if(redirect){res.writeHead(redirect.type,{Location:redirect.destination});return res.end()}
 const portal=pathname==='/portal'||pathname.startsWith('/portal/');
 if(portal)res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
 const categoryRewrite=config.hosting.rewrites.find(item=>item.source===pathname&&item.destination.startsWith('/product-categories/'));
 let file=path.resolve(root,categoryRewrite?'.'+categoryRewrite.destination:portal?'portal/index.html':pathname==='/products'||pathname==='/products/'?'products.html':pathname==='/'?'index.html':'.'+pathname);
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory()){
  // Hosting canonicalizes directory URLs itself; explicit slash redirects can self-match.
  if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'});return res.end()}
  file=path.join(file,'index.html');
 }
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 const found=fs.existsSync(file)&&fs.statSync(file).isFile();
 const dest=found?file:path.join(root,'404.html');
 res.writeHead(found?200:404,{'Content-Type':mime[path.extname(dest)]||'application/octet-stream'});
 fs.createReadStream(dest).pipe(res);
}).listen(Number(process.env.HST_PREVIEW_PORT || 4174),'127.0.0.1',()=>console.log(`Production headers and routes: http://127.0.0.1:${process.env.HST_PREVIEW_PORT || 4174}`));

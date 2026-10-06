const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'../frontend/dist');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const files=fs.readdirSync(root,{recursive:true}).filter(f=>fs.statSync(path.join(root,f)).isFile());
 for(const file of files){
  const res=await fetch(`https://hst-enterprises.web.app/${file.replaceAll('\\','/')}?verify=${Date.now()}`);
  if(!res.ok||hash(Buffer.from(await res.arrayBuffer()))!==hash(fs.readFileSync(path.join(root,file))))throw Error(`Deployed file mismatch: ${file}`);
 }
 const portal=await fetch('https://hst-enterprises.web.app/portal');
 if(!portal.ok||!(await portal.text()).includes('HST Enterprises'))throw Error('Portal route failed');
 console.log(`Verified all ${files.length} deployed files by SHA-256 and the /portal route.`);
})().catch(e=>{console.error(e);process.exit(1);});

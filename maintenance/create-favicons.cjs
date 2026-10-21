// Render the unmodified company emblem on a transparent square favicon canvas.
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('./deploy-build/node_modules/playwright');
(async()=>{
 const root=path.join(__dirname,'../frontend/public');
 let bytes;try{bytes=fs.readFileSync(path.join(root,'HST_logo.png'));}catch{bytes=require('node:child_process').execFileSync('git',['show','HEAD:frontend/public/HST_logo.png']);fs.writeFileSync(path.join(root,'HST_logo.png'),bytes);}
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage();
 for(const [size,name]of [[48,'favicon-48.png'],[192,'favicon-192.png'],[180,'apple-touch-icon.png']]){
  const data=await page.evaluate(async({image,size,name})=>{const img=new Image();img.src=image;await img.decode();const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');const source=document.createElement('canvas');source.width=img.width;source.height=img.height;const sc=source.getContext('2d');sc.drawImage(img,0,0);const pixels=sc.getImageData(0,0,img.width,img.height);for(let i=0;i<pixels.data.length;i+=4){const alpha=Math.min(1,(255-Math.min(pixels.data[i],pixels.data[i+1],pixels.data[i+2]))/220);if(alpha===0){pixels.data[i+3]=0;continue;}for(let j=0;j<3;j++)pixels.data[i+j]=Math.max(0,255+(pixels.data[i+j]-255)/alpha);pixels.data[i+3]*=alpha;}sc.putImageData(pixels,0,0);if(name==='apple-touch-icon.png'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,size,size);}const width=size*.82,height=width*img.height/img.width;ctx.drawImage(source,(size-width)/2,(size-height)/2,width,height);return c.toDataURL('image/png').split(',')[1];},{image:'data:image/png;base64,'+bytes.toString('base64'),size,name});
  fs.writeFileSync(path.join(root,name),Buffer.from(data,'base64'));
 }
 await browser.close();console.log('Created square 48px, 192px and 180px HST icons.');
})().catch(e=>{console.error(e);process.exit(1)});



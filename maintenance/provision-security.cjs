// Idempotent, operator-only migration. No secrets or image contents are logged.
const fs=require('node:fs');
const path=require('node:path');
const {session}=require('./firebase-session.cjs');
(async()=>{
 const api=await session();
 const project='hst-enterprises';
 const expectedUid='G1JCKkMhxIfUKU70vrG7woW4ler2';
 const accounts=await api(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:lookup`,{method:'POST',body:JSON.stringify({localId:[expectedUid]})});
 const user=accounts.users?.[0];
 if(!user||user.email!=='admin@hst.com'||user.disabled)throw Error('Administrator identity mismatch.');
 const claims={...JSON.parse(user.customAttributes||'{}'),admin:true};
 await api(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:update`,{method:'POST',body:JSON.stringify({localId:expectedUid,customAttributes:JSON.stringify(claims)})});
 const fields={};
 for(const [key,name]of [['signature','Authorized_sign.png'],['stamp','HST_Stamp.png']]){
  const file=path.join(__dirname,'private-assets',name);
  const bytes=fs.readFileSync(file);
  if(bytes.length>400000||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid signing image.');
  fields[key]={stringValue:'data:image/png;base64,'+bytes.toString('base64')};
 }
 await api(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/privateAssets/signing`,{method:'PATCH',body:JSON.stringify({fields})});
 console.log('Existing ERP administrator granted admin claim; signing images stored in privateAssets/signing.');
})().catch(e=>{console.error(e.message);process.exitCode=1});

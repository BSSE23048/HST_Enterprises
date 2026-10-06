const path = require('node:path');
(async()=>{
 const auth=require(path.join(process.env.APPDATA,'npm/node_modules/.firebase-tools-61nXexCW/lib/auth.js'));
 const account=auth.getProjectDefaultAccount(path.resolve(__dirname,'..'));
 const token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
 const headers={Authorization:`Bearer ${token.access_token}`};
 const response=await fetch('https://identitytoolkit.googleapis.com/v1/projects/hst-enterprises/accounts:batchGet?maxResults=100',{headers});
 if(!response.ok)throw Error(`Auth inspection failed: ${response.status}`);
 const data=await response.json();
 console.log(JSON.stringify((data.users||[]).map(u=>({uid:u.localId,email:u.email,disabled:!!u.disabled,claims:u.customAttributes||'{}'})),null,2));
 const buckets=await fetch('https://storage.googleapis.com/storage/v1/b?project=hst-enterprises',{headers});
 console.log('Storage:',buckets.status,buckets.ok?(await buckets.json()).items?.map(b=>b.name)||[]:'unavailable');
})().catch(e=>{console.error(e.message);process.exitCode=1});

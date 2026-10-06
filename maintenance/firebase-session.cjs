const fs=require('node:fs');
const path=require('node:path');
function cliRoot(){
 const base=path.join(process.env.APPDATA,'npm/node_modules');
 const candidates=['firebase-tools',...fs.readdirSync(base).filter(n=>n.startsWith('.firebase-tools-'))];
 const root=candidates.map(n=>path.join(base,n)).find(p=>fs.existsSync(path.join(p,'lib/auth.js')));
 if(!root)throw Error('Install firebase-tools and run firebase login.');
 return root;
}
async function session(){
 const auth=require(path.join(cliRoot(),'lib/auth.js'));
 const account=auth.getProjectDefaultAccount(path.resolve(__dirname,'..'));
 if(!account)throw Error('Firebase project login required.');
 const token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
 return async function api(url,options={}){
  const response=await fetch(url,{...options,headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(45000)});
  const data=await response.json();
  if(!response.ok)throw Error(`${response.status}: ${data.error?.message||'Firebase operation failed'}`);
  return data;
 };
}
module.exports={session,cliRoot};

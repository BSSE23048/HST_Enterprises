const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const build = path.join(__dirname, 'deploy-build');
const config = JSON.parse(fs.readFileSync(path.join(build, 'firebase-public-config.json'), 'utf8'));
if (config.projectId !== 'hst-enterprises') throw new Error('Unexpected Firebase project');
const mapping = {apiKey:'API_KEY',authDomain:'AUTH_DOMAIN',projectId:'PROJECT_ID',storageBucket:'STORAGE_BUCKET',messagingSenderId:'MESSAGING_SENDER_ID',appId:'APP_ID'};
const env = {...process.env};
for (const [key, suffix] of Object.entries(mapping)) {
  if (!config[key]) throw new Error(`Missing Firebase field: ${key}`);
  env[`VITE_FIREBASE_${suffix}`] = config[key];
}
execFileSync(process.execPath, [path.join(build,'node_modules/vite/bin/vite.js'),'build'], {cwd:build,env,stdio:'inherit'});
const configPath = path.join(__dirname,'..','firebase.json');
const deployment = JSON.parse(fs.readFileSync(configPath,'utf8'));
const hosting = deployment.hosting;
const schemaHash = fs.readFileSync(path.join(build,'schema-csp-hash.txt'),'utf8').trim();
for (const group of hosting.headers) for (const header of group.headers) {
  if (header.key === 'Content-Security-Policy') header.value = header.value.replace(/script-src[^;]+/, `script-src 'self' ${schemaHash}`);
}
fs.writeFileSync(configPath, JSON.stringify(deployment,null,2)+'\n');
fs.writeFileSync(path.join(build,'firebase.deploy.json'),JSON.stringify({hosting:{...hosting,public:'dist'}},null,2));

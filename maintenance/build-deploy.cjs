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
if (!/^'sha256-[A-Za-z0-9+/]{43}='(?: 'sha256-[A-Za-z0-9+/]{43}=')*$/.test(schemaHash)) {
  throw new Error('Invalid generated JSON-LD CSP hashes');
}
// Fail closed if documents, source files or private assets enter the output.
const publicFiles = new Set([
  'product-categories/circuit-protection.html',
  'product-categories/motor-control.html',
  'product-categories/sensors-automation.html',
  'product-categories/cables-wires.html',
  'product-categories/panels-enclosures.html',
  'product-categories/switches-indicators.html',
  'product-categories/cable-accessories.html',
  'index.html', 'products.html', '404.html', 'portal/index.html', 'robots.txt', 'sitemap.xml',
  'industrial-switchgear/index.html', 'mccb-circuit-breakers/index.html',
  'industrial-electrical-cables/index.html', 'electrical-control-components/index.html',
  'HST_logo.png', 'favicon-48.png', 'favicon-192.png', 'apple-touch-icon.png',
  'company/industry.webp', 'company/industry-small.webp', 'company/power.webp',
  'company/manrope-0.woff2', 'company/fonts.css', 'company/OFL-Manrope.txt',
]);
function validateOutput(directory, prefix = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) validateOutput(path.join(directory, entry.name), relative + '/');
    else if (!publicFiles.has(relative) && !/^assets\/[A-Za-z0-9_.-]+\.(js|css)$/.test(relative)) {
      throw new Error(`Unexpected public build file: ${relative}`);
    }
  }
}
validateOutput(path.join(build, 'dist'));
for (const group of hosting.headers) for (const header of group.headers) {
  if (header.key === 'Content-Security-Policy') header.value = header.value.replace(/script-src[^;]+/, directive => {
    // Refresh generated hashes without dropping explicitly allowed script hosts.
    const sources = directive.replace(/\s+'sha256-[^']+'/g, '');
    return sources.replace("script-src 'self'", `script-src 'self' ${schemaHash}`);
  });
}
fs.writeFileSync(configPath, JSON.stringify(deployment,null,2)+'\n');
fs.writeFileSync(path.join(build,'firebase.deploy.json'),JSON.stringify({hosting:{...hosting,public:'dist'}},null,2));

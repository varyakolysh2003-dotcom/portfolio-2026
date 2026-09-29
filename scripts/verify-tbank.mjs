import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, cp, mkdir, rm, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const temp=await mkdtemp(join(tmpdir(),'tbank-static-'));
const password=randomBytes(32).toString('base64url');
const env={...process.env};delete env.TBANK_PASSWORD;
let server,browser;
function run(args, extra={}) {
 const result=spawnSync(process.execPath,args,{cwd:temp,env:{...env,...extra},encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);return result;
}
async function files(dir) {
 const result=[];
 for(const name of await readdir(dir)) {const path=join(dir,name);if((await stat(path)).isDirectory())result.push(...await files(path));else result.push(path);}
 return result;
}
try {
 for(const name of await readdir('.')) {
  if(name.startsWith('.') || ['node_modules','dist'].includes(name))continue;
  await cp(name,join(temp,name),{recursive:true});
 }
 await cp('.private/tbank',join(temp,'.private/tbank'),{recursive:true});
 const missing=spawnSync(process.execPath,['scripts/encrypt-tbank.mjs'],{cwd:temp,env,encoding:'utf8'});
 assert.notEqual(missing.status,0);assert.match(missing.stderr,/TBANK_PASSWORD/);
 run(['scripts/encrypt-tbank.mjs'],{TBANK_PASSWORD:password});
 const copy=JSON.parse(await readFile(join(temp,'.private/tbank/copy.json'),'utf8'));
 const protectedFiles=await files(join(temp,'.private/tbank/media'));
 const hashes=new Set(await Promise.all(protectedFiles.map(async p=>createHash('sha256').update(await readFile(p)).digest('hex'))));
 await rm(join(temp,'.private'),{recursive:true});
 const build=spawnSync('npm',['run','build'],{cwd:temp,env,encoding:'utf8'});
 assert.equal(build.status,0,build.stderr); // No private files or password.
 const manifest=JSON.parse(await readFile(join(temp,'T-Bank/encrypted/manifest.json'),'utf8'));
 await rm(join(temp,'T-Bank/encrypted',manifest.content));
 assert.notEqual(spawnSync(process.execPath,['scripts/build.mjs'],{cwd:temp,env}).status,0);
 const built=await files(join(temp,'dist'));
 for(const path of built) {
  const bytes=await readFile(path);assert.equal(hashes.has(createHash('sha256').update(bytes).digest('hex')),false,path);
  if(/\.(js|html|json|css)$/.test(path)) {
   const text=bytes.toString();assert.equal(text.includes(password),false);
   for(const group of [copy.profile,copy.main])for(const phrase of [group.context,group.result,...group.captions])assert.equal(text.includes(phrase),false,`Plaintext in ${path}`);
  }
 }
 // Run the exact GitHub Pages adaptation from the workflow.
 const workflow=await readFile('.github/workflows/pages.yml','utf8');
 const adaptation=workflow.split("python3 - <<'PY'\n")[1].split('\n          PY')[0].replace(/^          /gm,'');
 const adapted=spawnSync('python3',['-c',adaptation],{cwd:temp,encoding:'utf8'});assert.equal(adapted.status,0,adapted.stderr);
 const base='/portfolio-2026';
 server=createServer(async(req,res)=>{
  try {
   const path=new URL(req.url,'http://localhost').pathname;
   if(!path.startsWith(base+'/') || path.includes('/api/')){res.writeHead(404).end();return;}
   const name=path.slice(base.length+1)+(path.endsWith('/')?'index.html':'');
   const data=await readFile(join(temp,'dist',name));
   const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.mp4':'video/mp4','.png':'image/png','.ttf':'font/ttf'}[extname(name)];
   res.writeHead(200,{'Content-Type':type || 'application/octet-stream'}).end(data);
  } catch {res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}${base}/t-bank/`;
 console.log(`Static preview: ${url}`);
 browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto(url);await page.waitForSelector('.dots');
 assert.equal(await page.locator('.bank-tabs').isVisible(),false);
 async function submit(value){await page.locator('#case-password').fill(value);await page.locator('#case-password').press('Enter');await page.waitForFunction(()=>!document.querySelector('#password-form').hasAttribute('aria-busy'));}
 await submit('wrong');assert.equal(await page.locator('.spoiler--open').count(),0);assert.equal(await page.locator('#case-password').inputValue(),'');
 const contentPath=join(temp,'dist/t-bank/encrypted',manifest.content);
 const originalEnvelope=await readFile(contentPath,'utf8');
 const corrupt=JSON.parse(originalEnvelope);const bytes=Buffer.from(corrupt.ciphertext,'base64');bytes[0]^=1;corrupt.ciphertext=bytes.toString('base64');
 await writeFile(contentPath,JSON.stringify(corrupt));
 await submit(password);assert.equal(await page.locator('.spoiler--open').count(),0);
 await writeFile(contentPath,originalEnvelope);
 await submit(password);assert.equal(await page.locator('#password-form').isVisible(),false);assert.equal(await page.locator('.spoiler--open').count(),16);
 assert.ok((await page.locator('.bank-intro').innerText()).includes(copy.profile.result));
 for(const width of [1200,375,320,768,1024]) {
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].map(img=>img.decode()));});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
 }
 await page.getByRole('tab',{name:'Main 8.4',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('#main-cases').hidden);
 await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].map(img=>img.decode()));});
 await page.locator('video').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
 assert.ok((await page.locator('.bank-intro').innerText()).includes(copy.main.result));
 await page.getByRole('tab',{name:'Main 8.4',exact:true}).press('ArrowLeft');assert.equal(await page.locator('#profile-cases').isVisible(),true);
 assert.equal((await page.context().cookies()).some(c=>c.name==='tbank_session'),false);
 assert.equal(requests.some(url=>url.includes('/api/tbank/')),false);
 assert.equal(requests.some(url=>url.includes(base+base)),false);
 assert.equal(requests.filter(url=>url.startsWith('http')).every(url=>new URL(url).pathname.startsWith(base+'/')),true);
 await page.reload();await page.waitForSelector('.dots');assert.equal(await page.locator('.spoiler--open').count(),0);
 await page.goto(url+'?lang=ru');await submit(password);
 assert.equal(await page.locator('html').getAttribute('lang'),'ru');
 assert.equal(await page.locator('.desktop-caption p').first().innerText(),(await import(new URL('../.private/tbank/translations.mjs',import.meta.url))).translations(copy).find(([en])=>en===copy.profile.captions[0])[1]);
 await page.setViewportSize({width:375,height:812});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].map(img=>img.decode()));});
 await page.waitForFunction(()=>[...document.querySelectorAll('.blur-block')].every(el=>getComputedStyle(el).opacity==='0'));
 await mkdir('.private/tbank/verification',{recursive:true});
 await page.screenshot({path:'.private/tbank/verification/encrypted-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 const report={staticSubpath:true,noBackendRequests:true,buildWithoutPrivateFilesOrPassword:true,missingBundleRejected:true,wrongPasswordRejected:true,tamperedCiphertextRejected:true,profileAndMainTabs:true,imagesDecoded:true,videoLoaded:true,reloadLocks:true,russianTranslations:true,responsiveWidths:[1200,375,320,768,1024],plaintextScanPassed:true,errors};
 await writeFile('verification/tbank-checks.json',JSON.stringify(report,null,2)+'\n');console.log(report);
 if(process.env.TBANK_VERIFY_HOLD)await new Promise(resolve=>setTimeout(resolve,45000));
} finally {await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}

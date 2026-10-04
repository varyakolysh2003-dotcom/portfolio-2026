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
   for(const group of [copy.profile,copy.main])for(const phrase of [group.context,group.result,...group.captions,...(group.blocks || []).flat().flatMap(block=>[block.body,block.ru]),...(group.introSections || []).flatMap(section=>[section.body,section.ru])])assert.equal(text.includes(phrase),false,`Plaintext in ${path}`);
  }
 }
 // Production is served directly from the custom domain root.
 const base='';
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
 const apiChecks=await page.evaluate(async({password})=>{
  const {decryptCase}=await import('./decrypt.js');
  const originalFetch=window.fetch,originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
  const fetched=[],created=[],revoked=[];
  window.fetch=(...args)=>{fetched.push(String(args[0]));return originalFetch(...args)};
  URL.createObjectURL=blob=>{const url=originalCreate(blob);created.push(url);return url};
  URL.revokeObjectURL=url=>{revoked.push(url);originalRevoke(url)};
  try {
   const result=await decryptCase(password);
   const contentOnly=fetched.length===2;
   window.testMediaFiles=result.media;
   const name=Object.keys(result.media)[0];
   const urls=await Promise.all([result.mediaUrl(name),result.mediaUrl(name)]);
   await result.mediaUrl(name);
   const cached=fetched.length===3 && urls[0]===urls[1] && created.length===1;
   const pending=result.mediaUrl(Object.keys(result.media)[1]);
   result.dispose();
   const cancelled=await pending.then(()=>false,()=>true);
   const rejectsDisposed=await result.mediaUrl(name).then(()=>false,()=>true);
   return {contentOnly,cached,cancelled,rejectsDisposed,revoked:revoked.length===created.length};
  } finally {window.fetch=originalFetch;URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke}
 },{password});
 assert.ok(Object.values(apiChecks).every(Boolean),JSON.stringify(apiChecks));
 await submit('wrong');assert.equal(await page.locator('.spoiler--open').count(),0);assert.equal(await page.locator('#case-password').inputValue(),'');
 const contentPath=join(temp,'dist/t-bank/encrypted',manifest.content);
 const originalEnvelope=await readFile(contentPath,'utf8');
 const corrupt=JSON.parse(originalEnvelope);const bytes=Buffer.from(corrupt.ciphertext,'base64');bytes[0]^=1;corrupt.ciphertext=bytes.toString('base64');
 await writeFile(contentPath,JSON.stringify(corrupt));
 await submit(password);assert.equal(await page.locator('.spoiler--open').count(),0);
 await writeFile(contentPath,originalEnvelope);
 // Content authentication must finish while media responses are deliberately held.
 const requestStart=requests.length;
 const held=[];
 let releaseMedia;
 const mediaGate=new Promise(resolve=>{releaseMedia=resolve;});
 await page.route('**/encrypted/*.json',async route=>{
  if(route.request().url().endsWith('/manifest.json') || route.request().url().endsWith('/'+manifest.content))return route.continue();
  held.push(route);
  await mediaGate;
  await route.continue();
 });
 await submit(password);assert.equal(await page.locator('#password-form').isVisible(),false);assert.equal(await page.locator('.text-spoiler.spoiler--open').count(),copy.profile.blocks.flat().length*2);
 assert.ok((await page.locator('.bank-intro').innerText()).replace(/\s+/g,' ').includes(copy.profile.result.replace(/\s+/g,' ')));
 await page.waitForFunction(()=>document.querySelector('.bank-media[aria-busy=true]'));
 assert.equal(await page.locator('#main-cases').locator('*').count(),0);
 assert.ok(held.length<protectedFiles.length);
 assert.ok(await page.locator('.bank-media:not(.spoiler--open)').count()>0);
 releaseMedia();
 async function loadVisibleMedia(root) {
  for(const media of await page.locator(root+' .bank-media').all()) {
   await media.scrollIntoViewIfNeeded();
   await page.waitForFunction(el=>!el.hasAttribute('aria-busy') && el.classList.contains('spoiler--open'),await media.elementHandle());
  }
 }
 await loadVisibleMedia('#profile-cases');

 for(const width of [1200,375,320,768,1024]) {
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await loadVisibleMedia('#profile-cases');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
 }
 const mediaFiles=await page.evaluate(()=>window.testMediaFiles);
 const mainFiles=Object.entries(mediaFiles).filter(([name])=>name.startsWith('main')).map(([,asset])=>asset.file);
 assert.equal(requests.slice(requestStart).some(url=>mainFiles.some(file=>url.endsWith('/encrypted/'+file))),false);
 const beforeMain=requests.length;
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('tab',{name:'Main 8.4',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('#main-cases').hidden);
 await page.waitForFunction(()=>document.querySelector('#main-cases .bank-media.spoiler--open'));
 const requestedMain=requests.slice(beforeMain).filter(url=>mainFiles.some(file=>url.endsWith('/encrypted/'+file)));
 assert.ok(requestedMain.length>0 && requestedMain.length<mainFiles.length);
 assert.equal(await page.locator('video').getAttribute('src'),null);
 await loadVisibleMedia('#main-cases');
 assert.equal(await page.locator('video').getAttribute('src'),null);
 assert.equal(await page.locator('video').evaluate(video=>video.paused),true);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('video').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
 assert.ok((await page.locator('.bank-intro').innerText()).includes(copy.main.result));
 await page.getByRole('tab',{name:'Main 8.4',exact:true}).press('ArrowLeft');assert.equal(await page.locator('#profile-cases').isVisible(),true);
 assert.equal(await page.locator('video').evaluate(video=>video.paused),true);
 const mediaRequests=requests.slice(requestStart).filter(url=>/encrypted\/\d+\.json$/.test(url) && !url.endsWith('/'+manifest.content));
 assert.equal(new Set(mediaRequests).size,mediaRequests.length);
 assert.equal((await page.context().cookies()).some(c=>c.name==='tbank_session'),false);
 assert.equal(requests.some(url=>url.includes('/api/tbank/')),false);
 assert.equal(requests.some(url=>url.includes('/portfolio-2026/')),false);
 assert.equal(requests.filter(url=>url.startsWith('http')).every(url=>new URL(url).pathname.startsWith(base+'/')),true);
 await page.reload();await page.waitForSelector('.dots');assert.equal(await page.locator('.spoiler--open').count(),0);
 await page.goto(url+'?lang=ru');await submit(password);
 assert.equal(await page.locator('html').getAttribute('lang'),'ru');
 for(const section of copy.profile.introSections) assert.ok((await page.locator('.bank-intro').innerText()).replace(/\s+/g,' ').includes(section.ru.replace(/\s+/g,' ')));
 assert.equal(await page.locator('.bank-results > div').count(),copy.profile.introSections.at(-1).metrics.length);
 assert.deepEqual(await page.locator('.bank-results dd').allTextContents(),copy.profile.introSections.at(-1).metrics.map(metric=>metric.value));
 assert.equal((await page.locator('.desktop-caption p').first().innerText()).replace(/\s+/g,' '),(await import(new URL('../.private/tbank/translations.mjs',import.meta.url))).translations(copy).find(([en])=>en===copy.profile.captions[0])[1].replace(/\s+/g,' '));
 await page.setViewportSize({width:1200,height:900});
 await loadVisibleMedia('#profile-cases');
 await mkdir('.private/tbank/verification',{recursive:true});
 await page.waitForFunction(()=>[...document.querySelectorAll('#profile-cases .blur-block')].every(el=>getComputedStyle(el).opacity==='0'));
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'.private/tbank/verification/encrypted-desktop.png',fullPage:true});
 for (const block of copy.profile.blocks.flat()) assert.ok((await page.locator('#profile-cases').innerText()).replace(/\s+/g,' ').includes(block.ru.replace(/\s+/g,' ')));
 await page.setViewportSize({width:375,height:812});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await loadVisibleMedia('#profile-cases');
 await page.waitForFunction(()=>[...document.querySelectorAll('.blur-block')].every(el=>getComputedStyle(el).opacity==='0'));
 await mkdir('.private/tbank/verification',{recursive:true});
 await page.screenshot({path:'.private/tbank/verification/encrypted-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 const report={lazyApi:apiChecks,unlockWithMediaBlocked:true,mainDeferred:true,viewportOnly:true,noRepeatedMediaRequests:true,reducedMotion:true,hiddenVideoPaused:true,customDomainRoot:true,noBackendRequests:true,buildWithoutPrivateFilesOrPassword:true,missingBundleRejected:true,wrongPasswordRejected:true,tamperedCiphertextRejected:true,profileAndMainTabs:true,imagesDecoded:true,videoLoaded:true,reloadLocks:true,russianTranslations:true,responsiveWidths:[1200,375,320,768,1024],plaintextScanPassed:true,errors};
 await writeFile('verification/tbank-checks.json',JSON.stringify(report,null,2)+'\n');console.log(report);
 if(process.env.TBANK_VERIFY_HOLD)await new Promise(resolve=>setTimeout(resolve,45000));
} finally {await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}

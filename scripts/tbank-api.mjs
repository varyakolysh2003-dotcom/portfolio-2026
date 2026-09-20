import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHmac, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(derive);
const privateRoot = resolve(process.env.TBANK_PRIVATE_DIR || '.private/tbank');
const configPath = resolve(process.env.TBANK_AUTH_FILE || '.data/tbank-auth.json');
const attempts = new Map();
function equal(a,b) { return a.length === b.length && timingSafeEqual(a,b); }
export async function tbankApi(req,res,pathname) {
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  const json = (status,data) => { res.writeHead(status,{'Content-Type':'application/json'}).end(JSON.stringify(data)); };
  try {
    const config = JSON.parse(await readFile(configPath,'utf8'));
    const sign = text => createHmac('sha256',config.secret).update(text).digest('hex');
    const token = req.headers.cookie?.match(/(?:^|;\s*)tbank_session=(\d+\.[a-f0-9]{64})(?:;|$)/)?.[1];
    const [expiry,signature] = token?.split('.') || [];
    const authorized = !!expiry && Number(expiry) > Date.now() && equal(Buffer.from(signature),Buffer.from(sign(expiry)));
    if (pathname === '/api/tbank/session' && req.method === 'GET') { json(200,{authorized}); return; }
    if (pathname === '/api/tbank/session' && req.method === 'POST') {
      if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) { json(403,{error:'Forbidden'});return; }
      const key=req.socket.remoteAddress;
      const now=Date.now();
      for (const [ip,value] of attempts) if (value.until<now) attempts.delete(ip);
      const limit=attempts.get(key) || {count:0,until:now+60000};
      if (limit.count>=10) {json(429,{error:'Too many attempts. Please try again in a minute.'});return;}
      limit.count++; attempts.set(key,limit);
      let body='';
      for await (const chunk of req) {body+=chunk;if(Buffer.byteLength(body)>2048){json(413,{error:'Request too large'});return;}}
      let password;
      try {password=JSON.parse(body).password;} catch {json(400,{error:'Invalid request'});return;}
      if(typeof password!=='string' || password.length>256) {json(400,{error:'Invalid password'});return;}
      const hash=await scrypt(password,config.salt,64);
      if(!equal(hash,Buffer.from(config.hash,'hex'))) {json(401,{error:'Incorrect password. Please try again.'});return;}
      attempts.delete(key);
      const expires=String(Date.now()+8*60*60*1000);
      res.setHeader('Set-Cookie',`tbank_session=${expires}.${sign(expires)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${req.socket.encrypted || req.headers['x-forwarded-proto']==='https'?'; Secure':''}`);
      json(200,{authorized:true});return;
    }
    if(!authorized) {json(401,{error:'Password required'});return;}
    if(req.method!=='GET') {json(405,{error:'Method not allowed'});return;}
    let file,type;
    const media=pathname.match(/^\/api\/tbank\/media\/((?:profile|main)(?:Desktop|Mobile)-\d-\d\.(?:png|svg))$/);
    if(media) {file=resolve(privateRoot,'media',media[1]);type=media[1].endsWith('.svg')?'image/svg+xml':'image/png';}
    else if(pathname==='/api/tbank/copy') {file=resolve(privateRoot,'copy.json');type='application/json';}
    else if(pathname==='/api/tbank/cases/main') {file=resolve(privateRoot,'main.html');type='text/html; charset=utf-8';}
    else {json(404,{error:'Not found'});return;}
    const content=await readFile(file);
    res.writeHead(200,{'Content-Type':type,'Content-Length':content.length}).end(content);
  } catch(error) {json(error.code==='ENOENT'?503:500,{error:'Cases are temporarily unavailable. Please try again.'});}
}

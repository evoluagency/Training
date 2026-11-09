import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {createTrainingSessionAuthority} from '../supabase/functions/intelligence-session-authority/session-authority.mjs';
const pair=generateKeyPairSync('ed25519'),jwk=pair.publicKey.export({format:'jwk'});
const issuer='https://ljuqbkwsnouthzwrzszy.supabase.co/auth/v1';
const subject='c52c8fb3-783e-4b22-8f7e-86c491c03d3a',sessionId='14bef9b3-2d56-489c-8d44-41ff3a06f5d3';
const now=1800000000000,path='/functions/v1/intelligence-session-authority';
const url='https://ljuqbkwsnouthzwrzszy.supabase.co'+path;
const body=JSON.stringify({issuer,subject,sessionId});
const signed=({value=body,ts=now,nonce='AAAAAAAAAAAAAAAAAAAAAA',key=pair.privateKey}={})=>{
 const signature=sign(null,Buffer.from(['v1','intelligence','POST',path,ts,nonce,value].join('\n')),key).toString('base64url');
 return new Request(url,{method:'POST',headers:{'content-type':'application/json','x-evolu-service':'intelligence','x-evolu-timestamp':String(ts),'x-evolu-nonce':nonce,'x-evolu-signature':signature},body:value});
};
const factory=(checkSession)=>createTrainingSessionAuthority({publicKeyJwk:jwk,checkSession,clock:()=>now});
test('valid signed session responds with an uncached boolean and no browser CORS',async()=>{
 let seen;const r=await factory(async x=>{seen=x;return true;}).fetch(signed());
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{active:true});
 assert.deepEqual(seen,{subject,sessionId});assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal(r.headers.get('access-control-allow-origin'),null);
});
test('logout is rechecked on every request',async()=>{
 let active=true,calls=0;const server=factory(async()=>{calls++;return active;});
 assert.deepEqual(await (await server.fetch(signed())).json(),{active:true});
 active=false;
 assert.deepEqual(await (await server.fetch(signed({nonce:'BBBBBBBBBBBBBBBBBBBBBB'}))).json(),{active:false});
 assert.equal(calls,2);
});
test('expired, forged and tampered requests never reach the database',async()=>{
 let calls=0;const server=factory(async()=>{calls++;return true;});
 const attacks=[
  signed({ts:now-11000}),signed({ts:now+11000}),signed({key:generateKeyPairSync('ed25519').privateKey}),
  new Request(url,{method:'POST',headers:signed().headers,body:body.replace(subject,'00000000-0000-4000-8000-000000000000')}),
  signed({value:JSON.stringify({issuer:'https://wrong.invalid/auth/v1',subject,sessionId})}),
  new Request(url,{method:'GET'})
 ];
 for(const req of attacks)assert.equal((await server.fetch(req)).status,401);
 assert.equal(calls,0);
});
test('database outage, malformed answers and private JWK fail closed',async()=>{
 assert.equal((await factory(async()=>{throw Error('secret');}).fetch(signed())).status,503);
 assert.equal((await factory(async()=>null).fetch(signed())).status,503);
 for(const key of [undefined,null,{}, {...jwk,d:'sensitive'}, {...jwk,crv:'X25519'}])
  assert.throws(()=>createTrainingSessionAuthority({publicKeyJwk:key,checkSession:async()=>true}),/CONFIGURATION_ERROR/);
});

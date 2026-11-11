import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveIntelligenceRoute,intelligenceBaseUrl,localPreviewEnabled,forwardToIntelligence,MAX_BODY_BYTES} from '../lib/intelligence/gateway.ts';
import {splitSentences,formatClock,interviewBadge,ROUTE_BADGE,ERROR_TEXT} from '../app/intelligence/meeting-text.ts';
import {isPortalRoute,portalPageTitle} from '../lib/training/navigation.ts';

const base=new URL('http://127.0.0.1:4173');
type Call={url:string;init:RequestInit};
function fakeFetch(status:number,body:string){
  const calls:Call[]=[];
  const impl=(async(url:URL|string,init?:RequestInit)=>{calls.push({url:String(url),init:init??{}});return new Response(body,{status,headers:{'content-type':'application/json','x-internal':'segredo'}})}) as typeof fetch;
  return {calls,impl};
}

test('intelligence: lista fechada de rotas, entrevista só para administração',()=>{
  assert.deepEqual(resolveIntelligenceRoute('GET','state'),{method:'GET',path:'state',access:'learner'});
  assert.equal(resolveIntelligenceRoute('POST','lesson/ask')?.access,'learner');
  for(const p of ['interview/start','interview/reply','interview/finish'])assert.equal(resolveIntelligenceRoute('POST',p)?.access,'admin');
  assert.equal(resolveIntelligenceRoute('GET','lesson/ask'),null);
  assert.equal(resolveIntelligenceRoute('POST','../admin'),null);
  assert.equal(resolveIntelligenceRoute('POST','lesson/ask/../../x'),null);
  assert.equal(resolveIntelligenceRoute('DELETE','state'),null);
});

test('intelligence: URL do serviço só http(s) e sem credencial embutida',()=>{
  assert.equal(intelligenceBaseUrl(undefined),null);
  assert.equal(intelligenceBaseUrl(''),null);
  assert.equal(intelligenceBaseUrl('ftp://x'),null);
  assert.equal(intelligenceBaseUrl('http://user:pw@host'),null);
  assert.equal(intelligenceBaseUrl('nao é url'),null);
  assert.equal(intelligenceBaseUrl('http://127.0.0.1:4173')?.host,'127.0.0.1:4173');
});

test('intelligence: prévia sem login só fora de produção e com a variável explícita',()=>{
  assert.equal(localPreviewEnabled({NODE_ENV:'development',INTELLIGENCE_LOCAL_PREVIEW:'1'}),true);
  assert.equal(localPreviewEnabled({NODE_ENV:'production',INTELLIGENCE_LOCAL_PREVIEW:'1'}),false);
  assert.equal(localPreviewEnabled({NODE_ENV:'development'}),false);
  assert.equal(localPreviewEnabled({NODE_ENV:'development',INTELLIGENCE_LOCAL_PREVIEW:'true'}),false);
});

test('intelligence: repassa JSON ao serviço e devolve sem cabeçalhos internos',async()=>{
  const f=fakeFetch(200,JSON.stringify({route:'ANSWER',speech:'ok'}));
  const r=await forwardToIntelligence({route:resolveIntelligenceRoute('POST','lesson/ask')!,base,body:'{"text":"oi"}',fetchImpl:f.impl});
  assert.equal(r.status,200);
  assert.deepEqual(await r.json(),{route:'ANSWER',speech:'ok'});
  assert.equal(r.headers.get('x-internal'),null);
  assert.equal(r.headers.get('cache-control'),'private, no-store');
  assert.equal(f.calls[0].url,'http://127.0.0.1:4173/api/lesson/ask');
  assert.equal(f.calls[0].init.method,'POST');
  assert.equal(f.calls[0].init.body,'{"text":"oi"}');
  assert.equal(f.calls[0].init.redirect,'error');
});

test('intelligence: GET sem corpo e base com caminho preservado',async()=>{
  const f=fakeFetch(200,'{}');
  await forwardToIntelligence({route:resolveIntelligenceRoute('GET','state')!,base:new URL('https://intel.example/avatar'),body:'',fetchImpl:f.impl});
  assert.equal(f.calls[0].url,'https://intel.example/avatar/api/state');
  assert.equal(f.calls[0].init.body,undefined);
});

test('intelligence: corpo grande, JSON inválido e serviço fora',async()=>{
  const route=resolveIntelligenceRoute('POST','lesson/ask')!;
  const f=fakeFetch(200,'{}');
  assert.equal((await forwardToIntelligence({route,base,body:JSON.stringify({text:'x'.repeat(MAX_BODY_BYTES)}),fetchImpl:f.impl})).status,413);
  assert.equal((await forwardToIntelligence({route,base,body:'{quebrado',fetchImpl:f.impl})).status,400);
  assert.equal(f.calls.length,0);
  const down=(async()=>{throw new Error('ECONNREFUSED')}) as unknown as typeof fetch;
  const r=await forwardToIntelligence({route,base,body:'{}',fetchImpl:down});
  assert.equal(r.status,503);
  assert.deepEqual(await r.json(),{error:'INTELLIGENCE_UNAVAILABLE'});
});

test('intelligence: erros do serviço viram código curto, sem detalhe interno',async()=>{
  const route=resolveIntelligenceRoute('POST','lesson/ask')!;
  let r=await forwardToIntelligence({route,base,body:'{}',fetchImpl:fakeFetch(400,'{"error":"LESSON_NOT_LIVE"}').impl});
  assert.equal(r.status,400);assert.deepEqual(await r.json(),{error:'LESSON_NOT_LIVE'});
  r=await forwardToIntelligence({route,base,body:'{}',fetchImpl:fakeFetch(500,'{"error":"stack trace at /srv/x.js"}').impl});
  assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'UPSTREAM_ERROR'});
  r=await forwardToIntelligence({route,base,body:'{}',fetchImpl:fakeFetch(200,'<html>').impl});
  assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'BAD_UPSTREAM'});
});

test('intelligence: textos da reunião',()=>{
  const t='Primeira frase. Segunda? Terceira!\nFim';
  assert.equal(splitSentences(t).join(''),t);
  assert.ok(splitSentences(t).length>=4);
  assert.equal(formatClock(0),'00:00');assert.equal(formatClock(65_400),'01:05');assert.equal(formatClock(-5),'00:00');
  assert.equal(interviewBadge({draft:{}}),'Rascunho gerado (DRAFT)');
  assert.equal(interviewBadge({guard:'PERSONAL'}),'Não registrado');
  assert.equal(interviewBadge({}),null);
  assert.ok(ROUTE_BADGE.CONTINGENCY&&ERROR_TEXT.INTELLIGENCE_UNAVAILABLE&&ERROR_TEXT.ADMIN_ONLY);
});

test('intelligence: rota da entrevista no /admin e fora da área do participante',()=>{
  assert.equal(isPortalRoute('/admin/entrevista-avatar','admin'),true);
  assert.equal(isPortalRoute('/area/entrevista-avatar','learner'),false);
  assert.equal(portalPageTitle('/admin/entrevista-avatar'),'Entrevista do avatar');
});

import {visemeFor,levelFromSamples,avatarMood,moodTarget,approach} from '../app/intelligence/avatar-motion.ts';

test('avatar 3D: visema pela vogal, lábios fechados em m/b/p, acentos ignorados',()=>{
  assert.ok(visemeFor('casa').open>visemeFor('isso').open);
  assert.ok(visemeFor('uva').round>visemeFor('ela').round);
  assert.ok(visemeFor('igual').width>visemeFor('outro').width);
  assert.equal(visemeFor('mesa').closed,true);
  assert.equal(visemeFor('tarde').closed,false);
  assert.deepEqual(visemeFor('ótimo'),visemeFor('otimo'));
  assert.equal(visemeFor('').closed,false);
  assert.equal(visemeFor(undefined).open,visemeFor('xyz').open);
});

test('avatar 3D: volume do áudio entre 0 e 1, silêncio é zero',()=>{
  assert.equal(levelFromSamples(new Uint8Array(512).fill(128)),0);
  assert.equal(levelFromSamples([]),0);
  const loud=Uint8Array.from({length:512},(_,i)=>i%2?255:0);
  assert.equal(levelFromSamples(loud),1);
  const mid=Uint8Array.from({length:512},(_,i)=>128+Math.round(12*Math.sin(i/5)));
  const l=levelFromSamples(mid);assert.ok(l>0&&l<1,String(l));
});

test('avatar 3D: estados ouvindo, pensando, falando e encaminhando',()=>{
  const base={thinking:false,speaking:false,listening:false,routed:false};
  assert.equal(avatarMood(base),'idle');
  assert.equal(avatarMood({...base,listening:true}),'listening');
  assert.equal(avatarMood({...base,speaking:true,listening:true}),'speaking');
  assert.equal(avatarMood({...base,speaking:true,routed:true}),'routing');
  assert.equal(avatarMood({...base,thinking:true,speaking:true}),'thinking');
  assert.notEqual(moodTarget('routing').led,moodTarget('speaking').led);
  assert.ok(moodTarget('thinking').ledPulse>0);
  assert.equal(approach(0,1,5,0),0);
  assert.ok(Math.abs(approach(0,1,5,10)-1)<1e-9);
});

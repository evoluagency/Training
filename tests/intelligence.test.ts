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
import {CaptureUploader,uploadQuery,plainMime,sizeAllowed,newCaptureSession,estimateMegabytesPerHour,CAPTURE_CLIENT} from '../app/intelligence/capture.ts';
import {CAPTURE_POLICY} from '../app/intelligence/meeting-text.ts';
const consent={id:'c-1',mode:'interview' as const,policyVersion:CAPTURE_POLICY.version,camera:true,photos:true,recording:true,acceptedAt:1};

test('captação: consulta, tipo sem codec, limites e sessão aceitos pelo servidor',()=>{
  assert.equal(uploadQuery({consent:'c 1',session:'entrevista-x',kind:'photo',moment:'answer_start'}),'consent=c+1&session=entrevista-x&kind=photo&moment=answer_start');
  assert.equal(plainMime('video/webm;codecs=vp8,opus','recording'),'video/webm');
  assert.equal(plainMime('video/mp4','recording'),'video/mp4');
  assert.equal(plainMime('','photo'),'image/jpeg');
  assert.ok(sizeAllowed(1024*1024,'photo'));assert.ok(!sizeAllowed(1024*1024+1,'photo'));assert.ok(!sizeAllowed(0,'recording'));
  assert.ok(sizeAllowed(4*1024*1024,'recording'));assert.ok(!sizeAllowed(4*1024*1024+1,'recording'));
  const s=newCaptureSession(Date.UTC(2026,10,12,10,30,0));assert.match(s,/^[a-zA-Z0-9-]{8,64}$/);assert.ok(s.startsWith('entrevista-2026-11-12-10-30-00-'));
  // Trecho de 60 s no bitrate configurado fica abaixo do limite de envio (4 MB).
  assert.ok((CAPTURE_CLIENT.videoBitsPerSecond+CAPTURE_CLIENT.audioBitsPerSecond)*CAPTURE_CLIENT.segmentMs/1000/8<CAPTURE_CLIENT.segmentBytes);
  assert.equal(estimateMegabytesPerHour(true,false),11);assert.equal(estimateMegabytesPerHour(false,false),0);assert.ok(estimateMegabytesPerHour(true,true)>100);
});

test('captação: envia em série, tenta de novo uma vez e guarda o que falhar',async()=>{
  const calls:{url:string;type:string;size:number}[]=[];let failNext=1;
  const fetcher=(async(url:string,init:RequestInit)=>{const b=init.body as Blob;calls.push({url,type:String((init.headers as Record<string,string>)['Content-Type']),size:b.size});
    if(url.includes('kind=recording')&&failNext-->0)return new Response('{}',{status:503});
    if(url.includes('moment=expression'))return Response.json({error:'Aceite da política de imagem ausente ou revogado.'},{status:403});
    return Response.json({id:'x'},{status:201});}) as unknown as typeof fetch;
  const changes:string[]=[];
  const up=new CaptureUploader(consent,'entrevista-teste-1',(_s,err)=>{if(err)changes.push(err)},fetcher);
  up.enqueue(new Blob([new Uint8Array(100)],{type:'image/jpeg'}),'photo','answer_start');
  up.enqueue(new Blob([new Uint8Array(200)],{type:'video/webm;codecs=vp8,opus'}),'recording','session');
  up.enqueue(new Blob([new Uint8Array(50)],{type:'image/jpeg'}),'photo','expression');
  up.enqueue(new Blob([new Uint8Array(CAPTURE_CLIENT.photoBytes+1)]),'photo','interval');
  await up.flush(2000);
  assert.equal(up.stats.photos,1);assert.equal(up.stats.segments,1);assert.equal(up.stats.failed,2);assert.equal(up.stats.bytes,300);
  assert.equal(up.failedItems.length,2);
  assert.equal(calls.length,4,'503 tenta de novo, 403 não, acima do limite nem envia');
  assert.equal(calls[1].type,'video/webm');
  assert.ok(calls.every(c=>c.url.startsWith('/api/training/capture-upload?consent=c-1&session=entrevista-teste-1&')));
  assert.equal(changes[0],'Foto acima de 1 MB.');
  const noPhotos=new CaptureUploader({...consent,photos:false},'entrevista-teste-2',()=>{},fetcher);
  noPhotos.enqueue(new Blob([new Uint8Array(10)]),'photo','interval');await noPhotos.flush(500);assert.equal(calls.length,4,'sem aceite de fotos nada é enviado');
});

test('captação: política versionada separada da política de imagem da aula',()=>{
  assert.match(CAPTURE_POLICY.version,/^[a-zA-Z0-9._-]{1,40}$/);
  assert.ok(CAPTURE_POLICY.points.some(p=>p.includes('10 segundos')));
  assert.ok(CAPTURE_POLICY.points.some(p=>/revogar/i.test(p)));
});
import {phonemesToIds,chunkForSpeech,sha256Hex,PIPER_ASSETS} from '../app/intelligence/neural-voice.ts';
test('voz neural: fonemas no formato do Piper, frases curtas e arquivo fixado',async()=>{
  const map={_:[0],'^':[1],$:[2],o:[27],l:[24],'ˈ':[120],a:[14],' ':[3]};
  assert.deepEqual(phonemesToIds(['o','l','ˈ','a','?',' '],map),[1,0,27,0,24,0,120,0,14,0,3,0,2],'símbolo desconhecido é ignorado');
  assert.deepEqual(chunkForSpeech('Olá!  Tudo bem? Vamos começar.'),['Olá!','Tudo bem?','Vamos começar.']);
  const long='palavra '.repeat(60)+'fim.';const parts=chunkForSpeech(long,100);assert.ok(parts.length>3&&parts.every(p=>p.length<=100));assert.equal(parts.join(' ').split(' ').length,61);
  assert.deepEqual(chunkForSpeech('   '),[]);
  assert.equal(await sha256Hex(new TextEncoder().encode('abc').buffer as ArrayBuffer),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.match(PIPER_ASSETS.model,/\/resolve\/[0-9a-f]{40}\//,'revisão fixada');assert.match(PIPER_ASSETS.modelSha256,/^[0-9a-f]{64}$/);
  assert.match(PIPER_ASSETS.ortWasm,/onnxruntime-web@1\.22\.0\//,'wasm igual à versão do package.json');
});
import {bypassValue} from '../lib/intelligence/gateway.ts';
test('intelligence: bypass da Vercel só do servidor, formato simples, nunca devolvido',async()=>{
  assert.ok(bypassValue('a'.repeat(32)));assert.ok(!bypassValue(undefined));assert.ok(!bypassValue('curto'));assert.ok(!bypassValue('a'.repeat(30)+'\r\nX-Evil: 1'));
  let seen:Headers|null=null;
  const fetchImpl=(async(_u:URL,init:RequestInit)=>{seen=new Headers(init.headers);return Response.json({ok:true},{headers:{'x-vercel-protection-bypass':'eco','set-cookie':'x=1'}})}) as unknown as typeof fetch;
  const r=await forwardToIntelligence({route:resolveIntelligenceRoute('GET','state')!,base:new URL('https://svc.example.test/avatar'),body:'',fetchImpl,bypass:'b'.repeat(32)});
  assert.equal(seen!.get('x-vercel-protection-bypass'),'b'.repeat(32));
  assert.equal(r.headers.get('x-vercel-protection-bypass'),null);assert.equal(r.headers.get('set-cookie'),null);
  await forwardToIntelligence({route:resolveIntelligenceRoute('GET','state')!,base:new URL('https://svc.example.test/avatar'),body:'',fetchImpl,bypass:'ruim'});
  assert.equal(seen!.get('x-vercel-protection-bypass'),null);
});

// Modo de voz: o WAV montado no navegador passa no leitor do servidor, e os controles de nível batem com a proposta.
import {encodeWav,measure,takeIssue,roomToneIssue,nextPending,voiceUploadQuery,formatSpeech,newVoiceSession,VOICE_LIMITS} from '../app/intelligence/voice-capture.ts';
import {readWavHeader} from '../lib/training/wav.ts';
import {voiceScript,voiceLineExists,CURRENT_VOICE_SCRIPT} from '../lib/intelligence/voice-script.ts';
import {VOICE_POLICY} from '../app/intelligence/meeting-text.ts';
const tone=(ms:number,amp:number,rate=48000)=>{const n=Math.round(rate*ms/1000),c=new Float32Array(n);for(let i=0;i<n;i++)c[i]=amp*Math.sin(2*Math.PI*220*i/rate);return c};
test('voz: WAV do navegador é PCM 16 bits mono e o servidor lê duração e taxa do cabeçalho',()=>{
  const a=tone(1200,0.5),b=tone(800,0.5);const wav=encodeWav([a,b],48000);
  assert.equal(wav.byteLength,44+(a.length+b.length)*2);
  assert.deepEqual(readWavHeader(wav),{sampleRate:48000,channels:1,bitsPerSample:16,dataBytes:(a.length+b.length)*2,durationMs:2000});
  assert.equal(readWavHeader(encodeWav([tone(500,0.2,44100)],44100))?.sampleRate,44100);
  const clipped=encodeWav([new Float32Array([2,-2])],48000);const v=new DataView(clipped.buffer);assert.equal(v.getInt16(44,true),32767);assert.equal(v.getInt16(46,true),-32768);
  assert.equal(readWavHeader(new Uint8Array(10)),null);
  const bad=encodeWav([tone(500,0.2)],48000);new DataView(bad.buffer).setUint16(22,2,true);assert.equal(readWavHeader(bad),null);
  const cut=encodeWav([tone(500,0.2)],48000).slice(0,1000);assert.equal(readWavHeader(cut),null);
});
test('voz: controles de corte, volume baixo, duração e ruído da sala',()=>{
  assert.equal(takeIssue(measure([tone(2000,0.5)],48000)),null);
  assert.match(takeIssue(measure([tone(2000,1)],48000))!,/alto/);
  assert.match(takeIssue(measure([tone(2000,0.05)],48000))!,/baixo/);
  assert.match(takeIssue(measure([tone(200,0.5)],48000))!,/curta/);
  assert.match(takeIssue({durationMs:VOICE_LIMITS.maxMs+1,peakDbfs:-6,rmsDbfs:-20})!,/40 segundos/);
  assert.equal(roomToneIssue(measure([tone(5000,0.001)],48000)),null);
  assert.match(roomToneIssue(measure([tone(5000,0.05)],48000))!,/ruído/);
  assert.equal(measure([],48000).rmsDbfs,-120);
});
test('voz: roteiro-voz-0.1 como dado, próxima frase pendente e parâmetros do envio',()=>{
  const s=voiceScript(CURRENT_VOICE_SCRIPT)!;assert.equal(s.frases.length,600);assert.equal(new Set(s.frases.map(f=>f.id)).size,600);
  assert.ok(s.frases.every(f=>s.blocos[f.bloco]&&f.id.startsWith(f.bloco)&&f.frase.trim()));
  assert.equal(voiceLineExists('roteiro-voz-0.1','A001'),true);assert.equal(voiceLineExists('roteiro-voz-0.1','toString'),false);assert.equal(voiceScript('constructor'),null);
  const ids=['A001','A002','A003'];assert.equal(nextPending(ids,new Set(['A001'])),1);assert.equal(nextPending(ids,new Set(['A003']),2),0);assert.equal(nextPending(ids,new Set(ids)),-1);
  assert.equal(voiceUploadQuery({consent:'c',session:'voz-1',moment:'room_tone',script:'roteiro-voz-0.1',line:'A001'}),'consent=c&session=voz-1&kind=voice&moment=room_tone&script=roteiro-voz-0.1');
  assert.match(voiceUploadQuery({consent:'c',session:'voz-1',moment:'script_line',script:'roteiro-voz-0.1',line:'B007'}),/line=B007$/);
  assert.match(newVoiceSession(Date.UTC(2026,10,12)),/^voz-2026-11-12-00-00-00-[0-9a-f]{8}$/);
  assert.equal(formatSpeech(26*60000+5000),'26 min de fala');assert.equal(formatSpeech(42000),'42 s de fala');
  assert.equal(VOICE_POLICY.version,'voz-rascunho-0.1');
  assert.equal(isPortalRoute('/admin/voz-avatar','admin'),true);assert.equal(isPortalRoute('/area/voz-avatar','learner'),false);assert.equal(portalPageTitle('/admin/voz-avatar'),'Voz do avatar');
});

import {VOICE_SCRIPT_IDS,voiceScriptKnown} from '../lib/intelligence/voice-script-ids.ts';
test('voz: ids do servidor iguais ao roteiro',()=>{
  const s=voiceScript(CURRENT_VOICE_SCRIPT)!;assert.deepEqual([...VOICE_SCRIPT_IDS[s.versao]],s.frases.map(f=>f.id));
  assert.equal(voiceScriptKnown('constructor'),false);assert.equal(voiceScriptKnown('__proto__'),false);
});

import {expressionScript,CURRENT_EXPRESSION_SCRIPT,scriptMs,stepMs} from '../lib/intelligence/expression-script.ts';
import {EXPRESSION_SCRIPT_IDS,expressionScriptKnown,expressionScriptStage} from '../lib/intelligence/expression-script-ids.ts';
test('expressões: roteiro-expressoes-0.1 como dado, cerca de 15 min, palmas no início e no fim',()=>{
  const s=expressionScript(CURRENT_EXPRESSION_SCRIPT)!;assert.equal(s.etapa,'face');
  assert.equal(new Set(s.passos.map(p=>p.id)).size,s.passos.length);assert.ok(s.passos.every(p=>s.blocos[p.bloco]&&p.id.startsWith(p.bloco)&&p.instrucao.trim()&&p.duracaoS>0));
  assert.ok(s.passos[1].sincronia&&s.passos.at(-2)!.sincronia);
  assert.equal(s.passos.filter(p=>p.bloco==='O').length,8);assert.equal(s.passos.filter(p=>p.bloco==='R').length,8);assert.equal(s.passos.filter(p=>p.fala&&p.bloco==='S').length,10);
  assert.ok(s.passos.filter(p=>p.bloco==='X').every(p=>p.repeticoes===3&&p.duracaoS===2));assert.equal(stepMs({id:'X01',bloco:'X',instrucao:'a',duracaoS:2,repeticoes:3}),8000);
  const min=scriptMs(s)/60000;assert.ok(min>8&&min<15,String(min));assert.equal(expressionScript('constructor'),null);
});
test('expressões: ids do servidor iguais ao roteiro',()=>{
  const s=expressionScript(CURRENT_EXPRESSION_SCRIPT)!;assert.deepEqual([...EXPRESSION_SCRIPT_IDS[s.versao]],s.passos.map(p=>p.id));
  assert.equal(expressionScriptKnown('__proto__'),false);assert.equal(expressionScriptStage('roteiro-expressoes-0.1'),'face');assert.equal(expressionScriptStage('toString'),null);
});

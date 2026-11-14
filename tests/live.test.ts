import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stepTurn,runTurn,silenceNeededMs,studentFinished,initialTurn,TURN_CONFIG} from '../lib/intelligence/live/turn.ts';
import {stepVad,initialVad,rmsDb,VAD_CONFIG} from '../lib/intelligence/live/vad.ts';
import {labelTake,addTake,buildCoverage,nextRequest,yawCell,gazeCell,coverageRatio,labelToMarkRow,markRowToLabel,MARK_COLUMNS,emptyCoverage} from '../lib/intelligence/live/coverage.ts';
import {validateTrack} from '../lib/intelligence/motion-track.ts';

test('vez: silêncio exigido depende do fim do texto',()=>{
  assert.equal(silenceNeededMs('Qual é o prazo?'),TURN_CONFIG.silenceAfterSentenceMs);
  assert.equal(silenceNeededMs('eu queria saber se'),TURN_CONFIG.silenceAfterOpenEndMs);
  assert.equal(silenceNeededMs('o cliente pediu desconto'),TURN_CONFIG.silenceDefaultMs);
  assert.equal(silenceNeededMs(''),TURN_CONFIG.silenceDefaultMs);
  assert.equal(studentFinished(400,'Pode repetir?'),true);
  assert.equal(studentFinished(400,'eu acho que'),false);
});

test('vez: fluxo normal aluno fala, avatar responde, volta a ouvir',()=>{
  const r=runTurn([{type:'voz.inicio',at:0},{type:'voz.fim',at:1000},{type:'vez.fim',at:1400},{type:'fala.inicio',at:2000},{type:'fala.fim',at:5000}]);
  assert.equal(r.state.phase,'idle');
  assert.deepEqual(r.effects.map(e=>e.do),['iniciar.resposta','ouvir.retomar']);
  assert.equal(r.emitted.length,0);
});

test('vez: aluno corta o avatar (para fala, cancela resposta, registra o dito, volta a ouvir)',()=>{
  const s=runTurn([{type:'voz.inicio',at:0},{type:'vez.fim',at:800},{type:'fala.inicio',at:1500}]).state;
  assert.equal(s.phase,'avatar');
  const r=stepTurn(s,{type:'voz.inicio',at:2500});
  assert.equal(r.state.phase,'student');
  assert.deepEqual(r.effects.map(e=>e.do),['parar.fala','cancelar.resposta','registrar.corte','ouvir.retomar']);
  assert.deepEqual(r.emit,[{type:'interrupcao.aluno',at:2500}]);
});

test('vez: aluno volta a falar enquanto o avatar ainda pensa descarta a resposta',()=>{
  const s=runTurn([{type:'voz.inicio',at:0},{type:'vez.fim',at:800}]).state;
  assert.equal(s.phase,'thinking');
  const r=stepTurn(s,{type:'voz.inicio',at:1000});
  assert.equal(r.state.phase,'student');
  assert.deepEqual(r.effects,[{do:'cancelar.resposta'}]);
});

test('vez: eventos fora de hora não mudam o estado',()=>{
  assert.deepEqual(stepTurn(initialTurn,{type:'vez.fim',at:1}).state,initialTurn);
  assert.deepEqual(stepTurn(initialTurn,{type:'fala.fim',at:1}).state,initialTurn);
  assert.deepEqual(stepTurn(initialTurn,{type:'voz.fim',at:1}).state,initialTurn);
});

test('vez: avatar só toma a palavra enquanto o aluno fala',()=>{
  const s=runTurn([{type:'voz.inicio',at:0}]).state;
  const r=stepTurn(s,{type:'interrupcao.avatar',at:3000,motivo:'tempo_esgotado'});
  assert.equal(r.state.phase,'thinking');
  assert.equal(stepTurn(initialTurn,{type:'interrupcao.avatar',at:1,motivo:'fora_do_assunto'}).state.phase,'idle');
});

test('voz: dBFS e detector com histerese',()=>{
  assert.ok(rmsDb(new Float32Array(100).fill(0.5))>-7&&rmsDb(new Float32Array(100).fill(0.5))<-5);
  assert.equal(rmsDb([]),-120);
  let s=initialVad;const ev:string[]=[];
  const run=(db:number,from:number,to:number,avatar=false)=>{for(let t=from;t<=to;t+=30){const r=stepVad(s,db,t,avatar);s=r.state;if(r.event)ev.push(r.event.type+'@'+r.event.at)}};
  run(-70,0,300);          // silêncio
  run(-30,330,420);        // estalo curto: não é voz
  run(-70,450,600);
  assert.deepEqual(ev,[]);
  run(-30,630,1000);       // voz de verdade
  assert.equal(ev.length,1);assert.match(ev[0],/^voz\.inicio@/);
  run(-70,1030,1500);      // silêncio termina a voz
  assert.equal(ev.length,2);assert.match(ev[1],/^voz\.fim@/);
});

test('voz: com o avatar falando, eco fraco não corta e voz forte corta',()=>{
  let s=initialVad;let ev=0;
  for(let t=0;t<=300;t+=30){const r=stepVad(s,-70,t,true);s=r.state}
  const noise=s.noiseDb;
  const eco=noise+VAD_CONFIG.marginDb+3; // passa o limite normal, mas não o do avatar falando
  for(let t=330;t<=1000;t+=30){const r=stepVad(s,eco,t,true);s=r.state;if(r.event)ev++}
  assert.equal(ev,0);
  for(let t=1030;t<=1400;t+=30){const r=stepVad(s,-20,t,true);s=r.state;if(r.event?.type==='voz.inicio')ev++}
  assert.equal(ev,1);
});

test('cobertura: classificação de giro, inclinação e olhar',()=>{
  assert.equal(yawCell(0),'frente');assert.equal(yawCell(-12),'esq_leve');assert.equal(yawCell(-30),'esq_forte');assert.equal(yawCell(25),'dir_forte');
  assert.equal(gazeCell(20,0),'camera');assert.equal(gazeCell(20,15),'acompanha');assert.equal(gazeCell(0,0),'camera');
});

test('cobertura: exemplo do proprietário, virou o rosto mas manteve o olho na câmera',()=>{
  const l=labelTake('t1',{yawDeg:18,pitchDeg:0,gazeYawDeg:1},true);
  assert.deepEqual([l.yaw,l.gaze],['dir_leve','camera']);
  const cov=addTake(emptyCoverage,l);
  assert.equal(cov['dir_leve|reto|camera|neutra'],1);
  assert.equal(cov['dir_leve|reto|acompanha|neutra'],undefined); // continua na fila
});

test('cobertura: voz ruim não preenche o mapa, rosto errado nunca reprova',()=>{
  assert.deepEqual(addTake(emptyCoverage,labelTake('t',{yawDeg:0,pitchDeg:0,gazeYawDeg:0},false)),{});
  assert.equal(Object.keys(addTake(emptyCoverage,labelTake('t',{yawDeg:40,pitchDeg:30,gazeYawDeg:0},true))).length,1);
});

test('cobertura: próxima instrução mantém metade de frente e evita giro forte até liberar',()=>{
  let cov=emptyCoverage;
  assert.equal(nextRequest(cov).yaw,'frente');
  cov=addTake(cov,labelTake('a',{yawDeg:0,pitchDeg:0,gazeYawDeg:0},true));
  const r=nextRequest(cov);assert.notEqual(r.yaw,'frente');assert.ok(!r.yaw.endsWith('forte'));
  assert.match(r.texto,/vire um pouco/);
  assert.ok(nextRequest(cov,{allowStrong:true}).yaw!=='frente');
  // preenche tudo permitido: razão chega a 1 e a instrução ainda existe
  const labels=[];let n=0;
  for(const y of [-15,0,15])for(const p of [-12,0,12])for(const g of [0,12]){labels.push(labelTake('x'+n++,{yawDeg:y,pitchDeg:p,gazeYawDeg:y===0?0:(g?y:0)},true))}
  const full=buildCoverage(labels);
  assert.equal(coverageRatio(full,false),1);
  assert.ok(nextRequest(full).texto.length>0);
});

test('cobertura: pede cada casa vazia antes de repetir',()=>{
  let cov=emptyCoverage;const seen=new Set<string>();
  for(let i=0;i<10;i++){
    const r=nextRequest(cov);const k=`${r.yaw}|${r.pitch}|${r.gaze}`;
    if(i<4)assert.ok(!seen.has(k)||r.yaw==='frente',`repetiu ${k}`);
    seen.add(k);
    const deg={frente:0,esq_leve:-15,dir_leve:15,esq_forte:-30,dir_forte:30}[r.yaw];
    const pit={baixo:-12,reto:0,cima:12}[r.pitch];
    cov=addTake(cov,labelTake('t'+i,{yawDeg:deg,pitchDeg:pit,gazeYawDeg:r.gaze==='acompanha'?deg:0},true));
  }
  assert.ok(coverageRatio(cov,false)>0.4);
});

test('marcação: etiqueta vira linha da trilha marks e a trilha é aceita pelo validador sem servidor novo',()=>{
  const l=labelTake('t3',{yawDeg:-17,pitchDeg:9,gazeYawDeg:-14,expr:'sorrindo'},true);
  const row=labelToMarkRow(1234,3,l);
  assert.equal(row.length,MARK_COLUMNS.length);
  assert.deepEqual(markRowToLabel(row,'t3'),l);
  const track={schema:'evolu.motion-track',version:'0.1',track:'marks',session:'s1',camera:'frontal',t0Ms:0,durationMs:5000,extractor:null,source:{kind:'selfie-labels'},columns:[...MARK_COLUMNS],scale:{},frames:[row]};
  assert.equal(validateTrack(track,{track:'marks',session:'s1',camera:'frontal',t0Ms:0}).frames.length,1);
});

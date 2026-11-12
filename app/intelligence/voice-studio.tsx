'use client';
// Gravação de voz para o avatar (área da administração): termo voz-rascunho-0.1, teste de sala de 5 s e o
// roteiro frase a frase. Cada frase aceita sobe na hora como WAV. Dá para parar e continuar outro dia.
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Mic,Square,RotateCcw,Check,SkipForward,SkipBack,ShieldCheck,Download,AlertTriangle} from 'lucide-react';
import {VOICE_POLICY} from './meeting-text';
import {VOICE_LIMITS,VoiceRecorder,encodeWav,measure,takeIssue,roomToneIssue,formatSpeech,nextPending,newVoiceSession,httpVoiceApi,
  type VoiceApi,type VoiceConsent,type VoiceProgress,type TakeLevels} from './voice-capture';
import {voiceScript,CURRENT_VOICE_SCRIPT,type VoiceScript} from '../../lib/intelligence/voice-script';
import './voice-studio.css';

type Phase='loading'|'consent'|'room'|'lines'|'revoked'|'error';
type Take={wav:Uint8Array;url:string;levels:TakeLevels;sampleRate:number;issue:string|null};

const emptyProgress=(s:VoiceScript):VoiceProgress=>({script:s.versao,total:s.frases.length,recorded:0,speechMs:0,roomTones:0,lines:[]});
const toBlob=(w:Uint8Array)=>new Blob([w.slice().buffer],{type:'audio/wav'});
function download(blob:Blob,name:string){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}

export function VoiceStudio({api=httpVoiceApi,script=voiceScript(CURRENT_VOICE_SCRIPT)!}:{api?:VoiceApi;script?:VoiceScript}){
  const [phase,setPhase]=useState<Phase>('loading');
  const [consent,setConsent]=useState<VoiceConsent|null>(null);
  const [agree,setAgree]=useState(false);
  const [progress,setProgress]=useState<VoiceProgress>(()=>emptyProgress(script));
  const [index,setIndex]=useState(0);
  const [rec,setRec]=useState<'idle'|'recording'|'review'|'sending'>('idle');
  const [take,setTake]=useState<Take|null>(null);
  const [room,setRoom]=useState<{levels:TakeLevels;issue:string|null}|null>(null);
  const [level,setLevel]=useState(-120);
  const [elapsed,setElapsed]=useState(0);
  const [error,setError]=useState('');
  const recorder=useRef<VoiceRecorder|null>(null);
  const session=useRef('');
  const timer=useRef<{tick?:ReturnType<typeof setInterval>;stop?:ReturnType<typeof setTimeout>;t0:number}>({t0:0});
  const ids=useMemo(()=>script.frases.map(f=>f.id),[script]);
  const done=useMemo(()=>new Set(progress.lines.map(l=>l.id)),[progress]);
  const line=script.frases[index];
  const takes=progress.lines.find(l=>l.id===line?.id)?.takes??0;

  useEffect(()=>{session.current=newVoiceSession()},[]);
  const loadProgress=useCallback(async()=>{const p=await api.progress(script.versao);setProgress(p);return p},[api,script.versao]);
  useEffect(()=>{let live=true;(async()=>{try{
    const c=await api.consent();const p=await loadProgress();if(!live)return;
    const valid=c&&c.voice&&c.policyVersion===VOICE_POLICY.version?c:null;setConsent(valid);
    const start=nextPending(ids,new Set(p.lines.map(l=>l.id)));setIndex(start<0?0:start);
    setPhase(valid?'room':'consent');
  }catch(e){if(live){setError(e instanceof Error?e.message:'Falha ao abrir a gravação.');setPhase('error')}}})();return ()=>{live=false}},[api,ids,loadProgress]);
  useEffect(()=>()=>{recorder.current?.close();clearInterval(timer.current.tick);clearTimeout(timer.current.stop)},[]);
  useEffect(()=>()=>{if(take)URL.revokeObjectURL(take.url)},[take]);

  const mic=async()=>{if(!recorder.current)recorder.current=new VoiceRecorder(setLevel);await recorder.current.open();return recorder.current};
  const stopClock=()=>{clearInterval(timer.current.tick);clearTimeout(timer.current.stop)};
  const startClock=(limitMs:number,onLimit:()=>void)=>{timer.current.t0=Date.now();setElapsed(0);timer.current.tick=setInterval(()=>setElapsed(Date.now()-timer.current.t0),200);timer.current.stop=setTimeout(onLimit,limitMs)};

  const accept=async()=>{setError('');try{const c=await api.accept(VOICE_POLICY.version);setConsent(c);setPhase('room')}catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar o aceite.')}};
  const revoke=async()=>{if(!consent)return;stopClock();recorder.current?.close();recorder.current=null;setRec('idle');setTake(null);
    try{await api.revoke(consent.id);setConsent(null);setPhase('revoked')}catch(e){setError(e instanceof Error?e.message:'Não foi possível revogar.')}};

  // Teste de sala: 5 s de silêncio, enviado como room_tone. Ruído acima de -50 dBFS pede um lugar mais silencioso.
  const roomTest=async()=>{if(!consent||rec!=='idle')return;setError('');setRoom(null);
    try{const r=await mic();setRec('recording');r.begin();
      startClock(VOICE_LIMITS.roomToneMs,async()=>{stopClock();const {chunks,sampleRate}=await r.end();const levels=measure(chunks,sampleRate);setRec('sending');
        try{await api.upload({consent:consent.id,session:session.current,moment:'room_tone',script:script.versao,wav:toBlob(encodeWav(chunks,sampleRate))});await loadProgress();setRoom({levels,issue:roomToneIssue(levels)})}
        catch(e){setError(e instanceof Error?e.message:'Falha ao enviar o teste de sala.')}finally{setRec('idle')}});
    }catch{setRec('idle');setError('Não foi possível abrir o microfone. Confira a permissão do navegador.')}};

  const stopTake=useCallback(async()=>{const r=recorder.current;if(!r)return;stopClock();const {chunks,sampleRate}=await r.end();
    const wav=encodeWav(chunks,sampleRate),levels=measure(chunks,sampleRate);
    setTake({wav,url:URL.createObjectURL(toBlob(wav)),levels,sampleRate,issue:wav.byteLength>VOICE_LIMITS.bytes?'Arquivo acima de 4 MB. Regrave só a frase.':takeIssue(levels)});setRec('review')},[]);
  const startTake=useCallback(async()=>{if(!consent)return;setError('');setTake(null);
    try{const r=await mic();r.begin();setRec('recording');startClock(VOICE_LIMITS.maxMs+500,()=>void stopTake())}
    catch{setRec('idle');setError('Não foi possível abrir o microfone. Confira a permissão do navegador.')}},[consent,stopTake]);
  const send=useCallback(async()=>{if(!consent||!take||take.issue||!line)return;setRec('sending');setError('');
    try{await api.upload({consent:consent.id,session:session.current,moment:'script_line',script:script.versao,line:line.id,wav:toBlob(take.wav)});
      const p=await loadProgress();setTake(null);setRec('idle');const n=nextPending(ids,new Set(p.lines.map(l=>l.id)),index+1);if(n>=0)setIndex(n)}
    catch(e){setRec('review');setError((e instanceof Error?e.message:'Falha no envio.')+' A gravação continua aqui: tente de novo ou baixe a cópia.')}},[api,consent,take,line,script.versao,loadProgress,ids,index]);
  const go=(to:number)=>{if(rec==='recording'||rec==='sending')return;setTake(null);setRec('idle');setIndex(Math.max(0,Math.min(ids.length-1,to)))};

  // Espaço grava e para, Enter envia a frase aceita.
  useEffect(()=>{if(phase!=='lines')return;
    const down=(e:KeyboardEvent)=>{const t=e.target as HTMLElement|null;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;
      if(e.code==='Space'){e.preventDefault();if(e.repeat)return;if(rec==='recording')void stopTake();else if(rec==='idle'||rec==='review')void startTake()}
      else if(e.key==='Enter'&&rec==='review'&&take&&!take.issue){e.preventDefault();void send()}};
    const up=(e:KeyboardEvent)=>{if(e.code==='Space')e.preventDefault()};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);return ()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)}},[phase,rec,take,startTake,stopTake,send]);

  const meter=Math.max(0,Math.min(100,(level+60)/60*100));
  const head=<div className="ev-voice-progress" role="status">
    <strong>{progress.recorded} de {progress.total} frases</strong><span>{formatSpeech(progress.speechMs)}</span>
    <progress value={progress.recorded} max={progress.total}/>
  </div>;

  if(phase==='loading')return <section className="ev-panel ev-voice"><p>Carregando o roteiro e o andamento…</p></section>;
  if(phase==='error')return <section className="ev-panel ev-voice"><p className="ev-voice-error" role="alert"><AlertTriangle size={16}/> {error}</p></section>;
  if(phase==='revoked')return <section className="ev-panel ev-voice"><h2>Aceite revogado</h2><p>A gravação foi interrompida. O que já foi enviado continua guardado nesta fase de teste.</p>{head}
    <button className="ev-button outline" onClick={()=>{setAgree(false);setPhase('consent')}}>Aceitar de novo</button></section>;
  if(phase==='consent')return <section className="ev-panel ev-voice">
    <h2>{VOICE_POLICY.title}</h2><p className="ev-muted">Termo {VOICE_POLICY.version} · rascunho para revisão jurídica</p>
    <ul className="ev-voice-terms">{VOICE_POLICY.points.map(p=><li key={p}>{p}</li>)}</ul>
    <label className="ev-voice-agree"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/> Li e aceito a gravação da minha voz nestes termos.</label>
    {error&&<p className="ev-voice-error" role="alert">{error}</p>}
    <button className="ev-button lime" disabled={!agree} onClick={()=>void accept()}><ShieldCheck size={16}/> Aceitar e continuar</button>
    {progress.recorded>0&&head}
  </section>;

  const consentChip=consent&&<p className="ev-voice-chip"><ShieldCheck size={13}/> Aceite {consent.policyVersion} · só microfone <button className="ev-voice-link" onClick={()=>void revoke()}>Revogar aceite</button></p>;
  const levelBar=<div className="ev-voice-meter" aria-label="Nível do microfone"><span style={{width:meter+'%'}} className={level>VOICE_LIMITS.clipDbfs?'clip':''}/></div>;

  if(phase==='room')return <section className="ev-panel ev-voice">
    {consentChip}<h2>Teste de sala</h2>
    <p>Fique em silêncio por 5 segundos. A EVOLU grava o ruído do ambiente para limpar o áudio no preparo do treino.</p>
    <p className="ev-muted">Use o mesmo lugar e o mesmo microfone em todas as sessões. Eco, redução de ruído e ganho automático do navegador ficam desligados.</p>
    {levelBar}
    {rec==='recording'&&<p className="ev-voice-rec" role="status">Gravando silêncio… {Math.max(0,Math.ceil((VOICE_LIMITS.roomToneMs-elapsed)/1000))} s</p>}
    {rec==='sending'&&<p role="status">Enviando…</p>}
    {room&&(room.issue?<p className="ev-voice-warn" role="alert"><AlertTriangle size={16}/> {room.issue}</p>:<p className="ev-voice-ok" role="status"><Check size={16}/> Ambiente silencioso ({Math.round(room.levels.rmsDbfs)} dBFS).</p>)}
    {error&&<p className="ev-voice-error" role="alert">{error}</p>}
    <div className="ev-voice-actions">
      <button className="ev-button lime" disabled={rec!=='idle'} onClick={()=>void roomTest()}><Mic size={16}/> {room?'Repetir teste':'Gravar 5 s de silêncio'}</button>
      {room&&<button className={'ev-button '+(room.issue?'outline':'lime')} onClick={()=>setPhase('lines')}>{room.issue?'Continuar assim mesmo':'Começar o roteiro'}</button>}
    </div>
    {head}
  </section>;

  return <section className="ev-panel ev-voice">
    {consentChip}{head}
    {line&&<div className="ev-voice-line">
      <p className="ev-eyebrow">Bloco {line.bloco} · {script.blocos[line.bloco]} · {line.id}{done.has(line.id)?` · já gravada (${takes}x)`:''}</p>
      <p className="ev-voice-text" lang="pt-BR">{line.frase}</p>
    </div>}
    {levelBar}
    {rec==='recording'&&<p className="ev-voice-rec" role="status">Gravando {(elapsed/1000).toFixed(1)} s · espaço para parar</p>}
    {take&&<div className="ev-voice-take">
      <audio controls src={take.url}/>
      <span className="ev-muted">{(take.levels.durationMs/1000).toFixed(1)} s · pico {Math.round(take.levels.peakDbfs)} dBFS · {take.sampleRate} Hz</span>
      {take.issue?<p className="ev-voice-warn" role="alert"><AlertTriangle size={16}/> {take.issue}</p>:<p className="ev-voice-ok"><Check size={16}/> Nível bom. Ouça e envie (Enter) ou regrave (espaço).</p>}
    </div>}
    {error&&<p className="ev-voice-error" role="alert">{error}</p>}
    <div className="ev-voice-actions">
      {rec==='recording'?<button className="ev-button lime" onClick={()=>void stopTake()}><Square size={16}/> Parar</button>
        :<button className={'ev-button '+(take?'outline':'lime')} disabled={rec==='sending'} onClick={()=>void startTake()}>{take?<><RotateCcw size={16}/> Regravar</>:<><Mic size={16}/> Gravar</>}</button>}
      {take&&<button className="ev-button lime" disabled={!!take.issue||rec==='sending'} onClick={()=>void send()}><Check size={16}/> {rec==='sending'?'Enviando…':'Aceitar e enviar'}</button>}
      {take&&error&&<button className="ev-button outline" onClick={()=>download(toBlob(take.wav),`${line?.id||'frase'}.wav`)}><Download size={16}/> Baixar cópia</button>}
    </div>
    <div className="ev-voice-nav">
      <button className="ev-button outline" disabled={index===0||rec==='recording'||rec==='sending'} onClick={()=>go(index-1)}><SkipBack size={15}/> Anterior</button>
      <span className="ev-muted">Frase {index+1} de {ids.length}</span>
      <button className="ev-button outline" disabled={index>=ids.length-1||rec==='recording'||rec==='sending'} onClick={()=>go(index+1)}>Próxima <SkipForward size={15}/></button>
    </div>
    {progress.recorded>=progress.total&&<p className="ev-voice-ok" role="status"><Check size={16}/> Roteiro completo. Regrave o que quiser, a mais recente de cada frase vale para o treino.</p>}
  </section>;
}

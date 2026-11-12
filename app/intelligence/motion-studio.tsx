'use client';
// Captação do avatar, sessão A (rosto): termo imagem-rascunho-0.1, escolha de câmera com prévia, roteiro passo a passo,
// extração ao vivo do rosto (52 expressões e rotação da cabeça) e envio de marcas e trilhas em trechos de 60 s.
// O vídeo do celular fica com o proprietário. Para a EVOLU sobem só trilhas, marcas e os dados do arquivo.
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Play,SkipForward,RotateCcw,Check,ShieldCheck,AlertTriangle,Download,Square} from 'lucide-react';
import {IMAGE_POLICY} from './meeting-text';
import {CameraPicker,useBlackWatch,BLACK_WARNING,type CameraChoice} from './camera-picker';
import {createFaceExtractor,type FaceExtractor} from './face-extractor';
import {httpMotionApi,TrackChunker,TrackUploader,faceColumns,faceScale,faceValues,headAngles,MARK_COLUMNS,MARK_EVENTS,MOTION_EXTRACT,formatClock,
  type MotionApi,type MotionConsent,type MotionSession,type SessionProgress} from './motion-capture';
import {expressionScript,CURRENT_EXPRESSION_SCRIPT,stepMs,scriptMs,type ExpressionScript} from '../../lib/intelligence/expression-script';
import {gzipTrack,type MotionTrack} from '../../lib/intelligence/motion-track';
import './voice-studio.css';
import './motion-studio.css';

type Phase='loading'|'consent'|'setup'|'steps'|'finish'|'done'|'revoked'|'error';
type Live={names:string[];scores:number[];yaw:number;pitch:number;roll:number}|null;
const REF='ref';

async function downloadTrack(t:MotionTrack){const gz=await gzipTrack(t);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([gz.slice().buffer],{type:'application/gzip'}));a.download=`${t.camera}-${t.track}-${t.t0Ms}.json.gz`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}

export function MotionStudio({api=httpMotionApi,script=expressionScript(CURRENT_EXPRESSION_SCRIPT)!,extractorFactory=createFaceExtractor}:{api?:MotionApi;script?:ExpressionScript;extractorFactory?:()=>Promise<FaceExtractor>}){
  const [phase,setPhase]=useState<Phase>('loading');
  const [consent,setConsent]=useState<MotionConsent|null>(null);
  const [agree,setAgree]=useState(false);
  const [camera,setCamera]=useState<CameraChoice|null>(null);
  const [session,setSession]=useState<MotionSession|null>(null);
  const [index,setIndex]=useState(0);
  const [running,setRunning]=useState<{t0:number;ms:number}|null>(null);
  const [now,setNow]=useState(0);
  const [live,setLive]=useState<Live>(null);
  const [faceSeen,setFaceSeen]=useState(true);
  const [progress,setProgress]=useState<SessionProgress|null>(null);
  const [error,setError]=useState('');
  const [uploads,setUploads]=useState<{sent:number;failed:MotionTrack[]}>({sent:0,failed:[]});
  const [sessionT0,setSessionT0]=useState(0);
  const [file,setFile]=useState({fileName:'',bytes:'',sha256:'',durationMin:''});
  const video=useRef<HTMLVideoElement>(null);
  const run=useRef<{ex?:FaceExtractor;raf?:number;sessionT0:number;lastFrame:number;face?:TrackChunker;marks?:TrackChunker;up?:TrackUploader;noFace:number}>({sessionT0:0,lastFrame:0,noFace:0});
  const step=script.passos[index];
  const black=useBlackWatch(video,phase==='steps');
  const total=useMemo(()=>scriptMs(script),[script]);

  useEffect(()=>{let ok=true;(async()=>{try{const c=await api.consent();if(!ok)return;const v=c&&c.motion&&c.policyVersion===IMAGE_POLICY.version?c:null;setConsent(v);setPhase(v?'setup':'consent')}
    catch(e){if(ok){setError(e instanceof Error?e.message:'Falha ao abrir a captação.');setPhase('error')}}})();return ()=>{ok=false}},[api]);
  useEffect(()=>{if(video.current&&camera&&(phase==='steps'))video.current.srcObject=camera.stream},[camera,phase]);
  const stopLoop=()=>{const r=run.current;if(r.raf)cancelAnimationFrame(r.raf);r.raf=undefined;r.ex?.close();r.ex=undefined};
  useEffect(()=>()=>{stopLoop();camera?.stream.getTracks().forEach(t=>t.stop())},[camera]);

  const mark=useCallback((stepIdx:number,event:number)=>{const r=run.current;r.up?.add(r.marks?.push(performance.now()-r.sessionT0,[stepIdx,event])??null)},[]);

  const accept=async()=>{setError('');try{setConsent(await api.accept(IMAGE_POLICY.version));setPhase('setup')}catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar o aceite.')}};
  const revoke=async()=>{if(!consent)return;stopLoop();setRunning(null);try{await api.revoke(consent.id);setConsent(null);setPhase('revoked')}catch(e){setError(e instanceof Error?e.message:'Não foi possível revogar.')}};

  // Extração: um quadro a cada ~30 ms, 52 expressões e rotação quantizadas, cortadas em trechos de 60 s.
  const loopRef=useRef<()=>void>(()=>{});
  const loop=useCallback(()=>{const r=run.current,v=video.current;
    if(r.ex&&v){const t=performance.now();if(t-r.lastFrame>=MOTION_EXTRACT.minFrameGapMs){r.lastFrame=t;
      const f=r.ex.detect(v,t);
      if(f){r.noFace=0;if(!r.face){r.face=new TrackChunker('face',{session:session!.id,camera:REF,extractor:r.ex.extractor,source:{kind:'browser',label:camera?.label??'',width:camera?.width??0,height:camera?.height??0}},faceColumns(f.names),faceScale(f.names))}
        r.up?.add(r.face.push(t-r.sessionT0,faceValues(f.scores,f.matrix)));
        const a=f.matrix?headAngles(f.matrix):{yaw:0,pitch:0,roll:0};setLive({names:f.names,scores:f.scores,...a});setFaceSeen(true)}
      else if(++r.noFace>30)setFaceSeen(false)}}
    r.raf=requestAnimationFrame(()=>loopRef.current())},[session,camera]);
  useEffect(()=>{loopRef.current=loop},[loop]);

  const begin=async()=>{if(!consent||!camera)return;setError('');
    try{const s=await api.createSession(consent.id,script.versao);setSession(s);
      await api.camera({session:s.id,cameraId:REF,role:'reference',source:'browser',deviceLabel:camera.label.slice(0,120),width:camera.width>=320?camera.width:undefined,height:camera.height>=240?camera.height:undefined,fps:camera.fps>=10?Math.round(camera.fps):undefined});
      const r=run.current;r.ex=await extractorFactory();r.sessionT0=performance.now();setSessionT0(r.sessionT0);setNow(r.sessionT0);const up=new TrackUploader(api,consent.id,()=>setUploads({sent:up.sent,failed:[...up.failed]}));r.up=up;
      r.marks=new TrackChunker('marks',{session:s.id,camera:REF,extractor:null,source:{kind:'browser',page:'captacao-avatar'}},MARK_COLUMNS,{});
      setIndex(0);setPhase('steps');
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível iniciar a sessão.')}};
  useEffect(()=>{if(phase==='steps'&&session&&!run.current.raf)run.current.raf=requestAnimationFrame(loop)},[phase,session,loop]);

  const startStep=useCallback((repeat=false)=>{if(!step||running)return;mark(index,repeat?MARK_EVENTS.repeat:step.sincronia?MARK_EVENTS.clap:MARK_EVENTS.start);setRunning({t0:performance.now(),ms:stepMs(step)});setNow(performance.now())},[step,running,index,mark]);
  const endStep=useCallback((advance=true)=>{if(!running)return;mark(index,MARK_EVENTS.end);setRunning(null);if(advance&&index<script.passos.length-1)setIndex(index+1)},[running,index,mark,script.passos.length]);
  const endRef=useRef(endStep);useEffect(()=>{endRef.current=endStep},[endStep]);
  // Relógio da tela: atualiza 5 vezes por segundo durante os passos e encerra o passo no tempo dele.
  useEffect(()=>{if(phase!=='steps')return;const id=setInterval(()=>{const t=performance.now();setNow(t);if(running&&t-running.t0>=running.ms)endRef.current()},200);return ()=>clearInterval(id)},[phase,running]);
  const skip=()=>{if(running)return;mark(index,MARK_EVENTS.skip);if(index<script.passos.length-1)setIndex(index+1)};

  const finishSession=async()=>{const r=run.current;if(running)endStep(false);stopLoop();r.up?.add(r.face?.flush()??null);r.up?.add(r.marks?.flush()??null);await r.up?.idle();
    if(session){try{await api.endSession(session.id);setProgress(await api.progress(session.id))}catch(e){setError(e instanceof Error?e.message:'Falha ao fechar a sessão.')}}setPhase('finish')};
  const saveFile=async()=>{if(!session)return;setError('');
    try{await api.camera({session:session.id,cameraId:'close',role:'close',source:'device_file',location:'owner_disk',fileName:file.fileName.trim(),bytes:Number(file.bytes),sha256:file.sha256.trim().toLowerCase(),durationMs:file.durationMin?Math.round(Number(file.durationMin.replace(',','.'))*60000):undefined});
      setProgress(await api.progress(session.id));setPhase('done')}catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar o arquivo.')}};

  // Espaço começa o passo (ou encerra antes), R repete, S pula.
  useEffect(()=>{if(phase!=='steps')return;const down=(e:KeyboardEvent)=>{const t=e.target as HTMLElement|null;if(t&&(t.tagName==='INPUT'||t.tagName==='SELECT'))return;
    if(e.code==='Space'){e.preventDefault();if(!e.repeat){if(running)endStep();else startStep()}}else if(e.key==='r'||e.key==='R'){if(!running)startStep(true)}else if(e.key==='s'||e.key==='S')skip()};
    window.addEventListener('keydown',down);return ()=>window.removeEventListener('keydown',down)},[phase,running,startStep,endStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const chip=consent&&<p className="ev-voice-chip"><ShieldCheck size={13}/> Aceite {consent.policyVersion} · câmera e movimento, sem voz <button className="ev-voice-link" onClick={()=>void revoke()}>Revogar aceite</button></p>;

  if(phase==='loading')return <section className="ev-panel ev-voice"><p>Carregando…</p></section>;
  if(phase==='error')return <section className="ev-panel ev-voice"><p className="ev-voice-error" role="alert"><AlertTriangle size={16}/> {error}</p></section>;
  if(phase==='revoked')return <section className="ev-panel ev-voice"><h2>Aceite revogado</h2><p>A captação foi interrompida. O que já foi enviado continua guardado nesta fase de teste.</p><button className="ev-button outline" onClick={()=>{setAgree(false);setPhase('consent')}}>Aceitar de novo</button></section>;
  if(phase==='consent')return <section className="ev-panel ev-voice">
    <h2>{IMAGE_POLICY.title}</h2><p className="ev-muted">Termo {IMAGE_POLICY.version} · rascunho para revisão jurídica</p>
    <ul className="ev-voice-terms">{IMAGE_POLICY.points.map(p=><li key={p}>{p}</li>)}</ul>
    <label className="ev-voice-agree"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/> Li e aceito a captação de imagem e movimento nestes termos.</label>
    {error&&<p className="ev-voice-error" role="alert">{error}</p>}
    <button className="ev-button lime" disabled={!agree} onClick={()=>void accept()}><ShieldCheck size={16}/> Aceitar e continuar</button>
  </section>;
  if(phase==='setup')return <section className="ev-panel ev-voice">
    {chip}<h2>Sessão A · rosto</h2>
    <p>Cerca de {Math.round(total/60000)+5} minutos, {script.passos.length} passos. Escolha a câmera do notebook que fica de frente para você. Ela é a câmera de referência da extração ao vivo.</p>
    <ol className="ev-motion-prep"><li>Celular no tripé, perto do rosto, gravando em 4K ou 1080p no app de câmera. O arquivo fica no seu disco.</li><li>Luz de frente, sem janela atrás.</li><li>Comece a gravar no celular antes de iniciar. As três palmas no começo e no fim sincronizam as câmeras.</li></ol>
    <CameraPicker onChange={setCamera} keep/>
    {error&&<p className="ev-voice-error" role="alert">{error}</p>}
    <button className="ev-button lime" disabled={!camera} onClick={()=>void begin()}><Play size={16}/> Iniciar a sessão</button>
  </section>;
  if(phase==='finish'||phase==='done')return <section className="ev-panel ev-voice">
    {chip}<h2>{phase==='done'?'Sessão registrada':'Sessão encerrada'}</h2>
    {progress&&<p className="ev-muted">{progress.cameras.map(c=><span key={c.cameraId}>{c.cameraId}: {c.tracks.face?`${c.tracks.face.chunks} trechos de rosto (${formatClock(c.tracks.face.coveredMs)})`:'sem trilha de rosto'}{c.tracks.marks?`, ${c.tracks.marks.chunks} de marcas`:''}. </span>)}</p>}
    {uploads.failed.length>0&&<div><p className="ev-voice-warn" role="alert"><AlertTriangle size={16}/> {uploads.failed.length} trecho(s) não subiram. Baixe para não perder.</p>{uploads.failed.map(t=><button key={t.track+t.t0Ms} className="ev-button outline" onClick={()=>void downloadTrack(t)}><Download size={15}/> {t.track} {formatClock(t.t0Ms)}</button>)}</div>}
    {phase==='finish'&&<>
      <p>Pare a gravação do celular e copie o arquivo para o seu disco. Informe os dados dele: o vídeo não sobe, só estes dados.</p>
      <p className="ev-muted">SHA-256: no Windows, <code>certutil -hashfile ARQUIVO SHA256</code>. No Mac ou Linux, <code>shasum -a 256 ARQUIVO</code>.</p>
      <div className="ev-motion-file">
        <label>Nome do arquivo<input value={file.fileName} onChange={e=>setFile({...file,fileName:e.target.value})} placeholder="IMG_0001.MOV"/></label>
        <label>Tamanho em bytes<input inputMode="numeric" value={file.bytes} onChange={e=>setFile({...file,bytes:e.target.value.replace(/\D/g,'')})}/></label>
        <label>SHA-256<input value={file.sha256} onChange={e=>setFile({...file,sha256:e.target.value})} spellCheck={false}/></label>
        <label>Duração (min)<input inputMode="decimal" value={file.durationMin} onChange={e=>setFile({...file,durationMin:e.target.value})}/></label>
      </div>
      {error&&<p className="ev-voice-error" role="alert">{error}</p>}
      <div className="ev-voice-actions"><button className="ev-button lime" disabled={!file.fileName||!file.bytes||!/^[0-9a-fA-F]{64}$/.test(file.sha256.trim())} onClick={()=>void saveFile()}><Check size={16}/> Registrar o arquivo do celular</button>
        <button className="ev-button outline" onClick={()=>setPhase('done')}>Registrar depois</button></div></>}
  </section>;

  const left=running?Math.max(0,running.ms-(now-running.t0)):stepMs(step);
  const top=live?live.names.map((n,i)=>({n,s:live.scores[i]})).filter(x=>x.n!=='_neutral').sort((a,b)=>b.s-a.s).slice(0,6):[];
  return <section className="ev-panel ev-voice ev-motion">
    {chip}
    <div className="ev-voice-progress" role="status"><strong>Passo {index+1} de {script.passos.length}</strong><span>Sessão {formatClock(sessionT0?now-sessionT0:0)} · {uploads.sent} trechos enviados</span><progress value={index} max={script.passos.length}/></div>
    <div className="ev-motion-grid">
      <div className="ev-motion-cam"><video ref={video} autoPlay muted playsInline/>{!faceSeen&&<p className="ev-voice-warn" role="alert"><AlertTriangle size={16}/> Rosto não encontrado. Fique de frente para a câmera.</p>}{black&&<p className="ev-voice-warn" role="alert"><AlertTriangle size={16}/> {BLACK_WARNING}</p>}</div>
      <div className="ev-motion-live" aria-label="Extração ao vivo">
        <p className="ev-eyebrow">Extração ao vivo</p>
        {live?<><ul>{top.map(x=><li key={x.n}><span>{x.n}</span><meter min={0} max={1} value={x.s}/></li>)}</ul>
          <p className="ev-muted">Cabeça: virar {Math.round(live.yaw)}° · acenar {Math.round(live.pitch)}° · inclinar {Math.round(live.roll)}°</p></>:<p className="ev-muted">Aguardando o rosto…</p>}
      </div>
    </div>
    {step&&<div className="ev-voice-line">
      <p className="ev-eyebrow">Bloco {step.bloco} · {script.blocos[step.bloco]} · {step.id}{step.repeticoes?` · ${step.repeticoes} vezes`:''}</p>
      <p className="ev-voice-text" lang="pt-BR">{step.instrucao}</p>
      <p className={running?'ev-voice-rec':'ev-muted'} role="status">{running?`Agora · ${Math.ceil(left/1000)} s`:`${Math.round(stepMs(step)/1000)} s · espaço para começar`}</p>
    </div>}
    {error&&<p className="ev-voice-error" role="alert">{error}</p>}
    <div className="ev-voice-actions">
      {running?<button className="ev-button lime" onClick={()=>endStep()}><Square size={16}/> Encerrar o passo</button>:<button className="ev-button lime" onClick={()=>startStep()}><Play size={16}/> Começar o passo</button>}
      <button className="ev-button outline" disabled={!!running} onClick={()=>startStep(true)}><RotateCcw size={16}/> Repetir</button>
      <button className="ev-button outline" disabled={!!running} onClick={skip}><SkipForward size={16}/> Pular</button>
      <button className="ev-button outline" onClick={()=>void finishSession()}><Check size={16}/> {index>=script.passos.length-1?'Concluir a sessão':'Encerrar agora'}</button>
    </div>
  </section>;
}

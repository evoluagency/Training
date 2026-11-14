'use client';
// Reunião virtual com o avatar do EVOLU Intelligence (estilo videochamada), com a identidade do Training.
// Aula: o participante tira dúvida com o avatar. Entrevista: o avatar do proprietário entrevista o capacitador
// e a saída é sempre um rascunho (DRAFT).
//
// Layout inspirado nas videochamadas (sala de espera clara, sala escura em tela cheia, barra inferior com botões
// redondos, painel lateral de chat e roteiro), com as cores, a fonte e o logotipo do Training.
// Câmera do participante: opcional e real, ligada só com o aceite da política de imagem da aula online.
// Aula: nesta versão de teste a imagem do participante ainda não é enviada.
// Entrevista: captação com aceite registrado no servidor (fotos no início de cada resposta e a cada 10 s, gravação
// em trechos enviada à EVOLU pelo /api/training, bucket privado intelligence-capture). Indicador visível o tempo todo.
// A lógica da conversa roda no Intelligence (/api/intelligence/*).
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {startMicVad,type MicVad} from '@/lib/intelligence/live/vad';
import {stepTurn,initialTurn,type TurnState} from '@/lib/intelligence/live/turn';
import type {LiveEvent} from '@/lib/intelligence/live/events';
import {createPortal} from 'react-dom';
import {Mic,MicOff,Video,VideoOff,Captions,MessageSquare,SkipForward,PhoneOff,Circle,Square,Download,Send,X,Info,ShieldCheck,Bot} from 'lucide-react';
import {Avatar3D,type Avatar3DHandle} from './avatar3d';
import {listCameras,useBlackWatch,BLACK_WARNING} from './camera-picker';
import './motion-studio.css';
import {avatarMood} from './avatar-motion';
import {ERROR_TEXT,ROUTE_BADGE,interviewBadge,splitSentences,formatClock,coverageLabel,CAMERA_POLICY,CAPTURE_POLICY,type MeetingMode} from './meeting-text';
import {PiperVoice,PIPER_DOWNLOAD_MB,chunkForSpeech} from './neural-voice';
import {CAPTURE_CLIENT,CaptureUploader,SegmentRecorder,acceptConsent,currentConsent,estimateMegabytesPerHour,newCaptureSession,revokeConsent,snapshotJpeg,type CaptureConsent,type CaptureMoment,type CaptureStats} from './capture';
import './meeting.css';

// Respostas JSON do Intelligence (formato definido em src/digital-instructor/live-app.mjs).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R=Record<string,any>;
type LogEntry={id:number;who:string;text:string;me?:boolean};
type CaptionState={who:string;text:string;upTo:number;badge:string|null}|null;
type Speech={speaking:boolean};

const endpoint='/api/intelligence/';
async function api(path:string,body?:unknown):Promise<R>{
  const res=await fetch(endpoint+path,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
  const json=await res.json().catch(()=>({error:'BAD_RESPONSE'}));
  if(!res.ok)throw Object.assign(new Error(json.error||'ERRO'),{code:json.error});
  return json;
}
const errorText=(e:unknown)=>ERROR_TEXT[(e as {code?:string})?.code||'']||'Algo falhou na conexão com o Intelligence. Tente de novo.';

type SpeechRecognitionLike={lang:string;interimResults:boolean;continuous:boolean;start():void;abort():void;
  onresult:((ev:{resultIndex:number;results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>})=>void)|null;
  onerror:((ev:{error:string})=>void)|null;onend:(()=>void)|null};
function recognitionCtor():(new()=>SpeechRecognitionLike)|null{
  if(typeof window==='undefined')return null;
  const w=window as unknown as {SpeechRecognition?:new()=>SpeechRecognitionLike;webkitSpeechRecognition?:new()=>SpeechRecognitionLike};
  return w.SpeechRecognition??w.webkitSpeechRecognition??null;
}
const plural=(n:number,one:string,many:string)=>`${n} ${n===1?one:many}`;
const MIC_ACK_KEY='evolu-intelligence-mic-ack';
const CAM_ACK_KEY='evolu-intelligence-camera-policy';

/** Abre por cima da página (tela cheia). onClose devolve à tela de origem. */
export function IntelligenceMeeting({mode,contextTitle,onClose}:{mode:MeetingMode;contextTitle?:string;onClose:()=>void}){
  const lesson=mode==='lesson';
  const [phase,setPhase]=useState<'lobby'|'call'|'left'>('lobby');
  const [app,setApp]=useState<R|null>(null);
  const [draft,setDraft]=useState<R|null>(null);
  const [log,setLog]=useState<LogEntry[]>([]);
  const [sources,setSources]=useState<{id:string;title:string}[]>([]);
  const [caption,setCaption]=useState<CaptionState>(null);
  const [ccOn,setCcOn]=useState(true);
  const [speech,setSpeech]=useState<Speech>({speaking:false});
  const [thinking,setThinking]=useState(false);
  const [listening,setListening]=useState(false);
  const [userTalking,setUserTalking]=useState(false);
  const [micOpen,setMicOpenState]=useState(false);
  const [camOn,setCamOn]=useState(false);
  const [recording,setRecording]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [recElapsed,setRecElapsed]=useState(0);
  const [panel,setPanel]=useState<'chat'|'info'|null>('chat');
  const [consentChecked,setConsentChecked]=useState(false);
  const [capConsent,setCapConsent]=useState<CaptureConsent|null>(null);
  const [capStats,setCapStats]=useState<CaptureStats>({photos:0,segments:0,failed:0,bytes:0});
  const [capPhotos,setCapPhotos]=useState(true);
  const [capRecording,setCapRecording]=useState(true);
  const [capChecked,setCapChecked]=useState(false);
  const [capFailedCount,setCapFailedCount]=useState(0);
  const [startedAt,setStartedAt]=useState(0);
  const [input,setInput]=useState('');
  const [joining,setJoining]=useState(false);
  const [lobbyMic,setLobbyMic]=useState(false);
  const [voiceOn,setVoiceOn]=useState(true);
  const [engine,setEngine]=useState<'browser'|'neural'>('browser');
  const [neuralState,setNeuralState]=useState<'off'|'loading'|'ready'|'error'>('off');
  const [neuralMb,setNeuralMb]=useState(0);
  const [rate,setRate]=useState(1.05);
  const [lobbyNotice,setLobbyNotice]=useState('');
  const [hasSynth,setHasSynth]=useState(true);
  const [hasRecognition,setHasRecognition]=useState(true);

  const avatarRef=useRef<Avatar3DHandle>(null);
  const meVideo=useRef<HTMLVideoElement>(null),lobbyVideo=useRef<HTMLVideoElement>(null);
  // Escolha da câmera (vale também para a gravação da entrevista) e aviso de imagem preta.
  const [cams,setCams]=useState<MediaDeviceInfo[]>([]);const [camDevice,setCamDevice]=useState('');const camDeviceRef=useRef('');
  const camVideo=()=>camDeviceRef.current?{deviceId:{exact:camDeviceRef.current}}:true;
  const micDialog=useRef<HTMLDialogElement>(null),capDialog=useRef<HTMLDialogElement>(null),camDialog=useRef<HTMLDialogElement>(null);
  const logEnd=useRef<HTMLLIElement>(null);
  const live=useRef({busy:false,speaking:false,micOpen:false,inCall:false,speakToken:0,seq:0,voiceOn:true,rate:1.05,
    recognizer:null as SpeechRecognitionLike|null,cam:null as MediaStream|null,rec:null as MediaStream|null,
    recorder:null as SegmentRecorder|null,recStart:0,voice:null as SpeechSynthesisVoice|null,
    engine:'browser' as 'browser'|'neural',neural:null as PiperVoice|null,audioCtx:null as AudioContext|null,analyser:null as AnalyserNode|null,source:null as AudioBufferSourceNode|null,
    consent:null as CaptureConsent|null,uploader:null as CaptureUploader|null,answerShot:false,shoot:(_m:CaptureMoment)=>{void _m},
    vad:null as MicVad|null,turn:initialTurn as TurnState,feed:(_e:LiveEvent)=>{void _e},
    dialogResolve:null as ((ok:boolean)=>void)|null,send:(_t:string)=>{void _t},resume:()=>{}});

  useEffect(()=>{live.current.voiceOn=voiceOn;live.current.rate=rate;live.current.engine=engine},[voiceOn,rate,engine]);
  // Voz neural pt-BR (Piper no navegador): baixa uma vez quando escolhida, depois fica no cache do navegador.
  const chooseEngine=useCallback((next:'browser'|'neural')=>{
    setEngine(next);
    if(next!=='neural'||live.current.neural||neuralState==='loading')return;
    setNeuralState('loading');setNeuralMb(0);
    PiperVoice.load(mb=>setNeuralMb(mb)).then(v=>{live.current.neural=v;setNeuralState('ready')})
      .catch(()=>{setNeuralState('error');setEngine('browser');setLobbyNotice('Não consegui carregar a voz neural. Sigo com a voz do navegador.')});
  },[neuralState]);
  const audioGraph=useCallback(()=>{
    const s=live.current;
    if(!s.audioCtx){const Ctx=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!Ctx)return null;s.audioCtx=new Ctx()}
    if(!s.analyser){s.analyser=s.audioCtx.createAnalyser();s.analyser.fftSize=1024;s.analyser.connect(s.audioCtx.destination)}
    void s.audioCtx.resume();return {ctx:s.audioCtx,analyser:s.analyser};
  },[]);
  useEffect(()=>{logEnd.current?.scrollIntoView({block:'nearest'})},[log]);

  // Recursos do navegador (só depois de montar: evita divergência com a renderização do servidor).
  useEffect(()=>{
    const synth=typeof window!=='undefined'&&'speechSynthesis' in window?window.speechSynthesis:null;
    const pick=()=>{if(!synth)return;const v=synth.getVoices();live.current.voice=v.find(x=>x.lang==='pt-BR'&&/google|luciana|francisca|natural/i.test(x.name))??v.find(x=>x.lang==='pt-BR')??v.find(x=>x.lang?.startsWith('pt'))??null};
    pick();synth?.addEventListener?.('voiceschanged',pick);
    const t=setTimeout(()=>{setHasSynth(Boolean(synth));if(!synth)setVoiceOn(false);setHasRecognition(Boolean(recognitionCtor()));if(window.matchMedia('(max-width: 760px)').matches)setPanel(null)},0);
    return()=>{clearTimeout(t);synth?.removeEventListener?.('voiceschanged',pick)};
  },[]);

  // Tela cheia: trava a rolagem da página enquanto a reunião está aberta.
  useEffect(()=>{const prev=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=prev}},[]);

  const addLog=useCallback((who:string,text:string,me=false)=>{setLog(l=>[...l,{id:++live.current.seq,who,text,me}])},[]);

  // ---------- diálogos de aceite ----------
  const confirmDialog=useCallback((dlg:HTMLDialogElement|null)=>new Promise<boolean>(resolve=>{
    if(!dlg||typeof dlg.showModal!=='function'){resolve(window.confirm(dlg?.querySelector('p')?.textContent||'Confirmar?'));return}
    live.current.dialogResolve=resolve;dlg.showModal();
  }),[]);
  const closeDialog=(dlg:HTMLDialogElement|null,ok:boolean)=>{dlg?.close();const r=live.current.dialogResolve;live.current.dialogResolve=null;r?.(ok)};

  // ---------- captação da entrevista (aceite no servidor, fotos e gravação enviadas) ----------
  const capPhotosRef=useRef(capPhotos),capRecordingRef=useRef(capRecording);
  useEffect(()=>{capPhotosRef.current=capPhotos;capRecordingRef.current=capRecording},[capPhotos,capRecording]);
  const applyConsent=useCallback((c:CaptureConsent|null)=>{
    const s=live.current;s.consent=c;setCapConsent(c);
    if(c&&(!s.uploader||s.uploader.consentId!==c.id)){
      const session=s.uploader?.session??newCaptureSession();
      s.uploader=new CaptureUploader(c,session,(st,err)=>{setCapStats(st);setCapFailedCount(live.current.uploader?.failedItems.length??0);if(err)addLog('Sistema','Captação: '+err+' O arquivo fica guardado para baixar no fim.')});
    }
  },[addLog]);
  /** Devolve o aceite vigente (servidor) ou pede um novo. needRecording exige a gravação no aceite. */
  const ensureConsent=useCallback(async(needRecording:boolean):Promise<CaptureConsent|null>=>{
    const s=live.current;if(lesson)return null;
    let c=s.consent;
    if(!c){try{c=await currentConsent('interview')}catch(e){addLog('Sistema','Captação indisponível ('+((e as Error).message||'sem conexão')+'). A entrevista segue sem enviar imagem.');return null}}
    if(c&&c.policyVersion===CAPTURE_POLICY.version&&(!needRecording||c.recording)){applyConsent(c);return c}
    setCapChecked(false);setCapPhotos(c?.photos??true);setCapRecording(needRecording||(c?.recording??true));
    if(!(await confirmDialog(capDialog.current))){addLog('Sistema','Captação não aceita. Nada da sua imagem é enviado.');return s.consent}
    try{
      const accepted=await acceptConsent({mode:'interview',policyVersion:CAPTURE_POLICY.version,camera:true,photos:capPhotosRef.current,recording:capRecordingRef.current});
      applyConsent(accepted);addLog('Sistema',`Aceite registrado (${CAPTURE_POLICY.version}).${accepted.photos?' Fotos ligadas.':''}${accepted.recording?' Gravação liberada.':''}`);return accepted;
    }catch(e){addLog('Sistema','Não consegui registrar o aceite: '+((e as Error).message||'sem conexão')+' Nada é enviado.');return null}
  },[addLog,confirmDialog,lesson,applyConsent]);
  const shoot=useCallback(async(moment:CaptureMoment)=>{
    const s=live.current;if(lesson||!s.consent?.photos||!s.uploader||!s.cam||!s.inCall)return;
    const blob=await snapshotJpeg(meVideo.current);if(blob&&s.inCall)s.uploader?.enqueue(blob,'photo',moment);
  },[lesson]);
  useEffect(()=>{live.current.shoot=m=>{void shoot(m)}},[shoot]);
  // Piso: uma foto a cada 10 s com a câmera ligada e o aceite de fotos.
  useEffect(()=>{
    if(lesson||phase!=='call'||!camOn||!capConsent?.photos)return;
    const id=setInterval(()=>live.current.shoot('interval'),CAPTURE_CLIENT.photoEveryMs);
    return()=>clearInterval(id);
  },[lesson,phase,camOn,capConsent]);

  // ---------- câmera ----------
  const attachCam=useCallback(()=>{for(const v of [meVideo.current,lobbyVideo.current])if(v)v.srcObject=live.current.cam;setCamOn(Boolean(live.current.cam))},[]);
  const setCam=useCallback(async(on:boolean)=>{
    const s=live.current;
    if(!on){
      if(s.recorder){addLog('Sistema','Pare a gravação antes de desligar a câmera.');return}
      s.cam?.getTracks().forEach(t=>t.stop());s.cam=null;
    }else if(!s.cam){
      if(lesson){
        let accepted=false;try{accepted=localStorage.getItem(CAM_ACK_KEY)===CAMERA_POLICY.version}catch{/* sem armazenamento */}
        if(!accepted){setConsentChecked(false);accepted=await confirmDialog(camDialog.current);if(!accepted)return;try{localStorage.setItem(CAM_ACK_KEY,CAMERA_POLICY.version)}catch{/* sem armazenamento */}}
      }
      try{s.cam=await navigator.mediaDevices.getUserMedia({video:camVideo()});const id=s.cam.getVideoTracks()[0]?.getSettings().deviceId||'';camDeviceRef.current=id;setCamDevice(id);void listCameras().then(setCams).catch(()=>{})}catch{setLobbyNotice('Não consegui abrir a câmera. A reunião segue sem vídeo.');addLog('Sistema','Não consegui abrir a câmera. A reunião segue sem vídeo.')}
    }
    attachCam();
    if(on&&s.cam&&!lesson)void ensureConsent(false);
  },[addLog,attachCam,confirmDialog,lesson,ensureConsent]);
  useEffect(()=>{attachCam()},[phase,attachCam]);
  const switchCam=useCallback(async(id:string)=>{const s=live.current;if(s.recorder){addLog('Sistema','Pare a gravação antes de trocar a câmera.');return}
    s.cam?.getTracks().forEach(t=>t.stop());s.cam=null;camDeviceRef.current=id;setCamDevice(id);await setCam(true)},[addLog,setCam]);
  const blackLobby=useBlackWatch(lobbyVideo,phase==='lobby'&&camOn),blackCall=useBlackWatch(meVideo,phase==='call'&&camOn);

  // ---------- ouvir: microfone aberto como numa chamada ----------
  const pauseListening=useCallback(()=>{
    const s=live.current;
    if(s.recognizer){s.recognizer.onend=null;try{s.recognizer.abort()}catch{/* já parado */}s.recognizer=null}
    setListening(false);setUserTalking(false);
  },[]);
  const resumeListening=useCallback(()=>{
    const s=live.current,Ctor=recognitionCtor();
    if(!Ctor||!s.micOpen||s.speaking||s.busy||s.recognizer||!s.inCall)return;
    const r=new Ctor();s.recognizer=r;r.lang='pt-BR';r.interimResults=true;r.continuous=false;
    let finalText='';
    r.onresult=ev=>{let interim='';for(let k=ev.resultIndex;k<ev.results.length;k++){const res=ev.results[k];if(res.isFinal)finalText+=res[0].transcript;else interim+=res[0].transcript}
      const said=(finalText+interim).trim();setUserTalking(Boolean(said));if(said){setCaption({who:'Você',text:said,upTo:said.length,badge:null});if(!s.answerShot){s.answerShot=true;s.shoot('answer_start')}}};
    r.onerror=ev=>{if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){addLog('Sistema','Microfone bloqueado pelo navegador. Use o chat.');s.micOpen=false;setMicOpenState(false)}};
    r.onend=()=>{s.recognizer=null;setListening(false);setUserTalking(false);const said=finalText.trim();if(said)s.send(said);else setTimeout(()=>s.resume(),250)};
    setListening(true);
    try{r.start()}catch{s.recognizer=null;setListening(false)}
  },[addLog]);
  useEffect(()=>{live.current.resume=resumeListening},[resumeListening]);

  // ---------- falar ----------
  const setSpeaking=useCallback((v:boolean)=>{const s=live.current;s.speaking=v;setSpeech({speaking:v});s.vad?.setAvatarSpeaking(v);s.feed({type:v?'fala.inicio':'fala.fim',at:performance.now()});if(v)pauseListening();else s.resume()},[pauseListening]);
  const avatarLabel=app?.avatar?.label||'Avatar (IA)';
  const avatarLabelRef=useRef(avatarLabel);
  useEffect(()=>{avatarLabelRef.current=avatarLabel},[avatarLabel]);

  /** Fala com legenda. Divide em frases (o Chrome corta falas longas). Sem voz, segue um ritmo de leitura estimado. */
  const speak=useCallback((text:string,badge:string|null=null,speaker?:string)=>{
    const s=live.current,token=++s.speakToken,who=speaker||avatarLabelRef.current;
    const synth='speechSynthesis' in window?window.speechSynthesis:null;
    synth?.cancel();setSpeaking(true);setCaption({who,text,upTo:0,badge});
    const done=()=>{if(token===s.speakToken){setCaption({who,text,upTo:text.length,badge});setSpeaking(false)}};
    const timed=(from:number)=>new Promise<void>(resolve=>{
      const cps=15*s.rate,t0=performance.now();let last=from;
      const tick=()=>{if(token!==s.speakToken)return resolve();
        const pos=Math.min(text.length,from+Math.floor((performance.now()-t0)/1000*cps));
        if(pos!==last){setCaption({who,text,upTo:pos,badge});if(/\s/.test(text[pos]??''))avatarRef.current?.word(text.slice(pos+1).match(/^\S+/)?.[0]);last=pos}
        if(pos>=text.length){done();return resolve()}requestAnimationFrame(tick)};
      tick();
    });
    const graph=s.voiceOn&&s.engine==='neural'&&s.neural?audioGraph():null;
    if(graph&&s.neural){
      const voice=s.neural,{ctx,analyser}=graph,chunks=chunkForSpeech(text);
      avatarRef.current?.setAnalyser(analyser);
      return (async()=>{
        let offset=0,next:Promise<Float32Array>|null=chunks.length?voice.synthesize(chunks[0],s.rate):null;
        try{
          for(let i=0;i<chunks.length&&next;i++){
            const pcm=await next;if(token!==s.speakToken)break;
            next=i+1<chunks.length?voice.synthesize(chunks[i+1],s.rate):null;next?.catch(()=>{/* tratado no próximo laço */});
            const found=text.indexOf(chunks[i],offset),base=found>=0?found:offset,len=chunks[i].length;
            const buf=ctx.createBuffer(1,pcm.length,voice.sampleRate);buf.copyToChannel(new Float32Array(pcm),0);
            const src=ctx.createBufferSource();src.buffer=buf;src.connect(analyser);s.source=src;avatarRef.current?.setAnalyser(analyser); // a sala pode ter montado depois do início da fala
            await new Promise<void>(res=>{src.onended=()=>res();src.start();const t0=performance.now(),dur=buf.duration*1000;
              const tick=()=>{if(token!==s.speakToken){try{src.stop()}catch{/* já parado */}return res()}
                const f=Math.min(1,(performance.now()-t0)/dur);setCaption({who,text,upTo:base+Math.floor(len*f),badge});if(f<1)requestAnimationFrame(tick)};tick()});
            offset=base+len;
          }
          s.source=null;avatarRef.current?.setAnalyser(null);done();
        }catch{s.source=null;avatarRef.current?.setAnalyser(null);if(token===s.speakToken){addLog('Sistema','A voz neural falhou nesta fala. Sigo com a voz do navegador.');s.engine='browser';setEngine('browser');await timed(offset)}}
      })();
    }
    if(!synth||!s.voiceOn)return timed(0);
    const sentences=splitSentences(text);
    return new Promise<void>(resolve=>{
      let i=0,offset=0;
      const next=()=>{
        if(token!==s.speakToken)return resolve();
        if(i>=sentences.length){done();return resolve()}
        const chunk=sentences[i++],base=offset;offset+=chunk.length;
        if(!chunk.trim())return next();
        const u=new SpeechSynthesisUtterance(chunk);u.lang='pt-BR';if(s.voice)u.voice=s.voice;u.rate=s.rate;
        let began=false;
        u.onstart=()=>{began=true};
        u.onboundary=ev=>{if(token===s.speakToken){avatarRef.current?.word(chunk.slice(ev.charIndex??0).match(/^\S+/)?.[0]);setCaption({who,text,upTo:base+(ev.charIndex??0),badge})}};
        u.onend=()=>{if(token===s.speakToken)setCaption({who,text,upTo:offset,badge});next()};
        u.onerror=()=>{if(began)next()};
        synth.speak(u);
        // Navegador sem voz utilizável: segue com legenda e boca no ritmo estimado.
        setTimeout(()=>{if(!began&&token===s.speakToken){synth.cancel();timed(base).then(resolve)}},2500);
      };
      next();
    });
  },[addLog,audioGraph,setSpeaking]);
  const stopSpeaking=useCallback(()=>{const s=live.current;s.speakToken+=1;try{s.source?.stop()}catch{/* já parado */}s.source=null;if('speechSynthesis' in window)window.speechSynthesis.cancel();if(s.speaking)setSpeaking(false)},[setSpeaking]);

  // Aluno corta o avatar: o detector de voz segue ligado enquanto o avatar fala. Fala real por mais de 200 ms silencia o avatar.
  useEffect(()=>{live.current.feed=e=>{
    const s=live.current,r=stepTurn(s.turn,e);s.turn=r.state;
    if(r.effects.some(x=>x.do==='parar.fala')&&s.speaking){s.speakToken+=1;try{s.source?.stop()}catch{/* já parado */}s.source=null;if('speechSynthesis' in window)window.speechSynthesis.cancel();setSpeaking(false)}
  }},[setSpeaking]);
  const setMic=useCallback(async(on:boolean)=>{
    const s=live.current;
    if(on&&!recognitionCtor()){addLog('Sistema','Este navegador não tem reconhecimento de voz. Use o chat.');return}
    if(on){
      let accepted=false;try{accepted=localStorage.getItem(MIC_ACK_KEY)==='1'}catch{/* sem armazenamento */}
      if(!accepted){accepted=await confirmDialog(micDialog.current);if(!accepted)return;try{localStorage.setItem(MIC_ACK_KEY,'1')}catch{/* sem armazenamento */}}
    }
    s.micOpen=on;setMicOpenState(on);
    if(on){
      if(!s.vad)startMicVad(e=>s.feed(e)).then(v=>{if(s.micOpen&&!s.vad){s.vad=v;v.setAvatarSpeaking(s.speaking)}else v.stop()}).catch(()=>{/* sem detector: segue como antes, o aluno corta pelo botão */});
      stopSpeaking();live.current.resume();
    }else{s.vad?.stop();s.vad=null;s.turn=initialTurn;pauseListening()}
  },[addLog,confirmDialog,pauseListening,stopSpeaking]);

  // ---------- gravação da entrevista (enviada à EVOLU em trechos) ----------
  const download=(blob:Blob,name:string)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
  const stopRecording=useCallback(()=>{
    const s=live.current;if(!s.recorder)return;
    s.recorder.stop();s.rec?.getAudioTracks().forEach(t=>t.stop());s.recorder=null;setRecording(false);
    addLog('Sistema','Gravação parada. O último trecho segue para o servidor.');
  },[addLog]);
  const toggleRecording=useCallback(async()=>{
    const s=live.current;
    if(lesson)return; // o participante nunca é gravado
    if(s.recorder){stopRecording();return}
    if(typeof MediaRecorder==='undefined'||!navigator.mediaDevices?.getUserMedia){addLog('Sistema','Este navegador não grava. A entrevista segue sem gravação.');return}
    const consent=await ensureConsent(true);
    if(!consent?.recording||!s.uploader){addLog('Sistema','Sem aceite de gravação registrado. Nada foi gravado.');return}
    try{s.rec=await navigator.mediaDevices.getUserMedia({video:camVideo(),audio:true})}catch{addLog('Sistema','Não consegui acesso à câmera e ao microfone para gravar.');return}
    s.cam?.getTracks().forEach(t=>t.stop());s.cam=new MediaStream(s.rec.getVideoTracks());attachCam();
    const uploader=s.uploader;
    const recorder=new SegmentRecorder(s.rec,blob=>uploader.enqueue(blob,'recording','session'));
    recorder.start();s.recorder=recorder;s.recStart=Date.now();setRecElapsed(0);setRecording(true);
    addLog('Sistema','Gravação iniciada. Vai para a EVOLU em trechos de 1 minuto.');
  },[addLog,attachCam,ensureConsent,lesson,stopRecording]);
  const revokeCapture=useCallback(async()=>{
    const s=live.current,c=s.consent;if(!c)return;
    stopRecording();
    try{await revokeConsent(c.id);addLog('Sistema','Aceite revogado. A captação parou. O que já foi enviado continua guardado nesta fase de teste.')}
    catch(e){addLog('Sistema','Não consegui revogar no servidor: '+((e as Error).message||'sem conexão')+' A captação parou nesta tela.')}
    s.consent=null;setCapConsent(null);
  },[addLog,stopRecording]);
  const downloadFailed=()=>{const items=live.current.uploader?.failedItems??[];items.forEach((it,i)=>download(it.blob,`captacao-nao-enviada-${i+1}.${it.kind==='photo'?'jpg':it.blob.type.includes('mp4')?'mp4':'webm'}`))};

  // ---------- relógio da chamada ----------
  useEffect(()=>{
    if(phase!=='call')return;
    const t0=Date.now();
    const id=setInterval(()=>{setElapsed(Date.now()-t0);if(live.current.recorder)setRecElapsed(Date.now()-live.current.recStart)},1000);
    return()=>clearInterval(id);
  },[phase]);

  // ---------- aula ----------
  const narrate=useCallback((state:R,segmentId:string)=>{
    const seg=state.lesson.segments.find((x:R)=>x.id===segmentId);if(!seg)return;
    const text=`${seg.title}. ${seg.narration}`;setSources([]);addLog(`Avatar · trecho ${seg.order}`,text);speak(text,null,state.avatar?.label);
  },[addLog,speak]);
  const stepLesson=useCallback(async()=>{
    if(!app)return;
    const l=app.lesson,cur=l.segments.find((s:R)=>s.id===l.current_segment_id);
    if(cur&&cur.order===l.segments.length){const next=await api('lesson/end',{});setApp(next);addLog('Avatar','Fim da aula. Obrigado pela participação.');speak('Fim da aula. Obrigado pela participação.');return}
    const target=l.segments.find((s:R)=>s.order===(cur?cur.order+1:1));if(!target)return;
    const next=await api('lesson/segment',{segment_id:target.id});setApp(next);narrate(next,target.id);
  },[addLog,app,narrate,speak]);

  // ---------- entrevista ----------
  const applyInterview=useCallback((r:R)=>{
    setApp(a=>a?{...a,interview:r.state,usage:r.usage??a.usage}:a);
    if(r.draft)setDraft(r.draft);
    addLog('Entrevistador',r.line);
  },[addLog]);
  const finishInterview=useCallback(async()=>{const r=await api('interview/finish',{});applyInterview(r);speak(r.line,interviewBadge(r))},[applyInterview,speak]);

  // ---------- envio (voz ou chat) ----------
  const send=useCallback(async(raw:string)=>{
    const text=String(raw??'').trim();const s=live.current;
    if(!text||s.busy)return;
    stopSpeaking();s.busy=true;setThinking(true);pauseListening();s.answerShot=false;
    addLog(lesson?'Você (participante)':'Você (capacitador)',text,true);
    let reply:[string,string|null];
    try{
      if(lesson){
        const r=await api('lesson/ask',{text});
        addLog('Avatar',r.speech);setSources(r.sources||[]);
        if(r.usage)setApp(a=>a?{...a,usage:r.usage}:a);
        reply=[r.speech,ROUTE_BADGE[r.route]??null];
      }else{
        const r=await api('interview/reply',{text});applyInterview(r);reply=[r.line,interviewBadge(r)];
      }
    }catch(e){addLog('Sistema',errorText(e));reply=[errorText(e),null]}
    finally{s.busy=false;setThinking(false)}
    speak(...reply);
  },[addLog,applyInterview,lesson,pauseListening,speak,stopSpeaking]);
  useEffect(()=>{live.current.send=(t:string)=>{void send(t)}},[send]);

  // ---------- entrar e sair ----------
  const join=async()=>{
    if(live.current.engine==='neural')audioGraph();
    setJoining(true);setLobbyNotice('');setStartedAt(Date.now());setElapsed(0);setLog([]);setSources([]);setDraft(null);setCaption(null);
    try{
      let state=await api('state');
      if(lesson){
        state=await api('lesson/start',{});
        setApp(state);live.current.inCall=true;setPhase('call');
        narrate(state,state.lesson.current_segment_id);
      }else{
        const r=await api('interview/start',{});
        state={...state,interview:r.state};
        setApp(state);live.current.inCall=true;setPhase('call');
        addLog('Entrevistador',r.line);speak(r.line,null,state.avatar?.label);
      }
      if(lobbyMic)void setMic(true);
    }catch(e){setLobbyNotice(errorText(e))}
    finally{setJoining(false)}
  };
  const leave=async()=>{
    const s=live.current;
    stopSpeaking();await setMic(false);stopRecording();
    s.inCall=false; // para as fotos antes de terminar o envio
    if(s.uploader&&!s.uploader.idle){addLog('Sistema','Terminando de enviar a captação…');await s.uploader.flush()}
    try{
      if(lesson&&app?.lesson?.run_status==='LIVE')await api('lesson/end',{});
      if(!lesson&&app?.interview?.status==='OPEN'){const r=await api('interview/finish',{});if(r.draft)setDraft(r.draft)}
    }catch{/* Intelligence fora: sai assim mesmo */}
    s.inCall=false;setCaption(null);setPhase('left');setElapsed(0);
  };
  const close=()=>{const s=live.current;s.cam?.getTracks().forEach(t=>t.stop());s.cam=null;setCamOn(false);onClose()};
  const downloadDraft=()=>{if(draft)download(new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}),`rascunho-avatar-${draft.interviewee_id||'capacitador'}.json`)};

  // Encerrar a câmera, a gravação e a fala ao sair da tela.
  useEffect(()=>()=>{const s=live.current;s.inCall=false;s.speakToken+=1;if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();
    if(s.recognizer){s.recognizer.onend=null;try{s.recognizer.abort()}catch{/* já parado */}}
    s.recorder?.stop();s.rec?.getTracks().forEach(t=>t.stop());s.cam?.getTracks().forEach(t=>t.stop())},[]);

  const submit=(e:FormEvent)=>{e.preventDefault();const v=input;setInput('');void send(v)};
  const run=(fn:()=>Promise<void>)=>{fn().catch(e=>addLog('Sistema',errorText(e)))};

  // ---------- derivados para a tela ----------
  const l=app?.lesson,cur=l?.segments?.find((s:R)=>s.id===l.current_segment_id);
  const interview=app?.interview;
  const usage=app?.usage;
  const stepLabel=lesson?(l?.run_status!=='LIVE'?'Aula encerrada':cur&&cur.order===l.segments.length?'Encerrar aula':'Próximo trecho'):(interview?.status==='OPEN'?'Encerrar e gerar rascunho':'Entrevista encerrada');
  const stepDisabled=thinking||(lesson?l?.run_status!=='LIVE':interview?.status!=='OPEN');
  const mood=avatarMood({thinking,speaking:speech.speaking,listening,routed:caption?.badge===ROUTE_BADGE.ESCALATE});
  const avatarState=({thinking:'pensando',speaking:'falando',routing:'encaminhando',listening:'ouvindo você',idle:'pronto'} as const)[mood];
  const title=lesson?(l?.title||'Aula com o avatar'):'Entrevista do capacitador';
  const cov=interview?.coverage??{covered:0,total:13};

  const timeNow=startedAt?new Date(startedAt+elapsed).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'';
  const togglePanel=(p:'chat'|'info')=>setPanel(v=>v===p?null:p);
  const brand=(dark:boolean)=><span className="ev-room-brand"><img src={dark?'/brand/evolu-white.png':'/brand/evolu-black.png'} alt="EVOLU"/><small>Training</small></span>;

  const node=<div className={'ev-meet'+(phase==='call'?' is-call':' is-light')} role="dialog" aria-modal="true" aria-label={lesson?'Aula com o avatar':'Entrevista com o avatar'}>
    {phase==='lobby'&&<div className="ev-lobby">
      <header className="ev-lobby-head">{brand(false)}<button className="ev-lobby-x" onClick={close} aria-label="Fechar e voltar"><X size={20}/></button></header>
      <div className="ev-lobby-main">
        <div className="ev-lobby-preview">
          <video ref={lobbyVideo} autoPlay muted playsInline hidden={!camOn}/>
          {!camOn&&<div className="ev-lobby-off"><span className="ev-room-initial">{lesson?'P':'C'}</span><span>A câmera está desligada</span></div>}
          <span className="ev-lobby-name">{lesson?'Você':'Você (capacitador)'}</span>
          <div className="ev-lobby-toggles">
            <button className={'ev-round'+(lobbyMic?'':' off')} onClick={()=>setLobbyMic(v=>!v)} disabled={!hasRecognition} aria-pressed={lobbyMic} aria-label={lobbyMic?'Entrar com o microfone fechado':'Entrar com o microfone aberto'} title="Microfone">{lobbyMic?<Mic size={20}/>:<MicOff size={20}/>}</button>
            <button className={'ev-round'+(camOn?'':' off')} onClick={()=>void setCam(!camOn)} aria-pressed={camOn} aria-label={camOn?'Desligar a câmera':'Ligar a câmera'} title="Câmera">{camOn?<Video size={20}/>:<VideoOff size={20}/>}</button>
          </div>
        </div>
        <div className="ev-lobby-side">
          <span className="ev-eyebrow">{lesson?'AULA COM O AVATAR':'ENTREVISTA DO CAPACITADOR'}</span>
          <h1>Pronto para participar?</h1>
          <div className="ev-lobby-who"><span className="ev-lobby-dot" aria-hidden="true"><Bot size={18}/></span><span>{lesson?'O avatar do proprietário já está na sala.':'O avatar do proprietário vai conduzir a conversa.'}</span></div>
          {contextTitle&&<p className="ev-lobby-context">{contextTitle}</p>}
          <button className="ev-pill-button lime" onClick={join} disabled={joining}>{joining?'Entrando…':lesson?'Participar agora':'Iniciar entrevista'}</button>
          {lobbyNotice&&<p className="ev-lobby-error" role="alert">{lobbyNotice}</p>}
          {camOn&&cams.length>1&&<label className="ev-lobby-cam">Câmera <select value={camDevice} onChange={e=>void switchCam(e.target.value)}>{cams.map((d,i)=><option key={d.deviceId||i} value={d.deviceId}>{d.label||'Câmera '+(i+1)}</option>)}</select></label>}
          {blackLobby&&<p className="ev-lobby-error" role="alert">{BLACK_WARNING}</p>}
          <details className="ev-lobby-more"><summary>Voz e acessibilidade</summary>
            <label><input type="checkbox" checked={voiceOn} disabled={!hasSynth&&engine==='browser'} onChange={e=>setVoiceOn(e.target.checked)}/> Voz do avatar</label>
            <fieldset className="ev-lobby-engine"><legend>Tipo de voz</legend>
              <label><input type="radio" name="ev-engine" checked={engine==='browser'} onChange={()=>chooseEngine('browser')}/> Voz do navegador</label>
              <label><input type="radio" name="ev-engine" checked={engine==='neural'} onChange={()=>{setVoiceOn(true);chooseEngine('neural')}}/> Voz neural pt-BR (teste, baixa cerca de {PIPER_DOWNLOAD_MB} MB na primeira vez)</label>
              {neuralState==='loading'&&<small role="status">Baixando a voz neural: {neuralMb} MB…</small>}
              {neuralState==='ready'&&<small role="status">Voz neural pronta.</small>}
            </fieldset>
            <label>Velocidade da voz <input type="range" min="0.8" max="1.4" step="0.05" value={rate} onChange={e=>setRate(Number(e.target.value))} aria-valuetext={rate.toFixed(2)+'x'}/></label>
          </details>
          <ul className="ev-lobby-notes">
            <li>{lesson?'Câmera opcional. Ao ligar, você aceita a política de imagem da aula online.':'Câmera opcional. Fotos e gravação só com o seu aceite, registrado no servidor, e vão para a EVOLU.'}</li>
            <li>{hasRecognition?'Microfone pelo reconhecimento de voz do navegador (no Chrome, o áudio vai para o Google). O chat funciona sempre.':'Este navegador não reconhece voz. Use o chat.'}</li>
            <li>O avatar é uma versão digital feita com IA.</li>
          </ul>
        </div>
      </div>
    </div>}

    {phase==='left'&&<div className="ev-lobby ev-left">
      <header className="ev-lobby-head">{brand(false)}</header>
      <div className="ev-left-body">
        <h1>{lesson?'Você saiu da aula':'Entrevista encerrada'}</h1>
        {draft&&<p>O rascunho (DRAFT) do avatar do capacitador está pronto para revisão.</p>}
        {!lesson&&(capStats.photos+capStats.segments+capStats.failed>0)&&<p>Captação enviada à EVOLU: {plural(capStats.photos,'foto','fotos')} e {plural(capStats.segments,'trecho','trechos')} de gravação.{capStats.failed?` ${plural(capStats.failed,'item não foi enviado','itens não foram enviados')}.`:''}</p>}
        <div className="ev-left-actions">
          <button className="ev-pill-button outline" onClick={()=>setPhase('lobby')}>Participar novamente</button>
          {draft&&<button className="ev-pill-button outline" onClick={downloadDraft}><Download size={16}/> Baixar rascunho</button>}
          {capFailedCount>0&&<button className="ev-pill-button outline" onClick={downloadFailed}><Download size={16}/> Baixar o que não foi enviado</button>}
          <button className="ev-pill-button lime" onClick={close}>{lesson?'Voltar à aula':'Voltar ao painel'}</button>
        </div>
      </div>
    </div>}

    {phase==='call'&&<div className={'ev-room'+(panel?' with-panel':'')}>
      <header className="ev-room-head">
        {brand(true)}
        <div className="ev-room-flags">
          {recording&&<span className="ev-room-rec" role="status"><Circle size={9} fill="currentColor"/> Gravando {formatClock(recElapsed)}</span>}
          {lesson&&camOn&&<span className="ev-room-chip"><ShieldCheck size={13}/> Câmera ligada · política aceita</span>}
          {!lesson&&capConsent&&(camOn||recording)&&<span className="ev-room-chip capture" role="status" aria-label="Captação ligada"><ShieldCheck size={13}/> Captação ligada{capConsent.photos?` · ${plural(capStats.photos,'foto','fotos')}`:''}{capConsent.recording?` · ${plural(capStats.segments,'trecho','trechos')}`:''}{capStats.failed?` · ${plural(capStats.failed,'falha','falhas')}`:''}</span>}
          <span className="ev-room-live">{lesson?(l?.run_status==='LIVE'?'AO VIVO':'ENCERRADA'):(interview?.status==='OPEN'?'EM ANDAMENTO':'ENCERRADA')}</span>
        </div>
      </header>
      <div className="ev-room-main">
        <div className="ev-room-stage">
          <button type="button" className={'ev-tile avatar'+(speech.speaking?' speaking':'')+(thinking?' thinking':'')} onClick={()=>{if(speech.speaking)stopSpeaking()}} aria-label={speech.speaking?'Interromper a fala do avatar':avatarLabel}>
            <Avatar3D ref={avatarRef} mood={mood} label={avatarLabel}/>
            <span className="ev-tile-name">{avatarLabel}</span>
            <span className="ev-tile-state">{avatarState}</span>
          </button>
          <div className={'ev-tile me'+(userTalking?' speaking':'')}>
            <video ref={meVideo} autoPlay muted playsInline hidden={!camOn}/>
            {!camOn&&<span className="ev-room-initial" aria-hidden="true">{lesson?'P':'C'}</span>}
            <span className="ev-tile-name">Você{listening&&<small> · ouvindo</small>}{blackCall&&<small role="alert"> · imagem preta, confira a câmera</small>}</span>
            {!micOpen&&<span className="ev-tile-muted" aria-label="microfone fechado"><MicOff size={13}/></span>}
          </div>
          {ccOn&&caption&&caption.text&&<div className="ev-room-caption" aria-live="polite">
            <span className="who">{caption.who}{caption.badge&&<em>{caption.badge}</em>}</span>
            <p><span>{caption.text.slice(0,caption.upTo)}</span><span className="pending">{caption.text.slice(caption.upTo)}</span></p>
          </div>}
        </div>
        {panel&&<aside className="ev-room-panel" aria-label={panel==='chat'?'Chat':'Detalhes'}>
          <div className="ev-room-panel-head"><h2>{panel==='chat'?'Mensagens':lesson?'Roteiro da aula':'Roteiro da entrevista'}</h2><button className="ev-icon" onClick={()=>setPanel(null)} aria-label="Fechar painel"><X size={18}/></button></div>
          {panel==='chat'&&<div className="ev-room-chat">
            <ol className="ev-room-log" aria-live="polite">{log.map(m=><li key={m.id} className={m.me?'me':m.who==='Sistema'?'system':''}><span className="who">{m.who}</span>{m.text}</li>)}<li ref={logEnd} aria-hidden="true" className="end"/></ol>
            {sources.length>0&&<div className="ev-room-sources">Fontes da aula: {sources.map(s=><span className="ev-pill" key={s.id}>{s.title}</span>)}</div>}
            <form className="ev-room-input" onSubmit={submit}>
              <input value={input} onChange={e=>{const v=e.target.value;if(!input&&v&&!live.current.answerShot){live.current.answerShot=true;live.current.shoot('answer_start')}setInput(v)}} maxLength={1200} placeholder={lesson?'Escreva a sua dúvida':'Escreva a sua resposta'} aria-label={lesson?'Sua dúvida':'Sua resposta'} disabled={thinking}/>
              <button className="ev-icon send" type="submit" disabled={thinking||!input.trim()} aria-label="Enviar"><Send size={17}/></button>
            </form>
          </div>}
          {panel==='info'&&<div className="ev-room-info">
            {lesson?<ol className="ev-room-segments">{l?.segments?.map((s:R)=><li key={s.id} className={cur&&s.id===cur.id?'current':cur&&s.order<cur.order?'done':''}><span>{s.order}</span>{s.title}</li>)}</ol>
              :<div className="ev-room-coverage"><p>{coverageLabel(interview?.status)}</p><progress value={cov.covered} max={cov.total||1}/><strong>{cov.covered} de {cov.total} pontos</strong>
                <p>Trajetória, método, personalidade, limites e materiais. Assuntos pessoais, contatos e dados sensíveis não são registrados.</p>
                {draft&&<button className="ev-pill-button outline" onClick={downloadDraft}><Download size={15}/> Baixar rascunho (DRAFT)</button>}
                <div className="ev-room-capture"><strong>Captação</strong>{capConsent?<><p>Aceite {capConsent.policyVersion}. {capConsent.photos?'Fotos ligadas. ':''}{capConsent.recording?'Gravação liberada. ':''}Enviados: {plural(capStats.photos,'foto','fotos')} e {plural(capStats.segments,'trecho','trechos')} ({(capStats.bytes/1024/1024).toFixed(1)} MB).</p>
                  <button className="ev-pill-button outline" onClick={()=>run(revokeCapture)}>Revogar aceite</button></>
                  :<><p>Sem aceite. Nada da sua imagem é enviado.</p><button className="ev-pill-button outline" onClick={()=>run(async()=>{await ensureConsent(false)})}>Ver política e aceitar</button></>}</div></div>}
            <dl className="ev-room-facts">
              <div><dt>Perfil</dt><dd>{app?.avatar?.profile?`${app.avatar.profile.id} · ${app.avatar.profile.activation}`:'-'}</dd></div>
              <div><dt>Modelo</dt><dd>{app?.model?.label||'-'}</dd></div>
              <div><dt>Custo</dt><dd>{usage?`US$ ${Number(usage.cost_usd).toFixed(4)} de US$ ${usage.budget_usd}`:'zero (sem modelo real)'}</dd></div>
            </dl>
          </div>}
        </aside>}
      </div>
      <footer className="ev-room-bar">
        <div className="ev-room-bar-left"><span className="ev-room-time">{timeNow}</span><span className="ev-room-sep" aria-hidden="true">|</span><span className="ev-room-title" title={title}>{title}</span><span className="ev-room-clock" aria-label="Tempo de reunião">{formatClock(elapsed)}</span></div>
        <div className="ev-room-bar-center" role="toolbar" aria-label="Controles da reunião">
          <button className={'ev-round'+(micOpen?'':' off')} aria-pressed={micOpen} onClick={()=>void setMic(!micOpen)} disabled={!hasRecognition} aria-label={micOpen?'Fechar microfone':'Abrir microfone'} title={hasRecognition?'Microfone':'Sem reconhecimento de voz neste navegador'}>{micOpen?<Mic size={20}/>:<MicOff size={20}/>}</button>
          <button className={'ev-round'+(camOn?'':' off')} aria-pressed={camOn} onClick={()=>void setCam(!camOn)} aria-label={camOn?'Desligar câmera':'Ligar câmera'} title="Câmera">{camOn?<Video size={20}/>:<VideoOff size={20}/>}</button>
          <button className={'ev-round'+(ccOn?' active':'')} aria-pressed={ccOn} onClick={()=>setCcOn(v=>!v)} aria-label="Legendas" title="Legendas"><Captions size={20}/></button>
          {!lesson&&<button className={'ev-round'+(recording?' rec':'')} aria-pressed={recording} onClick={()=>run(toggleRecording)} aria-label={recording?'Parar gravação':'Gravar'} title={recording?'Parar gravação':'Gravar'}>{recording?<Square size={18}/>:<Circle size={18}/>}</button>}
          <button className="ev-pill-button lime ev-advance" onClick={()=>run(lesson?stepLesson:finishInterview)} disabled={stepDisabled}><SkipForward size={18}/><span>{stepLabel}</span></button>
          <button className="ev-pill-button leave" onClick={()=>run(leave)} aria-label="Sair da reunião" title="Sair"><PhoneOff size={20}/></button>
        </div>
        <div className="ev-room-bar-right">
          <button className={'ev-icon'+(panel==='info'?' active':'')} aria-pressed={panel==='info'} onClick={()=>togglePanel('info')} aria-label={lesson?'Roteiro da aula':'Roteiro da entrevista'} title="Roteiro"><Info size={20}/></button>
          <button className={'ev-icon'+(panel==='chat'?' active':'')} aria-pressed={panel==='chat'} onClick={()=>togglePanel('chat')} aria-label="Chat" title="Chat"><MessageSquare size={20}/></button>
        </div>
      </footer>
    </div>}

    <dialog ref={camDialog} className="ev-meet-dialog" onCancel={e=>{e.preventDefault();closeDialog(camDialog.current,false)}}>
      <h3>{CAMERA_POLICY.title}</h3>
      <ul>{CAMERA_POLICY.points.map(p=><li key={p}>{p}</li>)}</ul>
      <p className="ev-meet-dialog-note">{CAMERA_POLICY.testNote}</p>
      <label className="ev-meet-consent"><input type="checkbox" checked={consentChecked} onChange={e=>setConsentChecked(e.target.checked)}/> Li e aceito a política de imagem da aula online ({CAMERA_POLICY.version}).</label>
      <div className="ev-meet-dialog-actions"><button className="ev-pill-button outline" onClick={()=>closeDialog(camDialog.current,false)}>Continuar sem câmera</button><button className="ev-pill-button lime" disabled={!consentChecked} onClick={()=>closeDialog(camDialog.current,true)}>Ligar a câmera</button></div>
    </dialog>
    <dialog ref={micDialog} className="ev-meet-dialog" onCancel={e=>{e.preventDefault();closeDialog(micDialog.current,false)}}>
      <h3>Usar o microfone</h3>
      <p>O reconhecimento de voz é feito pelo navegador. No Chrome, o áudio vai para o Google para virar texto. O chat funciona sempre, sem enviar áudio.</p>
      <div className="ev-meet-dialog-actions"><button className="ev-pill-button outline" onClick={()=>closeDialog(micDialog.current,false)}>Usar só o chat</button><button className="ev-pill-button lime" onClick={()=>closeDialog(micDialog.current,true)}>Abrir o microfone</button></div>
    </dialog>
    <dialog ref={capDialog} className="ev-meet-dialog" onCancel={e=>{e.preventDefault();closeDialog(capDialog.current,false)}}>
      <h3>{CAPTURE_POLICY.title}</h3>
      <ul>{CAPTURE_POLICY.points.map(p=><li key={p}>{p}</li>)}</ul>
      <fieldset className="ev-meet-capture-options"><legend>O que você aceita</legend>
        <label><input type="checkbox" checked={capPhotos} onChange={e=>setCapPhotos(e.target.checked)}/> Fotos (início de cada resposta e a cada 10 s)</label>
        <label><input type="checkbox" checked={capRecording} onChange={e=>setCapRecording(e.target.checked)}/> Gravação da entrevista (câmera e voz)</label>
      </fieldset>
      <p className="ev-meet-dialog-note">Volume estimado: cerca de {estimateMegabytesPerHour(capPhotos,capRecording)} MB por hora.</p>
      <label className="ev-meet-consent"><input type="checkbox" checked={capChecked} onChange={e=>setCapChecked(e.target.checked)}/> Li e aceito a captação da entrevista ({CAPTURE_POLICY.version}).</label>
      <div className="ev-meet-dialog-actions"><button className="ev-pill-button outline" onClick={()=>closeDialog(capDialog.current,false)}>Continuar sem captação</button><button className="ev-pill-button lime" disabled={!capChecked||(!capPhotos&&!capRecording)} onClick={()=>closeDialog(capDialog.current,true)}>Aceitar</button></div>
    </dialog>
  </div>;
  return typeof document==='undefined'?null:createPortal(node,document.body);
}

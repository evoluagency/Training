'use client';
// Reunião virtual com o avatar do EVOLU Intelligence (estilo videochamada), com a identidade do Training.
// Aula: o participante tira dúvida com o avatar. Entrevista: o avatar do proprietário entrevista o capacitador
// e a saída é sempre um rascunho (DRAFT).
//
// Tudo o que é mídia fica no navegador: voz do avatar (síntese do navegador), reconhecimento de voz do navegador
// (com aviso), câmera só local e gravação da entrevista só neste computador, com aceite explícito.
// O participante nunca é gravado. A lógica do avatar roda no Intelligence, via /api/intelligence/*.
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {Mic,MicOff,Video,VideoOff,Captions,MessageSquare,SkipForward,PhoneOff,Circle,Square,Download,Send,X} from 'lucide-react';
import {IllustratedAvatar,type AvatarHandle} from './avatar';
import {ERROR_TEXT,ROUTE_BADGE,interviewBadge,splitSentences,formatClock,coverageLabel,type MeetingMode} from './meeting-text';
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
const MIC_ACK_KEY='evolu-intelligence-mic-ack';

export function IntelligenceMeeting({mode,contextTitle,onLeave}:{mode:MeetingMode;contextTitle?:string;onLeave?:()=>void}){
  const lesson=mode==='lesson';
  const [phase,setPhase]=useState<'lobby'|'call'>('lobby');
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
  const [panel,setPanel]=useState(true);
  const [tab,setTab]=useState<'chat'|'info'>('chat');
  const [input,setInput]=useState('');
  const [joining,setJoining]=useState(false);
  const [lobbyMic,setLobbyMic]=useState(false);
  const [voiceOn,setVoiceOn]=useState(true);
  const [rate,setRate]=useState(1.05);
  const [lobbyNotice,setLobbyNotice]=useState('');
  const [hasSynth,setHasSynth]=useState(true);
  const [hasRecognition,setHasRecognition]=useState(true);

  const avatarRef=useRef<AvatarHandle>(null);
  const meVideo=useRef<HTMLVideoElement>(null),lobbyVideo=useRef<HTMLVideoElement>(null);
  const micDialog=useRef<HTMLDialogElement>(null),recDialog=useRef<HTMLDialogElement>(null);
  const logEnd=useRef<HTMLLIElement>(null);
  const live=useRef({busy:false,speaking:false,micOpen:false,inCall:false,speakToken:0,seq:0,voiceOn:true,rate:1.05,
    recognizer:null as SpeechRecognitionLike|null,cam:null as MediaStream|null,rec:null as MediaStream|null,
    recorder:null as MediaRecorder|null,chunks:[] as Blob[],recStart:0,voice:null as SpeechSynthesisVoice|null,
    dialogResolve:null as ((ok:boolean)=>void)|null,send:(_t:string)=>{void _t},resume:()=>{}});

  useEffect(()=>{live.current.voiceOn=voiceOn;live.current.rate=rate},[voiceOn,rate]);
  useEffect(()=>{logEnd.current?.scrollIntoView({block:'nearest'})},[log]);

  // Recursos do navegador (só depois de montar: evita divergência com a renderização do servidor).
  useEffect(()=>{
    const synth=typeof window!=='undefined'&&'speechSynthesis' in window?window.speechSynthesis:null;
    const pick=()=>{if(!synth)return;const v=synth.getVoices();live.current.voice=v.find(x=>x.lang==='pt-BR'&&/google|luciana|francisca|natural/i.test(x.name))??v.find(x=>x.lang==='pt-BR')??v.find(x=>x.lang?.startsWith('pt'))??null};
    pick();synth?.addEventListener?.('voiceschanged',pick);
    const t=setTimeout(()=>{setHasSynth(Boolean(synth));if(!synth)setVoiceOn(false);setHasRecognition(Boolean(recognitionCtor()));if(window.matchMedia('(max-width: 760px)').matches)setPanel(false)},0);
    return()=>{clearTimeout(t);synth?.removeEventListener?.('voiceschanged',pick)};
  },[]);

  const addLog=useCallback((who:string,text:string,me=false)=>{setLog(l=>[...l,{id:++live.current.seq,who,text,me}])},[]);

  // ---------- câmera ----------
  const attachCam=useCallback(()=>{for(const v of [meVideo.current,lobbyVideo.current])if(v)v.srcObject=live.current.cam;setCamOn(Boolean(live.current.cam))},[]);
  const setCam=useCallback(async(on:boolean)=>{
    const s=live.current;
    if(!on){
      if(s.recorder){addLog('Sistema','Pare a gravação antes de desligar a câmera.');return}
      s.cam?.getTracks().forEach(t=>t.stop());s.cam=null;
    }else if(!s.cam){
      try{s.cam=await navigator.mediaDevices.getUserMedia({video:true})}catch{setLobbyNotice('Não consegui abrir a câmera. A reunião segue sem vídeo.');addLog('Sistema','Não consegui abrir a câmera. A reunião segue sem vídeo.')}
    }
    attachCam();
  },[addLog,attachCam]);
  useEffect(()=>{attachCam()},[phase,attachCam]);

  // ---------- diálogos de aceite ----------
  const confirmDialog=useCallback((dlg:HTMLDialogElement|null)=>new Promise<boolean>(resolve=>{
    if(!dlg||typeof dlg.showModal!=='function'){resolve(window.confirm(dlg?.querySelector('p')?.textContent||'Confirmar?'));return}
    live.current.dialogResolve=resolve;dlg.showModal();
  }),[]);
  const closeDialog=(dlg:HTMLDialogElement|null,ok:boolean)=>{dlg?.close();const r=live.current.dialogResolve;live.current.dialogResolve=null;r?.(ok)};

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
      const said=(finalText+interim).trim();setUserTalking(Boolean(said));if(said)setCaption({who:'Você',text:said,upTo:said.length,badge:null})};
    r.onerror=ev=>{if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){addLog('Sistema','Microfone bloqueado pelo navegador. Use o chat.');s.micOpen=false;setMicOpenState(false)}};
    r.onend=()=>{s.recognizer=null;setListening(false);setUserTalking(false);const said=finalText.trim();if(said)s.send(said);else setTimeout(()=>s.resume(),250)};
    setListening(true);
    try{r.start()}catch{s.recognizer=null;setListening(false)}
  },[addLog]);
  useEffect(()=>{live.current.resume=resumeListening},[resumeListening]);

  // ---------- falar ----------
  const setSpeaking=useCallback((v:boolean)=>{live.current.speaking=v;setSpeech({speaking:v});if(v)pauseListening();else live.current.resume()},[pauseListening]);
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
        if(pos!==last){setCaption({who,text,upTo:pos,badge});if(/\s/.test(text[pos]??''))avatarRef.current?.word();last=pos}
        if(pos>=text.length){done();return resolve()}requestAnimationFrame(tick)};
      tick();
    });
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
        u.onboundary=ev=>{if(token===s.speakToken){avatarRef.current?.word();setCaption({who,text,upTo:base+(ev.charIndex??0),badge})}};
        u.onend=()=>{if(token===s.speakToken)setCaption({who,text,upTo:offset,badge});next()};
        u.onerror=()=>{if(began)next()};
        synth.speak(u);
        // Navegador sem voz utilizável: segue com legenda e boca no ritmo estimado.
        setTimeout(()=>{if(!began&&token===s.speakToken){synth.cancel();timed(base).then(resolve)}},2500);
      };
      next();
    });
  },[setSpeaking]);
  const stopSpeaking=useCallback(()=>{const s=live.current;s.speakToken+=1;if('speechSynthesis' in window)window.speechSynthesis.cancel();if(s.speaking)setSpeaking(false)},[setSpeaking]);

  const setMic=useCallback(async(on:boolean)=>{
    const s=live.current;
    if(on&&!recognitionCtor()){addLog('Sistema','Este navegador não tem reconhecimento de voz. Use o chat.');return}
    if(on){
      let accepted=false;try{accepted=localStorage.getItem(MIC_ACK_KEY)==='1'}catch{/* sem armazenamento */}
      if(!accepted){accepted=await confirmDialog(micDialog.current);if(!accepted)return;try{localStorage.setItem(MIC_ACK_KEY,'1')}catch{/* sem armazenamento */}}
    }
    s.micOpen=on;setMicOpenState(on);
    if(on){stopSpeaking();live.current.resume()}else pauseListening();
  },[addLog,confirmDialog,pauseListening,stopSpeaking]);

  // ---------- gravação da entrevista (só neste computador) ----------
  const download=(blob:Blob,name:string)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
  const stopRecording=useCallback(()=>{
    const s=live.current;if(!s.recorder)return;
    s.recorder.stop();s.rec?.getAudioTracks().forEach(t=>t.stop());s.recorder=null;setRecording(false);
  },[]);
  const toggleRecording=useCallback(async()=>{
    const s=live.current;
    if(lesson)return; // o participante nunca é gravado
    if(s.recorder){stopRecording();return}
    if(typeof MediaRecorder==='undefined'||!navigator.mediaDevices?.getUserMedia){addLog('Sistema','Este navegador não grava. A entrevista segue sem gravação.');return}
    if(!(await confirmDialog(recDialog.current)))return;
    try{s.rec=await navigator.mediaDevices.getUserMedia({video:true,audio:true})}catch{addLog('Sistema','Não consegui acesso à câmera e ao microfone para gravar.');return}
    s.cam?.getTracks().forEach(t=>t.stop());s.cam=new MediaStream(s.rec.getVideoTracks());attachCam();
    s.chunks=[];
    const type=['video/webm;codecs=vp9,opus','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported?.(t))??'';
    const recorder=new MediaRecorder(s.rec,type?{mimeType:type}:undefined);
    recorder.ondataavailable=e=>{if(e.data.size)s.chunks.push(e.data)};
    recorder.onstop=()=>{const blob=new Blob(s.chunks,{type:s.chunks[0]?.type||'video/webm'});s.chunks=[];if(!blob.size)return;
      download(blob,`entrevista-${new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')}.${blob.type.includes('mp4')?'mp4':'webm'}`);
      addLog('Sistema','Gravação salva neste computador (pasta de downloads). Nada foi enviado ao servidor.')};
    recorder.start(1000);s.recorder=recorder;s.recStart=Date.now();setRecElapsed(0);setRecording(true);
    addLog('Sistema','Gravação iniciada. O arquivo fica só neste computador.');
  },[addLog,attachCam,confirmDialog,lesson,stopRecording]);

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
    stopSpeaking();s.busy=true;setThinking(true);pauseListening();
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
    setJoining(true);setLobbyNotice('');setLog([]);setSources([]);setDraft(null);setCaption(null);
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
    try{
      if(lesson&&app?.lesson?.run_status==='LIVE')await api('lesson/end',{});
      if(!lesson&&app?.interview?.status==='OPEN'){const r=await api('interview/finish',{});if(r.draft)setDraft(r.draft)}
    }catch{/* Intelligence fora: sai assim mesmo */}
    s.inCall=false;setCaption(null);setPhase('lobby');setElapsed(0);
    onLeave?.();
  };
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
  const avatarState=thinking?'pensando':speech.speaking?'falando':listening?'ouvindo você':'pronto';
  const title=lesson?(l?.title||'Aula com o avatar'):'Entrevista do capacitador';
  const cov=interview?.coverage??{covered:0,total:13};

  return <section className="ev-meet" aria-label={lesson?'Aula com o avatar':'Entrevista com o avatar'}>
    {phase==='lobby'&&<div className="ev-meet-lobby">
      <div className="ev-meet-lobby-preview">
        <video ref={lobbyVideo} autoPlay muted playsInline hidden={!camOn}/>
        {!camOn&&<div className="ev-meet-lobby-off"><VideoOff size={22}/><span>Câmera desligada</span></div>}
        <span className="ev-meet-chip">{lesson?'Só você vê esta imagem':'Só você vê esta imagem até gravar'}</span>
      </div>
      <div className="ev-meet-lobby-body">
        <span className="ev-eyebrow">{lesson?'SALA DA AULA / INTELLIGENCE':'ENTREVISTA / INTELLIGENCE'}</span>
        <h2>{lesson?'Aula com o avatar do proprietário':'Entrevista do capacitador'}</h2>
        <p>{lesson
          ?'O avatar apresenta a aula piloto e responde às suas dúvidas por voz ou pelo chat. É uma versão digital feita com IA, com respostas baseadas no material da aula.'
          :'O avatar do proprietário conduz uma conversa profissional para montar o avatar do capacitador. Tudo o que sair daqui vira um rascunho (DRAFT) revisado antes de qualquer uso.'}</p>
        {contextTitle&&<p className="ev-meet-context">Aula aberta no Training: <strong>{contextTitle}</strong>. O avatar usa a aula piloto do Intelligence.</p>}
        <div className="ev-meet-options">
          <label><input type="checkbox" checked={camOn} onChange={e=>void setCam(e.target.checked)}/> Ligar a minha câmera</label>
          <label><input type="checkbox" checked={lobbyMic} disabled={!hasRecognition} onChange={e=>setLobbyMic(e.target.checked)}/> Entrar com o microfone aberto</label>
          <label><input type="checkbox" checked={voiceOn} disabled={!hasSynth} onChange={e=>setVoiceOn(e.target.checked)}/> Voz do avatar</label>
          <label className="ev-meet-rate">Velocidade da voz <input type="range" min="0.8" max="1.4" step="0.05" value={rate} onChange={e=>setRate(Number(e.target.value))} aria-valuetext={rate.toFixed(2)+'x'}/></label>
        </div>
        <ul className="ev-meet-notes">
          <li>{lesson?'A câmera aparece só para você. Nenhuma imagem vai ao servidor e o participante nunca é gravado.':'A câmera aparece só para você. Gravar é opcional, pede o seu aceite e o arquivo fica só neste computador.'}</li>
          <li>{hasRecognition?'Microfone: reconhecimento de voz do navegador. No Chrome, o áudio vai para o Google. O chat funciona sempre.':'Este navegador não tem reconhecimento de voz. Use o chat.'}</li>
        </ul>
        {lobbyNotice&&<div className="ev-alert error" role="alert">{lobbyNotice}</div>}
        {draft&&<div className="ev-alert" role="status">Entrevista encerrada. O rascunho (DRAFT) está pronto.<button className="ev-button outline" onClick={downloadDraft}><Download size={15}/> Baixar rascunho</button></div>}
        <div className="ev-meet-lobby-actions">
          <button className="ev-button lime" onClick={join} disabled={joining}>{joining?'Entrando…':lesson?'Entrar na aula':'Iniciar entrevista'}</button>
          {onLeave&&<button className="ev-button outline" onClick={()=>{void setCam(false);onLeave()}}>Voltar à aula</button>}
        </div>
      </div>
    </div>}

    {phase==='call'&&<div className="ev-meet-call">
      <header className="ev-meet-top">
        <div className="ev-meet-title"><span className="ev-meet-live">{lesson?(l?.run_status==='LIVE'?'AO VIVO':'ENCERRADA'):(interview?.status==='OPEN'?'EM ANDAMENTO':'ENCERRADA')}</span><strong>{title}</strong></div>
        <div className="ev-meet-meta">
          {recording&&<span className="ev-meet-rec" role="status"><Circle size={9} fill="currentColor"/> Gravando {formatClock(recElapsed)}</span>}
          <span className="ev-meet-clock" aria-label="Tempo de reunião">{formatClock(elapsed)}</span>
        </div>
      </header>
      <div className={'ev-meet-body'+(panel?' with-panel':'')}>
        <div className="ev-meet-stage">
          <button type="button" className={'ev-meet-tile avatar'+(speech.speaking?' speaking':'')+(thinking?' thinking':'')} onClick={()=>{if(speech.speaking)stopSpeaking()}} aria-label={speech.speaking?'Interromper a fala do avatar':avatarLabel}>
            <IllustratedAvatar ref={avatarRef} speaking={speech.speaking} label={avatarLabel}/>
            <span className="ev-meet-name">{avatarLabel}<small>{avatarState}</small></span>
          </button>
          <div className={'ev-meet-tile me'+(userTalking?' speaking':'')}>
            <video ref={meVideo} autoPlay muted playsInline hidden={!camOn}/>
            {!camOn&&<span className="ev-meet-initial" aria-hidden="true">{lesson?'P':'C'}</span>}
            <span className="ev-meet-name">{lesson?'Você':'Você (capacitador)'}{!micOpen&&<MicOff size={12} aria-label="microfone fechado"/>}{listening&&<small>ouvindo</small>}</span>
          </div>
          {ccOn&&caption&&caption.text&&<div className="ev-meet-caption" aria-live="polite">
            <span className="who">{caption.who}{caption.badge&&<em>{caption.badge}</em>}</span>
            <span><span>{caption.text.slice(0,caption.upTo)}</span><span className="pending">{caption.text.slice(caption.upTo)}</span></span>
          </div>}
        </div>
        {panel&&<aside className="ev-meet-panel">
          <div className="ev-meet-tabs" role="tablist">
            <button role="tab" aria-selected={tab==='chat'} onClick={()=>setTab('chat')}>Chat</button>
            <button role="tab" aria-selected={tab==='info'} onClick={()=>setTab('info')}>{lesson?'Roteiro da aula':'Roteiro da entrevista'}</button>
            <button className="ev-meet-close" onClick={()=>setPanel(false)} aria-label="Fechar painel"><X size={16}/></button>
          </div>
          {tab==='chat'&&<div className="ev-meet-chat">
            <ol className="ev-meet-log" aria-live="polite">{log.map(m=><li key={m.id} className={m.me?'me':m.who==='Sistema'?'system':''}><span className="who">{m.who}</span>{m.text}</li>)}<li ref={logEnd} aria-hidden="true" className="end"/></ol>
            {sources.length>0&&<div className="ev-meet-sources">Fontes da aula: {sources.map(s=><span className="ev-pill" key={s.id}>{s.title}</span>)}</div>}
            <form className="ev-meet-input" onSubmit={submit}>
              <input value={input} onChange={e=>setInput(e.target.value)} maxLength={1200} placeholder={lesson?'Escreva a sua dúvida':'Escreva a sua resposta'} aria-label={lesson?'Sua dúvida':'Sua resposta'} disabled={thinking}/>
              <button className="ev-button lime" type="submit" disabled={thinking||!input.trim()} aria-label="Enviar"><Send size={15}/></button>
            </form>
          </div>}
          {tab==='info'&&<div className="ev-meet-info">
            {lesson?<ol className="ev-meet-segments">{l?.segments?.map((s:R)=><li key={s.id} className={cur&&s.id===cur.id?'current':cur&&s.order<cur.order?'done':''}><span>{s.order}</span>{s.title}</li>)}</ol>
              :<div className="ev-meet-coverage"><p>{coverageLabel(interview?.status)}</p><progress value={cov.covered} max={cov.total||1}/><strong>{cov.covered} de {cov.total} pontos</strong>
                <p>Os pontos cobrem trajetória, método, personalidade, limites e materiais. Assuntos pessoais, contatos e dados sensíveis não são registrados.</p>
                {draft&&<button className="ev-button outline" onClick={downloadDraft}><Download size={15}/> Baixar rascunho (DRAFT)</button>}</div>}
            <dl className="ev-meet-facts">
              <div><dt>Perfil</dt><dd>{app?.avatar?.profile?`${app.avatar.profile.id} · ${app.avatar.profile.activation}`:'-'}</dd></div>
              <div><dt>Modelo</dt><dd>{app?.model?.label||'-'}</dd></div>
              <div><dt>Custo</dt><dd>{usage?`US$ ${Number(usage.cost_usd).toFixed(4)} de US$ ${usage.budget_usd}`:'zero (sem modelo real)'}</dd></div>
            </dl>
          </div>}
        </aside>}
      </div>
      <div className="ev-meet-controls" role="toolbar" aria-label="Controles da reunião">
        <button className="ev-meet-ctl" aria-pressed={micOpen} onClick={()=>void setMic(!micOpen)} disabled={!hasRecognition} title={hasRecognition?'Microfone':'Sem reconhecimento de voz neste navegador'}>{micOpen?<Mic size={18}/>:<MicOff size={18}/>}<span>{micOpen?'Fechar microfone':'Abrir microfone'}</span></button>
        <button className="ev-meet-ctl" aria-pressed={camOn} onClick={()=>void setCam(!camOn)}>{camOn?<Video size={18}/>:<VideoOff size={18}/>}<span>Câmera</span></button>
        <button className="ev-meet-ctl" aria-pressed={ccOn} onClick={()=>setCcOn(v=>!v)}><Captions size={18}/><span>Legendas</span></button>
        {!lesson&&<button className="ev-meet-ctl rec" aria-pressed={recording} onClick={()=>run(toggleRecording)}>{recording?<Square size={16}/>:<Circle size={16}/>}<span>{recording?'Parar gravação':'Gravar'}</span></button>}
        <button className="ev-meet-ctl" aria-pressed={panel} onClick={()=>setPanel(v=>!v)}><MessageSquare size={18}/><span>Chat e roteiro</span></button>
        <button className="ev-meet-ctl advance" onClick={()=>run(lesson?stepLesson:finishInterview)} disabled={stepDisabled}><SkipForward size={18}/><span>{stepLabel}</span></button>
        <button className="ev-meet-ctl leave" onClick={()=>run(leave)}><PhoneOff size={18}/><span>Sair</span></button>
      </div>
    </div>}

    <dialog ref={micDialog} className="ev-meet-dialog" onCancel={e=>{e.preventDefault();closeDialog(micDialog.current,false)}}>
      <h3>Usar o microfone</h3>
      <p>O reconhecimento de voz é feito pelo navegador. No Chrome, o áudio vai para o Google para virar texto. O chat funciona sempre, sem enviar áudio.</p>
      <div className="ev-meet-dialog-actions"><button className="ev-button outline" onClick={()=>closeDialog(micDialog.current,false)}>Usar só o chat</button><button className="ev-button lime" onClick={()=>closeDialog(micDialog.current,true)}>Abrir o microfone</button></div>
    </dialog>
    <dialog ref={recDialog} className="ev-meet-dialog" onCancel={e=>{e.preventDefault();closeDialog(recDialog.current,false)}}>
      <h3>Gravar a entrevista</h3>
      <p>A gravação inclui a sua câmera e a sua voz e fica salva só neste computador. Nada é enviado ao servidor. O indicador Gravando fica visível o tempo todo. Usar imagem ou voz para criar um avatar depende do termo de consentimento, assinado à parte.</p>
      <div className="ev-meet-dialog-actions"><button className="ev-button outline" onClick={()=>closeDialog(recDialog.current,false)}>Não gravar</button><button className="ev-button lime" onClick={()=>closeDialog(recDialog.current,true)}>Aceito gravar</button></div>
    </dialog>
  </section>;
}

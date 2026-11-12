// Modo "Gravação de voz para o avatar" (proposta de voz, seção 2): termo voz-rascunho-0.1, teste de sala de 5 s
// e frase a frase do roteiro-voz-0.1. Áudio PCM pelo AudioWorklet, sem eco, ruído ou ganho automático,
// gravado como WAV PCM 16 bits mono. O servidor relê o cabeçalho e confere a frase.

export const VOICE_LIMITS={minMs:300,maxMs:40_000,bytes:4*1024*1024,clipDbfs:-1,quietDbfs:-20,roomToneMs:5_000,roomMaxDbfs:-50} as const;

export type VoiceConsent={id:string;policyVersion:string;voice:boolean;acceptedAt:number};
export type VoiceProgress={script:string;total:number;recorded:number;speechMs:number;roomTones:number;lines:{id:string;takes:number;durationMs:number}[]};
export type VoiceUpload={consent:string;session:string;moment:'script_line'|'room_tone';script:string;line?:string;wav:Blob};
export type VoiceUploadResult={id:string;durationMs:number;sampleRate:number;size:number};

/** Chamadas do modo de voz. A tela recebe esta interface para a prévia local usar dados fictícios. */
export interface VoiceApi{
  consent():Promise<VoiceConsent|null>;
  accept(policyVersion:string):Promise<VoiceConsent>;
  revoke(id:string):Promise<void>;
  progress(script:string):Promise<VoiceProgress>;
  upload(u:VoiceUpload):Promise<VoiceUploadResult>;
}

const base='/api/training/';
async function readJson(res:Response){const j=await res.json().catch(()=>({}));if(!res.ok)throw Object.assign(new Error(j.error||'Falha na gravação de voz.'),{status:res.status});return j}
export function voiceUploadQuery(u:Omit<VoiceUpload,'wav'>):string{
  const q:Record<string,string>={consent:u.consent,session:u.session,kind:'voice',moment:u.moment,script:u.script};if(u.moment==='script_line'&&u.line)q.line=u.line;
  return new URLSearchParams(q).toString();
}
export const httpVoiceApi:VoiceApi={
  async consent(){return (await readJson(await fetch(base+'capture-consent?mode=voice',{cache:'no-store'}))).consent??null},
  async accept(policyVersion){return readJson(await fetch(base+'capture-consent',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'voice',policyVersion,voice:true})}))},
  async revoke(id){await readJson(await fetch(base+'capture-consent/'+encodeURIComponent(id)+'/revoke',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:'{}'}))},
  async progress(script){return readJson(await fetch(base+'capture-voice-progress?script='+encodeURIComponent(script),{cache:'no-store'}))},
  async upload(u){return readJson(await fetch(base+'capture-upload?'+voiceUploadQuery(u),{method:'POST',cache:'no-store',headers:{'Content-Type':'audio/wav'},body:u.wav}))},
};

export function newVoiceSession(now=Date.now()):string{
  const rand=typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID().slice(0,8):Math.random().toString(16).slice(2,10);
  return 'voz-'+new Date(now).toISOString().slice(0,19).replace(/[:T]/g,'-')+'-'+rand;
}

/** Junta os blocos do worklet num WAV PCM 16 bits mono (cabeçalho de 44 bytes). */
export function encodeWav(chunks:Float32Array[],sampleRate:number):Uint8Array{
  const frames=chunks.reduce((n,c)=>n+c.length,0),data=frames*2,out=new Uint8Array(44+data),v=new DataView(out.buffer);
  const tag=(o:number,t:string)=>{for(let i=0;i<4;i++)out[o+i]=t.charCodeAt(i)};
  tag(0,'RIFF');v.setUint32(4,36+data,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);tag(36,'data');v.setUint32(40,data,true);
  let o=44;for(const c of chunks)for(let i=0;i<c.length;i++){const s=Math.max(-1,Math.min(1,c[i]));v.setInt16(o,s<0?Math.round(s*0x8000):Math.round(s*0x7fff),true);o+=2}
  return out;
}

export const dbfs=(x:number)=>x>0?20*Math.log10(x):-120;
export type TakeLevels={durationMs:number;peakDbfs:number;rmsDbfs:number};
export function measure(chunks:Float32Array[],sampleRate:number):TakeLevels{
  let n=0,peak=0,sum=0;for(const c of chunks)for(let i=0;i<c.length;i++){const a=Math.abs(c[i]);if(a>peak)peak=a;sum+=c[i]*c[i];n++}
  return {durationMs:Math.round(n/sampleRate*1000),peakDbfs:dbfs(peak),rmsDbfs:n?dbfs(Math.sqrt(sum/n)):-120};
}
/** Controles antes de aceitar a frase. Silêncio no começo e no fim fica (o corte é feito no preparo do treino). */
export function takeIssue(l:TakeLevels):string|null{
  if(l.durationMs<VOICE_LIMITS.minMs)return 'Muito curta. Grave a frase inteira.';
  if(l.durationMs>VOICE_LIMITS.maxMs)return 'Passou de 40 segundos. Regrave só a frase.';
  if(l.peakDbfs>VOICE_LIMITS.clipDbfs)return 'Muito alto, o áudio cortou. Afaste um pouco o microfone e regrave.';
  if(l.peakDbfs<VOICE_LIMITS.quietDbfs)return 'Muito baixo. Chegue mais perto do microfone e regrave.';
  return null;
}
export function roomToneIssue(l:TakeLevels):string|null{
  return l.rmsDbfs>VOICE_LIMITS.roomMaxDbfs?`O ambiente está com ruído (${Math.round(l.rmsDbfs)} dBFS, o limite é ${VOICE_LIMITS.roomMaxDbfs}). Procure um lugar mais silencioso.`:null;
}
export function formatSpeech(ms:number):string{const min=Math.floor(ms/60000);return min<1?Math.round(ms/1000)+' s de fala':min+' min de fala'}
export function nextPending(ids:string[],done:Set<string>,from=0):number{for(let i=from;i<ids.length;i++)if(!done.has(ids[i]))return i;for(let i=0;i<from;i++)if(!done.has(ids[i]))return i;return -1}

/** Microfone sem processamento e worklet PCM. Um gravador por sala, reaproveitado entre frases. */
export class VoiceRecorder{
  private ctx:AudioContext|null=null;private stream:MediaStream|null=null;private node:AudioWorkletNode|null=null;
  private chunks:Float32Array[]=[];private taking=false;
  constructor(private onLevel:(peakDbfs:number)=>void=()=>{}){}
  get sampleRate(){return this.ctx?.sampleRate??0}
  async open(){
    if(this.ctx)return;
    this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1,sampleRate:48000},video:false});
    const rate=this.stream.getAudioTracks()[0]?.getSettings().sampleRate;
    this.ctx=new AudioContext(rate?{sampleRate:rate}:{sampleRate:48000});
    await this.ctx.audioWorklet.addModule('/intelligence/pcm-capture-worklet.js');
    const src=this.ctx.createMediaStreamSource(this.stream);
    this.node=new AudioWorkletNode(this.ctx,'evolu-pcm-capture',{numberOfInputs:1,numberOfOutputs:1,channelCount:1,channelCountMode:'explicit',channelInterpretation:'speakers'});
    this.node.port.onmessage=e=>{if(!(e.data instanceof Float32Array))return;let p=0;for(let i=0;i<e.data.length;i++){const a=Math.abs(e.data[i]);if(a>p)p=a}this.onLevel(dbfs(p));if(this.taking)this.chunks.push(e.data)};
    const mute=this.ctx.createGain();mute.gain.value=0;src.connect(this.node);this.node.connect(mute);mute.connect(this.ctx.destination);
    if(this.ctx.state==='suspended')await this.ctx.resume();
  }
  begin(){this.chunks=[];this.taking=true}
  async end():Promise<{chunks:Float32Array[];sampleRate:number}>{
    const node=this.node;
    if(node)await new Promise<void>(r=>{const t=setTimeout(r,300);const prev=node.port.onmessage;node.port.onmessage=e=>{if(e.data==='flushed'){clearTimeout(t);node.port.onmessage=prev;r()}else prev?.call(node.port,e)};node.port.postMessage('flush')});
    this.taking=false;return {chunks:this.chunks,sampleRate:this.sampleRate};
  }
  close(){this.taking=false;this.node?.port.postMessage('stop');this.node?.disconnect();this.stream?.getTracks().forEach(t=>t.stop());void this.ctx?.close();this.ctx=null;this.stream=null;this.node=null}
}

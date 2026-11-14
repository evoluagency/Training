// Detector de atividade de voz por energia, com histerese. O núcleo é puro (testável). A ligação ao microfone fica em startMicVad.
import type {LiveEvent} from './events.ts';

export type VadConfig={
 /** Nível (dBFS, negativo) acima do ruído de fundo para considerar voz. */
 marginDb:number;
 /** Piso mínimo absoluto, abaixo disso nunca é voz. */
 floorDb:number;
 /** Voz precisa durar isso para começar (evita estalo e tosse curta). */
 startMs:number;
 /** Silêncio precisa durar isso para terminar. */
 endMs:number;
 /** Com o avatar falando, exige mais energia (o eco da própria voz não pode cortá-lo). */
 avatarExtraDb:number;
};
export const VAD_CONFIG:VadConfig={marginDb:12,floorDb:-55,startMs:200,endMs:300,avatarExtraDb:10};

export type VadState={noiseDb:number,speaking:boolean,aboveSince:number|null,belowSince:number|null};
export const initialVad:VadState={noiseDb:-70,speaking:false,aboveSince:null,belowSince:null};

/** Converte amostras PCM (-1..1) em dBFS RMS. */
export function rmsDb(samples:ArrayLike<number>):number{
 let sum=0;const n=samples.length;if(!n)return -120;
 for(let i=0;i<n;i++){const v=samples[i];sum+=v*v}
 return Math.max(-120,20*Math.log10(Math.sqrt(sum/n)||1e-6));
}

/** Um quadro de ~20 a 50 ms. Devolve o novo estado e, se houve, o evento de voz. */
export function stepVad(s:VadState,levelDb:number,at:number,avatarSpeaking:boolean,cfg:VadConfig=VAD_CONFIG):{state:VadState,event:LiveEvent|null}{
 const gate=Math.max(cfg.floorDb,s.noiseDb+cfg.marginDb+(avatarSpeaking?cfg.avatarExtraDb:0));
 const loud=levelDb>=gate;
 // O ruído de fundo só se atualiza quando não há voz: sobe devagar, desce rápido.
 let noiseDb=s.noiseDb;
 if(!loud&&!s.speaking)noiseDb=levelDb<noiseDb?levelDb:noiseDb+(levelDb-noiseDb)*0.05;
 if(loud){
  const aboveSince=s.aboveSince??at;
  if(!s.speaking&&at-aboveSince>=cfg.startMs)return {state:{noiseDb,speaking:true,aboveSince,belowSince:null},event:{type:'voz.inicio',at:aboveSince}};
  return {state:{noiseDb,speaking:s.speaking,aboveSince,belowSince:null},event:null};
 }
 const belowSince=s.belowSince??at;
 if(s.speaking&&at-belowSince>=cfg.endMs)return {state:{noiseDb,speaking:false,aboveSince:null,belowSince:null},event:{type:'voz.fim',at:belowSince}};
 return {state:{noiseDb,speaking:s.speaking,aboveSince:s.speaking?s.aboveSince:null,belowSince:s.speaking?belowSince:null},event:null};
}

export type MicVad={stop():void,setAvatarSpeaking(v:boolean):void};

/** Liga o detector a um microfone. Usa cancelamento de eco do navegador. Só roda no navegador. */
export async function startMicVad(onEvent:(e:LiveEvent)=>void,opts:{stream?:MediaStream,cfg?:VadConfig}={}):Promise<MicVad>{
 const own=!opts.stream;
 const stream=opts.stream??await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
 const Ctx=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
 if(!Ctx)throw new Error('Sem AudioContext');
 const ctx=new Ctx(),src=ctx.createMediaStreamSource(stream),an=ctx.createAnalyser();an.fftSize=1024;src.connect(an);
 const buf=new Float32Array(an.fftSize);let st=initialVad,avatar=false,alive=true;
 const tick=()=>{
  if(!alive)return;
  an.getFloatTimeDomainData(buf);
  const r=stepVad(st,rmsDb(buf),performance.now(),avatar,opts.cfg);st=r.state;if(r.event)onEvent(r.event);
 };
 const id=setInterval(tick,30);
 return {
  setAvatarSpeaking(v){avatar=v},
  stop(){alive=false;clearInterval(id);try{src.disconnect()}catch{/* já solto */}void ctx.close().catch(()=>{});if(own)stream.getTracks().forEach(t=>t.stop())},
 };
}

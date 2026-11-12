// Captação do avatar (sessão A, rosto): cliente da API, quantização das expressões e da rotação da cabeça,
// corte em trechos de 60 s no formato trilha-0.1 e detecção de imagem preta. Sem DOM aqui, para testar no Node.
import {TRACK_LIMITS,TRACK_SCHEMA,TRACK_VERSION,gzipTrack,type MotionTrack,type TrackName} from '../../lib/intelligence/motion-track.ts';

export type MotionConsent={id:string;policyVersion:string;camera:boolean;motion:boolean;acceptedAt:number};
export type MotionSession={id:string;consent:string;stage:string;script:string;startedAt:number;endedAt:number|null};
export type CameraInfo={session:string;cameraId:string;role:'close'|'medium'|'wide'|'reference';source:'browser'|'device_file';deviceLabel?:string;width?:number;height?:number;fps?:number;
  location?:'owner_disk'|'owner_drive';fileName?:string;sha256?:string;bytes?:number;durationMs?:number;codec?:string;syncOffsetMs?:number};
export type TrackProgress={chunks:number;coveredMs:number;lastT0Ms:number};
export type SessionProgress={session:string;stage:string;script:string;steps:number;startedAt:number;endedAt:number|null;reextractions:number;
  cameras:{cameraId:string;role:string;source:string;tracks:Partial<Record<TrackName,TrackProgress>>}[]};
export interface MotionApi{
  consent():Promise<MotionConsent|null>;
  accept(policyVersion:string):Promise<MotionConsent>;
  revoke(id:string):Promise<void>;
  createSession(consent:string,script:string):Promise<MotionSession>;
  endSession(id:string):Promise<void>;
  camera(info:CameraInfo):Promise<void>;
  uploadTrack(consent:string,track:MotionTrack):Promise<{id:string;frames:number;size:number}>;
  progress(session:string):Promise<SessionProgress>;
}

// Escalas declaradas na trilha: expressões 0 a 255, ângulos em centésimos de grau.
export const FACE_SCALE={expression:255,angle:100} as const;
export const MOTION_EXTRACT={chunkMs:TRACK_LIMITS.chunkMs,minFrameGapMs:30} as const;
export const MARK_EVENTS={start:1,end:2,repeat:3,skip:4,clap:5} as const;

export function quantizeExpression(score:number):number{return Math.max(0,Math.min(255,Math.round((Number.isFinite(score)?score:0)*FACE_SCALE.expression)))}
export function quantizeAngle(deg:number):number{return Math.round((Number.isFinite(deg)?deg:0)*FACE_SCALE.angle)}

/** Rotação da cabeça (graus) a partir da matriz 4x4 do MediaPipe (coluna a coluna). yaw = virar, pitch = acenar, roll = inclinar. */
export function headAngles(m:ArrayLike<number>):{yaw:number;pitch:number;roll:number}{
  const r=(row:number,col:number)=>m[col*4+row];
  const deg=180/Math.PI;
  const yaw=Math.asin(Math.max(-1,Math.min(1,-r(2,0))))*deg;
  const pitch=Math.atan2(r(2,1),r(2,2))*deg;
  const roll=Math.atan2(r(1,0),r(0,0))*deg;
  return {yaw,pitch,roll};
}

/** Imagem preta ou congelada: média e variação de brilho muito baixas numa amostra RGBA reduzida. */
export function frameIsBlack(rgba:ArrayLike<number>):boolean{
  let sum=0,sq=0,n=0;
  for(let i=0;i+2<rgba.length;i+=4){const y=0.2126*rgba[i]+0.7152*rgba[i+1]+0.0722*rgba[i+2];sum+=y;sq+=y*y;n++}
  if(!n)return true;const mean=sum/n,variance=sq/n-mean*mean;
  return mean<12&&variance<20;
}

export type TrackHeader={session:string;camera:string;extractor:MotionTrack['extractor'];source:Record<string,unknown>};

/** Junta quadros com tempo da sessão (ms) e entrega trechos fechados de 60 s. */
export class TrackChunker{
  private t0=0;private frames:number[][]=[];
  constructor(private track:TrackName,private header:TrackHeader,private columns:string[],private scale:Record<string,number>,private chunkMs:number=MOTION_EXTRACT.chunkMs){}
  /** Devolve o trecho anterior quando o quadro novo cai no trecho seguinte. */
  push(sessionMs:number,values:number[]):MotionTrack|null{
    if(values.length!==this.columns.length-1)throw new Error('Quadro com número de valores diferente das colunas.');
    const t=Math.max(0,Math.round(sessionMs));const start=Math.floor(t/this.chunkMs)*this.chunkMs;
    let done:MotionTrack|null=null;
    if(start!==this.t0){done=this.flush(true);this.t0=start}
    const last=this.frames.at(-1);if(last&&t-this.t0<last[0])return done;
    this.frames.push([t-this.t0,...values]);
    return done;
  }
  /** Fecha o trecho atual (fim da sessão ou troca de trecho). Sem quadros, nada a enviar. */
  flush(full=false):MotionTrack|null{
    if(!this.frames.length)return null;
    const frames=this.frames;this.frames=[];
    const durationMs=full?this.chunkMs:Math.max(1,Math.min(this.chunkMs,frames.at(-1)![0]+1));
    return {schema:TRACK_SCHEMA,version:TRACK_VERSION,track:this.track,session:this.header.session,camera:this.header.camera,t0Ms:this.t0,durationMs,
      extractor:this.header.extractor,source:this.header.source,columns:this.columns,scale:this.scale,frames};
  }
}

export function faceColumns(names:string[]):string[]{return ['t',...names,'yaw','pitch','roll']}
export function faceScale(names:string[]):Record<string,number>{return Object.fromEntries([...names.map(n=>[n,FACE_SCALE.expression]),['yaw',FACE_SCALE.angle],['pitch',FACE_SCALE.angle],['roll',FACE_SCALE.angle]])}
export function faceValues(scores:number[],matrix:ArrayLike<number>|null):number[]{
  const a=matrix?headAngles(matrix):{yaw:0,pitch:0,roll:0};
  return [...scores.map(quantizeExpression),quantizeAngle(a.yaw),quantizeAngle(a.pitch),quantizeAngle(a.roll)];
}
export const MARK_COLUMNS=['t','step','event'];

export function newCameraId(role:CameraInfo['role'],n=1):string{return ({close:'close',medium:'medium',wide:'wide',reference:'ref'} as const)[role]+(n>1?'_'+n:'')}
export function formatClock(ms:number):string{const s=Math.max(0,Math.floor(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}

async function req<T>(path:string,init?:RequestInit):Promise<T>{
  const r=await fetch('/api/training/'+path,{credentials:'same-origin',...init});
  const body=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error((body as {error?:string}).error||'Falha na captação.');
  return body as T;
}
const post=<T,>(path:string,data:unknown)=>req<T>(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});

export const httpMotionApi:MotionApi={
  async consent(){return (await req<{consent:MotionConsent|null}>('capture-consent?mode=motion')).consent},
  accept:(policyVersion)=>post<MotionConsent>('capture-consent',{mode:'motion',policyVersion,camera:true,motion:true}),
  async revoke(id){await post('capture-consent/'+encodeURIComponent(id)+'/revoke',{})},
  createSession:(consent,script)=>post<MotionSession>('capture-session',{consent,script}),
  async endSession(id){await post('capture-session/'+encodeURIComponent(id)+'/end',{})},
  async camera(info){await post('capture-camera',info)},
  async uploadTrack(consent,track){
    const gz=await gzipTrack(track);if(gz.byteLength>TRACK_LIMITS.gzipBytes)throw new Error('Trecho acima de 4 MB.');
    const q=new URLSearchParams({consent,session:track.session,kind:'track',moment:'track_chunk',camera:track.camera,track:track.track,t0:String(track.t0Ms)});
    return req('capture-upload?'+q,{method:'POST',headers:{'content-type':'application/gzip'},body:new Blob([gz.slice().buffer],{type:'application/gzip'})});
  },
  progress:(session)=>req<SessionProgress>('capture-session-progress?session='+encodeURIComponent(session)),
};

/** Envia trechos em série, tenta de novo uma vez e guarda o que falhar para baixar depois. */
export class TrackUploader{
  private queue:Promise<void>=Promise.resolve();readonly failed:MotionTrack[]=[];sent=0;
  constructor(private api:MotionApi,private consent:string,private onChange:()=>void=()=>{}){}
  add(track:MotionTrack|null){if(!track)return;this.queue=this.queue.then(async()=>{
    try{await this.api.uploadTrack(this.consent,track)}catch{try{await this.api.uploadTrack(this.consent,track)}catch{this.failed.push(track);this.onChange();return}}
    this.sent++;this.onChange()})}
  idle(){return this.queue}
}

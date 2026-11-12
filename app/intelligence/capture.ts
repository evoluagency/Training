// Captação da entrevista (D22, D23, D25, D29): aceite registrado no servidor, fotos JPEG no início de cada
// resposta e a cada 10 s, e gravação (câmera + voz) enviada em trechos ao bucket privado intelligence-capture
// pela /api/training. Nada fica com o capacitador. Se um envio falhar, o trecho fica guardado na memória da
// página para baixar no fim (cópia de segurança), sem tentar de novo para sempre.

export type CaptureMode='lesson'|'interview';
export type CaptureConsent={id:string;mode:CaptureMode;policyVersion:string;camera:boolean;photos:boolean;recording:boolean;acceptedAt:number};
export type CaptureKind='photo'|'recording';
export type CaptureMoment='answer_start'|'expression'|'interval'|'session';

/** Limites iguais aos do servidor (lib/training/service.ts CAPTURE_LIMITS). O de gravação respeita os 4,5 MB da Vercel. */
export const CAPTURE_CLIENT={photoBytes:1024*1024,segmentBytes:4*1024*1024,photoEveryMs:10_000,segmentMs:60_000,
  videoBitsPerSecond:250_000,audioBitsPerSecond:32_000,photoWidth:480,photoQuality:0.72} as const;

const base='/api/training/';
async function call(path:string,init?:RequestInit):Promise<Response>{return fetch(base+path,{cache:'no-store',...init})}
async function readJson(res:Response){const j=await res.json().catch(()=>({}));if(!res.ok)throw Object.assign(new Error(j.error||'Falha na captação.'),{status:res.status});return j}

export async function currentConsent(mode:CaptureMode):Promise<CaptureConsent|null>{
  return (await readJson(await call('capture-consent?mode='+mode))).consent??null;
}
export async function acceptConsent(input:Omit<CaptureConsent,'id'|'acceptedAt'>):Promise<CaptureConsent>{
  return readJson(await call('capture-consent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}));
}
export async function revokeConsent(id:string):Promise<void>{
  await readJson(await call('capture-consent/'+encodeURIComponent(id)+'/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}));
}

export function uploadQuery(p:{consent:string;session:string;kind:CaptureKind;moment:CaptureMoment}):string{
  return new URLSearchParams({consent:p.consent,session:p.session,kind:p.kind,moment:p.moment}).toString();
}
/** Tipo enviado ao servidor sem parâmetros de codec (o servidor aceita image/jpeg, video/webm e video/mp4). */
export function plainMime(type:string,kind:CaptureKind):string{
  const t=(type||'').split(';')[0].trim().toLowerCase();
  if(kind==='photo')return 'image/jpeg';
  return t==='video/mp4'?'video/mp4':'video/webm';
}
export function sizeAllowed(bytes:number,kind:CaptureKind):boolean{
  return bytes>0&&bytes<=(kind==='photo'?CAPTURE_CLIENT.photoBytes:CAPTURE_CLIENT.segmentBytes);
}
export function newCaptureSession(now=Date.now()):string{
  const rand=typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID().slice(0,8):Math.random().toString(16).slice(2,10);
  return 'entrevista-'+new Date(now).toISOString().slice(0,19).replace(/[:T]/g,'-')+'-'+rand;
}
/** Estimativa de volume para mostrar ao proprietário: fotos (~30 KB) e trechos no bitrate configurado. */
export function estimateMegabytesPerHour(photos:boolean,recording:boolean):number{
  const photo=photos?(3600_000/CAPTURE_CLIENT.photoEveryMs)*30/1024:0;
  const video=recording?(CAPTURE_CLIENT.videoBitsPerSecond+CAPTURE_CLIENT.audioBitsPerSecond)*3600/8/1024/1024:0;
  return Math.round(photo+video);
}

export type CaptureStats={photos:number;segments:number;failed:number;bytes:number};
type Pending={blob:Blob;kind:CaptureKind;moment:CaptureMoment};

/** Fila de envio em série: uma requisição por vez, uma nova tentativa, depois guarda para baixar. */
export class CaptureUploader{
  stats:CaptureStats={photos:0,segments:0,failed:0,bytes:0};
  failedItems:Pending[]=[];
  private queue:Pending[]=[];private running=false;
  constructor(private consent:CaptureConsent,readonly session:string,private onChange:(s:CaptureStats,error?:string)=>void,private fetcher:typeof fetch=(...a)=>fetch(...a)){}
  enqueue(blob:Blob,kind:CaptureKind,moment:CaptureMoment){
    if(kind==='photo'&&!this.consent.photos)return;
    if(kind==='recording'&&!this.consent.recording)return;
    if(!sizeAllowed(blob.size,kind)){this.fail({blob,kind,moment},kind==='photo'?'Foto acima de 1 MB.':'Trecho de gravação acima de 4 MB.');return}
    this.queue.push({blob,kind,moment});void this.drain();
  }
  get consentId(){return this.consent.id}
  get idle(){return !this.running&&this.queue.length===0}
  async flush(timeoutMs=20_000){const t0=Date.now();while(!this.idle&&Date.now()-t0<timeoutMs)await new Promise(r=>setTimeout(r,100))}
  private fail(item:Pending,error:string){this.failedItems.push(item);this.stats={...this.stats,failed:this.stats.failed+1};this.onChange(this.stats,error)}
  private async send(item:Pending):Promise<Response>{
    const mime=plainMime(item.blob.type,item.kind);
    return this.fetcher(base+'capture-upload?'+uploadQuery({consent:this.consent.id,session:this.session,kind:item.kind,moment:item.moment}),
      {method:'POST',headers:{'Content-Type':mime},body:item.blob,cache:'no-store'});
  }
  private async drain(){
    if(this.running)return;this.running=true;
    try{
      while(this.queue.length){
        const item=this.queue.shift()!;let res:Response|null=null,error='';
        for(let attempt=0;attempt<2&&!res?.ok;attempt++){
          try{res=await this.send(item);if(!res.ok){error=(await res.json().catch(()=>({}))).error||'Envio recusado.';if(res.status>=400&&res.status<500&&res.status!==429)break}}
          catch{error='Sem conexão com o servidor.'}
        }
        if(res?.ok){this.stats={...this.stats,photos:this.stats.photos+(item.kind==='photo'?1:0),segments:this.stats.segments+(item.kind==='recording'?1:0),bytes:this.stats.bytes+item.blob.size};this.onChange(this.stats)}
        else this.fail(item,error);
      }
    }finally{this.running=false}
  }
}

/** Quadro da câmera em JPEG, reduzido para a largura configurada. */
export async function snapshotJpeg(video:HTMLVideoElement|null):Promise<Blob|null>{
  if(!video||!video.videoWidth||!video.videoHeight)return null;
  const w=Math.min(CAPTURE_CLIENT.photoWidth,video.videoWidth),h=Math.round(video.videoHeight*w/video.videoWidth);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');if(!ctx)return null;ctx.drawImage(video,0,0,w,h);
  return new Promise(resolve=>canvas.toBlob(b=>resolve(b),'image/jpeg',CAPTURE_CLIENT.photoQuality));
}

export function recorderMime():string{
  if(typeof MediaRecorder==='undefined')return '';
  return ['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported?.(t))??'';
}

/**
 * Gravação em trechos independentes: para e reinicia o MediaRecorder a cada segmentMs, assim cada arquivo
 * abre sozinho e fica abaixo do limite de envio. onSegment recebe cada trecho pronto.
 */
export class SegmentRecorder{
  private recorder:MediaRecorder|null=null;private timer:ReturnType<typeof setTimeout>|null=null;private stopping=false;
  segments=0;
  constructor(private stream:MediaStream,private onSegment:(b:Blob)=>void,private segmentMs:number=CAPTURE_CLIENT.segmentMs){}
  get active(){return Boolean(this.recorder)}
  start(){this.stopping=false;this.next()}
  private next(){
    const type=recorderMime();
    const r=new MediaRecorder(this.stream,{...(type?{mimeType:type}:{}),videoBitsPerSecond:CAPTURE_CLIENT.videoBitsPerSecond,audioBitsPerSecond:CAPTURE_CLIENT.audioBitsPerSecond});
    const chunks:Blob[]=[];
    r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    r.onstop=()=>{const blob=new Blob(chunks,{type:chunks[0]?.type||type||'video/webm'});if(blob.size){this.segments+=1;this.onSegment(blob)}if(!this.stopping)this.next();else this.recorder=null};
    r.start(1000);this.recorder=r;
    this.timer=setTimeout(()=>{if(r.state!=='inactive')r.stop()},this.segmentMs);
  }
  stop(){this.stopping=true;if(this.timer)clearTimeout(this.timer);this.timer=null;const r=this.recorder;if(r&&r.state!=='inactive')r.stop();else this.recorder=null}
}

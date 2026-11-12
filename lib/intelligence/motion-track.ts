// Trilha extraída (trilha-0.1): JSON compactado com gzip, um trecho de até 60 s (o banco aceita até 120 s).
// Conferida no servidor (training-api) antes de gravar: gzip real, tamanho descompactado limitado, esquema e tempos dentro do trecho.
export const TRACK_SCHEMA='evolu.motion-track';
export const TRACK_VERSION='0.1';
export const TRACKS=['face','pose','hands','marks'] as const;
export type TrackName=typeof TRACKS[number];
export const TRACK_LIMITS={gzipBytes:4*1024*1024,jsonBytes:32*1024*1024,chunkMs:60000,maxDurationMs:120000,maxColumns:256,maxFps:240,valueAbs:2147483647} as const;

export type MotionTrack={schema:string,version:string,track:TrackName,session:string,camera:string,t0Ms:number,durationMs:number,
 extractor:{lib:string,version:string,model:string,modelSha256:string}|null,source:Record<string,unknown>,columns:string[],scale:Record<string,number>,frames:number[][]};
export type TrackExpect={track:TrackName,session:string,camera:string,t0Ms:number};

export class TrackError extends Error{}
function fail(m:string):never{throw new TrackError(m)}
const isInt=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v);
const short=(v:unknown,max=80)=>typeof v==='string'&&v.length>=1&&v.length<=max;

export function isGzip(bytes:Uint8Array){return bytes.byteLength>=18&&bytes[0]===0x1f&&bytes[1]===0x8b&&bytes[2]===8}

// Descompacta com limite: interrompe assim que passar de maxBytes (protege contra arquivo que infla demais).
export async function gunzipLimited(bytes:Uint8Array,maxBytes:number=TRACK_LIMITS.jsonBytes):Promise<Uint8Array>{
 if(!isGzip(bytes))fail('A trilha não é um arquivo gzip.');
 const stream=new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
 const reader=stream.getReader(),parts:Uint8Array[]=[];let total=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>maxBytes){await reader.cancel();fail('Trilha descompactada grande demais.')}parts.push(value)}}
 catch(e){if(e instanceof TrackError)throw e;fail('Arquivo gzip corrompido.')}
 const out=new Uint8Array(total);let at=0;for(const p of parts){out.set(p,at);at+=p.byteLength}return out;
}

export function validateTrack(value:unknown,expect:TrackExpect):MotionTrack{
 if(!value||typeof value!=='object'||Array.isArray(value))fail('Trilha inválida.');
 const t=value as Record<string,unknown>;
 if(t.schema!==TRACK_SCHEMA||t.version!==TRACK_VERSION)fail('Esquema da trilha desconhecido. Use '+TRACK_SCHEMA+' '+TRACK_VERSION+'.');
 if(t.track!==expect.track)fail('Tipo de trilha diferente do envio.');
 if(t.session!==expect.session)fail('Sessão da trilha diferente do envio.');
 if(t.camera!==expect.camera)fail('Câmera da trilha diferente do envio.');
 if(!isInt(t.t0Ms)||t.t0Ms!==expect.t0Ms)fail('Início do trecho diferente do envio.');
 const durationMs=t.durationMs as number;if(!isInt(durationMs)||durationMs<1||durationMs>TRACK_LIMITS.maxDurationMs)fail('Duração do trecho fora de 1 ms a 120 s.');
 let extractor:MotionTrack['extractor']=null;
 if(expect.track!=='marks'||t.extractor!=null){
  const e=t.extractor as Record<string,unknown>|null;
  if(!e||typeof e!=='object'||!short(e.lib)||!short(e.version,40)||!short(e.model,120)||typeof e.modelSha256!=='string'||!/^[0-9a-f]{64}$/.test(e.modelSha256))fail('Extrator da trilha incompleto (biblioteca, versão, modelo e SHA-256 do modelo).');
  extractor={lib:e!.lib as string,version:e!.version as string,model:e!.model as string,modelSha256:e!.modelSha256 as string};
 }
 const source=t.source;if(!source||typeof source!=='object'||Array.isArray(source)||JSON.stringify(source).length>2000)fail('Origem da trilha inválida.');
 const columns=t.columns;
 if(!Array.isArray(columns)||columns.length<1||columns.length>TRACK_LIMITS.maxColumns||columns[0]!=='t'||!columns.every(c=>typeof c==='string'&&/^[A-Za-z0-9_.:-]{1,48}$/.test(c))||new Set(columns).size!==columns.length)fail('Colunas da trilha inválidas. A primeira coluna é t (ms desde o início do trecho).');
 const cols=columns as string[];
 const scale=t.scale??{};if(typeof scale!=='object'||Array.isArray(scale))fail('Escala da trilha inválida.');
 for(const [k,v] of Object.entries(scale as Record<string,unknown>))if(!cols.includes(k)||typeof v!=='number'||!(v>0)||!Number.isFinite(v))fail('Escala da coluna '+k+' inválida.');
 const frames=t.frames;
 const maxFrames=Math.ceil(durationMs/1000*TRACK_LIMITS.maxFps)+1;
 if(!Array.isArray(frames)||frames.length>maxFrames)fail('Quadros da trilha ausentes ou acima de 240 por segundo.');
 let last=-1;
 for(const f of frames as unknown[]){
  if(!Array.isArray(f)||f.length!==cols.length)fail('Quadro com número de valores diferente das colunas.');
  const row=f as unknown[];
  for(const v of row)if(!isInt(v)||Math.abs(v)>TRACK_LIMITS.valueAbs)fail('A trilha só aceita inteiros na escala declarada.');
  const at=row[0] as number;if(at<0||at>durationMs)fail('Quadro fora do trecho.');if(at<last)fail('Quadros fora de ordem.');last=at;
 }
 return {schema:TRACK_SCHEMA,version:TRACK_VERSION,track:expect.track,session:expect.session,camera:expect.camera,t0Ms:expect.t0Ms,durationMs,extractor,source:source as Record<string,unknown>,columns:cols,scale:scale as Record<string,number>,frames:frames as number[][]};
}

export async function readTrack(bytes:Uint8Array,expect:TrackExpect):Promise<MotionTrack>{
 const raw=await gunzipLimited(bytes);let parsed:unknown;
 try{parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw))}catch{fail('A trilha não é um JSON válido.')}
 return validateTrack(parsed,expect);
}

// Lado do navegador: compacta a trilha antes do envio.
export async function gzipTrack(track:MotionTrack):Promise<Uint8Array>{
 const stream=new Blob([JSON.stringify(track)]).stream().pipeThrough(new CompressionStream('gzip'));
 return new Uint8Array(await new Response(stream).arrayBuffer());
}

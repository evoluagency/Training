// Voz neural pt-BR no navegador (sem servidor, sem custo): Piper, voz pt_BR-faber-medium, sobre onnxruntime-web.
// Fonemas pelo espeak-ng (piper-wasm). Medição 1.9: ~2,5 s para carregar, síntese 2,5 a 4 vezes mais rápida que o
// tempo real com 1 thread, transcrição automática sem erros nas frases de teste.
// Primeiro uso baixa ~95 MB (modelo 63 MB + espeak-ng 18 MB + wasm), guardados no cache do navegador.
// Licenças a revisar antes de vender: espeak-ng é GPL-3 e a voz faber foi ajustada a partir da voz lessac.

export const PIPER_ASSETS={
  // Revisão fixada do repositório rhasspy/piper-voices e SHA-256 do modelo conferido no download.
  model:'https://huggingface.co/rhasspy/piper-voices/resolve/ae9d8352b73c1b1750748843e753a504b00e05b0/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx',
  modelSha256:'858555e3a064209c57088fe6bd70c4c3dc54d03eaa00c45d5ecaf43a33f95aa7',
  config:'https://huggingface.co/rhasspy/piper-voices/resolve/ae9d8352b73c1b1750748843e753a504b00e05b0/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx.json',
  phonemize:'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize',
  ortWasm:'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',
} as const;
export const PIPER_DOWNLOAD_MB=95;

export type PiperConfig={audio:{sample_rate:number};espeak:{voice:string};inference:{noise_scale:number;length_scale:number;noise_w:number};phoneme_id_map:Record<string,number[]>};

/** Fonemas (IPA, um símbolo por item) para os ids do modelo, no formato do Piper: ^ _ f _ f _ ... $ */
export function phonemesToIds(phonemes:string[],map:Record<string,number[]>):number[]{
  const pad=map._??[0],ids=[...(map['^']??[1]),...pad];
  for(const p of phonemes){const id=map[p];if(id)ids.push(...id,...pad)}
  ids.push(...(map.$??[2]));
  return ids;
}
/** Frases curtas para começar a tocar cedo e não estourar o limite do modelo. */
export function chunkForSpeech(text:string,max=220):string[]{
  const sentences=text.replace(/\s+/g,' ').trim().match(/[^.!?…]+[.!?…]*/g)??[];
  const out:string[]=[];
  for(const s of sentences.map(x=>x.trim()).filter(Boolean)){
    if(s.length<=max){out.push(s);continue}
    let piece='';
    for(const part of s.split(/(?<=[,;:])\s+|\s+/)){if((piece+' '+part).trim().length>max&&piece){out.push(piece.trim());piece=part}else piece=(piece+' '+part).trim()}
    if(piece)out.push(piece);
  }
  return out;
}
export async function sha256Hex(buf:ArrayBuffer):Promise<string>{
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buf))).map(b=>b.toString(16).padStart(2,'0')).join('');
}

type OrtModule=typeof import('onnxruntime-web');
type PhonemizeModule={callMain(args:string[]):void};
type CreatePhonemize=(opts:{print:(d:string)=>void;printErr:(m:string)=>void;locateFile:(u:string)=>string})=>Promise<PhonemizeModule>;

async function cachedFetch(url:string,onBytes?:(n:number)=>void):Promise<ArrayBuffer>{
  let cache:Cache|null=null;
  try{cache=await caches.open('evolu-voz-neural');const hit=await cache.match(url);if(hit){const b=await hit.arrayBuffer();onBytes?.(b.byteLength);return b}}catch{/* sem cache */}
  const res=await fetch(url);if(!res.ok||!res.body)throw new Error('Download da voz falhou ('+res.status+').');
  const reader=res.body.getReader(),parts:Uint8Array[]=[];let n=0;
  for(;;){const {value,done}=await reader.read();if(done)break;parts.push(value);n+=value.byteLength;onBytes?.(n)}
  const buf=new Uint8Array(n);let o=0;for(const p of parts){buf.set(p,o);o+=p.byteLength}
  try{await cache?.put(url,new Response(buf.slice().buffer,{headers:{'Content-Type':res.headers.get('content-type')||'application/octet-stream'}}))}catch{/* cache cheio: segue sem */}
  return buf.buffer;
}
function loadScript(src:string):Promise<void>{
  return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=true;s.crossOrigin='anonymous';s.onload=()=>resolve();s.onerror=()=>reject(new Error('Não consegui carregar o fonemizador.'));document.head.append(s)});
}

export class PiperVoice{
  private constructor(private ort:OrtModule,private session:import('onnxruntime-web').InferenceSession,readonly config:PiperConfig,private createPhonemize:CreatePhonemize,private assets:typeof PIPER_ASSETS){}
  get sampleRate(){return this.config.audio.sample_rate}

  static async load(onProgress?:(mb:number)=>void,assets:typeof PIPER_ASSETS=PIPER_ASSETS):Promise<PiperVoice>{
    const ort=await import('onnxruntime-web/wasm') as unknown as OrtModule;
    ort.env.wasm.wasmPaths=assets.ortWasm;ort.env.wasm.numThreads=1;
    const w=window as unknown as {createPiperPhonemize?:CreatePhonemize};
    if(!w.createPiperPhonemize)await loadScript(assets.phonemize+'.js');
    if(!w.createPiperPhonemize)throw new Error('Fonemizador indisponível.');
    const config=JSON.parse(new TextDecoder().decode(await cachedFetch(assets.config))) as PiperConfig;
    const model=await cachedFetch(assets.model,n=>onProgress?.(Math.round(n/1048576)));
    if(await sha256Hex(model)!==assets.modelSha256){try{await (await caches.open('evolu-voz-neural')).delete(assets.model)}catch{/* sem cache */}throw new Error('Arquivo da voz diferente do esperado.')}
    const session=await ort.InferenceSession.create(new Uint8Array(model),{executionProviders:['wasm']});
    return new PiperVoice(ort,session,config,w.createPiperPhonemize,assets);
  }
  phonemes(text:string):Promise<string[]>{
    return new Promise((resolve,reject)=>{
      this.createPhonemize({print:d=>{try{resolve(JSON.parse(d).phonemes)}catch(e){reject(e)}},printErr:m=>reject(new Error(m)),
        locateFile:u=>u.endsWith('.wasm')?this.assets.phonemize+'.wasm':u.endsWith('.data')?this.assets.phonemize+'.data':u})
        .then(m=>m.callMain(['-l',this.config.espeak.voice,'--input',JSON.stringify([{text}]),'--espeak_data','/espeak-ng-data'])).catch(reject);
    });
  }
  async synthesize(text:string,rate=1):Promise<Float32Array>{
    const ids=phonemesToIds(await this.phonemes(text),this.config.phoneme_id_map);
    const {ort}=this,inf=this.config.inference;
    const out=await this.session.run({
      input:new ort.Tensor('int64',BigInt64Array.from(ids.map(BigInt)),[1,ids.length]),
      input_lengths:new ort.Tensor('int64',BigInt64Array.from([BigInt(ids.length)]),[1]),
      scales:new ort.Tensor('float32',Float32Array.from([inf.noise_scale,inf.length_scale/Math.max(.5,rate),inf.noise_w]),[3]),
    });
    return out.output.data as Float32Array;
  }
}

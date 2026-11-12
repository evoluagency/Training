// API fictícia da captação de movimento, só para a prévia local: guarda tudo na memória da página e confere cada
// trecho com o mesmo leitor do servidor (gzip, esquema trilha-0.1 e tempos). Nada sai do navegador.
import {gzipTrack,readTrack} from '../../../lib/intelligence/motion-track';
import {EXPRESSION_SCRIPT_IDS} from '../../../lib/intelligence/expression-script-ids';
import type {MotionApi,MotionConsent,MotionSession,CameraInfo,SessionProgress} from '../motion-capture';

export function fakeMotionApi():MotionApi&{tracks:{camera:string;track:string;t0Ms:number;durationMs:number;frames:number;size:number}[];cameras:CameraInfo[]}{
  let consent:MotionConsent|null=null;let session:MotionSession|null=null;
  const tracks:{camera:string;track:string;t0Ms:number;durationMs:number;frames:number;size:number}[]=[];const cameras:CameraInfo[]=[];
  return {tracks,cameras,
    async consent(){return consent},
    async accept(policyVersion){consent={id:'previa-'+Date.now(),policyVersion,camera:true,motion:true,acceptedAt:Date.now()};return consent},
    async revoke(){consent=null},
    async createSession(c,script){if(!EXPRESSION_SCRIPT_IDS[script])throw new Error('Roteiro desconhecido.');session={id:'mov-previa-'+Date.now(),consent:c,stage:'face',script,startedAt:Date.now(),endedAt:null};return session},
    async endSession(){if(session)session.endedAt=Date.now()},
    async camera(info){if(info.source==='device_file'&&!/^[0-9a-f]{64}$/.test(info.sha256||''))throw new Error('SHA-256 do arquivo inválido.');const i=cameras.findIndex(c=>c.cameraId===info.cameraId);if(i>=0)cameras[i]=info;else cameras.push(info)},
    async uploadTrack(_c,t){if(!cameras.some(c=>c.cameraId===t.camera))throw new Error('Câmera não registrada nesta sessão.');
      const gz=await gzipTrack(t);const v=await readTrack(gz,{track:t.track,session:t.session,camera:t.camera,t0Ms:t.t0Ms});
      tracks.push({camera:t.camera,track:t.track,t0Ms:t.t0Ms,durationMs:v.durationMs,frames:v.frames.length,size:gz.byteLength});return {id:'item-'+tracks.length,frames:v.frames.length,size:gz.byteLength}},
    async progress(id):Promise<SessionProgress>{
      return {session:id,stage:'face',script:session?.script??'',steps:EXPRESSION_SCRIPT_IDS[session?.script??'']?.length??0,startedAt:session?.startedAt??0,endedAt:session?.endedAt??null,reextractions:0,
        cameras:cameras.map(c=>({cameraId:c.cameraId,role:c.role,source:c.source,tracks:Object.fromEntries(['face','marks'].filter(k=>tracks.some(t=>t.camera===c.cameraId&&t.track===k)).map(k=>{const l=tracks.filter(t=>t.camera===c.cameraId&&t.track===k);return [k,{chunks:l.length,coveredMs:l.reduce((a,t)=>a+t.durationMs,0),lastT0Ms:Math.max(...l.map(t=>t.t0Ms))}]}))}))};
    },
  };
}

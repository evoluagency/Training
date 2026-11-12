// Extração ao vivo do rosto no navegador do proprietário (MediaPipe Face Landmarker): 52 expressões e a matriz da cabeça.
// Modelo e WASM vêm do próprio Training (public/intelligence/mediapipe). Nada vai para servidor de terceiros.
import {MEDIAPIPE} from '../../lib/intelligence/mediapipe-assets';
import type {MotionTrack} from '../../lib/intelligence/motion-track';

export type FaceFrame={names:string[];scores:number[];matrix:number[]|null};
export type FaceExtractor={extractor:NonNullable<MotionTrack['extractor']>;detect(video:HTMLVideoElement,nowMs:number):FaceFrame|null;close():void};

export async function createFaceExtractor():Promise<FaceExtractor>{
  const {FaceLandmarker,FilesetResolver}=await import('@mediapipe/tasks-vision');
  const files=await FilesetResolver.forVisionTasks(MEDIAPIPE.wasm.dir);
  const make=(delegate:'GPU'|'CPU')=>FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:MEDIAPIPE.face.path,delegate},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:true});
  let lm;try{lm=await make('GPU')}catch{lm=await make('CPU')}
  let last=-1;
  return {
    extractor:{lib:MEDIAPIPE.lib,version:MEDIAPIPE.version,model:MEDIAPIPE.face.file,modelSha256:MEDIAPIPE.face.sha256},
    detect(video,nowMs){
      if(video.readyState<2)return null;const ts=Math.max(last+1,Math.round(nowMs));last=ts;
      const r=lm.detectForVideo(video,ts);const b=r.faceBlendshapes?.[0];if(!b)return null;
      return {names:b.categories.map(c=>c.categoryName),scores:b.categories.map(c=>c.score),matrix:r.facialTransformationMatrixes?.[0]?.data??null};
    },
    close(){lm.close()},
  };
}

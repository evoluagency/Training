// Espelho ao vivo: converte as 52 expressões do MediaPipe e os ângulos da cabeça em poses do robô.
// Função pura e sem navegador. A suavização fica no laço de desenho do robô.
export type MirrorPose={
 /** 0..1 */jaw:number,smile:number,round:number,blink:number,browUp:number,browInner:number,
 /** -1..1, positivo = para a direita do robô */gazeX:number,gazeY:number,
 /** radianos */yaw:number,pitch:number,roll:number};
export const NEUTRAL_POSE:MirrorPose={jaw:0,smile:0,round:0,blink:0,browUp:0,browInner:0,gazeX:0,gazeY:0,yaw:0,pitch:0,roll:0};
export const MIRROR_LIMITS={headRad:0.5,gazeAmp:1.4} as const;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))||0; // `||0` evita -0
const rad=(d:number)=>d*Math.PI/180;

/**
 * @param mirror true = como num espelho: o robô vira para o mesmo lado da tela que a pessoa vê de si, ou seja, inverte giro, inclinação e olhar horizontal.
 */
export function mirrorPose(names:readonly string[],scores:readonly number[],angles:{yaw:number,pitch:number,roll:number}|null,mirror=true):MirrorPose{
 const idx=new Map<string,number>();names.forEach((n,i)=>idx.set(n,i));
 const g=(n:string)=>{const i=idx.get(n);const v=i==null?0:scores[i];return Number.isFinite(v)?clamp(v,0,1):0};
 const avg=(a:string,b:string)=>(g(a)+g(b))/2;
 const sx=mirror?-1:1;
 const gazeX=((g('eyeLookOutRight')+g('eyeLookInLeft'))-(g('eyeLookOutLeft')+g('eyeLookInRight')))/2;
 const gazeY=avg('eyeLookUpLeft','eyeLookUpRight')-avg('eyeLookDownLeft','eyeLookDownRight');
 const a=angles??{yaw:0,pitch:0,roll:0};
 const lim=MIRROR_LIMITS.headRad;
 return {
  jaw:g('jawOpen'),
  smile:avg('mouthSmileLeft','mouthSmileRight'),
  round:Math.max(g('mouthFunnel'),g('mouthPucker')),
  blink:avg('eyeBlinkLeft','eyeBlinkRight'),
  browUp:Math.max(g('browInnerUp'),avg('browOuterUpLeft','browOuterUpRight')),
  browInner:g('browInnerUp')-avg('browDownLeft','browDownRight'),
  gazeX:clamp(sx*gazeX*MIRROR_LIMITS.gazeAmp,-1,1),
  gazeY:clamp(gazeY*MIRROR_LIMITS.gazeAmp,-1,1),
  yaw:clamp(sx*rad(a.yaw),-lim,lim),
  pitch:clamp(rad(a.pitch),-lim,lim),
  roll:clamp(sx*rad(a.roll),-lim,lim),
 };
}

/** Pose velha demais (rosto sumiu ou câmera parou) volta ao comportamento normal do robô. */
export const MIRROR_STALE_MS=600;
export const mirrorFresh=(at:number|null,now:number)=>at!=null&&now-at<MIRROR_STALE_MS;

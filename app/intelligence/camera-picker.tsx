'use client';
// Escolha de câmera com prévia e aviso de imagem preta. Usado na captação do avatar e na sala da entrevista.
import {useCallback,useEffect,useRef,useState} from 'react';
import {AlertTriangle,Camera} from 'lucide-react';
import {frameIsBlack} from './motion-capture';

export type CameraChoice={deviceId:string;label:string;stream:MediaStream;width:number;height:number;fps:number};

export async function listCameras():Promise<MediaDeviceInfo[]>{
  if(!navigator.mediaDevices?.enumerateDevices)return [];
  return (await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');
}
export async function openCamera(deviceId:string,hd=true):Promise<MediaStream>{
  return navigator.mediaDevices.getUserMedia({audio:false,video:{...(deviceId?{deviceId:{exact:deviceId}}:{}),...(hd?{width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30}}:{})}});
}
/** Amostra o vídeo numa tela de 32x18 e diz se está preto. Sem quadro ainda, não conclui. */
export function videoLooksBlack(v:HTMLVideoElement,canvas:HTMLCanvasElement):boolean|null{
  if(v.readyState<2||!v.videoWidth)return null;
  canvas.width=32;canvas.height=18;const g=canvas.getContext('2d',{willReadFrequently:true});if(!g)return null;
  g.drawImage(v,0,0,32,18);return frameIsBlack(g.getImageData(0,0,32,18).data);
}

/** Vigia a prévia e liga o aviso depois de 2 s seguidos de imagem preta. */
export function useBlackWatch(video:React.RefObject<HTMLVideoElement|null>,active:boolean){
  const [black,setBlack]=useState(false);
  useEffect(()=>{if(!active)return;
    const canvas=document.createElement('canvas');let streak=0;
    const id=setInterval(()=>{const v=video.current;if(!v)return;const b=videoLooksBlack(v,canvas);if(b===null)return;streak=b?streak+1:0;setBlack(streak>=4)},500);
    return ()=>{clearInterval(id);setBlack(false)}},[video,active]);
  return active&&black;
}
export const BLACK_WARNING='A câmera está mandando imagem preta. Confira se a tampa ou o obturador está aberto, se outro programa está usando a câmera ou escolha outra na lista.';

/** keep: a câmera escolhida continua aberta ao sair (quem recebeu em onChange passa a fechar). */
export function CameraPicker({onChange,compact=false,keep=false}:{onChange:(c:CameraChoice|null)=>void;compact?:boolean;keep?:boolean}){
  const [devices,setDevices]=useState<MediaDeviceInfo[]>([]);
  const [selected,setSelected]=useState('');
  const [error,setError]=useState('');
  const video=useRef<HTMLVideoElement>(null);const stream=useRef<MediaStream|null>(null);
  const black=useBlackWatch(video,!!selected&&!error);
  const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null};
  const open=useCallback(async(id:string)=>{setError('');stop();
    try{const s=await openCamera(id);stream.current=s;if(video.current)video.current.srcObject=s;
      const t=s.getVideoTracks()[0],set=t?.getSettings()??{};const real=set.deviceId||id;
      const list=await listCameras();setDevices(list);setSelected(real);
      onChange({deviceId:real,label:t?.label||list.find(d=>d.deviceId===real)?.label||'Câmera',stream:s,width:set.width||0,height:set.height||0,fps:set.frameRate||0});
    }catch{setError('Não consegui abrir esta câmera. Confira a permissão do navegador ou escolha outra.');onChange(null)}},[onChange]);
  useEffect(()=>{const t=setTimeout(()=>void open(''),0);return ()=>{clearTimeout(t);if(!keep)stop()}},[open,keep]);
  return <div className={'ev-cam-picker'+(compact?' compact':'')}>
    <label><Camera size={15}/> Câmera{' '}
      <select value={selected} onChange={e=>void open(e.target.value)} disabled={!devices.length}>
        {devices.map((d,i)=><option key={d.deviceId||i} value={d.deviceId}>{d.label||'Câmera '+(i+1)}</option>)}
      </select></label>
    {!compact&&<video ref={video} autoPlay muted playsInline className="ev-cam-preview"/>}
    {compact&&<video ref={video} autoPlay muted playsInline hidden/>}
    {black&&<p className="ev-voice-warn" role="alert"><AlertTriangle size={16}/> {BLACK_WARNING}</p>}
    {error&&<p className="ev-voice-error" role="alert">{error}</p>}
  </div>;
}

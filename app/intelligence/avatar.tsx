'use client';
// Avatar ILUSTRADO e neutro (provisório). Foto ou vídeo do proprietário só com consentimento de imagem.
// A voz do navegador não expõe o áudio: a boca segue os limites de palavra informados pela voz
// somados a uma oscilação de sílabas enquanto há fala.
import {forwardRef,useEffect,useImperativeHandle,useRef} from 'react';

export type AvatarHandle={word:()=>void};

export const IllustratedAvatar=forwardRef<AvatarHandle,{speaking:boolean;label:string}>(function IllustratedAvatar({speaking,label},ref){
  const mouthOpen=useRef<SVGEllipseElement>(null),mouthLine=useRef<SVGPathElement>(null),eyes=useRef<SVGGElement>(null);
  const speakingRef=useRef(speaking),pulse=useRef(0);
  useEffect(()=>{speakingRef.current=speaking},[speaking]);
  useImperativeHandle(ref,()=>({word(){pulse.current=Math.min(1,pulse.current+.6)}}),[]);
  useEffect(()=>{
    let raf=0,open=0,blinkTimer:ReturnType<typeof setTimeout>|undefined;
    const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame=(t:number)=>{
      const s=speakingRef.current;
      const syllable=s?(reduced?.35:.35+.35*Math.abs(Math.sin(t/70))*(.6+.4*Math.sin(t/211))):0;
      pulse.current*=.86;
      const target=s?Math.min(1,syllable+pulse.current):0;
      open+=(target-open)*.45;
      mouthOpen.current?.setAttribute('ry',(1.5+open*11).toFixed(2));
      mouthOpen.current?.setAttribute('rx',(15-open*3).toFixed(2));
      if(mouthLine.current)mouthLine.current.style.opacity=open>.15?'0':'1';
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    const blink=()=>{
      const list=eyes.current?[...eyes.current.querySelectorAll('ellipse')]:[];
      if(!reduced){list.forEach(e=>e.setAttribute('ry','1'));setTimeout(()=>list.forEach(e=>e.setAttribute('ry','7')),120);}
      blinkTimer=setTimeout(blink,2600+Math.random()*2800);
    };
    blinkTimer=setTimeout(blink,1800);
    return()=>{cancelAnimationFrame(raf);clearTimeout(blinkTimer)};
  },[]);
  return <svg className="ev-meet-face" viewBox="0 0 240 260" role="img" aria-label={label}>
    <path d="M40 260 C44 205 80 188 120 188 C160 188 196 205 200 260 Z" className="av-shirt"/>
    <path d="M104 176 L104 196 C110 204 130 204 136 196 L136 176 Z" className="av-skin-shade"/>
    <ellipse cx="120" cy="118" rx="58" ry="68" className="av-skin"/>
    <path d="M62 112 C58 64 92 44 122 46 C156 48 184 68 178 114 C172 92 160 80 140 76 C118 72 96 78 82 88 C72 96 66 104 62 112 Z" className="av-hair"/>
    <ellipse cx="62" cy="122" rx="8" ry="13" className="av-skin-shade"/>
    <ellipse cx="178" cy="122" rx="8" ry="13" className="av-skin-shade"/>
    <path d="M84 100 Q96 94 108 99" className="av-line" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <path d="M132 99 Q144 94 156 100" className="av-line" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <g ref={eyes}><ellipse className="av-eye" cx="96" cy="116" rx="6.5" ry="7"/><ellipse className="av-eye" cx="144" cy="116" rx="6.5" ry="7"/></g>
    <path d="M118 124 Q114 142 120 146 Q124 147 126 145" className="av-nose" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <g transform="translate(120 162)">
      <ellipse ref={mouthOpen} className="av-mouth" cx="0" cy="0" rx="15" ry="1.5"/>
      <path ref={mouthLine} className="av-line" d="M-16 0 Q0 7 16 0" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
    </g>
  </svg>;
});

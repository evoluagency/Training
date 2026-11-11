'use client';
// Encaixe na tela de aula R04: a reunião com o avatar ocupa o lugar do player, no centro.
// O chat e o roteiro ficam na lateral da própria reunião. Fechar a reunião devolve o player.
import {useState,type ReactNode} from 'react';
import {Video} from 'lucide-react';
import {IntelligenceMeeting} from './meeting';

export function LessonMeetingSlot({lessonTitle,children}:{lessonTitle?:string;children:ReactNode}){
  const [open,setOpen]=useState(false);
  if(open)return <IntelligenceMeeting mode="lesson" contextTitle={lessonTitle} onLeave={()=>setOpen(false)}/>;
  return <>{children}<div className="ev-meet-entry">
    <div><strong>Dúvidas com o avatar do proprietário</strong><span>Reunião por voz ou chat com a versão digital (IA). O participante nunca é gravado.</span></div>
    <button className="ev-button lime" onClick={()=>setOpen(true)}><Video size={16}/> Entrar na sala</button>
  </div></>;
}

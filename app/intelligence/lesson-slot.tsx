'use client';
// Encaixe na tela de aula R04: o player continua no lugar e o botão abre a reunião em tela cheia.
import {useState,type ReactNode} from 'react';
import {Video} from 'lucide-react';
import {IntelligenceMeeting} from './meeting';
import type {MeetingMode} from './meeting-text';

export function LessonMeetingSlot({lessonTitle,children}:{lessonTitle?:string;children:ReactNode}){
  const [open,setOpen]=useState(false);
  return <>{children}<div className="ev-meet-entry">
    <div><strong>Dúvidas com o avatar do proprietário</strong><span>Sala por voz, vídeo ou chat com a versão digital (IA).</span></div>
    <button className="ev-button lime" onClick={()=>setOpen(true)}><Video size={16}/> Entrar na sala</button>
  </div>{open&&<IntelligenceMeeting mode="lesson" contextTitle={lessonTitle?'Aula aberta: '+lessonTitle:undefined} onClose={()=>setOpen(false)}/>}</>;
}

/** Entrada da entrevista no /admin: cartão que abre a sala em tela cheia. */
export function MeetingEntryCard({mode,title,description,action}:{mode:MeetingMode;title:string;description:string;action:string}){
  const [open,setOpen]=useState(false);
  return <><section className="ev-panel ev-meet-card"><div><h2>{title}</h2><p>{description}</p></div><button className="ev-button lime" onClick={()=>setOpen(true)}><Video size={16}/> {action}</button></section>
    {open&&<IntelligenceMeeting mode={mode} onClose={()=>setOpen(false)}/>}</>;
}

'use client';
// Casca estática da área do Training (classes ev-*) com dados fictícios, só para a prévia local.
import {BookOpen,LayoutDashboard,MessageSquare,Video,ArrowLeft,CheckCircle2,ArrowRight} from 'lucide-react';
import '../../portal.css';
import {LessonMeetingSlot,MeetingEntryCard} from '../lesson-slot';

const MODULES=[{title:'Fundamentos',lessons:['Problema antes da solução','Hipóteses que dá para testar']},{title:'Validação',lessons:['Entrevistas com clientes','Evidência e margem']}];

type NavItem={label:string;Icon:typeof BookOpen;active:boolean};
const LEARNER_NAV:NavItem[]=[{label:'Visão geral',Icon:LayoutDashboard,active:false},{label:'Treinamentos',Icon:BookOpen,active:true},{label:'Comentários',Icon:MessageSquare,active:false}];
const ADMIN_NAV:NavItem[]=[{label:'Visão geral',Icon:LayoutDashboard,active:false},{label:'Treinamentos',Icon:BookOpen,active:false},{label:'Entrevista do avatar',Icon:Video,active:true}];

export function PreviewShell({mode}:{mode:'lesson'|'interview'}){
  const lesson=mode==='lesson';
  return <div className="ev-shell">
    <aside className="ev-sidebar">
      <div className="ev-sidebar-head"><span className="ev-brand"><img src="/brand/evolu-white.png" alt="EVOLU"/><small>Training</small></span></div>
      <p className="ev-sidebar-kicker">{lesson?'ÁREA DE APRENDIZAGEM':'GESTÃO DA PLATAFORMA'}</p>
      <nav>{(lesson?LEARNER_NAV:ADMIN_NAV).map(({label,Icon,active})=><a key={label} className={'ev-nav-link '+(active?'active':'')} href={lesson?'?':'?modo=entrevista'}><Icon size={17}/><span>{label}</span></a>)}</nav>
    </aside>
    <div className="ev-body">
      <header className="ev-topbar"><div className="ev-topbar-search"><span>EVOLU Training / {lesson?'Aprendizagem':'Administração'} / prévia local com dados fictícios</span></div></header>
      <main className="ev-content">
        {lesson?<>
          <div className="ev-lesson-back"><a href="?"><ArrowLeft size={16}/> Voltar aos treinamentos</a></div>
          <div className="ev-lesson-grid">
            <section className="ev-lesson-sidebar"><div className="ev-course-cover"><h3>Empreender com método (fictício)</h3><progress value={1} max={4}/><small>25%</small></div>
              <p className="ev-eyebrow">MÓDULOS DO CURSO</p>{MODULES.map((m,i)=><div className="ev-mini-module" key={m.title}><strong>{i+1}. {m.title}</strong>{m.lessons.map((l,k)=><a key={l} className={i===0&&k===0?'active':''} href="?">{l}</a>)}</div>)}</section>
            <section className="ev-lesson-main"><span className="ev-eyebrow">Empreender com método / Fundamentos</span><h1>Problema antes da solução</h1><p>Aula fictícia da prévia local. O conteúdo real vem do curso aberto no Training.</p>
              <LessonMeetingSlot lessonTitle="Problema antes da solução"><div className="ev-media"><div className="ev-photo"><img src="/training-media/aula_concreto_1280x720.webp" alt="Imagem editorial da aula"/></div></div></LessonMeetingSlot>
              <h2>Sobre a aula</h2><p className="ev-lesson-text">Texto fictício da aula.</p>
              <div className="ev-lesson-actions"><button className="ev-button lime" disabled><CheckCircle2 size={17}/>Marcar aula concluída</button><a className="ev-button outline" href="?">Próxima aula <ArrowRight size={16}/></a></div></section>
            <aside className="ev-lesson-right"><section className="ev-panel"><h2>Conteúdo do curso</h2><progress value={1} max={4}/>{MODULES.map(m=><details key={m.title} open><summary>{m.title}</summary>{m.lessons.map(l=><a key={l} href="?">○ {l}</a>)}</details>)}</section><section className="ev-panel"><h2>Ferramentas da aula</h2><p>Nenhum material na prévia.</p></section></aside>
          </div></>
        :<><div className="ev-heading"><div><span className="ev-eyebrow">INTELLIGENCE / CAPACITADORES</span><h1>Entrevista do avatar</h1><p>O avatar do proprietário entrevista o capacitador para montar o avatar dele. A saída é sempre um rascunho (DRAFT), revisado antes de qualquer uso.</p></div></div><MeetingEntryCard mode="interview" title="Sala de entrevista" description="Abra a sala junto com o capacitador. A conversa fica no profissional, o rascunho sai ao final e fotos e gravação, com o aceite do capacitador, vão para a EVOLU." action="Abrir a sala"/></>}
      </main>
    </div>
  </div>;
}

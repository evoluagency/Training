'use client';

import Link from 'next/link';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Download, GraduationCap, MessageSquare, RefreshCw} from 'lucide-react';
import {readTrainingResponse} from '../lib/training/client-response';

type Attempt = {id:string; number:number; status:string; deadline:number; serverTime?:number; score:number|null; passed:number; answers:Record<string,number>; questions:{id:string;prompt:string;options:string[]}[]};
type Course = {id:string; title:string; duration:number; passing:number; attempt_limit:number; certificate:number; completed?:number; total?:number};
export type CourseDetail = {course:Course; lessons:{id:string}[]; progress?:{lesson_id:string}[]; attempts?:Attempt[]; survey?:{score:number|null;comment:string}|null; certificate?:{id:string}|null};
type Certificate = {id:string;course_id:string;name:string;company:string;title:string;hours:number;score:number;issued_at:number};
type Comment = {id:string;author:string;role:string;body:string;created_at:number};
export type Flow = 'avaliacao'|'pesquisa'|'certificado'|'comentarios';
const root = (id:string) => '/area/treinamentos/' + id;
const date = (value:number) => new Date(value).toLocaleDateString('pt-BR');
const message = (error:unknown) => error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';
async function api<T>(path:string, body?:unknown):Promise<T> {
  return readTrainingResponse<T>(await fetch('/api/training/'+path, {method:body===undefined?'GET':'POST', cache:'no-store', headers:body===undefined?undefined:{'Content-Type':'application/json'}, body:body===undefined?undefined:JSON.stringify(body)}));
}

function Failure({error}:{error:string}) { return error ? <p className="ev-alert error" role="alert">{error}</p> : null; }

export function CourseTabs({courseId,active}:{courseId:string;active?:Flow}) {
  return <nav className="ev-course-tabs" aria-label="Etapas do treinamento">{[
    ['', 'Aulas'], ['avaliacao','Avaliação'], ['pesquisa','Pesquisa'], ['certificado','Certificado'], ['comentarios','Comentários'],
  ].map(([path,label])=><Link key={path} className={path===(active||'')?'active':''} aria-current={path===(active||'')?'page':undefined} href={root(courseId)+(path?'/'+path:'')}>{label}</Link>)}</nav>;
}

export function LearningHub({kind,courses}:{kind:'avaliacoes'|'comentarios';courses:Course[]}) {
  const assessments=kind==='avaliacoes';
  return <><div className="ev-heading"><div><span className="ev-eyebrow">ÁREA DO PARTICIPANTE</span><h1>{assessments?'Avaliações':'Comentários e dúvidas'}</h1><p>{assessments?'Acesse a avaliação do treinamento e acompanhe suas tentativas.':'Selecione um treinamento para conversar com a equipe da EVOLU e sua empresa.'}</p></div></div>
    <div className="ev-flow-cards">{courses.map(c=><article className="ev-panel" key={c.id}>{assessments?<ClipboardCheck size={26}/>:<MessageSquare size={26}/>}<h2>{c.title}</h2>{assessments?<p>{c.completed||0}/{c.total||0} aulas concluídas · {Math.round(c.duration/60)} minutos de prova · aprovação a partir de {c.passing}%.</p>:<p>Conversa restrita aos participantes da sua empresa e à administração.</p>}<Link className="ev-button lime" href={root(c.id)+'/'+(assessments?'avaliacao':'comentarios')}>{assessments?'Abrir avaliação':'Abrir conversa'} <ArrowRight size={16}/></Link></article>)}</div>
    {!courses.length&&<section className="ev-panel"><h2>Nenhum treinamento liberado</h2><p>Os treinamentos autorizados para sua empresa aparecerão aqui.</p><Link className="ev-button outline" href="/area/treinamentos">Ir aos treinamentos</Link></section>}
  </>;
}

export function CourseFlow({kind,detail,refresh}:{kind:Flow;detail:CourseDetail;refresh:()=>Promise<void>}) {
  return <><div className="ev-lesson-back"><Link href={root(detail.course.id)}><ArrowLeft size={16}/> Voltar às aulas</Link></div><div className="ev-heading"><div><span className="ev-eyebrow">{detail.course.title}</span><h1>{{avaliacao:'Avaliação do treinamento',pesquisa:'Sua experiência',certificado:'Conclusão e certificado',comentarios:'Comentários e dúvidas'}[kind]}</h1></div></div><CourseTabs courseId={detail.course.id} active={kind}/>
    {kind==='avaliacao'&&<Assessment detail={detail} refresh={refresh}/>}
    {kind==='pesquisa'&&<Survey detail={detail} refresh={refresh}/>}
    {kind==='certificado'&&<Completion detail={detail}/>}
    {kind==='comentarios'&&<CourseComments courseId={detail.course.id}/>}
  </>;
}

function Assessment({detail,refresh}:{detail:CourseDetail;refresh:()=>Promise<void>}) {
  const [attempt,setAttempt]=useState<Attempt|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const {course}=detail, attempts=detail.attempts||[], active=attempts.find(a=>a.status==='active'), passed=attempts.some(a=>a.passed);
  const complete=detail.lessons.length>0&&detail.progress?.length===detail.lessons.length;
  async function start() {
    setBusy(true);setError('');
    try {const a=active||await api<Attempt>('course/'+course.id+'/start',{});setAttempt(await api<Attempt>('attempt/'+a.id));}
    catch(e){setError(message(e));}finally{setBusy(false);}
  }
  if(attempt)return <ExamSession initial={attempt} courseId={course.id} refresh={refresh} back={()=>setAttempt(null)}/>;
  return <><Failure error={error}/><section className="ev-panel"><div className="ev-panel-title"><h2>Prepare-se para a avaliação</h2><ClipboardCheck size={25}/></div><div className="ev-exam-facts"><span><strong>{Math.round(course.duration/60)} min</strong>por tentativa</span><span><strong>{course.passing}%</strong>nota mínima</span><span><strong>{attempts.length}/{course.attempt_limit}</strong>tentativas utilizadas</span></div><p>As respostas são salvas ao selecionar. O tempo continua correndo se você sair da página.</p>
    {passed?<><p className="ev-flow-success"><CheckCircle2 size={18}/> Você foi aprovado neste treinamento.</p><Link className="ev-button lime" href={root(course.id)+(detail.survey?'/certificado':'/pesquisa')}>Continuar conclusão <ArrowRight size={16}/></Link></>:<><button className="ev-button lime" disabled={busy||!complete||(!active&&attempts.length>=course.attempt_limit)} onClick={start}>{busy?'Carregando…':active?'Retomar prova':'Iniciar prova'} <ArrowRight size={16}/></button>{!complete&&<p>Conclua todas as aulas para liberar a prova. <Link className="ev-link" href={root(course.id)}>Voltar às aulas →</Link></p>}{!active&&attempts.length>=course.attempt_limit&&<p>O limite de tentativas foi atingido. <Link className="ev-link" href={root(course.id)+'/comentarios'}>Falar com a administração →</Link></p>}</>}
  </section><section className="ev-panel"><h2>Histórico de tentativas</h2>{attempts.length?attempts.map(a=><div className="ev-listline" key={a.id}><strong>Tentativa {a.number}</strong><span>{a.status==='active'?'Em andamento':`${a.score}% · ${a.passed?'Aprovado':'Não aprovado'}${a.status==='expired'?' · Tempo encerrado':''}`}</span></div>):<p>Você ainda não iniciou a avaliação.</p>}</section></>;
}

function ExamSession({initial,courseId,refresh,back}:{initial:Attempt;courseId:string;refresh:()=>Promise<void>;back:()=>void}) {
  const [a,setA]=useState(initial),[tick,setTick]=useState(Date.now()),[offset,setOffset]=useState((initial.serverTime||Date.now())-Date.now()),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const operation=useRef(false),autoSubmitted=useRef(false),mounted=useRef(true);
  const remaining=Math.max(0,Math.ceil((a.deadline-tick-offset)/1000));
  useEffect(()=>{mounted.current=true;const interval=setInterval(()=>setTick(Date.now()),1000);return()=>{mounted.current=false;clearInterval(interval)}},[]);
  const sync=useCallback(async()=>{if(operation.current)return;try{const next=await api<Attempt>('attempt/'+initial.id);if(mounted.current){setA(next);setOffset((next.serverTime||Date.now())-Date.now());}}catch(e){if(mounted.current)setError(message(e));}},[initial.id]);
  useEffect(()=>{const visible=()=>{if(document.visibilityState==='visible')void sync()};document.addEventListener('visibilitychange',visible);return()=>document.removeEventListener('visibilitychange',visible)},[sync]);
  const finish=useCallback(async()=>{
    if(operation.current)return;operation.current=true;setBusy(true);setError('');
    try{const next=await api<Attempt>('attempt/'+initial.id+'/submit',{});if(mounted.current)setA(next);await refresh();}
    catch(e){if(mounted.current)setError(message(e));}finally{operation.current=false;if(mounted.current)setBusy(false);}
  },[initial.id,refresh]);
  useEffect(()=>{if(!remaining&&a.status==='active'&&!busy&&!autoSubmitted.current){autoSubmitted.current=true;void finish();}},[remaining,a.status,busy,finish]);
  async function answer(questionId:string,choice:number){
    if(operation.current)return;operation.current=true;setBusy(true);setError('');
    try{await api('attempt/'+a.id+'/answer',{questionId,choice});if(mounted.current)setA(prev=>({...prev,answers:{...prev.answers,[questionId]:choice}}));}
    catch(e){if(mounted.current)setError(message(e));}finally{operation.current=false;if(mounted.current)setBusy(false);}
  }
  return <section className="ev-exam"><Failure error={error}/><div className="ev-panel ev-exam-header"><div><span className="ev-eyebrow">TENTATIVA {a.number}</span><h2>{a.status==='active'?'Responda às questões':a.passed?'Aprovação registrada':'Tentativa finalizada'}</h2></div><strong className="ev-exam-timer" role="timer">{a.status==='active'?`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`:a.score+'%'}</strong></div>
    {a.status==='active'?<>{a.questions.map((q,i)=><fieldset className="ev-panel ev-question" key={q.id}><legend>{i+1}. {q.prompt}</legend>{q.options.map((o,k)=><label className="ev-answer" key={k}><input type="radio" name={q.id} checked={a.answers[q.id]===k} disabled={busy||!remaining} onChange={()=>void answer(q.id,k)}/><span>{o}</span></label>)}</fieldset>)}<div className="ev-flow-actions"><button className="ev-button lime" disabled={busy} onClick={()=>{if(window.confirm('Finalizar a prova com as respostas salvas?'))void finish();}}>{busy?'Salvando…':'Finalizar prova'}</button><button className="ev-button outline" disabled={busy} onClick={back}>Voltar à avaliação</button><span role="status">{busy?'Aguarde o salvamento.':'Respostas selecionadas salvas.'}</span></div></>:<section className="ev-panel"><h2>{a.passed?'Você concluiu a avaliação com aprovação.':'Nota mínima não atingida.'}</h2><p>Resultado: {a.score}%. {a.status==='expired'?'O prazo encerrou; as respostas salvas foram consideradas.':''}</p><div className="ev-flow-actions"><Link className="ev-button lime" href={root(courseId)+'/pesquisa'}>Avaliar minha experiência <ArrowRight size={16}/></Link><button className="ev-button outline" onClick={back}>Ver tentativas</button></div></section>}
  </section>;
}

function Survey({detail,refresh}:{detail:CourseDetail;refresh:()=>Promise<void>}) {
  const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const eligible=detail.attempts?.some(a=>a.status!=='active');
  async function save(body:unknown){setBusy(true);setError('');try{await api('course/'+detail.course.id+'/survey',body);await refresh();router.push(root(detail.course.id)+'/certificado');}catch(e){setError(message(e));}finally{setBusy(false);}}
  return <section className="ev-panel"><Failure error={error}/>{!eligible?<><h2>A pesquisa será liberada após a avaliação.</h2><Link className="ev-button lime" href={root(detail.course.id)+'/avaliacao'}>Ir à avaliação</Link></>:detail.survey?<><h2>Pesquisa registrada</h2><p>{detail.survey.score===null?'Você optou por pular a pesquisa.':'Obrigado por compartilhar sua experiência.'} A pesquisa não altera sua nota ou aprovação.</p><Link className="ev-button lime" href={root(detail.course.id)+'/certificado'}>Continuar para conclusão <ArrowRight size={16}/></Link></>:<form onSubmit={e=>{e.preventDefault();const values=new FormData(e.currentTarget);void save({score:Number(values.get('score')),comment:String(values.get('comment')||'')});}}><h2>Como foi este treinamento?</h2><p>Sua resposta é opcional e não interfere na nota ou na aprovação.</p><label>De 0 a 10, quanto você recomendaria este treinamento?<select name="score" required defaultValue=""><option value="" disabled>Selecione uma nota</option>{Array.from({length:11},(_,n)=><option key={n} value={n}>{n}</option>)}</select></label><label>O que podemos melhorar? (opcional)<textarea name="comment" maxLength={2000}/></label><div className="ev-flow-actions"><button className="ev-button lime" disabled={busy}>{busy?'Salvando…':'Enviar pesquisa'}</button><button className="ev-button outline" type="button" disabled={busy} onClick={()=>void save({skip:true})}>Pular pesquisa</button></div></form>}</section>;
}

function Completion({detail}:{detail:CourseDetail}) {
  const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const passed=detail.attempts?.some(a=>a.passed),course=detail.course;
  async function issue(){setBusy(true);setError('');try{const cert=await api<Certificate>('course/'+course.id+'/certificate',{});router.push('/area/certificados/'+cert.id);}catch(e){setError(message(e));}finally{setBusy(false);}}
  return <section className="ev-panel"><GraduationCap size={35}/><Failure error={error}/><h2>{passed?'Seu resultado está registrado':'Conclua sua avaliação'}</h2>{!passed?<><p>O certificado depende de aprovação na prova.</p><Link className="ev-button lime" href={root(course.id)+'/avaliacao'}>Ir à avaliação</Link></>:!course.certificate?<><p>Este treinamento foi configurado sem emissão de certificado. Sua aprovação permanece registrada.</p><Link className="ev-button outline" href="/area/treinamentos">Voltar aos treinamentos</Link></>:!detail.survey?<><p>Responda ou escolha pular a pesquisa de experiência para continuar.</p><Link className="ev-button lime" href={root(course.id)+'/pesquisa'}>Ir à pesquisa</Link></>:detail.certificate?<><p>Seu certificado de conclusão já está disponível.</p><Link className="ev-button lime" href={'/area/certificados/'+detail.certificate.id}>Abrir certificado <ArrowRight size={16}/></Link></>:<><p>Você cumpriu os requisitos deste treinamento. Emita seu certificado para imprimir ou salvar em PDF.</p><button className="ev-button lime" disabled={busy} onClick={issue}>{busy?'Emitindo…':'Emitir certificado'} <GraduationCap size={18}/></button></>}</section>;
}

function CourseComments({courseId}:{courseId:string}) {
  const [comments,setComments]=useState<Comment[]>([]),[text,setText]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const path='comments?course='+encodeURIComponent(courseId);
  const reload=useCallback(async()=>{setLoading(true);setError('');try{setComments(await api<Comment[]>(path));}catch(e){setError(message(e));}finally{setLoading(false);}},[path]);
  useEffect(()=>{void reload()},[reload]);
  async function send(){if(!text.trim())return;setBusy(true);setError('');setNotice('');try{await api(path,{text:text.trim()});setText('');setNotice('Comentário publicado.');await reload();}catch(e){setError(message(e));}finally{setBusy(false);}}
  return <><section className="ev-panel"><div className="ev-panel-title"><h2>Conversa do treinamento</h2><button className="ev-button outline" disabled={loading||busy} onClick={()=>void reload()}><RefreshCw size={15}/> Atualizar</button></div><p>Visível para sua empresa e para a administração da EVOLU.</p><Failure error={error}/>{notice&&<p role="status">{notice}</p>}{loading?<p role="status">Carregando conversa…</p>:comments.length?<div className="ev-conversation">{comments.map(c=><article key={c.id}><header><strong>{c.author}</strong><span>{c.role==='admin'?'Administração · ':''}{new Date(c.created_at).toLocaleString('pt-BR')}</span></header><p>{c.body}</p></article>)}</div>:!error&&<p>Nenhum comentário ainda. Envie a primeira dúvida ou contribuição.</p>}</section><section className="ev-panel"><form onSubmit={e=>{e.preventDefault();void send();}}><label>Escreva uma dúvida ou contribuição<textarea required maxLength={4000} value={text} onChange={e=>setText(e.target.value)}/></label><button className="ev-button lime" disabled={busy||!text.trim()}>{busy?'Publicando…':'Publicar comentário'} <MessageSquare size={16}/></button></form></section></>;
}

export function CertificateCollection({compact=false}:{compact?:boolean}) {
  const [items,setItems]=useState<Certificate[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  useEffect(()=>{let active=true;api<Certificate[]>('certificates').then(r=>{if(active)setItems(r)}).catch(e=>{if(active)setError(message(e))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  return <><Failure error={error}/>{loading?<p role="status">Carregando certificados…</p>:items.length?(compact?items.slice(0,3):items).map(c=><Link className="ev-listline" href={'/area/certificados/'+c.id} key={c.id}><GraduationCap size={24}/><strong>{c.title}<small>{c.hours}h · {date(c.issued_at)}</small></strong><ArrowRight size={17}/></Link>):!error&&<><p>Você ainda não possui certificados emitidos.</p><Link className="ev-link" href="/area/avaliacoes">Ver avaliações e conclusão →</Link></>}{compact&&items.length>0&&<Link className="ev-link" href="/area/certificados">Ver todos os certificados →</Link>}</>;
}

export function CertificateView({id,admin=false}:{id:string;admin?:boolean}) {
  const [cert,setCert]=useState<Certificate|null>(null),[error,setError]=useState('');
  useEffect(()=>{let active=true;api<Certificate>('certificate/'+id).then(r=>{if(active)setCert(r)}).catch(e=>{if(active)setError(message(e))});return()=>{active=false}},[id]);
  return <div className="ev-certificate-view"><div className="ev-flow-actions ev-print-hide"><Link className="ev-button outline" href={admin?'/admin/certificados':'/area/certificados'}><ArrowLeft size={16}/> Voltar aos certificados</Link>{cert&&<button className="ev-button lime" onClick={()=>window.print()}><Download size={16}/> Imprimir / salvar PDF</button>}</div><Failure error={error}/>{!cert&&!error&&<p role="status">Carregando certificado…</p>}{cert&&<article className="ev-certificate-paper"><img src="/brand/evolu-black.png" alt="EVOLU" width={170}/><span className="ev-eyebrow">EVOLU TRAINING</span><h1>Certificado de conclusão</h1><p>Certificamos que</p><h2>{cert.name}</h2><p>concluiu com aprovação o treinamento</p><h3>{cert.title}</h3><div className="ev-certificate-details"><span>Carga horária: <strong>{cert.hours} horas</strong></span><span>Aproveitamento: <strong>{cert.score}%</strong></span><span>Empresa: <strong>{cert.company}</strong></span></div><p>Emitido em {date(cert.issued_at)}</p><small>Código de registro: {cert.id}</small></article>}</div>;
}

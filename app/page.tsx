import Link from 'next/link';
import {ArrowRight,Building2,BookOpen,UsersRound,FileText,ClipboardCheck,Layers,Calculator} from 'lucide-react';
import {getTrainingUser} from './auth';
import {buildPublicHomeCategories} from '../lib/training/public-home';
import type {PublicCourse} from '../lib/training/public-catalog';
import './home.css';
import './home-reference.css';

export const dynamic='force-dynamic';

// Identidade, banner, navegação e ferramentas permanentes são elementos da plataforma.
// Nenhuma categoria, treinamento, capa de catálogo ou módulo é criado aqui.
const steps=[
 ['01','Conheça os treinamentos','Consulte o catálogo disponibilizado pela EVOLU.'],
 ['02','Receba acesso corporativo','A empresa reserva vagas para os participantes autorizados.'],
 ['03','Estude e pratique','Acesse aulas e ferramentas relacionadas a cada módulo.'],
 ['04','Avalie e conclua','Realize a avaliação e obtenha certificado quando elegível.']
];
const photo=(name:string)=>({backgroundImage:'linear-gradient(0deg,#020405bd,#0a0c0d17),url(/training-media/'+name+'.webp)'});
const cover=(image:string)=>image?{backgroundImage:'linear-gradient(0deg,#020405bd,#0a0c0d17),url('+JSON.stringify(image)+')'}:undefined;

export default async function Home(){
 const user=await getTrainingUser();
 let catalog:PublicCourse[]=[];
 let ready=false;
 try{
  if(process.env.NEXT_PUBLIC_SUPABASE_URL){
   const response=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/training-api/public-catalog',{
    headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||''},cache:'no-store'
   });
   if(response.ok){
    const data:unknown=await response.json();
    if(Array.isArray(data)){catalog=data as PublicCourse[];ready=true;}
   }
  }
 }catch(e){console.error('training_catalog_unavailable',e instanceof Error?e.message:'unknown')}
 const categories=buildPublicHomeCategories(ready?catalog:[]);
 const hasContent=categories.length>0;
 const courseCount=categories.reduce((total,category)=>total+category.course_count,0);
 return <div className="home ev-public">
  <header className="home-header">
   <Link className="home-product" href="/"><img className="home-logo" src="/brand/evolu-white.png" alt="EVOLU" width={145} height={31}/><span className="home-product-divider"/><span className="home-product-sub">Training</span></Link>
   <nav className="home-nav" aria-label="Navegação principal">
    {hasContent&&<><a href="#treinamentos">Treinamentos</a><a href="#areas">Catálogos</a></>}
    <a href="#metodo">Como funciona</a><Link href="/simulador">Simulador</Link>
   </nav>
   <Link className="home-access" href={user?'/entrada':'/acesso'}>Acessar plataforma <ArrowRight size={16}/></Link>
  </header>
  <main className="ev-public-main">
   <section className="ev-public-hero">
    <div className="ev-public-hero-photo" style={photo('home_executivo_cidade_1920x900')}/>
    <div className="ev-public-hero-copy">
     <p className="ev-public-kicker">CONHECIMENTO QUE GERA IMPACTO REAL</p>
     <h1>Conhecimento<br/>que impulsiona<br/><em>resultados.</em></h1>
     <p>Formação corporativa com conteúdo estruturado, ferramentas e aplicação no trabalho.</p>
     <div className="ev-public-actions">
      <a className="ev-public-primary" href={hasContent?'#treinamentos':'/acesso'}>{hasContent?'Explorar treinamentos':'Acessar plataforma'} <ArrowRight size={16}/></a>
      <a className="ev-public-secondary" href="#metodo">Como funciona</a>
     </div>
    </div>
    <div className="ev-public-value"><span><BookOpen/> Conteúdo estruturado</span><span><FileText/> Ferramentas por aula</span><span><Building2/> Gestão corporativa</span><span><ClipboardCheck/> Avaliações e certificados</span></div>
   </section>
   <section className="ev-public-tool" aria-labelledby="ev-tool-title">
    <div className="ev-public-tool-symbol" aria-hidden="true"><Calculator size={30} strokeWidth={1.65}/><span>2027</span></div>
    <div className="ev-public-tool-copy"><p>FERRAMENTAS PARA TOMADA DE DECISÃO</p><h2 id="ev-tool-title">Simulador tributário <span>2027</span></h2><span>Compare dois cenários de compra ou venda considerando regime tributário, origem e destino, transporte, impostos e créditos estimados.</span></div>
    <Link className="ev-public-tool-link" href="/simulador">Acessar simulador <ArrowRight size={18}/></Link>
   </section>
   {hasContent&&<section className="ev-public-areas" id="areas">
    <div className="ev-public-intro"><p>CONTEÚDO CADASTRADO</p><h2>Catálogos<br/>disponíveis</h2><span>Áreas com treinamentos publicados e autorizados para apresentação.</span></div>
    <div className="ev-public-area-list">{categories.map((category,i)=><a href={'#categoria-'+category.id} key={category.id} className="ev-public-area">
     <div className="ev-public-area-cover" style={cover(category.cover_image)}/>
     <div className="ev-public-area-copy"><Layers size={25}/><h3>{category.title}</h3>
      {category.description&&<p>{category.description}</p>}
      <small className="ev-public-category-count">{category.course_count} {category.course_count===1?'treinamento':'treinamentos'}</small>
      <span>{String(i+1).padStart(2,'0')} ↗</span>
     </div>
    </a>)}</div>
   </section>}
   {hasContent&&<section className="ev-public-featured" id="treinamentos">
    <div className="ev-public-intro"><p>CATÁLOGO CORPORATIVO</p><h2>Treinamentos<br/>disponíveis</h2><span>{courseCount} {courseCount===1?'treinamento publicado':'treinamentos publicados'} e autorizados para a vitrine.</span></div>
    <div className="ev-public-catalog-groups">{categories.map(category=><section className="ev-public-catalog-group" id={'categoria-'+category.id} key={category.id} aria-label={'Treinamentos de '+category.title}>
     <div className="ev-public-catalog-heading"><h3>{category.title}</h3><span>{category.course_count} {category.course_count===1?'treinamento':'treinamentos'}</span></div>
     <div className="ev-public-cards">{category.courses.map(course=><article className="ev-public-course-tile" key={course.id}>
      <Link className="ev-public-course" href={'/area/treinamentos/'+encodeURIComponent(course.id)} style={cover(course.cover_image)}>
       <span className="ev-public-category">{category.title}</span>
       <h3>{course.title}</h3>
       {course.description&&<p className="ev-public-description">{course.description}</p>}
       <p>{course.hours} {course.hours===1?'hora':'horas'}</p>
       <span className="ev-public-course-action"><ArrowRight size={18}/></span>
      </Link>
      {Array.isArray(course.modules)&&course.modules.length>0&&<details className="ev-public-modules">
       <summary>{course.modules.length} {course.modules.length===1?'módulo cadastrado':'módulos cadastrados'}</summary>
       <ol>{course.modules.map((module,i)=><li key={i}>{module.title}</li>)}</ol>
      </details>}
     </article>)}</div>
    </section>)}</div>
   </section>}
   {!ready&&<p className="ev-public-catalog-status" role="status">Não foi possível consultar o catálogo neste momento. Os treinamentos não serão apresentados até que a consulta esteja disponível.</p>}
   <section className="ev-public-method" id="metodo"><div className="ev-public-intro"><p>DA FORMAÇÃO À APLICAÇÃO</p><h2>Como funciona</h2><span>O acesso aos treinamentos é reservado a empresas e participantes autorizados.</span></div><div className="ev-public-steps">{steps.map(([number,title,description])=><article key={number}><strong>{number}</strong><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></section>
   <section className="ev-public-outro" style={photo('escritorio_notebook_1280x720')}><div><p>ACESSO CORPORATIVO</p><h2>Acesse o EVOLU Training</h2><span>Consulte os treinamentos e materiais que sua empresa disponibilizou.</span></div><Link href={user?'/entrada':'/acesso'}>Acessar plataforma <ArrowRight size={16}/></Link></section>
  </main>
  <footer className="ev-public-footer"><Link href="/"><img src="/brand/evolu-white.png" alt="EVOLU" width={135}/><span>TRAINING</span></Link><p>Estratégia · Inteligência de negócios · Educação corporativa</p><div><a href="https://www.linkedin.com/company/evoluagency/" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://www.instagram.com/evolu.ink/" target="_blank" rel="noreferrer">Instagram</a></div></footer>
 </div>;
}

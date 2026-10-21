import {env} from 'cloudflare:workers';
import {getChatGPTUser,chatGPTSignInPath} from './chatgpt-auth';
import './home.css';

export const dynamic='force-dynamic';

type PublicCourse={id:string,title:string,description:string,hours:number,category:string};
const areas=[
 {index:'01',name:'Estratégia e gestão',detail:'Diagnóstico, decisões e aplicação de modelos de gestão.'},
 {index:'02',name:'Dados e inteligência',detail:'Leitura de indicadores, BI e estruturação da informação.'},
 {index:'03',name:'Operações e processos',detail:'Rotinas, qualidade de execução e eficiência operacional.'},
 {index:'04',name:'Finanças e tecnologia',detail:'Análise financeira e ferramentas para apoiar o trabalho.'}
];
const journey=[
 {n:'01',name:'Conteúdo',body:'Aulas em vídeo, documentos e materiais disponibilizados por treinamento.'},
 {n:'02',name:'Aplicação',body:'Ferramentas relacionadas às aulas e contexto da empresa participante.'},
 {n:'03',name:'Avaliação',body:'Verificação de aprendizagem com critérios e tempo definidos.'},
 {n:'04',name:'Conclusão',body:'Registro do resultado, pesquisa de experiência e certificado quando aplicável.'}
];

export default async function HomePage(){
 const user=await getChatGPTUser();
 const accessHref=user?'/area':chatGPTSignInPath('/area');
 let courses:PublicCourse[]=[];
 let catalogReady=false;
 try{
  if(env.DB){
   const result=await env.DB.prepare("SELECT c.id,c.title,c.description,c.hours,cat.title AS category FROM courses c JOIN catalogs cat ON cat.id=c.catalog_id WHERE c.status='published' AND c.show_on_home=1 ORDER BY cat.title,c.title").all<PublicCourse>();
   courses=result.results;
   catalogReady=true;
  }
 }catch(e){
  console.error('public_course_catalog_unavailable',e instanceof Error?e.message:'unknown');
 }
 return <div className="home">
  <header className="home-header" id="inicio">
   <a href="#inicio" className="home-product" aria-label="EVOLU Training — início"><span className="home-product-name">EVOLU</span><span className="home-product-divider" aria-hidden="true"/><span className="home-product-sub">Training</span></a>
   <nav className="home-nav" aria-label="Navegação principal">
    <a href="#areas">Áreas de formação</a><a href="#cursos">Treinamentos</a><a href="#metodo">Como funciona</a>
   </nav>
   <a className="home-access" href={accessHref} target="_top">{user?'Minha área':'Acesso do participante'} <span aria-hidden="true">↗</span></a>
  </header>
  <main className="home-main">
   <section className="home-hero" aria-labelledby="home-hero-title">
    <div className="home-hero-copy">
     <p className="home-kicker"><span className="home-kicker-dot"/> Formação corporativa · Plataforma EVOLU</p>
     <h1 id="home-hero-title">Aprender faz parte do trabalho.<span>Aplicar faz parte do resultado.</span></h1>
     <p className="home-lead">Treinamentos organizados para empresas e equipes, com conteúdo, materiais de apoio, avaliações e acompanhamento em um único ambiente.</p>
     <div className="home-hero-actions"><a className="home-primary" href="#cursos">Conhecer treinamentos <span aria-hidden="true">↘</span></a><a className="home-tertiary" href={accessHref} target="_top">{user?'Continuar formação':'Entrar com ChatGPT'} <span aria-hidden="true">↗</span></a></div>
     <p className="home-note">Participação mediante vagas disponibilizadas pela empresa. O acesso aos materiais requer autorização.</p>
    </div>
    <div className="home-hero-art" aria-label="Três etapas da formação: conteúdo, prática e avaliação">
      <div className="home-art-top"><span>EVOLU / LEARNING ENVIRONMENT</span><span>01—03</span></div>
      <div className="home-art-symbol" aria-hidden="true"><span>→</span></div>
      <div className="home-art-bottom"><div><small>FORMAÇÃO CORPORATIVA</small><strong>Conteúdo.</strong><strong>Prática.</strong><strong>Resultado.</strong></div><span className="home-art-index">E/T</span></div>
    </div>
   </section>
   <section className="home-areas home-section" id="areas" aria-labelledby="areas-title">
    <div className="home-section-heading"><div><p className="home-section-label">01 / Áreas de desenvolvimento</p><h2 id="areas-title">Temas conectados à operação das empresas.</h2></div><p>Frentes de aprendizagem que podem compor os treinamentos de cada organização. A oferta depende do catálogo efetivamente publicado.</p></div>
    <div className="home-area-grid">{areas.map(a=><article className="home-area" key={a.index}><span>{a.index} / ÁREA</span><h3>{a.name}</h3><p>{a.detail}</p><span className="home-area-arrow" aria-hidden="true">↗</span></article>)}</div>
   </section>
   <section className="home-catalog home-section" id="cursos" aria-labelledby="courses-title">
    <div className="home-section-heading"><div><p className="home-section-label">02 / Catálogo</p><h2 id="courses-title">Treinamentos em destaque.</h2></div><p>Somente treinamentos publicados e autorizados pela administração aparecem nesta vitrine. O conteúdo completo permanece restrito aos participantes convidados.</p></div>
    {!catalogReady?<div className="home-catalog-empty"><p className="home-section-label">CATÁLOGO INDISPONÍVEL</p><h3>Não foi possível consultar os treinamentos.</h3><p>A área de aprendizagem continua disponível para as contas autorizadas.</p><a href={accessHref} target="_top">Acessar minha área ↗</a></div>:courses.length===0?<div className="home-catalog-empty"><p className="home-section-label">CATÁLOGO EM ORGANIZAÇÃO</p><h3>Os treinamentos desta vitrine estão sendo preparados.</h3><p>Se você já recebeu acesso de sua empresa, entre na área do participante para consultar seus cursos disponíveis.</p><a href={accessHref} target="_top">Acessar minha área ↗</a></div>:<div className="home-public-courses">{courses.map((course,i)=><article className="home-public-course" key={course.id}><div className="home-course-top"><span>{String(i+1).padStart(2,'0')}</span><span className="home-course-mark" aria-hidden="true">↗</span></div><div className="home-course-main"><p className="home-section-label">{course.category}</p><h3>{course.title}</h3><p>{course.description||'Formação direcionada à aplicação prática no ambiente corporativo.'}</p><div className="home-course-bottom"><span>{course.hours} {course.hours===1?'hora':'horas'}</span><a href={'/area?course='+encodeURIComponent(course.id)} target="_top" aria-label={'Acessar treinamento '+course.title}>Acessar treinamento ↗</a></div></div></article>)}</div>}
   </section>
   <section className="home-how home-section" id="metodo" aria-labelledby="how-title">
    <div className="home-section-heading"><div><p className="home-section-label">03 / Experiência de aprendizagem</p><h2 id="how-title">Da formação à execução.</h2></div><p>O participante encontra os materiais do seu treinamento sem precisar navegar por uma interface de conversa.</p></div>
    <div className="home-steps">{journey.map(j=><article key={j.n}><span>{j.n}</span><h3>{j.name}</h3><p>{j.body}</p></article>)}</div>
   </section>
   <section className="home-entry" aria-labelledby="entry-title"><div><p className="home-section-label">ACESSO CORPORATIVO</p><h2 id="entry-title">Seu treinamento está disponível?</h2><p>Utilize a conta ChatGPT autorizada pela sua empresa para acessar cursos, aulas, ferramentas, avaliações e certificados na interface do EVOLU Training.</p></div><a href={accessHref} target="_top">{user?'Ir para minha área':'Entrar com ChatGPT'} <span aria-hidden="true">↗</span></a></section>
  </main>
  <footer className="home-footer"><span>EVOLU Training</span><p>Plataforma de aprendizagem corporativa. Acesso por empresa e participante autorizado.</p><a href="#inicio">Voltar ao topo ↑</a></footer>
 </div>;
}

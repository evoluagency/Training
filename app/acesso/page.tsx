import Link from 'next/link';
import {getChatGPTUser,chatGPTSignInPath} from '../chatgpt-auth';
import {ShieldCheck,UsersRound,BookOpen,ArrowRight} from 'lucide-react';
import './access.css';
export const dynamic='force-dynamic';
export default async function Access(){
 const user=await getChatGPTUser();
 const target=user?'/entrada':chatGPTSignInPath('/entrada');
 return <main className="ev-access"><section className="ev-access-photo">
  <div className="ev-access-image" aria-hidden="true"/>
  <Link className="ev-access-brand" href="/"><img src="/brand/evolu-white.png" alt="EVOLU" width="178" height="41"/><span>TRAINING</span></Link>
  <div className="ev-access-statement"><span>FORMAÇÃO CORPORATIVA</span><h1>Aprendizagem para aplicar no trabalho.</h1><p>Treinamentos, ferramentas e evolução profissional no mesmo ambiente.</p></div>
 </section><section className="ev-access-form"><div className="ev-access-lang">EVOLU TRAINING / ACESSO</div><div className="ev-access-inner">
  <span className="ev-access-eyebrow">ACESSO POR EMPRESA</span><h2>{user?'Sua área está disponível':'Acesse sua conta'}</h2><p>Utilize a identidade ChatGPT autorizada por sua empresa para consultar os seus treinamentos.</p>
  <a className="ev-access-cta" href={target} target="_top">{user?'Entrar na plataforma':'Entrar com ChatGPT'}<ArrowRight size={19}/></a>
  <div className="ev-access-benefits"><div><ShieldCheck/><p><strong>Identidade verificada</strong><small>O login ocorre no serviço oficial, sem coleta de senha pela EVOLU.</small></p></div><div><BookOpen/><p><strong>Conteúdos da sua empresa</strong><small>As vagas e o acesso aos treinamentos são autorizados individualmente.</small></p></div><div><UsersRound/><p><strong>Progresso acompanhado</strong><small>Aulas, materiais de apoio, avaliações e certificados.</small></p></div></div>
  <div className="ev-access-help"><strong>Não possui acesso?</strong><p>Solicite ao responsável pela sua empresa que cadastre seu e-mail e libere a participação.</p><Link href="/">Voltar à página inicial →</Link></div>
 </div></section></main>;
}

import Link from 'next/link';
import {getTrainingUser} from '../auth';
import LoginForm from './login-form';
import './access.css';
export const dynamic='force-dynamic';
export default async function Access(){
 const user=await getTrainingUser();
 return <main className="ev-access"><section className="ev-access-photo"><div className="ev-access-image" aria-hidden="true"/><Link className="ev-access-brand" href="/"><img src="/brand/evolu-white.png" alt="EVOLU" width="178" height="41"/><span>TRAINING</span></Link><div className="ev-access-statement"><span>FORMAÇÃO CORPORATIVA</span><h1>Aprendizagem para aplicar no trabalho.</h1><p>Treinamentos, ferramentas e evolução profissional no mesmo ambiente.</p></div></section><section className="ev-access-form"><div className="ev-access-lang">EVOLU TRAINING / ACESSO</div><div className="ev-access-inner"><span className="ev-access-eyebrow">ACESSO POR EMPRESA</span><h2>{user?'Sua área está disponível':'Acesse sua conta'}</h2><p>Entre com o e-mail e a senha liberados para você pela administração.</p>{user?<Link className="ev-access-cta" href="/entrada">Entrar na plataforma →</Link>:<LoginForm/>}<div className="ev-access-help"><strong>Precisa de acesso?</strong><p>Solicite ao responsável pela sua empresa a reserva da vaga e a configuração da sua conta.</p><Link href="/">Voltar à página inicial →</Link></div></div></section></main>;
}

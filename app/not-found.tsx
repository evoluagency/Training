import Link from 'next/link';
export default function NotFound(){return <main className="ev-setup"><img src="/brand/evolu-black.png" alt="EVOLU" width={155}/><h1>Página não encontrada</h1><p>O endereço pode ter mudado. Continue pela entrada da plataforma.</p><Link className="button" href="/entrada">Acessar a plataforma →</Link><p><Link href="/">Voltar à página inicial</Link></p></main>;}

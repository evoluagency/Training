import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL('https://training.evolu.ink'),title:{default:'EVOLU Training | Formação corporativa',template:'%s | EVOLU Training'},description:'Treinamentos privados, ferramentas e desenvolvimento por empresa.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}

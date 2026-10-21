import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Training | Formação corporativa',description:'Treinamentos privados, ferramentas e desenvolvimento por empresa.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}

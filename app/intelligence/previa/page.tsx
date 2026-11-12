// Prévia LOCAL da reunião com o avatar dentro do layout do Training, com dados fictícios e sem login.
// Só existe fora de produção e com INTELLIGENCE_LOCAL_PREVIEW=1. Em produção responde 404.
import {notFound} from 'next/navigation';
import {localPreviewEnabled} from '../../../lib/intelligence/gateway';
import {PreviewShell} from './preview-shell';
export const dynamic='force-dynamic';
export const metadata={title:'Prévia local do Intelligence',robots:{index:false,follow:false}};
export default async function IntelligencePreview({searchParams}:{searchParams:Promise<{modo?:string}>}){
  if(!localPreviewEnabled())notFound();
  const {modo}=await searchParams;
  return <PreviewShell mode={modo==='entrevista'?'interview':modo==='voz'?'voice':'lesson'}/>;
}

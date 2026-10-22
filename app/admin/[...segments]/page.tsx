import {redirect} from 'next/navigation';
import {getChatGPTUser,chatGPTSignInPath} from '../../chatgpt-auth';
import Portal from '../../visual-portal';
export const dynamic='force-dynamic';
export default async function AdminRoutes({params}:{params:Promise<{segments:string[]}>}){
 const {segments}=await params;
 const safe=Array.isArray(segments)&&segments.length<=5&&segments.every(s=>/^[a-zA-Z0-9-]{1,100}$/.test(s));
 const target=safe?'/admin/'+segments.map(encodeURIComponent).join('/'):'/admin';
 const user=await getChatGPTUser();
 if(!user)redirect(chatGPTSignInPath(target));
 return <Portal area="admin"/>;
}

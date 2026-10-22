import {redirect} from 'next/navigation';
import {getChatGPTUser,chatGPTSignInPath} from '../chatgpt-auth';
import RoleRedirect from './role-redirect';
export const dynamic='force-dynamic';
export default async function Entry(){const user=await getChatGPTUser();if(!user)redirect(chatGPTSignInPath('/entrada'));return <RoleRedirect/>}

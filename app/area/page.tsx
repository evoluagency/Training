import {redirect} from 'next/navigation';
import {getChatGPTUser,chatGPTSignInPath} from '../chatgpt-auth';
import Portal from '../visual-portal';
export const dynamic='force-dynamic';
export default async function Area(){const user=await getChatGPTUser();if(!user)redirect(chatGPTSignInPath('/area'));return <Portal area="learner"/>}

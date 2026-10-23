import {redirect} from 'next/navigation';
import {getTrainingUser,trainingSignInPath} from '../auth';
import Portal from '../visual-portal';
export const dynamic='force-dynamic';
export default async function Admin(){const user=await getTrainingUser();if(!user)redirect(trainingSignInPath('/admin'));return <Portal area="admin"/>}

import {serverSupabase} from '../../../lib/supabase/server';
import {createRecoveryHandlers} from '../../../lib/supabase/recovery';
export const dynamic='force-dynamic';
const recovery=createRecoveryHandlers(async()=>(await serverSupabase()).auth);
export async function GET(request:Request){return recovery.GET(request);}
export async function POST(request:Request){return recovery.POST(request);}

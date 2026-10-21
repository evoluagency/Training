import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../../chatgpt-auth';
import { handle } from '../../../../lib/training/service';
export const dynamic='force-dynamic';
async function handler(request:Request){
 if(!env.DB||!env.BUCKET)return Response.json({error:'Armazenamento ainda não disponível.'},{status:503});
 return handle(request,{db:env.DB,bucket:env.BUCKET,user:await getChatGPTUser(),adminEmail:env.TRAINING_ADMIN_EMAIL||''});
}
export const GET=handler;export const POST=handler;export const PATCH=handler;

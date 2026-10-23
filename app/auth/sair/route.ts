import {NextResponse} from 'next/server';
import {serverSupabase} from '../../../lib/supabase/server';
export async function GET(request:Request){await (await serverSupabase()).auth.signOut();return NextResponse.redirect(new URL('/acesso',request.url));}

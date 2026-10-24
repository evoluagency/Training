export const dynamic = 'force-dynamic';
export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) return new Response(null, {status: 404});
  const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/training-api/public-cover/' + id, {
    headers: {apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''}, cache: 'no-store', redirect: 'manual',
  });
  const headers = new Headers({'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'});
  const location = response.headers.get('location');
  if (location) headers.set('Location', location);
  return new Response(null, {status: response.status, headers});
}

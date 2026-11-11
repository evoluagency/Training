// Ligação Training → EVOLU Intelligence (avatar com voz).
// O navegador só fala com /api/intelligence/*. Esta camada roda no servidor do Training, confere quem pede
// e repassa para o serviço do Intelligence configurado em INTELLIGENCE_AVATAR_URL (variável só de servidor).
// Nenhuma chave de modelo passa por aqui nem vai ao navegador: o modelo é chamado pelo Intelligence.

export type IntelligenceAccess = 'learner' | 'admin';
export type IntelligenceRoute = { method: 'GET' | 'POST'; path: string; access: IntelligenceAccess };

// Lista fechada. Aula: qualquer participante autenticado. Entrevista do capacitador: só administração.
const ROUTES: readonly IntelligenceRoute[] = Object.freeze([
  { method: 'GET', path: 'state', access: 'learner' },
  { method: 'POST', path: 'lesson/start', access: 'learner' },
  { method: 'POST', path: 'lesson/segment', access: 'learner' },
  { method: 'POST', path: 'lesson/end', access: 'learner' },
  { method: 'POST', path: 'lesson/ask', access: 'learner' },
  { method: 'POST', path: 'interview/start', access: 'admin' },
  { method: 'POST', path: 'interview/reply', access: 'admin' },
  { method: 'POST', path: 'interview/finish', access: 'admin' },
]);

export const MAX_BODY_BYTES = 8 * 1024;
export const UPSTREAM_TIMEOUT_MS = 45_000;

export function resolveIntelligenceRoute(method: string, path: string): IntelligenceRoute | null {
  return ROUTES.find((r) => r.method === method && r.path === path) ?? null;
}

/** URL base do serviço do Intelligence. Só http(s), sem credencial embutida. Ausente → recurso indisponível. */
export function intelligenceBaseUrl(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

/** Prévia local (sem login): só fora de produção e com a variável explícita. */
export function localPreviewEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== 'production' && env.INTELLIGENCE_LOCAL_PREVIEW === '1';
}

const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });

/**
 * Repassa uma chamada já autorizada ao Intelligence. Só JSON, corpo limitado, resposta sem cabeçalhos do serviço.
 * Erros do serviço chegam como { error: CODIGO } (sem detalhe interno).
 */
export async function forwardToIntelligence(
  { route, base, body, fetchImpl = fetch }: { route: IntelligenceRoute; base: URL; body: string; fetchImpl?: typeof fetch },
): Promise<Response> {
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) return json(413, { error: 'BODY_TOO_LARGE' });
  if (route.method === 'POST' && body) {
    try { JSON.parse(body); } catch { return json(400, { error: 'BAD_JSON' }); }
  }
  const target = new URL('api/' + route.path, base.href.endsWith('/') ? base.href : base.href + '/');
  let upstream: Response;
  try {
    upstream = await fetchImpl(target, {
      method: route.method,
      headers: route.method === 'POST' ? { 'content-type': 'application/json' } : undefined,
      body: route.method === 'POST' ? body || '{}' : undefined,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return json(503, { error: 'INTELLIGENCE_UNAVAILABLE' });
  }
  const text = await upstream.text();
  let payload: unknown;
  try { payload = JSON.parse(text); } catch { return json(502, { error: 'BAD_UPSTREAM' }); }
  if (!upstream.ok) {
    const code = typeof (payload as { error?: unknown })?.error === 'string' ? (payload as { error: string }).error : 'UPSTREAM_ERROR';
    return json(upstream.status >= 500 ? 502 : upstream.status, { error: /^[A-Z_]{2,40}$/.test(code) ? code : 'UPSTREAM_ERROR' });
  }
  return json(200, payload);
}

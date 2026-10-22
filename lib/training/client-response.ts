/** Parse the API boundary once; response bodies from Workers are unknown. */
export async function readTrainingResponse<T>(response: Response): Promise<T> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('A plataforma não retornou uma resposta válida. Tente novamente.');
  }

  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data
      && typeof data.error === 'string' ? data.error : null;
    throw new Error(message || 'Não foi possível concluir a solicitação.');
  }

  // T is the endpoint's response contract. Error envelopes are checked above.
  return data as T;
}

// Textos e funções puras da reunião com o avatar (sem navegador, testáveis).
export type MeetingMode='lesson'|'interview';

export const ERROR_TEXT:Record<string,string>={
  LESSON_NOT_LIVE:'A aula não está em andamento.',
  INVALID_INPUT:'Não entendi o texto enviado. Tente de novo.',
  CREDENTIAL_IN_TEXT:'Parece que o texto tem uma senha ou chave. Não envie isso aqui.',
  SESSION_NOT_OPEN:'A entrevista está encerrada ou pausada.',
  INTELLIGENCE_UNAVAILABLE:'O avatar não está disponível agora. Tente de novo mais tarde.',
  SIGN_IN_REQUIRED:'Entre na plataforma para continuar.',
  NO_ACCESS:'A sua conta ainda não tem acesso a esta área.',
  ADMIN_ONLY:'A entrevista do capacitador é restrita à administração.',
  BODY_TOO_LARGE:'O texto está longo demais. Divida em partes menores.',
};

/** Selo exibido na legenda conforme o caminho da resposta da aula. */
export const ROUTE_BADGE:Record<string,string>={
  CONTINGENCY:'Resposta geral da IA, fora do material',
  ESCALATE:'Encaminhado para uma pessoa',
  LIMIT:'Fora do escopo',
  OFF_TOPIC:'Fora do tema',
  FALLBACK:'Resposta não validada',
};

export function interviewBadge(r:{draft?:unknown;guard?:unknown}):string|null{
  return r.draft?'Rascunho gerado (DRAFT)':r.guard?'Não registrado':null;
}

/** Divide em frases para a voz do navegador (o Chrome corta falas longas). Preserva o texto inteiro. */
export function splitSentences(text:string):string[]{
  return text.match(/[^.!?\n]+[.!?]*\s*|\n+/g)??[text];
}

export function formatClock(ms:number):string{
  const s=Math.max(0,Math.floor(ms/1000));
  return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
}

export function coverageLabel(status:string|undefined):string{
  return ({OPEN:'Entrevista em andamento.',PAUSED_CRISIS:'Entrevista pausada.',CLOSED_DRAFT:'Entrevista encerrada. Saída em rascunho (DRAFT).'} as Record<string,string>)[status||'']||'Entrevista não iniciada.';
}

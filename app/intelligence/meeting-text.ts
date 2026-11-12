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

/**
 * Política de imagem da aula online. RASCUNHO para revisão do proprietário (e jurídica) antes de valer.
 * A versão entra no aceite guardado: mudar o texto exige nova versão e novo aceite.
 */
export const CAMERA_POLICY={
  version:'rascunho-0.1',
  title:'Política de imagem da aula online',
  points:[
    'Ligar a câmera é opcional. Você participa da aula do mesmo jeito sem ela e pode desligar a qualquer momento.',
    'Com a câmera ligada, a EVOLU pode ver e registrar a sua imagem e o seu comportamento visual durante a aula, como numa aula online com professor.',
    'Finalidade: melhorar as aulas e o avatar e entender como os participantes aprendem. A imagem não é usada para outro fim nem vendida.',
    'Quem acessa, por quanto tempo a imagem fica guardada e como pedir a exclusão serão informados na versão final desta política.',
  ],
  testNote:'Versão de teste: nesta etapa a imagem aparece só na sua tela e ainda não é enviada nem guardada.',
} as const;

/**
 * Captação da entrevista do capacitador (D23, D25, D29). RASCUNHO para revisão do proprietário (e jurídica).
 * O aceite fica registrado no servidor com esta versão. Mudar o texto exige nova versão e novo aceite.
 */
export const CAPTURE_POLICY={
  version:'captacao-rascunho-0.1',
  title:'Captação da entrevista',
  points:[
    'Com o seu aceite, a EVOLU registra a sua imagem e a sua voz durante a entrevista para continuar trabalhando no modelo do avatar.',
    'Fotos: uma no início de cada resposta e uma a cada 10 segundos enquanto a câmera estiver ligada.',
    'Gravação: câmera e voz, enviadas em trechos de 1 minuto durante a entrevista.',
    'Os arquivos vão para um armazenamento privado da EVOLU. Só a administração da EVOLU acessa. Você não fica com cópia.',
    'Você pode parar a gravação, desligar a câmera ou revogar este aceite a qualquer momento. Revogar interrompe a captação. O que já foi enviado continua guardado nesta fase de teste.',
    'Usar a sua imagem ou a sua voz para criar um avatar depende do termo de consentimento, assinado à parte.',
  ],
} as const;

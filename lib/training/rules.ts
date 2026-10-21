export class AppError extends Error { constructor(public status:number,message:string){super(message)} }
export function check(condition:unknown,message:string,status=400):asserts condition { if(!condition)throw new AppError(status,message) }
export function field(value:unknown,max=200){check(typeof value==='string'&&value.trim().length>0&&value.trim().length<=max,'Preencha os campos obrigatórios dentro do limite permitido.');return value.trim()}
export function whole(value:unknown,min:number,max:number){const n=Number(value);check(Number.isInteger(n)&&n>=min&&n<=max,`Informe um número inteiro entre ${min} e ${max}.`);return n}
export function email(value:unknown){const e=field(value,254).toLowerCase();check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),'E-mail inválido.');return e}
export function phone(value:unknown){if(!value)return '';const n=String(value).replace(/[^\d]/g,'');check(n.length>=10&&n.length<=15,'WhatsApp deve conter DDI, DDD e número.');return '+'+n}
export function grade(questions:any[],answers:Record<string,number>){return Math.round(questions.filter(q=>answers[q.id]===q.correct).length*100/questions.length)}
export function publicAttempt(a:any){if(!a)return null;const {questions,...rest}=a;return {...rest,questions:JSON.parse(questions).map(({correct,...q}:any)=>q),answers:JSON.parse(a.answers)}}
export function assertSameOrigin(req:Request){if(['GET','HEAD'].includes(req.method))return;const origin=req.headers.get('origin');check(origin===new URL(req.url).origin,'Origem da operação não autorizada.',403)}

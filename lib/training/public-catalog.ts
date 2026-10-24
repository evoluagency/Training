import type {Database} from './types.ts';
export type PublicCourse={id:string,title:string,description:string,hours:number,category:string,cover_image:string};

// Somente cursos explicitamente liberados para a vitrine. Não retorna vagas,
// empresas, membros, aulas, arquivos, avaliações ou dados de acesso.
export const PUBLIC_COURSE_SQL="SELECT c.id,c.title,c.description,c.hours,cat.title AS category,CASE WHEN c.cover_image<>'' THEN c.cover_image ELSE cat.cover_image END cover_image FROM courses c JOIN catalogs cat ON cat.id=c.catalog_id WHERE c.status='published' AND c.show_on_home=1 ORDER BY cat.title,c.title";

export async function getPublicCatalog(db:Pick<Database,'prepare'>):Promise<PublicCourse[]>{
 const response=await db.prepare(PUBLIC_COURSE_SQL).all<PublicCourse>();
 return response.results.map(course=>({...course,cover_image:course.cover_image?.startsWith('storage:')?'/api/capas/'+course.id:course.cover_image||''}));
}

export type PublicCourse={id:string,title:string,description:string,hours:number,category:string};

// Somente cursos explicitamente liberados para a vitrine. Não retorna vagas,
// empresas, membros, aulas, arquivos, avaliações ou dados de acesso.
export const PUBLIC_COURSE_SQL="SELECT c.id,c.title,c.description,c.hours,cat.title AS category FROM courses c JOIN catalogs cat ON cat.id=c.catalog_id WHERE c.status='published' AND c.show_on_home=1 ORDER BY cat.title,c.title";

export async function getPublicCatalog(db:Pick<D1Database,'prepare'>):Promise<PublicCourse[]>{
 const response=await db.prepare(PUBLIC_COURSE_SQL).all<PublicCourse>();
 return response.results;
}

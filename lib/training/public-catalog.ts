import type {Database} from './types.ts';

export type PublicModule={title:string;position:number};
export type PublicCourse={
 id:string;catalog_id:string;title:string;description:string;hours:number;
 category:string;category_description:string;cover_image:string;modules:PublicModule[];
};

// O site publica somente metadados de cursos aprovados pelo administrador.
// Não expõe vagas, empresas, participantes, materiais internos, texto das aulas ou provas.
export const PUBLIC_COURSE_SQL=
 "SELECT c.id,c.catalog_id,c.title,c.description,c.hours,cat.title AS category,cat.description AS category_description,CASE WHEN c.cover_image<>'' THEN c.cover_image ELSE cat.cover_image END AS cover_image FROM courses c JOIN catalogs cat ON cat.id=c.catalog_id WHERE c.status='published' AND c.show_on_home=1 ORDER BY cat.title,c.title,c.id";

export const PUBLIC_MODULE_SQL=
 "SELECT m.course_id,m.title,m.position FROM modules m JOIN courses c ON c.id=m.course_id WHERE c.status='published' AND c.show_on_home=1 ORDER BY m.course_id,m.position,m.id";

export async function getPublicCatalog(db:Pick<Database,'prepare'>):Promise<PublicCourse[]>{
 const courseRows=await db.prepare(PUBLIC_COURSE_SQL).all<Omit<PublicCourse,'modules'>>();
 const moduleRows=await db.prepare(PUBLIC_MODULE_SQL).all<{course_id:string;title:string;position:number}>();
 const grouped=new Map<string,PublicModule[]>();
 for(const module of moduleRows.results){
  const current=grouped.get(module.course_id)||[];
  current.push({title:module.title,position:Number(module.position)});
  grouped.set(module.course_id,current);
 }
 return courseRows.results.map(course=>({
  ...course,
  category_description:course.category_description||'',
  description:course.description||'',
  cover_image:course.cover_image?.startsWith('storage:')?'/api/capas/'+course.id:course.cover_image||'',
  modules:grouped.get(course.id)||[]
 }));
}

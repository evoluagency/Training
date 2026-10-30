import type {PublicCourse} from './public-catalog.ts';

export type PublicHomeCategory={
 id:string;title:string;description:string;cover_image:string;course_count:number;courses:PublicCourse[];
};

// Catálogos não aparecem na home enquanto não tiverem pelo menos um
// treinamento publicado e explicitamente autorizado para a vitrine.
export function buildPublicHomeCategories(courses:PublicCourse[]):PublicHomeCategory[]{
 const categories=new Map<string,PublicHomeCategory>();
 for(const course of courses){
  if(!course.category||!course.id||!course.title)continue;
  // Compatível com a versão anterior da API durante implantação gradual.
  const categoryId=course.catalog_id||'legacy-'+course.category.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,'-');
  let category=categories.get(categoryId);
  if(!category){
   category={id:categoryId,title:course.category,description:course.category_description||'',cover_image:course.cover_image||'',course_count:0,courses:[]};
   categories.set(categoryId,category);
  }
  category.courses.push(course);
  category.course_count+=1;
  if(!category.cover_image&&course.cover_image)category.cover_image=course.cover_image;
 }
 return [...categories.values()].sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
}

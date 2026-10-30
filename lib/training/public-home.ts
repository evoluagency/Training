import type {PublicCourse} from './public-catalog.ts';

export type PublicHomeCategory={
 id:string;title:string;description:string;cover_image:string;course_count:number;courses:PublicCourse[];
};

// Catálogos não aparecem na home enquanto não tiverem pelo menos um
// treinamento publicado e explicitamente autorizado para a vitrine.
export function buildPublicHomeCategories(courses:PublicCourse[]):PublicHomeCategory[]{
 const categories=new Map<string,PublicHomeCategory>();
 for(const course of courses){
  if(!course.catalog_id||!course.category||!course.id||!course.title)continue;
  let category=categories.get(course.catalog_id);
  if(!category){
   category={id:course.catalog_id,title:course.category,description:course.category_description||'',cover_image:course.cover_image||'',course_count:0,courses:[]};
   categories.set(course.catalog_id,category);
  }
  category.courses.push(course);
  category.course_count+=1;
  if(!category.cover_image&&course.cover_image)category.cover_image=course.cover_image;
 }
 return [...categories.values()].sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
}

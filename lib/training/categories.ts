export type CategorizedCourse = {catalog_id: string; category_title?: string};
export function visibleCourseCategories(courses: CategorizedCourse[]) {
  const categories = new Map<string, {id: string; title: string; courses: number}>();
  for (const course of courses) {
    if (!course.catalog_id || !course.category_title) continue;
    const entry = categories.get(course.catalog_id) || {id: course.catalog_id, title: course.category_title, courses: 0};
    entry.courses += 1;
    categories.set(entry.id, entry);
  }
  return [...categories.values()].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
}

export function lessonTitleFromFile(name: string): string {
  const title = name.replace(/\.pdf$/i, '').replace(/^m[oó]dulo[\s_-]*\d+[\s_-]*/i, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return title || 'Material da aula';
}

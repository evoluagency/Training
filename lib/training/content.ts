export const COURSE_STATUSES = {
  draft: 'Rascunho',
  review: 'Em revisão',
  published: 'Ativo',
  disabled: 'Desativado',
  archived: 'Arquivado',
} as const;
export type CourseStatus = keyof typeof COURSE_STATUSES;
export function courseStatusLabel(status: string): string {
  return COURSE_STATUSES[status as CourseStatus] || 'Status desconhecido';
}
export function contentEditable(course: { status: string; content_locked?: number }): boolean {
  return !course.content_locked && ['draft', 'review'].includes(course.status);
}
export function coverValue(value: unknown): string {
  const image = String(value || '').trim();
  if (!image || /^\/training-media\/[a-zA-Z0-9_-]+\.webp$/.test(image)) return image;
  try {
    const url = new URL(image);
    if (url.protocol === 'https:' && !url.username && !url.password && image.length <= 2000) return url.href;
  } catch { /* Invalid user input is rejected below. */ }
  throw new Error('Use uma imagem enviada, uma imagem da biblioteca ou uma URL HTTPS válida.');
}
export function courseCover(course: { id: string; cover_image?: string; catalog_cover?: string }, catalog?: { cover_image?: string }): string {
  const image = course.cover_image || course.catalog_cover || catalog?.cover_image || '';
  return image.startsWith('storage:') ? '/api/training/cover/course/' + course.id + '?v=' + encodeURIComponent(image.slice(8)) : image;
}
export function catalogCover(catalog: { id: string; cover_image?: string }): string {
  const image = catalog.cover_image || '';
  return image.startsWith('storage:') ? '/api/training/cover/catalog/' + catalog.id + '?v=' + encodeURIComponent(image.slice(8)) : image;
}

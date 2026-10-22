/** Lesson positions are local to each module; navigation follows module order. */
export function orderLessons<T extends {id:string;module_id:string;position:number}>(
  modules: readonly {id:string;position:number}[],
  lessons: readonly T[],
): T[] {
  const ranks = new Map([...modules]
    .sort((a,b) => a.position-b.position || a.id.localeCompare(b.id))
    .map((module,index) => [module.id,index]));
  return [...lessons].sort((a,b) =>
    (ranks.get(a.module_id) ?? Number.MAX_SAFE_INTEGER) -
    (ranks.get(b.module_id) ?? Number.MAX_SAFE_INTEGER) ||
    a.position-b.position || a.id.localeCompare(b.id));
}

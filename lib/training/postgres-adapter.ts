import type {Database} from './types.ts';
type Result={rows:Record<string,any>[];affectedRows?:number};
export type Query=(sql:string,values:unknown[])=>Promise<Result>;
export function postgresSql(source:string):string{
 let sql=source.replace(/INSERT OR IGNORE INTO/gi,'INSERT INTO');
 const ignore=/INSERT OR IGNORE INTO/i.test(source);
 sql=sql.replace(/\bchar\(/gi,'chr(').replace(/date\(moment\/1000,'unixepoch'\)/g,"to_char(to_timestamp(moment/1000.0) AT TIME ZONE 'UTC','YYYY-MM-DD')");
 sql=sql.replace(' day,COUNT',' AS "day",COUNT').replace('GROUP BY day ORDER BY day','GROUP BY "day" ORDER BY "day"');
 let quote='',position=0,output='';
 for(let i=0;i<sql.length;i++){const c=sql[i];if(quote){output+=c;if(c===quote){if(sql[i+1]===quote){output+=sql[++i];}else quote='';}}else if(c==="'"||c==='"'){quote=c;output+=c;}else output+=c==='?'?'$'+(++position):c;}
 return output+(ignore?' ON CONFLICT DO NOTHING':'');
}
export function postgresDatabase(query:Query):Database{
 return {prepare(sql:string){let values:unknown[]=[];const execute=()=>query(postgresSql(sql),values);return {bind(...next:unknown[]){values=next;return this},async first<T>(){return (await execute()).rows[0] as T||null},async all<T>(){return {results:(await execute()).rows as T[]}},async run(){const r=await execute();return {meta:{changes:r.affectedRows??r.rows.length}}}};}};
}

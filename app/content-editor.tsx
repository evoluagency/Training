'use client';
import {useEffect, useState, type FormEvent} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft, BookOpen, ChevronDown, Download, Edit3, FileText, Link2, Plus, Upload} from 'lucide-react';
import {EditorDialog} from './editor-dialog';
import {COURSE_STATUSES, contentEditable, courseStatusLabel, courseCover, catalogCover} from '../lib/training/content';
import {readTrainingResponse} from '../lib/training/client-response';
import {uploadTrainingFile} from '../lib/supabase/browser';

type Row = Record<string, any>;
async function api(path: string, body?: unknown, method = 'POST'): Promise<Row> {
  return readTrainingResponse(await fetch('/api/training/' + path, {method: body === undefined ? 'GET' : method, headers: {'Content-Type': 'application/json'}, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store'}));
}
function values(event: FormEvent<HTMLFormElement>) {event.preventDefault(); return Object.fromEntries(new FormData(event.currentTarget));}
const images = [
  ['estrategia_reuniao_1280x720', 'Estratégia e negócios'], ['dados_grafico_1280x720', 'Dados e inteligência'],
  ['processos_arquitetura_1280x720', 'Processos e operações'], ['lideranca_duas_executivas_1280x720', 'Liderança'],
  ['escritorio_notebook_1280x720', 'Trabalho e gestão'], ['reflexao_executiva_1280x720', 'Tecnologia'],
];

export function CoverControl({kind, record, onSaved}: {kind: 'catalog' | 'course'; record: Row; onSaved: () => Promise<void>}) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const image = kind === 'catalog' ? catalogCover(record as {id: string}) : courseCover(record as {id: string});
  async function save(coverImage: string) {
    setBusy(true); setError('');
    try {await api(kind === 'catalog' ? 'catalogs/' + record.id : 'course/' + record.id + '/cover', {coverImage}, kind === 'catalog' ? 'PATCH' : 'POST'); await onSaved();}
    catch (e) {setError((e as Error).message);} finally {setBusy(false);}
  }
  return <section className="ev-cover-control"><h3>Capa {kind === 'catalog' ? 'do catálogo' : 'do treinamento'}</h3>
    {image ? <img className="ev-cover-preview" src={image} alt="Capa selecionada"/> : <div className="ev-cover-placeholder"><BookOpen/><span>Sem capa definida</span></div>}
    {error && <p className="ev-alert error" role="alert">{error}</p>}
    <label>Imagem da biblioteca<select disabled={busy} value={record.cover_image?.startsWith('storage:') ? 'uploaded' : record.cover_image?.startsWith('/training-media/') ? record.cover_image : ''} onChange={e => save(e.target.value)}>
      <option value="">{kind === 'course' ? 'Usar a capa do catálogo' : 'Sem imagem'}</option>
      {record.cover_image?.startsWith('storage:') && <option value="uploaded">Imagem enviada</option>}
      {images.map(([name, label]) => <option key={name} value={'/training-media/' + name + '.webp'}>{label}</option>)}
    </select></label>
    <label className="ev-button outline ev-upload"><Upload size={16}/>{busy ? 'Salvando capa…' : 'Enviar minha imagem'}<input type="file" disabled={busy} accept=".png,.jpg,.jpeg,.webp" onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
      setBusy(true); setError('');
      try {
        const mime = file.type || (/\.png$/i.test(file.name) ? 'image/png' : /\.webp$/i.test(file.name) ? 'image/webp' : 'image/jpeg');
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime) || file.size > 5 * 1024 * 1024) throw new Error('Envie PNG, JPG ou WebP de até 5 MB.');
        await readTrainingResponse(await uploadTrainingFile('cover-upload?' + new URLSearchParams({kind, id: record.id}), file, mime)); await onSaved();
      } catch (e) {setError((e as Error).message);} finally {setBusy(false);}
    }}/></label>
    <small>PNG, JPG ou WebP, até 5 MB. A capa do catálogo é herdada pelos seus treinamentos.</small>
    <form key={record.cover_image} className="ev-cover-url" onSubmit={e => {const data = values(e); save(String(data.coverImage));}}><label>Ou URL HTTPS da imagem<input name="coverImage" type="url" defaultValue={record.cover_image?.startsWith('https:') ? record.cover_image : ''} placeholder="https://…" required maxLength={2000}/></label><button disabled={busy} className="ev-button outline">Usar URL</button></form>
    {record.cover_image && <button type="button" className="ev-link" disabled={busy} onClick={() => save('')}>{kind === 'course' ? 'Usar capa do catálogo' : 'Remover capa'}</button>}
  </section>;
}

export function ContentEditor({detail, companies, grants, onRefresh}: {detail: Row; companies: Row[]; grants: Row[]; onRefresh: () => Promise<void>}) {
  const router = useRouter(), search = useSearchParams();
  const course = detail.course, modules: Row[] = detail.modules || [], lessons: Row[] = detail.lessons || [];
  const [moduleId, setModuleId] = useState(search.get('modulo') || modules[0]?.id || ''), [lessonId, setLessonId] = useState('');
  const [dialog, setDialog] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [companyId, setCompanyId] = useState('');
  const editable = contentEditable(course), module = modules.find(m => m.id === moduleId) || modules[0];
  const moduleLessons = lessons.filter(l => l.module_id === module?.id).sort((a,b) => a.position-b.position || a.id.localeCompare(b.id));
  const lesson = moduleLessons.find(l => l.id === lessonId) || moduleLessons[0];
  const assets = (detail.assets || []).filter((a: Row) => a.lesson_id === lesson?.id);
  const resources = (detail.lessonResources || []).filter((a: Row) => a.lesson_id === lesson?.id);
  useEffect(() => {if (search.get('modulo') && modules.some(m => m.id === search.get('modulo'))) setModuleId(search.get('modulo')!);}, [search, modules]);
  function selectModule(id: string) {
    setModuleId(id); setLessonId(''); setError('');
    router.replace('/admin/treinamentos/' + course.id + '/estrutura?modulo=' + encodeURIComponent(id), {scroll: false});
  }
  async function act(operation: () => Promise<unknown>, message = 'Alterações salvas.') {
    setBusy(true); setError(''); setNotice('');
    try {const result = await operation(); await onRefresh(); setNotice(message); setDialog(''); return result;}
    catch (e) {setError((e as Error).message); return null;} finally {setBusy(false);}
  }
  async function upload(file: File, path: string, newLesson = false) {
    await act(async () => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const mime = file.type || ({pdf: 'application/pdf', mp4: 'video/mp4', webm: 'video/webm', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls: 'application/vnd.ms-excel', csv: 'text/csv'} as Record<string,string>)[extension];
      if (!mime || file.size > (mime.startsWith('video/') ? 50 : 10) * 1024 * 1024) throw new Error('Materiais: até 10 MB. Vídeos: até 50 MB. Confira o formato do arquivo.');
      const result = await readTrainingResponse<Row>(await uploadTrainingFile(path, file, mime));
      if (newLesson) setLessonId(result.lessonId);
      return result;
    }, 'Arquivo enviado e vinculado ao módulo.');
  }
  function publish() {
    if (!course.content_locked && !window.confirm('Ativar este treinamento? O conteúdo e a prova serão preservados nesta versão após a publicação.')) return;
    act(() => api('course/' + course.id + '/publish', {}), 'Treinamento ativo.');
  }
  return <>
    <Link className="ev-link" href="/admin/treinamentos"><ArrowLeft size={15}/> Voltar aos treinamentos</Link>
    <div className="ev-heading"><div><span className="ev-eyebrow">TREINAMENTOS / MÓDULOS E MATERIAIS</span><h1>{course.title}</h1><p>{course.description || 'Organize os módulos e anexe o material de cada treinamento.'}</p></div><span className={'ev-pill ' + (course.status === 'published' ? 'success' : '')}>{courseStatusLabel(course.status)}</span></div>
    {error && !dialog && <div className="ev-alert error" role="alert">{error}</div>}{notice && <div className="ev-alert" role="status">{notice}</div>}
    <section className="ev-panel ev-editor-settings"><div className="ev-inline-actions"><label>Status do treinamento<select value={course.status} disabled={busy} onChange={e => e.target.value === 'published' ? publish() : act(() => api('course/' + course.id + '/status', {status: e.target.value}))}>
      {Object.entries(COURSE_STATUSES).map(([value, label]) => <option key={value} value={value} disabled={!!course.content_locked && ['draft','review'].includes(value)}>{label}</option>)}
    </select></label><button type="button" className="ev-button outline" disabled={!editable || busy} onClick={() => {setError(''); setDialog('course');}}><Edit3 size={16}/> Editar treinamento</button><button className="ev-button outline" onClick={() => {setError(''); setDialog('cover');}}>Alterar capa</button>
    {course.status !== 'published' && <button className="ev-button lime" disabled={busy || (!editable && !course.content_locked)} onClick={publish}>{course.content_locked ? 'Reativar treinamento' : 'Publicar treinamento'}</button>}
    <label className="ev-checkbox"><input type="checkbox" disabled={busy || course.status !== 'published'} checked={!!course.show_on_home} onChange={e => act(() => api('course/' + course.id + '/home', {visible: e.target.checked}))}/> Exibir na página inicial</label></div>
    {course.content_locked ? <p>Esta versão já foi publicada. A disponibilidade e a capa podem ser alteradas; aulas, materiais e prova permanecem preservados.</p> : !editable ? <p>Selecione Rascunho ou Em revisão para continuar preparando o conteúdo.</p> : <p>Selecione um módulo para editar o nome, organizar as aulas e anexar PDFs. Os materiais só serão liberados aos participantes após a publicação.</p>}</section>
    <section className="ev-panel ev-content-editor"><div className="ev-panel-title"><h2>Módulos do treinamento</h2><button className="ev-button lime" disabled={!editable || busy} onClick={() => {setError(''); setDialog('newModule');}}><Plus size={16}/> Novo módulo</button></div>
      {!modules.length && <p>Crie o primeiro módulo e anexe o PDF correspondente.</p>}
      {modules.map((item, index) => <article key={item.id} className={'ev-module-block ' + (module?.id === item.id ? 'selected' : '')}>
        <button className="ev-editor-row" aria-expanded={module?.id === item.id} onClick={() => selectModule(item.id)}><b>{index + 1}</b><span>{item.title}<small>{lessons.filter(l => l.module_id === item.id).length} aulas · Abrir edição e materiais</small></span><ChevronDown size={18}/></button>
        {module?.id === item.id && <div className="ev-module-content"><div className="ev-panel-title"><h3>{item.title}</h3><button className="ev-button outline" disabled={!editable || busy} onClick={() => {setError(''); setDialog('editModule');}}><Edit3 size={15}/> Editar módulo</button></div>
          <div className="ev-inline-actions"><label className={'ev-button lime ev-upload ' + (!editable || busy ? 'disabled' : '')}><Upload size={16}/>{busy ? 'Enviando…' : 'Anexar PDF ao módulo'}<input type="file" accept=".pdf,application/pdf" aria-label={'Anexar PDF ao módulo ' + item.title} disabled={!editable || busy} onChange={e => {const file = e.target.files?.[0]; e.target.value = ''; if (file) upload(file, 'module-upload?' + new URLSearchParams({module: item.id, name: file.name}), true);}}/></label><button className="ev-button outline" disabled={!editable || busy} onClick={() => {setError(''); setDialog('newLesson');}}><Plus size={16}/> Nova aula</button></div>
          <p className="ev-muted">Cada PDF anexado diretamente cria uma aula com o nome do arquivo. Você pode renomeá-la e complementar o conteúdo depois. Limite: 10 MB por PDF.</p>
          {!moduleLessons.length && <div className="ev-empty"><FileText/><h3>Este módulo ainda não tem conteúdo.</h3><p>Anexe seu PDF ou crie uma aula acima.</p></div>}
          {moduleLessons.length > 0 && <div className="ev-editor-lesson-layout"><nav aria-label={'Aulas de ' + item.title}>{moduleLessons.map((entry, i) => <button key={entry.id} onClick={() => setLessonId(entry.id)} className={'ev-editor-row ' + (lesson?.id === entry.id ? 'selected' : '')}><b>{i + 1}</b><span>{entry.title}<small>{entry.mode === 'equivalent' ? 'Conteúdo principal' : 'Complementar'}</small></span></button>)}</nav>
          {lesson && <section className="ev-editor-materials"><div className="ev-panel-title"><h3>{lesson.title}</h3><button className="ev-link" disabled={!editable || busy} onClick={() => {setError(''); setDialog('editLesson');}}>Editar aula <Edit3 size={14}/></button></div>{lesson.body && <p className="ev-lesson-text">{lesson.body}</p>}
            <h4>Materiais da aula</h4>{assets.map((asset: Row) => <a className="ev-asset" key={asset.id} href={'/api/training/asset/' + asset.id} target="_blank" rel="noreferrer"><FileText size={18}/><span>{asset.name}<small>{(asset.size / 1024 / 1024).toFixed(2)} MB</small></span><Download size={16}/></a>)}
            {!assets.length && <p className="ev-muted">Nenhum material anexado a esta aula.</p>}
            <label className="ev-button outline ev-upload"><Upload size={16}/> Anexar PDF, imagem ou vídeo<input type="file" aria-label="Anexar material à aula" accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.webm" disabled={!editable || busy} onChange={e => {const file = e.target.files?.[0]; e.target.value = ''; if (file) upload(file, 'upload?' + new URLSearchParams({lesson: lesson.id, name: file.name}));}}/></label>
            <h4>Ferramentas por empresa</h4>{resources.map((resource: Row) => <a className="ev-asset" key={resource.id} href={resource.href || '/api/training/resource/' + resource.id} target="_blank" rel="noreferrer"><Link2 size={16}/><span>{resource.title}<small>{resource.company}</small></span></a>)}
            <label>Empresa destinatária<select value={companyId} onChange={e => setCompanyId(e.target.value)}><option value="">Selecione a empresa</option>{grants.filter(g => g.course_id === course.id).map(g => <option key={g.company_id} value={g.company_id}>{companies.find(c => c.id === g.company_id)?.name}</option>)}</select></label>
            <div className="ev-inline-actions"><label className="ev-button outline ev-upload"><Upload size={16}/> Anexar ferramenta<input type="file" aria-label="Anexar ferramenta para a empresa" disabled={busy || !companyId} accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.webp" onChange={e => {const file = e.target.files?.[0]; e.target.value = ''; if (file) upload(file, 'resource-file?' + new URLSearchParams({companyId, lessonId: lesson.id, title: file.name, name: file.name}));}}/></label><button className="ev-button outline" disabled={!companyId || busy} onClick={() => {setError(''); setDialog('link');}}>Adicionar link</button></div>
          </section>}</div>}
        </div>}
      </article>)}
    </section>
    {dialog && <EditorDialog title={dialog === 'cover' ? 'Capa do treinamento' : dialog === 'course' ? 'Editar treinamento' : dialog === 'newModule' ? 'Novo módulo' : dialog === 'editModule' ? 'Editar módulo' : dialog === 'newLesson' ? 'Nova aula' : dialog === 'editLesson' ? 'Editar aula' : 'Vincular ferramenta'} onClose={() => {if (!busy) {setDialog(''); setError('');}}}>
      {error && <p className="ev-alert error" role="alert">{error}</p>}
      {dialog === 'cover' ? <CoverControl kind="course" record={course} onSaved={onRefresh}/> : <form className="ev-fields" onSubmit={async e => {
        const v = values(e);
        if (dialog === 'course') await act(() => api('course/' + course.id, {...v, hours: Number(v.hours), minutes: Number(v.minutes), passing: Number(v.passing), attemptLimit: Number(v.attemptLimit)}, 'PATCH'));
        if (dialog === 'newModule' || dialog === 'editModule') {const result = await act(() => dialog === 'newModule' ? api('course/' + course.id + '/module', {title: v.title, position: Number(v.position)}) : api('modules/' + module.id, {title: v.title, position: Number(v.position)}, 'PATCH')); if (dialog === 'newModule' && result) selectModule((result as Row).id);}
        if (dialog === 'newLesson' || dialog === 'editLesson') {const payload = {...v, moduleId: module.id, position: Number(v.position)}; const result = await act(() => dialog === 'newLesson' ? api('course/' + course.id + '/lesson', payload) : api('lessons/' + lesson.id, payload, 'PATCH')); if (dialog === 'newLesson' && result) setLessonId((result as Row).id);}
        if (dialog === 'link') await act(() => api('resources', {...v, companyId, lessonId: lesson.id}));
      }}>
        {dialog === 'course' ? <><label>Título<input name="title" required maxLength={200} defaultValue={course.title}/></label><label>Descrição<textarea name="description" maxLength={4000} defaultValue={course.description}/></label><label>Carga horária (horas)<input name="hours" type="number" required min={1} max={2000} defaultValue={course.hours}/></label><label>Duração da prova (minutos)<input name="minutes" type="number" required min={1} max={240} defaultValue={Math.round(course.duration / 60)}/></label><label>Nota mínima (%)<input name="passing" type="number" required min={1} max={100} defaultValue={course.passing}/></label><label>Tentativas<input name="attemptLimit" type="number" required min={1} max={10} defaultValue={course.attempt_limit}/></label></> : dialog === 'link' ? <><label>Nome da ferramenta<input name="title" required maxLength={200}/></label><label>Link HTTPS<input name="href" type="url" required/></label></> : <>
          <label>{dialog.includes('Module') ? 'Nome do módulo' : 'Título da aula'}<input name="title" required maxLength={200} defaultValue={dialog === 'editModule' ? module?.title : dialog === 'editLesson' ? lesson?.title : ''}/></label>
          <label>Ordem<input name="position" type="number" min={1} max={1000} required defaultValue={dialog === 'newModule' ? Math.max(0, ...modules.map(m => m.position)) + 1 : dialog === 'editModule' ? module?.position : dialog === 'newLesson' ? Math.max(0, ...moduleLessons.map(l => l.position)) + 1 : lesson?.position}/></label>
          {dialog.includes('Lesson') && <><label>Texto e objetivos (opcional para aulas com PDF)<textarea name="body" maxLength={20000} defaultValue={dialog === 'editLesson' ? lesson?.body : ''}/></label><label>Relação entre formatos<select name="mode" defaultValue={dialog === 'editLesson' ? lesson?.mode : 'equivalent'}><option value="equivalent">Conteúdo principal</option><option value="complementary">Material complementar</option></select></label></>}
        </>}
        <div className="ev-form-actions"><button type="button" className="ev-button outline" disabled={busy} onClick={() => setDialog('')}>Cancelar</button><button className="ev-button lime" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button></div>
      </form>}
    </EditorDialog>}
  </>;
}

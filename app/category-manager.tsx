'use client';
import {useState} from 'react';
import Link from 'next/link';
import {ArrowRight, Edit3, Layers, Plus} from 'lucide-react';
import {EditorDialog} from './editor-dialog';
import {CoverControl} from './content-editor';
import {readTrainingResponse} from '../lib/training/client-response';

type Category = {id: string; title: string; description: string; cover_image?: string};
type Course = {id: string; catalog_id: string};
export function CourseCategoryFilters({categories, selected, basePath}: {
  categories: {id: string; title: string; courses: number}[]; selected: string; basePath: string;
}) {
  return <nav className="ev-category-filters" aria-label="Filtrar treinamentos por categoria">
    <Link className={'ev-pill ' + (!selected ? 'success' : '')} aria-current={!selected ? 'page' : undefined} href={basePath}>Todas as categorias</Link>
    {categories.map(category => <Link className={'ev-pill ' + (selected === category.id ? 'success' : '')} aria-current={selected === category.id ? 'page' : undefined} key={category.id} href={basePath + '?categoria=' + encodeURIComponent(category.id)}>{category.title} <span>({category.courses})</span></Link>)}
  </nav>;
}

export function CategoryManager({categories, courses, onRefresh}: {
  categories: Category[]; courses: Course[]; onRefresh: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const category = categories.find(item => item.id === editing);
  function open(id: string) {setError(''); setNotice(''); setEditing(id);}
  return <>
    <div className="ev-heading"><div><span className="ev-eyebrow">ORGANIZAÇÃO POR SETOR</span><h1>Categorias</h1><p>Classifique os cursos por área da empresa, como Financeiro, Contábil, Compras e Marketing.</p></div><button className="ev-button lime" onClick={() => open('new')}><Plus size={16}/> Nova categoria</button></div>
    {notice && <p className="ev-alert" role="status">{notice}</p>}
    <p className="ev-category-guide">Categoria → Curso → Módulos → Aulas e materiais. A avaliação e o certificado pertencem ao curso.</p>
    <div className="ev-category-grid">{categories.map(item => {
      const count = courses.filter(course => course.catalog_id === item.id).length;
      return <section className="ev-panel ev-category-card" key={item.id}><Layers size={24}/><h2>{item.title}</h2><p>{item.description || 'Cursos relacionados a este setor.'}</p><strong>{count} {count === 1 ? 'curso cadastrado' : 'cursos cadastrados'}</strong><div className="ev-category-actions"><Link className="ev-button outline" href={'/admin/treinamentos?categoria=' + item.id}>Ver cursos <ArrowRight size={15}/></Link><button className="ev-button outline" onClick={() => open(item.id)} aria-label={'Editar categoria ' + item.title}><Edit3 size={15}/> Editar</button></div></section>;
    })}</div>
    {!categories.length && <section className="ev-panel"><h2>Cadastre a primeira categoria</h2><p>Depois, vincule os treinamentos ao setor correspondente.</p></section>}
    {editing && <EditorDialog title={category ? 'Editar categoria' : 'Nova categoria'} onClose={() => {if (!busy) setEditing('');}}>
      {error && <p className="ev-alert error" role="alert">{error}</p>}
      <form className="ev-fields" onSubmit={async event => {
        event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); setBusy(true); setError('');
        try {
          await readTrainingResponse(await fetch('/api/training/categories' + (category ? '/' + category.id : ''), {method: category ? 'PATCH' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(values)}));
          await onRefresh(); setNotice(category ? 'Categoria atualizada.' : 'Categoria criada.'); setEditing('');
        } catch (error) {setError((error as Error).message);} finally {setBusy(false);}
      }}>
        <label>Nome do setor<input name="title" required maxLength={200} defaultValue={category?.title || ''} placeholder="Ex.: Financeiro"/></label>
        <label>Descrição (opcional)<textarea name="description" maxLength={2000} defaultValue={category?.description || ''}/></label>
        <div className="ev-form-actions"><button type="button" className="ev-button outline" disabled={busy} onClick={() => setEditing('')}>Cancelar</button><button className="ev-button lime" disabled={busy}>{busy ? 'Salvando…' : 'Salvar categoria'}</button></div>
      </form>
      {category && <CoverControl kind="catalog" record={category} onSaved={onRefresh}/>}
    </EditorDialog>}
  </>;
}

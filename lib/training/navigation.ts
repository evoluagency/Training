const id = '[a-f0-9-]{36}';
const adminRoutes = new RegExp(`^/admin(?:/(?:empresas(?:/(?:nova|${id}))?|participantes(?:/${id})?|treinamentos(?:/(?:novo|estrutura|${id}/estrutura))?|certificados(?:/${id})?|categorias|ferramentas|provas|comentarios|relatorios|configuracoes))?$`, 'i');
const learnerRoutes = new RegExp(`^/area(?:/(?:treinamentos(?:/${id}(?:/(?:aulas/${id}|avaliacao|pesquisa|certificado|comentarios))?)?|certificados(?:/${id})?|ferramentas|avaliacoes|comentarios|perfil|ajuda|relatorios))?$`, 'i');

export function isPortalRoute(path: string, area: 'admin' | 'learner'): boolean {
  return (area === 'admin' ? adminRoutes : learnerRoutes).test(path);
}

export function activePortalNav(path: string): string {
  if (path.startsWith('/admin/treinamentos/') && path.endsWith('/estrutura')) return '/admin/treinamentos/estrutura';
  if (path.startsWith('/area/treinamentos/')) {
    if (/\/(avaliacao|pesquisa)$/.test(path)) return '/area/avaliacoes';
    if (path.endsWith('/certificado')) return '/area/certificados';
    if (path.endsWith('/comentarios')) return '/area/comentarios';
    return '/area/treinamentos';
  }
  return '/' + path.split('/').filter(Boolean).slice(0, 2).join('/');
}

export function portalPageTitle(path: string): string {
  if (/\/treinamentos\/[^/]+\/estrutura$/.test(path)) return 'Módulos e materiais';
  if (/\/treinamentos\/[^/]+\/aulas\//.test(path)) return 'Aula';
  if (/\/treinamentos\/[^/]+$/.test(path) && !path.endsWith('/novo') && !path.endsWith('/estrutura')) return 'Treinamento';
  const section = path.split('/').filter(Boolean).at(-1) || '';
  return ({admin:'Painel administrativo',area:'Área do participante',empresas:'Empresas e vagas',nova:'Nova empresa',participantes:'Participantes',categorias:'Categorias por setor',treinamentos:'Catálogo de treinamentos',estrutura:'Módulos e aulas',novo:'Novo treinamento',ferramentas:'Ferramentas',provas:'Provas',certificados:'Certificados',certificado:'Certificado',comentarios:'Comentários',relatorios:'Relatórios',configuracoes:'Configurações',perfil:'Meu perfil',ajuda:'Ajuda e acesso',avaliacao:'Avaliação',avaliacoes:'Avaliações',pesquisa:'Pesquisa de experiência'} as Record<string,string>)[section] || 'EVOLU Training';
}

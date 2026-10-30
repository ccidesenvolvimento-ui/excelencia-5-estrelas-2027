// Testes estáticos de integração da navegação e exportações, sem dependências externas.
// Atualização v1.0.1: pendências são exportadas em XLSX, não CSV.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const menu = read('src/components/Navegacao.tsx');
const ranking = read('src/app/ranking/page.tsx');
const pdf = read('src/lib/relatorio-ranking-pdf.ts');
const config = read('src/app/configuracoes/page.tsx');
const css = read('src/app/modulos.css');
const pendencias = read('src/app/pendencias/page.tsx');
const exportadorPendencias = read('src/lib/exportar-pendencias-xlsx.ts');
const importacoes = read('src/app/importacoes/page.tsx');
const pacote = JSON.parse(read('package.json'));

const resultados = [
 ['Menu contém as sete áreas principais', ['/','/ranking','/pendencias','/importacoes','/rh0034','/configuracoes','/diagnostico'].every(r => menu.includes(`url: "${r}"`))],
 ['Painel não aparece no menu', !menu.includes('url: "/painel"')],
 ['Relatórios não aparecem como aba independente', !menu.includes('url: "/relatorios"')],
 ['Usuários não aparecem como aba independente', !menu.includes('url: "/usuarios"')],
 ['Ranking oferece relatórios', ranking.includes('Gerar relatório')],
 ['Top N preserva posições originais', ranking.includes('r.posicao<=limite')],
 ['Relatórios usam apenas elegíveis', ranking.includes('r.status==="Elegível" && r.posicao!==null')],
 ['Relatório do Ranking oferece CSV e PDF direto', ranking.includes('Exportar CSV') && ranking.includes('Baixar PDF') && !ranking.includes('window.print()')],
 ['PDF direto sem contadores desnecessários', !pdf.includes('PARTICIPANTES') && !pdf.includes('ELEGÍVEIS')],
 ['PDF divide Top 20 em páginas de 10 posições', pdf.includes('Math.ceil(dados.registros.length / 10)')],
 ['Configurações incluem usuários e permissões', config.includes('Usuários e acessos') && config.includes('PERMISSÕES POR ABA E OPERAÇÃO')],
 ['Configurações simulam acesso por filial', config.includes('FILIAIS PERMITIDAS') && config.includes('localStorage')],
 ['Importações preservam os seis modelos', importacoes.includes('modelos.map')],
 ['Pendências exportam lista filtrada em XLSX',
    pendencias.includes('const linhas: LinhaPendenciaExcel[] = faltantes.map') &&
    pendencias.includes('await exportarPendenciasXlsx(') &&
    pendencias.includes('Exportar Excel (.xlsx)') &&
    exportadorPendencias.includes('criarFolhaResumo(') &&
    exportadorPendencias.includes('criarFolhaPendencias(') &&
    Boolean(pacote.dependencies && pacote.dependencies.jszip)
 ],
 ['Design transversal está presente', css.includes('.cabecalho-premium') && css.includes('.mod-grid-estatisticas')],
 ['Rotas antigas encaminham para destinos novos', read('src/app/painel/page.tsx').includes('router.replace("/")') && read('src/app/relatorios/page.tsx').includes('router.replace("/ranking")') && read('src/app/usuarios/page.tsx').includes('router.replace("/configuracoes#usuarios")')]
];
for (const [label, ok] of resultados) console.log(`${ok ? '✓' : '✗'} ${label}`);
const ok = resultados.filter(r => r[1]).length;
console.log(`\n${ok}/${resultados.length} verificações da interface aprovadas`);
if (ok !== resultados.length) process.exit(1);

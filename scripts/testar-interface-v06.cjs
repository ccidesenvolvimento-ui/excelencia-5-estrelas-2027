// Testes estáticos de integração da navegação v0.6, sem dependências externas.
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const menu=read('src/components/Navegacao.tsx');
const ranking=read('src/app/ranking/page.tsx');
const config=read('src/app/configuracoes/page.tsx');
const css=read('src/app/modulos.css');
const pendencias=read('src/app/pendencias/page.tsx');
const importacoes=read('src/app/importacoes/page.tsx');
const resultados=[
 ['Menu contém as sete áreas principais', ['/','/ranking','/pendencias','/importacoes','/rh0034','/configuracoes','/diagnostico'].every(r=>menu.includes(`url: "${r}"`))],
 ['Painel não aparece no menu',!menu.includes('url: "/painel"')],
 ['Relatórios não aparecem como aba independente',!menu.includes('url: "/relatorios"')],
 ['Usuários não aparecem como aba independente',!menu.includes('url: "/usuarios"')],
 ['Ranking oferece relatórios',ranking.includes('Gerar relatório')],
 ['Top N preserva posições originais',ranking.includes('r.posicao<=limite')],
 ['Relatórios usam apenas elegíveis',ranking.includes('r.status==="Elegível" && r.posicao!==null')],
 ['Relatório oferece CSV e PDF via impressão',ranking.includes('Exportar CSV')&&ranking.includes('Salvar como PDF')],
 ['Configurações incluem usuários e permissões',config.includes('Usuários e acessos')&&config.includes('PERMISSÕES POR ABA E OPERAÇÃO')],
 ['Configurações simulam acesso por filial',config.includes('FILIAIS PERMITIDAS')&&config.includes('localStorage')],
 ['Importações preservam os seis modelos',importacoes.includes('modelos.map')],
 ['Pendências preservam exportação filtrada',pendencias.includes('faltantes.map')&&pendencias.includes('exportarCsv')],
 ['Design transversal está presente',css.includes('.cabecalho-premium')&&css.includes('.mod-grid-estatisticas')],
 ['Rotas antigas encaminham para destinos novos',read('src/app/painel/page.tsx').includes('router.replace("/")')&&read('src/app/relatorios/page.tsx').includes('router.replace("/ranking")')&&read('src/app/usuarios/page.tsx').includes('router.replace("/configuracoes#usuarios")')]
];
for(const [label,ok] of resultados)console.log(`${ok?'✓':'✗'} ${label}`);
const ok=resultados.filter(r=>r[1]).length;
console.log(`\n${ok}/${resultados.length} verificações da interface aprovadas`);
if(ok!==resultados.length)process.exit(1);

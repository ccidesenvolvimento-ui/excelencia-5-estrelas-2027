/**
 * Teste do XLSX de verdade: gera o arquivo em memória com ExcelJS,
 * reabre o binário e confirma todas as linhas, matrículas e abas.
 * Sem arquivos de RH reais: apenas amostra artificial.
 */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const ExcelJS = require('exceljs');
const arquivo = path.join(__dirname, '..', 'src', 'lib', 'exportar-pendencias-xlsx.ts');
const source = fs.readFileSync(arquivo, 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
}).outputText;
const modulo = new Module(arquivo, module);
modulo.filename = arquivo;
modulo.paths = Module._nodeModulePaths(path.dirname(arquivo));
modulo._compile(code, arquivo);
const { criarBufferPendenciasXlsx } = modulo.exports;

async function executar() {
  const linhas = [
    {nome:'Motorista Teste A',matricula:'000123',filial:'Lavras',segmento:'Florestal',competencia:'Abr/2027',pendencias:['Sem Segurança','Sem Dirigibilidade'],tipos:['seguranca','dirigibilidade'],fonteDirigibilidade:'Gobrax',situacao:'Pendente'},
    {nome:'Operador Teste B',matricula:'O002',filial:'Jataí',segmento:'Operadores de Máquinas e Tratores',competencia:'Abr/2027',pendencias:['Sem Jornada'],tipos:['jornada'],fonteDirigibilidade:'—',situacao:'Pendente'},
  ];
  const filtros = {competencia:'Abr/2027',segmento:'Todos os segmentos',filial:'Todas as filiais',tipo:'Todas as pendências',pesquisa:'Sem filtro',ordenacao:'Nome · crescente'};
  const bytes = await criarBufferPendenciasXlsx({ linhas, filtros, nomeArquivo:'teste.xlsx' });
  assert.ok(bytes.byteLength > 1000, 'O binário XLSX não foi gerado');
  const livro = new ExcelJS.Workbook();
  await livro.xlsx.load(bytes);
  assert.deepEqual(livro.worksheets.map(s=>s.name), ['Resumo','Pendências']);
  const pendencias = livro.getWorksheet('Pendências');
  assert.equal(pendencias.getCell('A9').value,'Motorista Teste A');
  assert.equal(pendencias.getCell('B9').value,'000123');
  assert.equal(pendencias.getCell('A10').value,'Operador Teste B');
  assert.equal(pendencias.getCell('G9').value,2);
  assert.equal(livro.getWorksheet('Resumo').getCell('C14').value,2);
  // Ao reabrir o XLSX, ExcelJS representa o autoFilter como intervalo A1.
  assert.equal(pendencias.autoFilter,'A8:I10');
  const cabecalho = ['Nome do colaborador','Matrícula','Filial','Segmento','Competência','Pendências identificadas','Quantidade','Fonte da Dirigibilidade','Situação'];
  assert.deepEqual(pendencias.getRow(8).values.slice(1), cabecalho);
  assert.deepEqual(pendencias.getRow(9).values.slice(1), ['Motorista Teste A','000123','Lavras','Florestal','Abr/2027','Sem Segurança · Sem Dirigibilidade',2,'Gobrax','Pendente']);
  assert.deepEqual(pendencias.getRow(10).values.slice(1), ['Operador Teste B','O002','Jataí','Operadores de Máquinas e Tratores','Abr/2027','Sem Jornada',1,'—','Pendente']);
  for (const numero of [9, 10]) {
    assert.equal(pendencias.getCell(`B${numero}`).type, ExcelJS.ValueType.String);
    assert.equal(pendencias.getCell(`B${numero}`).numFmt, '@');
  }
  assert.equal(pendencias.columnCount, 9, 'Não deve haver coluna extra deslocada');
  console.log('✓ XLSX válido, duas abas e dois colaboradores preservados, incluindo matrícula 000123.');
  const vazio = await criarBufferPendenciasXlsx({linhas:[],filtros,nomeArquivo:'vazio.xlsx'});
  const livroVazio = new ExcelJS.Workbook();
  await livroVazio.xlsx.load(vazio);
  assert.deepEqual(livroVazio.worksheets.map(s=>s.name), ['Resumo','Pendências']);
  assert.equal(livroVazio.getWorksheet('Resumo').getCell('C14').value,0);
  const pendenciasVazias = livroVazio.getWorksheet('Pendências');
  assert.equal(pendenciasVazias.autoFilter, 'A8:I8');
  assert.deepEqual(pendenciasVazias.getRow(8).values.slice(1), cabecalho);
  assert.equal(pendenciasVazias.getCell('A9').value, null);
  console.log('✓ XLSX sem pendências também abre corretamente.');
}
executar().catch(erro => {console.error('✗', erro); process.exit(1)});

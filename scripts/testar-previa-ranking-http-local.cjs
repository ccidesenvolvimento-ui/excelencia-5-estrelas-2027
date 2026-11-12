// E2E: prévia real HTTP -> SSR -> Supabase local. Apenas dados fictícios em runner.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {execFileSync}=require("node:child_process");
assert.equal(process.env.SUPABASE_URL,"http://127.0.0.1:54321");
assert.equal(process.env.E5_E2E_LOCAL_ONLY,"true");
const fixture=JSON.parse(fs.readFileSync("/tmp/e5-ajustes-e2e-fixture.json","utf8"));
const endpoint="http://127.0.0.1:3197/api/ranking-efetivo?mes=9";
async function login(papel){
 const {email}=fixture.usuarios[papel];
 const r=await fetch("http://127.0.0.1:3197/api/ci-login",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({email,password:fixture.senha})
 });
 assert.equal(r.status,200);
 return r.headers.getSetCookie().map(x=>x.split(";")[0]).join("; ");
}
async function buscar(cookie){
 const r=await fetch(endpoint,{headers:cookie?{cookie}:{},redirect:"manual"});
 assert.match(r.headers.get("cache-control")??"",/(?:^|,)\s*no-store\s*(?:,|$)/i,"Respostas autenticadas não podem ser armazenadas em cache");
 const texto=await r.text();
 const tipo=r.headers.get("content-type")??"";
 assert.ok(tipo.includes("application/json"),
  "API de ranking deve responder JSON (HTTP "+r.status+", content-type "+tipo+"): "+texto.slice(0,500));
 return {status:r.status,body:JSON.parse(texto)};
}
async function executar(){
 assert.equal((await buscar()).status,401,"Sem sessão não pode ler notas");
 const a=await login("adminA"),b=await login("adminB");
 const rb=await buscar(b);assert.equal(rb.status,200);
 assert.equal(rb.body.linhas.length,0,"Filial B não vê colaborador da filial A");
 let ra=await buscar(a);assert.equal(ra.status,200);
 assert.equal(ra.body.rankingOficial,false);assert.equal(ra.body.escopo,"filiais-autorizadas");
 assert.equal(ra.body.linhas.length,0,"Colaborador sem participação homologada ainda não entra");
 // Prepara participação fictícia e três pilares ausentes: sem tocar em cloud.
 const container=execFileSync("docker",["ps","--filter","name=supabase_db_","--format","{{.Names}}"],{encoding:"utf8"})
  .trim().split("\n").find(x=>x.includes("excelencia-5-estrelas-2027"));
 assert.ok(container,"Supabase local indisponível");
 const sql=`BEGIN;
 UPDATE public.colaboradores SET participa_programa=true,categoria_id=1,
  categorizacao_status='manual' WHERE id='${fixture.ids.colaborador}';
 INSERT INTO public.notas_mensais (colaborador_id,competencia,estrela,nota,origem,fonte_dirigibilidade) VALUES
  ('${fixture.ids.colaborador}','2027-10-01','dirigibilidade',80,'planilha','gobrax'),
  ('${fixture.ids.colaborador}','2027-10-01','jornada',90,'planilha',NULL),
  ('${fixture.ids.colaborador}','2027-10-01','treinamentos',100,'planilha',NULL);
 COMMIT;`;
 execFileSync("docker",["exec","-i",container,"psql","-X","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1","-q"],{input:sql,stdio:["pipe","pipe","pipe"]});
 if(process.env.E5_VERIFICAR_SEGURANCA==="true"){
  const sqlSeg=`BEGIN;
   INSERT INTO public.importacoes(tipo,arquivo_nome,competencia,estado)
   VALUES ('advertencias','ci-aviso-ficticio.xlsx','2027-10-01','confirmada');
   INSERT INTO public.penalizacoes_seguranca(colaborador_id,competencia,tipo,descricao,importacao_id)
   SELECT '${fixture.ids.colaborador}','2027-10-01','advertencia',
          'Penalização de Segurança fictícia',id FROM public.importacoes
   WHERE arquivo_nome='ci-aviso-ficticio.xlsx';
   COMMIT;`;
  execFileSync("docker",["exec","-i",container,"psql","-X","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1","-q"],
   {input:sqlSeg,stdio:["pipe","pipe","pipe"]});
 }

 if(process.env.E5_VERIFICAR_RH_TEMPORAL==="true"){
  const sqlRh=`BEGIN;
   INSERT INTO public.ferias (colaborador_id,inicio,termino,dias_gozo)
   VALUES ('${fixture.ids.colaborador}','2027-10-12','2027-10-20',9);
   INSERT INTO public.historico_categorias(colaborador_id,categoria_id,origem,competencia_inicio,competencia_fim)
   VALUES ('${fixture.ids.colaborador}',1,'manual','2027-01-01',NULL);
   COMMIT;`;
  execFileSync("docker",["exec","-i",container,"psql","-X","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1","-q"],
   {input:sqlRh,stdio:["pipe","pipe","pipe"]});
 }

 ra=await buscar(a);assert.equal(ra.status,200);
 assert.equal(ra.body.linhas.length,1);
 const linha=ra.body.linhas[0];
 if(process.env.E5_VERIFICAR_DIAGNOSTICO==="true"){
  assert.equal(ra.body.diagnostico.rankingOficial,false);
  assert.equal(ra.body.diagnostico.participantesAnalisados,1);
  assert.equal(ra.body.diagnostico.registrosComNotasCompletas,1);
  assert.equal(ra.body.diagnostico.linhas[0].notaZero,true);
  assert.ok(ra.body.diagnostico.impedimentosGlobais.includes("ESCOPO_RLS_PARCIAL"));
  assert.equal(rb.body.diagnostico.participantesAnalisados,0);
 }

 if(process.env.E5_VERIFICAR_RH_TEMPORAL==="true"){
  assert.equal(ra.body.diagnostico.fontesHistoricasLidas,true);
  assert.equal(ra.body.diagnostico.linhas[0].feriasNoMes,1);
  assert.equal(ra.body.diagnostico.linhas[0].categoriasHistoricasNoMes,1);
  assert.ok(ra.body.diagnostico.linhas[0].motivos.includes("FERIAS_NO_MES"));
  assert.equal(rb.body.diagnostico.linhas.length,0,"Filial B sem dados de férias/histórico da A");
 }
 if(process.env.E5_VERIFICAR_SEGURANCA==="true"){
  assert.equal(ra.body.seguranca.fonteLida,true);
  assert.equal(ra.body.seguranca.totalAdvertencias,1);
  assert.equal(ra.body.seguranca.fonteAdvertenciasFechada,false);
  assert.equal(ra.body.seguranca.fonteAcidentesFechada,false);
  assert.equal(ra.body.seguranca.linhas[0].notaSeguranca,0);
  assert.deepEqual(ra.body.seguranca.linhas[0].conflitos,[]);
  assert.equal(rb.body.seguranca.linhas.length,0,"Outra filial não vê penalizações");
 }
 assert.equal(linha.score,62,"Score usa produtividade efetiva 90 ajustada pelo E2E anterior");
 assert.equal(linha.status,"Inelegível");
 assert.equal(linha.posicao,null);
 // Exercita um segundo ajuste real (90 -> 95), preservando a origem 75.
 const novo=await fetch("http://127.0.0.1:3197/api/ajustes-notas",{
  method:"POST",headers:{cookie:a,origin:"http://127.0.0.1:3197","content-type":"application/json"},
  body:JSON.stringify({notaId:fixture.ids.nota,notaEsperada:90,novaNota:95,
   justificativa:"Segunda correção auditada para verificação local fictícia do ranking."})
 });
 assert.equal(novo.status,201,"Segundo ajuste auditado autorizado");
 const corrigida=await buscar(a);assert.equal(corrigida.status,200);
 const l=corrigida.body.linhas[0];
 assert.equal(l.notas.produtividade.original,75);
 assert.equal(l.notas.produtividade.efetiva,95);
 assert.equal(l.notas.produtividade.ajustada,true);
 assert.equal(l.score,63.25,"Segundo ajuste deve elevar score em 1,25");
 assert.equal(l.posicao,null,"Sem classificação global");
 assert.equal((await buscar(b)).body.linhas.length,0,"RLS continua isolando filial B");
 console.log("✓ HTTP real: sessão, RLS de filiais, score corrigido, segurança e ausência de posições oficiais.");
}
executar().catch(e=>{console.error(e);process.exitCode=1});

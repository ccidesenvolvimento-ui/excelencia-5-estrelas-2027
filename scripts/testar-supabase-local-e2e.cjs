// Issue #73 — teste REAL de Supabase local (GoTrue/Auth, PostgREST e PostgreSQL).
// Exclusivo de GitHub Actions com stack descartável: não usar Supabase Cloud.
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são geradas pelo Supabase local.
const assert=require("node:assert/strict");
const {createClient}=require("@supabase/supabase-js");
const {execFileSync}=require("node:child_process");
const crypto=require("node:crypto");
const url=process.env.SUPABASE_URL;
const anon=process.env.SUPABASE_ANON_KEY;
const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(url==="http://127.0.0.1:54321","Este teste só funciona no loopback local 54321");
assert.ok(anon&&service,"Chaves efêmeras locais obrigatórias");
const prefix=crypto.randomBytes(6).toString("hex");
const senha="TesteDescartavel-2027-"+prefix;
const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
const anonCliente=()=>createClient(url,anon,{auth:{autoRefreshToken:false,persistSession:false}});
const uid=v=>{assert.match(v,/^[0-9a-f-]{36}$/i);return v};
const id={
 empresa:"62000000-0000-4000-8000-000000000010",
 filialA:"62000000-0000-4000-8000-000000000011",
 filialB:"62000000-0000-4000-8000-000000000012",
 colaborador:"62000000-0000-4000-8000-000000000020",
 nota:"62000000-0000-4000-8000-000000000030",
 seguranca:"62000000-0000-4000-8000-000000000031"
};
const perfis=[
 ["adminA","Admin fictício A",true,true,id.filialA],
 ["comum","Usuário fictício",false,true,id.filialA],
 ["adminB","Admin fictício B",true,true,id.filialB],
 ["inativo","Administrador inativo",true,false,id.filialA]
];
async function checar(promise,contexto){
 const {data,error}=await promise;
 if(error)throw new Error(contexto+": "+error.code+" "+error.message);
 return data;
}
async function executar(){
 const usuarios={};
 for(const [papel] of perfis){
   const email="e5-ci-"+prefix+"-"+papel+"@example.test";
   const usuario=await checar(admin.auth.admin.createUser({email,password:senha,email_confirm:true}),"Criar "+papel);
   usuarios[papel]={email,id:uid(usuario.user.id)};
 }
 // Apenas UUIDs gerados pelo Auth local podem entrar no SQL; nunca usar input externo.
 const perfilSql=perfis.map(([papel,nome,administrador,ativo,filial])=>
   "INSERT INTO public.perfis(usuario_id,nome,administrador,ativo) VALUES ('"+usuarios[papel].id+"','"+nome+"',"+administrador+","+ativo+");\n"+
   "INSERT INTO public.filiais_usuario(usuario_id,filial_id) VALUES ('"+usuarios[papel].id+"','"+filial+"');"
 ).join("\n");
 const sql="BEGIN;\n"+
  "INSERT INTO public.empresas(id,codigo,nome) VALUES ('"+id.empresa+"','CI-E5','Empresa fictícia local');\n"+
  "INSERT INTO public.filiais(id,empresa_id,codigo,nome) VALUES "+
    "('"+id.filialA+"','"+id.empresa+"','CI-A','Filial fictícia A'),"+
    "('"+id.filialB+"','"+id.empresa+"','CI-B','Filial fictícia B');\n"+
  perfilSql+"\n"+
  "INSERT INTO public.colaboradores(id,empresa_id,matricula,nome,filial_id) VALUES ('"+id.colaborador+"','"+id.empresa+"','CI-M01','Motorista fictício','"+id.filialA+"');\n"+
  "INSERT INTO public.notas_mensais(id,colaborador_id,competencia,estrela,nota,origem) VALUES "+
    "('"+id.nota+"','"+id.colaborador+"','2027-10-01','produtividade',75,'planilha'),"+
    "('"+id.seguranca+"','"+id.colaborador+"','2027-10-01','seguranca',0,'seguranca_calculada');\nCOMMIT;\n";
 const container=execFileSync("docker",["ps","--filter","name=supabase_db_","--format","{{.Names}}"],{encoding:"utf8"})
   .trim().split("\n").filter(Boolean).find(x=>x.includes("excelencia-5-estrelas-2027"));
 assert.ok(container,"Banco Supabase local descartável não encontrado");
 execFileSync("docker",["exec","-i",container,"psql","-X","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1","-q"],{input:sql,stdio:["pipe","pipe","pipe"]});
 const clientes={};
 for(const [papel] of perfis){
   clientes[papel]=anonCliente();
   const sessao=await checar(clientes[papel].auth.signInWithPassword({email:usuarios[papel].email,password:senha}),"Login "+papel);
   assert.equal(sessao.user.id,usuarios[papel].id);
   const user=await checar(clientes[papel].auth.getUser(),"Autenticação remota "+papel);
   assert.equal(user.user.id,usuarios[papel].id);
 }
 const consulta=cliente=>cliente.from("notas_mensais_efetivas").select("id,nota,nota_efetiva,estrela,possui_ajuste").eq("competencia","2027-10-01");
 const admAntes=await checar(consulta(clientes.adminA),"Listar filial A");
 assert.equal(admAntes.length,2);
 assert.equal((await checar(consulta(clientes.adminB),"Listar filial B")).length,0,"Não enxergar outra filial");
 assert.equal((await checar(consulta(clientes.inativo),"Listar inativo")).length,0,"Inativo sem leitura");
 const args={p_nota_mensal_id:id.nota,p_nota_nova:90,p_nota_esperada:75,p_justificativa:"Correção de divergência fictícia conferida pelo responsável."};
 for(const papel of ["comum","adminB","inativo"]){
   const {error}=await clientes[papel].rpc("registrar_ajuste_nota",args);
   assert.ok(error,"Usuário "+papel+" precisa ser bloqueado");
   assert.equal(error.code,"42501","Negação por autorização/filial: "+papel);
 }
 const penalidade=await clientes.adminA.rpc("registrar_ajuste_nota",{...args,p_nota_mensal_id:id.seguranca,p_nota_nova:100,p_nota_esperada:0});
 assert.equal(penalidade.error?.code,"22023","Segurança não admite correção");
 const registrado=await checar(clientes.adminA.rpc("registrar_ajuste_nota",args),"RPC real de ajuste");
 assert.ok(registrado,"RPC deve devolver ID de histórico");
 const conflito=await clientes.adminA.rpc("registrar_ajuste_nota",{...args,p_nota_nova:85});
 assert.equal(conflito.error?.code,"40001","Conflito de concorrência precisa ser detectado");
 const depois=await checar(consulta(clientes.adminA),"Ler nota efetiva");
 const nota=depois.find(n=>n.id===id.nota);
 assert.equal(nota.nota,75,"Nota original preservada");
 assert.equal(nota.nota_efetiva,90,"Nota efetiva real na view");
 assert.equal(nota.possui_ajuste,true);
 const eventos=await checar(clientes.adminA.from("ajustes_notas").select("nota_anterior,nota_nova,justificativa,usuario_id").eq("nota_mensal_id",id.nota),"Histórico RLS");
 assert.equal(eventos.length,1);
 assert.equal(eventos[0].usuario_id,usuarios.adminA.id);
 assert.equal(eventos[0].nota_anterior,75);
 assert.equal(eventos[0].nota_nova,90);
 assert.equal((await checar(clientes.adminB.from("ajustes_notas").select("id"),"Histórico outra filial")).length,0);
 const auditoriaSql="SELECT COUNT(*) AS total FROM public.auditoria WHERE registro_id='"+id.nota+"' AND acao='ajuste_administrativo_nota';";
 const audit=execFileSync("docker",["exec","-i",container,"psql","-X","-U","postgres","-d","postgres","-At","-c",auditoriaSql],{encoding:"utf8"}).trim();
 assert.equal(audit,"1","Auditoria real precisa registrar um ajuste");
 console.log("✓ Supabase local real: 4 logins GoTrue, RLS de filiais, bloqueios, RPC, concorrência, nota efetiva, histórico e auditoria.");
}
executar().catch(e=>{console.error(e);process.exitCode=1;});

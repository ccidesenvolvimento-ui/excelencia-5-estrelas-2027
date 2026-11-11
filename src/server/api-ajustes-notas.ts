/**
 * API de ajustes de notas, exclusiva do servidor Next.js Node.
 * NÃO incluir automaticamente em src/app: os builds estáticos continuam demo.
 *
 * Segurança: o Supabase SSR usa a sessão do usuário e a publishable key;
 * nenhuma service_role ou credencial privilegiada é aceita aqui.
 * A RPC no PostgreSQL efetua todas as verificações em transação.
 */
import "server-only";
import { criarClienteAutenticadoServidor } from "@/lib/supabase/sessao-servidor";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FLAG = "EXCELENCIA_AJUSTES_API_ENABLED";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
const ESTRELAS = new Set(["seguranca","produtividade","dirigibilidade","jornada","treinamentos"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Erro = { erro: string };
function json(body:unknown,status=200) {
  return Response.json(body,{status,headers:NO_STORE});
}
function negado(status:401|403|503) {
  return json({erro:status===503?"Recurso indisponível.":status===401?"Autenticação necessária.":"Acesso não autorizado."} satisfies Erro,status);
}
function flagAtiva() {
  // Fail closed. O proxy Auth também deve estar habilitado.
  return process.env[FLAG]==="true"
    && process.env.EXCELENCIA_AUTH_GUARD_ENABLED==="true";
}
function origemValida(request:NextRequest) {
  const origem=request.headers.get("origin");
  const host=request.headers.get("host");
  if (!origem || !host) return false;
  try {
    const url=new URL(origem);
    return (url.protocol==="https:" || (process.env.NODE_ENV!=="production" && url.protocol==="http:"))
      && url.host.toLowerCase()===host.toLowerCase()
      && url.username==="" && url.password==="" && url.pathname==="/" && url.search==="";
  } catch { return false; }
}
async function obterSessaoAutorizada() {
  const cliente=await criarClienteAutenticadoServidor();
  const { data:userData,error:userError }=await cliente.auth.getUser();
  if(userError||!userData.user)return null;
  const { data:admin,error:adminError }=await cliente.rpc("eh_administrador_ativo");
  if(adminError || admin!==true)return { cliente,admin:false };
  return {cliente,admin:true};
}

/** Listagem limitada, por competência e pilar, sempre com RLS. */
export async function GET(request:NextRequest) {
  if(!flagAtiva())return negado(503);
  try {
    const sessao=await obterSessaoAutorizada();
    if(!sessao)return negado(401);
    if(!sessao.admin)return negado(403);
    const search=request.nextUrl.searchParams;
    const competencia=search.get("competencia")??"";
    const estrela=search.get("estrela")??"";
    const offset=Number(search.get("offset")??"0");
    if(competencia && !/^20\d\d-(0[1-9]|1[0-2])-01$/.test(competencia))return json({erro:"Competência inválida."},422);
    if(estrela&&!ESTRELAS.has(estrela))return json({erro:"Pilar inválido."},422);
    if(!Number.isSafeInteger(offset)||offset<0||offset>10000)return json({erro:"Paginação inválida."},422);

    let consulta=sessao.cliente
      .from("notas_mensais_efetivas")
      .select("id,colaborador_id,competencia,estrela,nota,nota_efetiva,possui_ajuste")
      .order("competencia",{ascending:false})
      .order("id",{ascending:true})
      .range(offset,offset+49);
    if(competencia)consulta=consulta.eq("competencia",competencia);
    if(estrela)consulta=consulta.eq("estrela",estrela);
    const { data:linhas,error }=await consulta;
    if(error)return json({erro:"Não foi possível consultar as notas."},503);

    const ids=[...new Set((linhas??[]).map(x=>x.colaborador_id))];
    const idsNotas=(linhas??[]).map(x=>x.id);
    const [colaboradores,historico]=await Promise.all([
      ids.length?sessao.cliente.from("colaboradores").select("id,matricula,nome,filial_id").in("id",ids):Promise.resolve({data:[],error:null}),
      idsNotas.length?sessao.cliente.from("ajustes_notas").select("id,nota_mensal_id,nota_anterior,nota_nova,justificativa,usuario_id,criado_em").in("nota_mensal_id",idsNotas).order("id",{ascending:true}).limit(200):Promise.resolve({data:[],error:null})
    ]);
    if(colaboradores.error||historico.error)return json({erro:"Não foi possível consultar os detalhes."},503);
    const mapa=new Map((colaboradores.data??[]).map(c=>[c.id,c]));
    const notas=(linhas??[]).filter(n=>mapa.has(n.colaborador_id)).map(n=>({...n,colaborador:mapa.get(n.colaborador_id)}));
    return json({notas,historico:historico.data??[],proximoOffset:(linhas??[]).length===50?offset+50:null,
      aviso:"Autorização por filial aplicada pelo banco de dados."});
  } catch {
    return json({erro:"Serviço de consulta indisponível."},503);
  }
}

/** Escrita exclusivamente via RPC auditada; nunca via UPDATE em notas_mensais. */
export async function POST(request:NextRequest) {
  if(!flagAtiva())return negado(503);
  if(!origemValida(request))return negado(403);
  const contentType=request.headers.get("content-type")??"";
  if(!contentType.toLowerCase().startsWith("application/json"))return json({erro:"Formato inválido."},415);
  const size=Number(request.headers.get("content-length")??"0");
  if(!Number.isFinite(size)||size>4096)return json({erro:"Solicitação muito grande."},413);
  let payload:Record<string,unknown>;
  try {
    const texto=await request.text();
    if(texto.length>4096)return json({erro:"Solicitação muito grande."},413);
    const valor:unknown=JSON.parse(texto);
    if(!valor||typeof valor!=="object"||Array.isArray(valor))return json({erro:"Dados inválidos."},422);
    payload=valor as Record<string,unknown>;
  } catch {return json({erro:"JSON inválido."},422);}
  const {notaId,novaNota,notaEsperada,justificativa}=payload;
  if(Object.keys(payload).some(x=>!["notaId","novaNota","notaEsperada","justificativa"].includes(x))
    || typeof notaId!=="string"||!UUID.test(notaId)
    || typeof novaNota!=="number"||!Number.isFinite(novaNota)||novaNota<0||novaNota>100
    || Math.round(novaNota*100)!==novaNota*100
    || typeof notaEsperada!=="number"||!Number.isFinite(notaEsperada)||notaEsperada<0||notaEsperada>100
    || Math.round(notaEsperada*100)!==notaEsperada*100
    || typeof justificativa!=="string"
    || justificativa.trim().length<15||justificativa.trim().length>1000
    || novaNota===notaEsperada
  )return json({erro:"Nota ou justificativa inválida."},422);

  try {
    const sessao=await obterSessaoAutorizada();
    if(!sessao)return negado(401);
    if(!sessao.admin)return negado(403);
    // PostgreSQL também verifica admin, filial, Segurança e concorrência.
    const {data,error}=await sessao.cliente.rpc("registrar_ajuste_nota",{
      p_nota_mensal_id:notaId,p_nota_nova:novaNota,p_nota_esperada:notaEsperada,
      p_justificativa:justificativa.trim()
    });
    if(error) {
      // SQLSTATE 40001: nota esperada não corresponde à versão atual.
      if(error.code==="40001")return json({erro:"A nota mudou. Recarregue antes de corrigir."},409);
      if(error.code==="42501")return negado(403);
      if(error.code==="22023"||error.code==="23514")return json({erro:"Ajuste recusado pelas regras de avaliação."},422);
      return json({erro:"Não foi possível registrar o ajuste."},503);
    }
    return json({ajusteId:data,registrado:true},201);
  } catch {return json({erro:"Serviço de ajuste indisponível."},503);}
}

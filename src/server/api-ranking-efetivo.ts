/** API Node opt-in: prévia de notas efetivas limitada ao escopo RLS. */
import "server-only";
import type { NextRequest } from "next/server";
import { consultarBaseRankingEfetivo } from "./consulta-ranking-efetivo";
import { projetarPreviaEfetiva } from "@/lib/projecao-ranking-efetivo";
import { diagnosticarProntidao } from "@/lib/diagnostico-prontidao-ranking";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
function resposta(body:unknown,status=200){return Response.json(body,{status,headers:HEADERS})}
export async function GET(request:NextRequest){
 if(process.env.EXCELENCIA_AUTH_GUARD_ENABLED!=="true"||process.env.EXCELENCIA_AJUSTES_API_ENABLED!=="true"
  ||process.env.EXCELENCIA_RANKING_PREVIA_ENABLED!=="true")return resposta({erro:"Prévia indisponível."},503);
 const raw=request.nextUrl.searchParams.get("mes")??"9";
 if(!/^(?:[0-9]|10|11)$/.test(raw))return resposta({erro:"Mês inválido."},422);
 try{
  const base=await consultarBaseRankingEfetivo();
  const mes=Number(raw);
  return resposta({...projetarPreviaEfetiva(base,mes),
   diagnostico:diagnosticarProntidao(base,`2027-${String(mes+1).padStart(2,"0")}-01`)});
 }catch(erro){
  // Mensagens internas de banco, autenticação e RLS não são expostas ao cliente.
  if(erro instanceof Error&&erro.message==="Sessão não autenticada")return resposta({erro:"Autenticação necessária."},401);
  return resposta({erro:"Não foi possível consultar a prévia."},503);
 }
}

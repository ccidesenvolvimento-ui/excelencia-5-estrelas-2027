/**
 * Diagnóstico de prontidão: NÃO habilita ranking, premiação nem posições.
 * Trabalha somente com a base já lida sob a sessão/RLS do usuário.
 */
import type { BaseRankingAutorizada } from "../server/consulta-ranking-efetivo";
import { categorias, estrelas, type Categoria } from "./calculo-ranking";
export type MotivoProntidao =
 | "SEM_IDENTIFICACAO" | "SEM_FILIAL" | "SEM_CATEGORIA"
 | "SITUACAO_RH_NAO_HOMOLOGADA" | "DESLIGADO"
 | "SEM_NOTA" | "SEGURANCA_INVALIDA"
 | "SEM_DATA_ADMISSAO" | "HISTORICO_CATEGORIA_NAO_VALIDADO"
 | "FERIAS_NAO_HOMOLOGADAS" | "SEGURANCA_SEM_FECHAMENTO"
 | "ESCOPO_RLS_PARCIAL";
export type LinhaDiagnostico={
 colaboradorId:string; matricula:string; nome:string; filialId:string|null;
 motivos:MotivoProntidao[]; pilaresAusentes:string[]; notasPresentes:number;
 notaZero:boolean;
};
export type DiagnosticoProntidao={
 competencia:string;escopo:"filiais-autorizadas";rankingOficial:false;
 participantesAnalisados:number;naoParticipantesIgnorados:number;
 registrosComNotasCompletas:number;registrosPendentes:number;
 totaisPorMotivo:Partial<Record<MotivoProntidao,number>>;
 linhas:LinhaDiagnostico[]; impedimentosGlobais:MotivoProntidao[];
};
const COMPETENCIA=/^2027-(0[1-9]|1[0-2])-01$/;
const validas=new Set<string>(categorias);
const globais:MotivoProntidao[]=[
 "SEM_DATA_ADMISSAO","HISTORICO_CATEGORIA_NAO_VALIDADO",
 "FERIAS_NAO_HOMOLOGADAS","SEGURANCA_SEM_FECHAMENTO","ESCOPO_RLS_PARCIAL"
];
export function diagnosticarProntidao(base:BaseRankingAutorizada,competencia:string):DiagnosticoProntidao{
 if(base.escopo!=="filiais-autorizadas"||base.rankingOficial!==false||!COMPETENCIA.test(competencia))
  throw new Error("Escopo ou competência não autorizados");
 const mapaCategoria=new Map(base.categorias.map(c=>[c.id,c.nome]));
 const notas=new Map<string,Map<string,number>>();
 const notasIds=new Set<string>();
 for(const reg of base.registros){
  if(reg.competencia!==competencia)continue;
  const key=reg.colaboradorId+"|"+reg.estrela;
  if(notasIds.has(key))throw new Error("Nota duplicada no diagnóstico");
  notasIds.add(key);
  if(!estrelas.includes(reg.estrela))throw new Error("Pilar desconhecido");
  const nota=reg.registro.efetiva;
  if(!Number.isFinite(nota)||nota<0||nota>100)throw new Error("Nota inválida");
  const porPessoa=notas.get(reg.colaboradorId)??new Map<string,number>();
  porPessoa.set(reg.estrela,nota);
  notas.set(reg.colaboradorId,porPessoa);
 }
 const linhas:LinhaDiagnostico[]=[];
 let ignorados=0,completos=0;
 const totais:Partial<Record<MotivoProntidao,number>>={};
 for(const c of base.colaboradores){
  if(!c.participa_programa){ignorados++;continue}
  const motivos:MotivoProntidao[]=[];
  if(!c.nome?.trim()||!c.matricula?.trim())motivos.push("SEM_IDENTIFICACAO");
  if(!c.filial_id)motivos.push("SEM_FILIAL");
  const nomeCategoria=c.categoria_id===null?null:mapaCategoria.get(c.categoria_id);
  if(!nomeCategoria||!validas.has(nomeCategoria))motivos.push("SEM_CATEGORIA");
  // situacao_rh é texto livre no schema: jamais inferir elegibilidade de "Ativo".
  motivos.push("SITUACAO_RH_NAO_HOMOLOGADA");
  if(c.desligado_manual||c.desligado_em)motivos.push("DESLIGADO");
  const porPessoa=notas.get(c.id)??new Map();
  const ausentes=estrelas.filter(e=>!porPessoa.has(e));
  if(ausentes.length)motivos.push("SEM_NOTA");
  const seg=porPessoa.get("seguranca");
  if(seg!==undefined&&seg!==0&&seg!==100)motivos.push("SEGURANCA_INVALIDA");
  if(ausentes.length===0)completos++;
  for(const m of motivos)totais[m]=(totais[m]??0)+1;
  linhas.push({colaboradorId:c.id,matricula:c.matricula,nome:c.nome,filialId:c.filial_id,
   motivos,pilaresAusentes:[...ausentes],notasPresentes:estrelas.length-ausentes.length,
   notaZero:[...porPessoa.values()].some(n=>n===0)});
 }
 linhas.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")||a.matricula.localeCompare(b.matricula,"pt-BR"));
 return {competencia,escopo:"filiais-autorizadas",rankingOficial:false,
  participantesAnalisados:linhas.length,naoParticipantesIgnorados:ignorados,
  registrosComNotasCompletas:completos,registrosPendentes:linhas.length-completos,
  totaisPorMotivo:totais,linhas,impedimentosGlobais:[...globais]};
}

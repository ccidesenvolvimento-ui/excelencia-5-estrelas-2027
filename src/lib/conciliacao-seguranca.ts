/** Conciliação read-only, nunca atribui nota nem fecha fontes. */
import type { BaseRankingAutorizada } from "../server/consulta-ranking-efetivo";
import { dataValida } from "./dominio-rh-temporal";

export type PenalizacaoSeguranca={
 id:string;colaborador_id:string;competencia:string;
 tipo:"advertencia"|"acidente";descricao:string;importacao_id:string;
};
export type ConflitoSeguranca="PENALIZACAO_COM_NOTA_100"|"PENALIZACAO_SEM_NOTA"|"NOTA_ZERO_SEM_PENALIZACAO";
export type LinhaConciliacao={
 colaboradorId:string;matricula:string;nome:string;
 advertencias:number;acidentes:number;notaSeguranca:number|null;
 conflitos:ConflitoSeguranca[];
};
export type ConciliacaoSeguranca={
 competencia:string;escopo:"filiais-autorizadas";rankingOficial:false;
 fonteLida:boolean;fonteAdvertenciasFechada:false;fonteAcidentesFechada:false;
 totalAdvertencias:number;totalAcidentes:number;linhas:LinhaConciliacao[];
 avisos:string[];
};
const COMPETENCIA=/^2027-(0[1-9]|1[0-2])-01$/;
export function validarPenalizacoes(
 registros:readonly PenalizacaoSeguranca[],colaboradores:readonly {id:string}[]
):PenalizacaoSeguranca[]{
 const ids=new Set(colaboradores.map(c=>c.id)),vistos=new Set<string>();
 return registros.map(p=>{
  if(!p||typeof p.id!=="string"||!p.id||vistos.has(p.id)||!ids.has(p.colaborador_id)
   ||!dataValida(p.competencia)||!p.competencia.endsWith("-01")
   ||!["advertencia","acidente"].includes(p.tipo)
   ||typeof p.descricao!=="string"||!p.descricao.trim()
   ||typeof p.importacao_id!=="string"||!p.importacao_id)
   throw new Error("Penalização inválida ou fora do escopo RLS");
  vistos.add(p.id);return p;
 });
}
export function conciliarSeguranca(base:BaseRankingAutorizada,competencia:string):ConciliacaoSeguranca{
 if(base.escopo!=="filiais-autorizadas"||base.rankingOficial!==false||!COMPETENCIA.test(competencia))
  throw new Error("Escopo ou competência inválidos");
 const fonteLida=base.fonteSegurancaLida===true&&Array.isArray(base.penalizacoesSeguranca);
 const penalizacoes=fonteLida?(base.penalizacoesSeguranca??[]).filter(p=>p.competencia===competencia):[];
 const porPessoa=new Map<string,{advertencias:number;acidentes:number}>();
 for(const p of penalizacoes){
  const x=porPessoa.get(p.colaborador_id)??{advertencias:0,acidentes:0};
  if(p.tipo==="advertencia")x.advertencias++;else x.acidentes++;
  porPessoa.set(p.colaborador_id,x);
 }
 const notas=new Map<string,number>();
 for(const r of base.registros){
  if(r.competencia!==competencia||r.estrela!=="seguranca")continue;
  if(notas.has(r.colaboradorId))throw new Error("Nota de Segurança duplicada");
  if(r.registro.ajustada||r.registro.original!==r.registro.efetiva||
    ![0,100].includes(r.registro.efetiva))throw new Error("Segurança inconsistente");
  notas.set(r.colaboradorId,r.registro.efetiva);
 }
 const linhas:LinhaConciliacao[]=[];
 if(fonteLida)for(const c of base.colaboradores){
  if(!c.participa_programa)continue;
  const qtd=porPessoa.get(c.id)??{advertencias:0,acidentes:0};
  const nota=notas.get(c.id)??null;
  const conflitos:ConflitoSeguranca[]=[];
  if(qtd.advertencias+qtd.acidentes>0){
   if(nota===100)conflitos.push("PENALIZACAO_COM_NOTA_100");
   if(nota===null)conflitos.push("PENALIZACAO_SEM_NOTA");
  }else if(nota===0)conflitos.push("NOTA_ZERO_SEM_PENALIZACAO");
  linhas.push({colaboradorId:c.id,nome:c.nome,matricula:c.matricula,
   ...qtd,notaSeguranca:nota,conflitos});
 }
 linhas.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")||a.matricula.localeCompare(b.matricula,"pt-BR"));
 return {competencia,escopo:"filiais-autorizadas",rankingOficial:false,
  fonteLida,fonteAdvertenciasFechada:false,fonteAcidentesFechada:false,
  totalAdvertencias:penalizacoes.filter(p=>p.tipo==="advertencia").length,
  totalAcidentes:penalizacoes.filter(p=>p.tipo==="acidente").length,linhas,
  avisos:[
   "Consulta RLS parcial por filial; não corresponde à população global.",
   "Advertências e acidentes não possuem comprovação de fechamento das fontes.",
   "Ausência de penalizações não autoriza nota de Segurança 100.",
   "Nota zero sem penalização na base consultada requer revisão, não prova erro."
  ]};
}

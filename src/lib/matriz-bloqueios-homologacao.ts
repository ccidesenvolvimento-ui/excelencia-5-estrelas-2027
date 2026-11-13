/**
 * Matriz de bloqueios da homologação — somente diagnóstico autorizado por RLS.
 *
 * Não aprova premiações, não substitui fontes de RH, não calcula posições.
 * Na ausência de prova formal das condições globais, o status nunca é "pronto".
 */
import type { DiagnosticoProntidao, MotivoProntidao } from "./diagnostico-prontidao-ranking";
import type { ConciliacaoSeguranca, ConflitoSeguranca } from "./conciliacao-seguranca";

export type ClasseBloqueio="dados"|"seguranca"|"rh"|"governanca";
export type EvidenciaBloqueio="observado"|"nao_comprovado"|"conflito";
export type Bloqueio={
 codigo:string;classe:ClasseBloqueio;evidencia:EvidenciaBloqueio;
 descricao:string;colaboradorId:string|null;
};
export type MatrizBloqueios={
 competencia:string;escopo:"filiais-autorizadas";rankingOficial:false;
 situacao:"BLOQUEADO";
 participantesAnalisados:number;completosNasNotas:number;
 totalComBloqueios:number;bloqueios:Bloqueio[];
 quantidadesPorClasse:Record<ClasseBloqueio,number>;
 requisitosGlobaisNaoComprovados:string[];
};

const CLASSES:Record<string,ClasseBloqueio>={
 SEM_IDENTIFICACAO:"dados",SEM_FILIAL:"dados",SEM_CATEGORIA:"dados",SEM_NOTA:"dados",
 SEGURANCA_INVALIDA:"seguranca",DESLIGADO:"rh",
 SITUACAO_RH_NAO_HOMOLOGADA:"rh",FONTE_RH_NAO_CONSULTADA:"rh",
 FERIAS_NO_MES:"rh",FERIAS_SOBREPOSTAS:"rh",
 CATEGORIA_HISTORICA_AUSENTE:"rh",HISTORICO_CATEGORIAS_SOBREPOSTO:"rh",
 CATEGORIA_HISTORICA_DIVERGENTE:"rh"
};
const CONFLITOS:Record<ConflitoSeguranca,EvidenciaBloqueio>={
 PENALIZACAO_COM_NOTA_100:"conflito",
 PENALIZACAO_SEM_NOTA:"observado",
 NOTA_ZERO_SEM_PENALIZACAO:"nao_comprovado"
};
const REQUISITOS_GLOBAIS=[
 "ESCOPO_RLS_PARCIAL",
 "SEM_DATA_ADMISSAO",
 "SITUACAO_RH_NAO_HOMOLOGADA",
 "FERIAS_NAO_HOMOLOGADAS",
 "HISTORICO_CATEGORIA_NAO_VALIDADO",
 "SEGURANCA_SEM_FECHAMENTO_DE_ADVERTENCIAS",
 "SEGURANCA_SEM_FECHAMENTO_DE_ACIDENTES",
 "AUSENCIA_DE_ATESTADO_DE_ABRANGENCIA_GLOBAL"
] as const;

function validaMes(c:string):boolean{
 return /^2027-(0[1-9]|1[0-2])-01$/.test(c);
}
function validarEntrada(d:DiagnosticoProntidao,s:ConciliacaoSeguranca):void{
 if(d.escopo!=="filiais-autorizadas"||s.escopo!=="filiais-autorizadas"
  ||d.rankingOficial!==false||s.rankingOficial!==false
  ||d.competencia!==s.competencia||!validaMes(d.competencia))
  throw new Error("Matriz recusada: período ou escopo inconsistente");
 if(d.participantesAnalisados!==d.linhas.length)throw new Error("Contagem divergente do diagnóstico");
 if(s.fonteAdvertenciasFechada!==false||s.fonteAcidentesFechada!==false)
  throw new Error("Fechamento não certificado pelas fontes");
 const ids=new Set<string>();
 for(const l of d.linhas){
  if(!l.colaboradorId||ids.has(l.colaboradorId))throw new Error("Colaborador duplicado na matriz");
  ids.add(l.colaboradorId);
 }
 const segurancaIds=new Set<string>();
 for(const l of s.linhas){
  if(!ids.has(l.colaboradorId)||segurancaIds.has(l.colaboradorId))
   throw new Error("Conciliação fora do escopo da matriz");
  segurancaIds.add(l.colaboradorId);
 }
 if(s.fonteLida&&s.linhas.length!==d.linhas.length)
  throw new Error("Conciliação de Segurança incompleta");
 if(!s.fonteLida&&s.linhas.length!==0)throw new Error("Fonte de Segurança não lida com resultados");
}
export function montarMatrizBloqueios(
 diagnostico:DiagnosticoProntidao,seguranca:ConciliacaoSeguranca
):MatrizBloqueios{
 validarEntrada(diagnostico,seguranca);
 const bloqueios:Bloqueio[]=[];
 const add=(codigo:string,classe:ClasseBloqueio,evidencia:EvidenciaBloqueio,
  descricao:string,colaboradorId:string|null=null)=>{
  bloqueios.push({codigo,classe,evidencia,descricao,colaboradorId});
 };
 const globais=[...REQUISITOS_GLOBAIS];
 for(const codigo of globais){
  add(codigo,"governanca","nao_comprovado",codigo.replaceAll("_"," "));
 }
 if(!seguranca.fonteLida){
  add("FONTE_SEGURANCA_NAO_CONSULTADA","seguranca","nao_comprovado",
   "Penalizações de Segurança não consultadas");
 }
 if(!diagnostico.fontesHistoricasLidas){
  add("FONTES_RH_NAO_CONSULTADAS","rh","nao_comprovado","Histórico de categorias e férias não consultados");
 }
 const conflitosPorId=new Map(seguranca.linhas.map(l=>[l.colaboradorId,l.conflitos]));
 const comBloqueios=new Set<string>();
 for(const linha of diagnostico.linhas){
  comBloqueios.add(linha.colaboradorId);
  for(const motivo of linha.motivos){
   const classe=CLASSES[motivo as MotivoProntidao];
   if(!classe)throw new Error("Motivo de diagnóstico não mapeado: "+motivo);
   add(motivo,classe,motivo==="SITUACAO_RH_NAO_HOMOLOGADA"||motivo==="FONTE_RH_NAO_CONSULTADA"
    ?"nao_comprovado":"observado",motivo.replaceAll("_"," "),linha.colaboradorId);
  }
  const conflitos=conflitosPorId.get(linha.colaboradorId)??[];
  for(const conflito of conflitos){
   add(conflito,"seguranca",CONFLITOS[conflito],conflito.replaceAll("_"," "),linha.colaboradorId);
  }
 }
 // A contagem de colaboradores com bloqueios inclui impedimento global que
 // afeta toda a população; nunca significa aprovação individual de premiação.
 const porClasse:Record<ClasseBloqueio,number>={dados:0,seguranca:0,rh:0,governanca:0};
 for(const b of bloqueios)porClasse[b.classe]++;
 return {
  competencia:diagnostico.competencia,escopo:"filiais-autorizadas",rankingOficial:false,
  situacao:"BLOQUEADO",participantesAnalisados:diagnostico.participantesAnalisados,
  completosNasNotas:diagnostico.registrosComNotasCompletas,
  totalComBloqueios:comBloqueios.size,
  bloqueios,quantidadesPorClasse:porClasse,
  requisitosGlobaisNaoComprovados:globais
 };
}

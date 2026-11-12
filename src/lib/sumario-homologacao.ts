/**
 * Relatório técnico agregado da homologação.
 * NÃO é ranking, não contém registros individuais e nunca confirma liberação.
 */
import type { MatrizBloqueios, ClasseBloqueio } from "./matriz-bloqueios-homologacao";

const CLASSES=["dados","seguranca","rh","governanca"] as const;
const EVIDENCIAS=["observado","nao_comprovado","conflito"] as const;
const REQUISITOS=[
 "ESCOPO_RLS_PARCIAL","SEM_DATA_ADMISSAO","SITUACAO_RH_NAO_HOMOLOGADA",
 "FERIAS_NAO_HOMOLOGADAS","HISTORICO_CATEGORIA_NAO_VALIDADO",
 "SEGURANCA_SEM_FECHAMENTO_DE_ADVERTENCIAS",
 "SEGURANCA_SEM_FECHAMENTO_DE_ACIDENTES",
 "AUSENCIA_DE_ATESTADO_DE_ABRANGENCIA_GLOBAL"
] as const;
const validarContagem=(n:unknown)=>typeof n==="number"&&Number.isSafeInteger(n)&&n>=0;
export type SumarioHomologacao={
 versao:1;tipo:"SUMARIO_AGREGADO_NAO_OFICIAL";
 competencia:string;escopo:"filiais-autorizadas";rankingOficial:false;
 situacao:"BLOQUEADO";
 participantesAnalisados:number;completosNasNotas:number;
 totalComBloqueios:number;totalOcorrencias:number;
 quantidadesPorClasse:Record<ClasseBloqueio,number>;
 quantidadesPorEvidencia:Record<"observado"|"nao_comprovado"|"conflito",number>;
 requisitosGlobaisNaoComprovados:string[];
 avisos:string[];
};
/** Saída com campos explicitamente permitidos; nunca serializar a matriz original. */
export function gerarSumarioHomologacao(matriz:MatrizBloqueios):SumarioHomologacao{
 if(!matriz||matriz.competencia===undefined||
  !/^2027-(0[1-9]|1[0-2])-01$/.test(matriz.competencia)||
  matriz.escopo!=="filiais-autorizadas"||matriz.rankingOficial!==false||
  matriz.situacao!=="BLOQUEADO"||
  !validarContagem(matriz.participantesAnalisados)||
  !validarContagem(matriz.completosNasNotas)||
  !validarContagem(matriz.totalComBloqueios)||
  matriz.completosNasNotas>matriz.participantesAnalisados||
  matriz.totalComBloqueios>matriz.participantesAnalisados||
  !Array.isArray(matriz.bloqueios)||!Array.isArray(matriz.requisitosGlobaisNaoComprovados))
  throw new Error("Matriz de homologação inválida");
 const requisitos=new Set(matriz.requisitosGlobaisNaoComprovados);
 if(requisitos.size!==REQUISITOS.length||
  REQUISITOS.some(req=>!requisitos.has(req)))throw new Error("Comprovações globais incompletas");
 const classes:Record<ClasseBloqueio,number>={dados:0,seguranca:0,rh:0,governanca:0};
 const evidencias:SumarioHomologacao["quantidadesPorEvidencia"]={observado:0,nao_comprovado:0,conflito:0};
 const individuos=new Set<string>();
 for(const item of matriz.bloqueios){
  if(!item||!CLASSES.includes(item.classe)||!EVIDENCIAS.includes(item.evidencia)||
   typeof item.codigo!=="string"||!/^[A-Z0-9_]{3,100}$/.test(item.codigo)||
   (item.colaboradorId!==null&&(typeof item.colaboradorId!=="string"||!item.colaboradorId)))
   throw new Error("Bloqueio de homologação inconsistente");
  classes[item.classe]++;
  evidencias[item.evidencia]++;
  if(item.colaboradorId!==null)individuos.add(item.colaboradorId);
 }
 for(const classe of CLASSES)if(classes[classe]!==matriz.quantidadesPorClasse?.[classe])
  throw new Error("Contagem de bloqueios divergente");
 if(individuos.size>matriz.totalComBloqueios)throw new Error("População inconsistente");
 if(matriz.bloqueios.length<REQUISITOS.length||
  matriz.bloqueios.some(b=>b.colaboradorId===null&&b.classe==="governanca"&&!requisitos.has(b.codigo)))
  throw new Error("Comprovações inválidas");
 return {
  versao:1,tipo:"SUMARIO_AGREGADO_NAO_OFICIAL",
  competencia:matriz.competencia,escopo:"filiais-autorizadas",rankingOficial:false,
  situacao:"BLOQUEADO",
  participantesAnalisados:matriz.participantesAnalisados,
  completosNasNotas:matriz.completosNasNotas,
  totalComBloqueios:matriz.totalComBloqueios,
  totalOcorrencias:matriz.bloqueios.length,
  quantidadesPorClasse:classes,quantidadesPorEvidencia:evidencias,
  requisitosGlobaisNaoComprovados:[...REQUISITOS],
  avisos:[
   "Documento técnico agregado para revisão da homologação.",
   "Somente filiais autorizadas por RLS; não representa necessariamente toda a empresa.",
   "Nenhuma nota, identificação individual ou justificativa pessoal está incluída.",
   "Não comprova fechamento das fontes, RH, abrangência global nem liberação de ranking.",
   "Não utilizar para premiações ou decisões de RH."
  ]
 };
}
export function serializarSumarioHomologacao(matriz:MatrizBloqueios):string{
 return JSON.stringify(gerarSumarioHomologacao(matriz),null,2)+"\n";
}
/** Usar exclusivamente no navegador da prévia opt-in, sobre dados autenticados. */
export function baixarSumarioHomologacao(matriz:MatrizBloqueios):void{
 if(typeof document==="undefined"||typeof URL==="undefined")throw new Error("Exportação somente no navegador");
 const conteudo=serializarSumarioHomologacao(matriz);
 const url=URL.createObjectURL(new Blob([conteudo],{type:"application/json;charset=utf-8"}));
 const a=document.createElement("a");
 a.href=url;a.download="sumario-homologacao-"+matriz.competencia.slice(0,7)+".json";
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),4000);
}

/**
 * Contrato de RH para homologação FUTURA; não faz consulta, não altera score,
 * não atribui posições, nem confere autorização para premiações.
 *
 * A procedência fornecida deve ser comprovada por um processo externo.
 * Um campo dizendo "homologada" nunca é prova suficiente de homologação.
 */
import { dataValida, periodoCompetencia } from "./dominio-rh-temporal";

export type SituacaoFuncionalRH="ativo"|"ferias"|"desligado"|"afastado";
export type RegistroRHParaConferencia={
 colaboradorId:string;
 competencia:string;
 dataAdmissao:string;
 situacao:SituacaoFuncionalRH;
 fonte:string;
 referenciaFonte:string;
};
export type ContextoConferenciaRH={
 competencia:string;
 escopo:"filiais-autorizadas";
 rankingOficial:false;
 /** Referência da fonte foi efetivamente verificada pelo RH? Não pode ser presumida. */
 evidenciaHomologacao:"confirmada"|"nao_comprovada";
 idsColaboradoresAutorizados:readonly string[];
};
export type RegistroRHConferido=Readonly<RegistroRHParaConferencia>;
export type ResultadoConferenciaRH={
 competencia:string;escopo:"filiais-autorizadas";rankingOficial:false;
 situacao:"CONFERENCIA_TECNICA";
 participantesAutorizados:number;registrosConferidos:number;
 registrosSemRH:number;
 registros:readonly RegistroRHConferido[];
 aviso:string;
};
export function conferirContratoRH(
 registros:readonly RegistroRHParaConferencia[], contexto:ContextoConferenciaRH
):ResultadoConferenciaRH{
 if(!contexto||contexto.escopo!=="filiais-autorizadas"||contexto.rankingOficial!==false||
  contexto.evidenciaHomologacao!=="confirmada"||
  !/^2027-(0[1-9]|1[0-2])-01$/.test(contexto.competencia)||
  !Array.isArray(contexto.idsColaboradoresAutorizados)||!Array.isArray(registros))
  throw new Error("Fonte de RH não comprovada ou escopo inválido");
 const autorizados=new Set<string>();
 for(const id of contexto.idsColaboradoresAutorizados){
  if(typeof id!=="string"||!id.trim()||autorizados.has(id))
   throw new Error("Lista de colaboradores autorizados inválida");
  autorizados.add(id);
 }
 const vistos=new Set<string>();
 const fimMes=periodoCompetencia(contexto.competencia).termino;
 const saida:RegistroRHConferido[]=[];
 for(const r of registros){
  if(!r||typeof r.colaboradorId!=="string"||!autorizados.has(r.colaboradorId)||
   vistos.has(r.colaboradorId)||r.competencia!==contexto.competencia||
   !dataValida(r.dataAdmissao)||r.dataAdmissao>fimMes||
   !["ativo","ferias","desligado","afastado"].includes(r.situacao)||
   typeof r.fonte!=="string"||!r.fonte.trim()||
   typeof r.referenciaFonte!=="string"||!r.referenciaFonte.trim())
   throw new Error("Registro de RH ausente, duplicado ou inconsistente");
  vistos.add(r.colaboradorId);
  // Copia os campos explicitamente permitidos; não reutiliza referências mutáveis.
  saida.push(Object.freeze({
   colaboradorId:r.colaboradorId,competencia:r.competencia,
   dataAdmissao:r.dataAdmissao,situacao:r.situacao,
   fonte:r.fonte,referenciaFonte:r.referenciaFonte
  }));
 }
 return {
  competencia:contexto.competencia,escopo:"filiais-autorizadas",rankingOficial:false,
  situacao:"CONFERENCIA_TECNICA",participantesAutorizados:autorizados.size,
  registrosConferidos:saida.length,registrosSemRH:autorizados.size-saida.length,
  registros:Object.freeze(saida),
  aviso:"Contrato conferido apenas no escopo de origem. Atestado RH isolado não comprova cobertura global, fechamento de Segurança, categoria histórica nem liberação de posições."
 };
}
/** Somente números agregados; a fonte original e os registros individuais não são expostos. */
export function indicadoresConferenciaRH(r:ResultadoConferenciaRH){
 if(r.rankingOficial!==false||r.escopo!=="filiais-autorizadas"||
  r.situacao!=="CONFERENCIA_TECNICA")throw new Error("Conferência inválida");
 return {
  competencia:r.competencia,escopo:r.escopo,rankingOficial:false as const,
  participantesAutorizados:r.participantesAutorizados,
  registrosConferidos:r.registrosConferidos,registrosSemRH:r.registrosSemRH,
  rankingLiberado:false as const
 };
}

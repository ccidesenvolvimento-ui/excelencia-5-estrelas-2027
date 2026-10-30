import {pessoas, ranking, type Avaliacao, type Periodo, type Pessoa} from "./dados-demo";

/**
 * Consulta demonstrativa: usa exatamente o cadastro e o cálculo do Ranking.
 * Em produção, a busca por matrícula deve ser feita em backend protegido,
 * nunca distribuindo a base real de colaboradores ao navegador.
 */
export type BuscaMotorista =
  | {tipo:"encontrado"; pessoa:Pessoa}
  | {tipo:"nao-encontrado"}
  | {tipo:"ambiguo"};

export function normalizarMatricula(valor:string):string {
  return valor.trim().toLocaleUpperCase("pt-BR").replace(/\s+/g, "");
}

export function buscarMotorista(matricula:string):BuscaMotorista {
  const chave=normalizarMatricula(matricula);
  if(!chave)return {tipo:"nao-encontrado"};
  const coincidencias=pessoas.filter(p=>normalizarMatricula(p.matricula)===chave && p.situacao!=="Desligado");
  if(coincidencias.length>1)return {tipo:"ambiguo"};
  if(!coincidencias.length)return {tipo:"nao-encontrado"};
  return {tipo:"encontrado",pessoa:coincidencias[0]};
}

/** A posição é oficial por segmento, não recalculada por filial ou por matrícula. */
export function avaliacaoDaMatricula(pessoa:Pessoa,periodo:Periodo,mes:number):Avaliacao|null {
  return ranking(periodo,mes).find(item=>item.pessoa.id===pessoa.id)??null;
}

export function periodoDisponivel(pessoa:Pessoa,periodo:Periodo,mes:number):boolean {
  return pessoa.categoria!==null && !(periodo==="mensal" && pessoa.categoria==="Sucro" && (mes<2||mes>10));
}

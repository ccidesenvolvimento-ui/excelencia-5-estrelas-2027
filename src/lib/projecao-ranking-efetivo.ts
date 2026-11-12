/** Projeção pura e não oficial: somente competências e filiais autorizadas. */
import { avaliarComNotas, categorias, estrelas, notasEfetivas,
 type Categoria, type Estrela, type NotasRastreaveis, type Pessoa
} from "./calculo-ranking";
import type { BaseRankingAutorizada } from "../server/consulta-ranking-efetivo";

export type LinhaPrevia={
 id:string;nome:string;matricula:string;filialId:string;
 categoria:Categoria;competencia:string;
 notas:NotasRastreaveis;score:number|null;
 status:"Elegível"|"Inelegível"|"Pendente";
 faltantes:string[];
 /** Proibido atribuir posições globais a dados limitados por RLS. */
 posicao:null;
};
export type PreviaRanking={
 escopo:"filiais-autorizadas";rankingOficial:false;mes:number;
 linhas:LinhaPrevia[];avisos:string[];
};
export function projetarPreviaEfetiva(base:BaseRankingAutorizada,mes:number):PreviaRanking{
 if(!Number.isInteger(mes)||mes<0||mes>11)throw new Error("Competência inválida");
 if(base.escopo!=="filiais-autorizadas"||base.rankingOficial!==false)
  throw new Error("Escopo de consulta inválido");
 const competencia=`2027-${String(mes+1).padStart(2,"0")}-01`;
 const nomesCategorias=new Map(base.categorias.map(c=>[c.id,c.nome]));
 const mapa=new Map<string,NotasRastreaveis>();
 for(const item of base.registros){
  if(item.competencia!==competencia)continue;
  const porPessoa=mapa.get(item.colaboradorId)??{};
  if(porPessoa[item.estrela]!==undefined)throw new Error("Nota duplicada na projeção");
  porPessoa[item.estrela]=item.registro;
  mapa.set(item.colaboradorId,porPessoa);
 }
 const linhas:LinhaPrevia[]=[];
 const avisos=[...base.alertas];
 for(const c of base.colaboradores){
  if(!c.participa_programa||c.desligado_manual||c.desligado_em)continue;
  const nomeCategoria=c.categoria_id===null?null:nomesCategorias.get(c.categoria_id);
  if(!nomeCategoria||!categorias.includes(nomeCategoria as Categoria)||!c.filial_id||!c.nome||!c.matricula){
   avisos.push("Colaborador com cadastro insuficiente excluído da prévia: "+c.id);
   continue;
  }
  const categoria=nomeCategoria as Categoria;
  // Sucro não possui competência mensal fora de março a novembro.
  if(categoria==="Sucro"&&(mes<2||mes>10))continue;
  const notas=mapa.get(c.id)??{};
  const pessoa:Pessoa={id:c.id,nome:c.nome,matricula:c.matricula,empresa:c.empresa_id,
   filial:c.filial_id,categoria,funcao:c.funcao??"",situacao:"Ativo",
   tipo:categoria==="Operadores de Máquinas e Tratores"?"Operador":"Motorista",
   dataAdmissao:null};
  // "Ativo" é apenas requisito do tipo do motor. Não comprova situação no RH.
  // A visualização não fornece elegibilidade oficial, posição nem premiação.
  const avaliacao=avaliarComNotas(pessoa,"mensal",mes,()=>notasEfetivas(notas));
  linhas.push({id:c.id,nome:c.nome,matricula:c.matricula,filialId:c.filial_id,
   categoria,competencia,notas,score:avaliacao.score,status:avaliacao.status,
   faltantes:avaliacao.faltantes,posicao:null});
 }
 // Ordem alfabética explícita, nunca classificação por pontuação.
 linhas.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")||a.matricula.localeCompare(b.matricula,"pt-BR"));
 avisos.push("Status provisório: cadastro RH, férias e fechamento da Segurança ainda não homologados.");
 avisos.push("Sem posições oficiais: as permissões de filial limitam a população consultada.");
 return {escopo:"filiais-autorizadas",rankingOficial:false,mes,linhas,avisos};
}

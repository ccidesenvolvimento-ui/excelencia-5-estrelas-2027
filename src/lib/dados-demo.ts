import { categorias,estrelas,pesos,rotulos,meses,mesesPeriodo,avaliarComNotas,classificarComNotas } from "./calculo-ranking";
import type { Pessoa,Notas,Periodo,Avaliacao } from "./calculo-ranking";
export { categorias,estrelas,pesos,rotulos,rotuloEstrela,meses,periodos,mesesPeriodo,compararRanking,formatarNota } from "./calculo-ranking";
export type { Categoria,Estrela,Pessoa,Notas,Periodo,Avaliacao } from "./calculo-ranking";
/** Dados completamente fictícios. PROIBIDO usá-los para premiação ou decisões de RH. */
export const pessoas:Pessoa[] = [
["m001","Ana Ribeiro","F001","E01","Lavras",0,"Motorista","Ativo","Motorista"],
["m002","Bruno Lima","F002","E01","Lavras",0,"Motorista","Ativo","Motorista"],
["m003","Carla Souza","S001","E02","Jataí",1,"Motorista","Ativo","Motorista"],
["m004","Diego Alves","S002","E02","Jataí",1,"Motorista","Férias","Motorista"],
["m005","Elisa Moraes","M001","E01","Itabira",2,"Motorista","Ativo","Motorista"],
["m006","Felipe Costa","M002","E01","Itabira",2,"Motorista","Ativo","Motorista"],
["m007","Gabriela Nunes","B001","E03","Contagem",3,"Motorista","Ativo","Motorista"],
["m008","Henrique Rocha","B002","E03","Contagem",3,"Motorista","Ativo","Motorista"],
["m009","Isabela Martins","R001","E01","Lavras",4,"Motorista","Ativo","Motorista"],
["m010","João Carvalho","R002","E01","Lavras",4,"Motorista","Ativo","Motorista"],
["m011","Karen Dias","T001","E01","Betim",5,"Motorista","Ativo","Motorista"],
["m012","Lucas Oliveira","T002","E01","Betim",5,"Motorista","Ativo","Motorista"],
["m013","Marina Ferreira","E001","E03","Contagem",6,"Motorista","Ativo","Motorista"],
["m014","Nicolas Prado","E002","E03","Contagem",6,"Motorista","Ativo","Motorista"],
["m015","Olivia Santos","O001","E02","Jataí",7,"Operador","Ativo","Operador"],
["m016","Paulo Mendes","O002","E02","Jataí",7,"Operador","Ativo","Operador"],
["m017","Renata Vieira","U001","E01","Lavras",null,"Motorista","Ativo","Motorista"],

["m019","Sara Fernandes","F003","E01","Jataí",0,"Motorista","Ativo","Motorista"],
["m020","Thiago Moraes","F004","E01","Lavras",0,"Motorista","Ativo","Motorista"],
["m021","Valéria Campos","F005","E01","Varginha",0,"Motorista","Ativo","Motorista"],
["m022","Wesley Duarte","F006","E01","Varginha",0,"Motorista","Ativo","Motorista"],
["m023","Yasmin Teixeira","F007","E01","Lavras",0,"Motorista","Ativo","Motorista"],
["m024","Caio Martins","F008","E01","Formiga",0,"Motorista","Ativo","Motorista"],
["m025","Débora Azevedo","F009","E01","Formiga",0,"Motorista","Ativo","Motorista"],
["m026","Eduardo Pires","F010","E01","Varginha",0,"Motorista","Ativo","Motorista"],
["m027","Fernanda Lopes","F011","E01","Lavras",0,"Motorista","Ativo","Motorista"],
["m028","Gustavo Faria","F012","E01","Formiga",0,"Motorista","Ativo","Motorista"],
["m029","Helena Cardoso","F013","E01","Lavras",0,"Motorista","Ativo","Motorista"],
["m030","Ícaro Mendes","F014","E01","Varginha",0,"Motorista","Ativo","Motorista"],
["m031","Júlia Ribeiro","F015","E01","Formiga",0,"Motorista","Ativo","Motorista"],
["m032","Leandro Dias","F016","E01","Lavras",0,"Motorista","Ativo","Motorista"],
["m033","Mariana Teles","F017","E01","Varginha",0,"Motorista","Ativo","Motorista"],
["m034","Natan Ferreira","F018","E01","Formiga",0,"Motorista","Ativo","Motorista"],
["m035","Olívia Andrade","F019","E01","Lavras",0,"Motorista","Ativo","Motorista"],
["m036","Pedro Carvalho","F020","E01","Varginha",0,"Motorista","Ativo","Motorista"],
["m037","Raquel Nunes","F021","E01","Formiga",0,"Motorista","Ativo","Motorista"],
["m038","Samuel Pinheiro","F022","E01","Lavras",0,"Motorista","Ativo","Motorista"],
].map(([id,nome,matricula,empresa,filial,categoria,funcao,situacao,tipo])=>({
 id:String(id),nome:String(nome),matricula:String(matricula),empresa:String(empresa),filial:String(filial),
 categoria:typeof categoria==="number"?categorias[categoria]:null,funcao:String(funcao),
 situacao:situacao as Pessoa["situacao"],tipo:tipo as Pessoa["tipo"],
 // Datas sintéticas exclusivamente para a demonstração pública.
 // Em produção, a data oficial deverá ser importada da RH0034.
 dataAdmissao: `${2004 + (Number(String(id).slice(1)) * 7) % 20}-${String(1 + Number(String(id).slice(1)) % 12).padStart(2,"0")}-15`
}));
/** Modelo determinístico para demonstração: NÃO simula importação RH0034 real. */
export function notasDe(p:Pessoa,mes:number):Notas {
 if(!p.categoria || (p.categoria==="Sucro"&&(mes<2||mes>10))) return {};
 const n=Number(p.id.replace("m",""));
 const base=73+((n*7+mes*3)%22);
 const notas:Notas={ seguranca:100,produtividade:Math.min(100,base),dirigibilidade:Math.min(100,base+4),jornada:Math.min(100,base+2),treinamentos:Math.min(100,base+7) };
 if((p.id==="m002"&&mes===0)||(p.id==="m012"&&mes===2)) notas.seguranca=0;
 if(p.id==="m007"&&mes===0) delete notas.treinamentos;
 if(p.id==="m009"&&mes===1) delete notas.produtividade;
 if(p.id==="m004"&&mes===3) {delete notas.produtividade;delete notas.dirigibilidade;delete notas.jornada;delete notas.treinamentos;}
 // Casos de teste exclusivamente fictícios para exercitar os filtros da Central de Pendências.
 if(mes===3){
   if(p.id==="m006") delete notas.seguranca; // Segurança ausente (diferente de nota zero).
   if(p.id==="m008") delete notas.dirigibilidade; // Bebidas: fonte será informada na planilha.
   if(p.id==="m010") delete notas.dirigibilidade; // Fonte não informada nesta demonstração.
   if(p.id==="m015") delete notas.dirigibilidade; // Operadores: Eficiência Operacional.
   if(p.id==="m016") delete notas.jornada; // Operadores: Conservação/Operação.
   if(p.id==="m019") return {}; // Simula mês sem nenhuma avaliação recebida.
 }
 return notas;
}
export function avaliarPessoa(pessoa:Pessoa,periodo:Periodo,mes=0):Avaliacao {
 return avaliarComNotas(pessoa,periodo,mes,notasDe);
}
/** Posições por segmento calculadas antes de filtros, usando somente dados fictícios. */
export function ranking(periodo:Periodo,mes:number):Avaliacao[] {
 return classificarComNotas(pessoas,periodo,mes,notasDe);
}

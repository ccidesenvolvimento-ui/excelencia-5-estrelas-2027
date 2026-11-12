import type { FonteDirigibilidade } from "./fontes-dirigibilidade";
/** Motor puro de cálculo. Não consulta banco, não valida autorização e não define fonte oficial. */
export const categorias = [
  "Florestal", "Sucro", "Mineração", "Bebidas",
  "Rodoviário – Cavalo Mecânico", "Motoristas de Truck/Toco",
  "E-commerce", "Operadores de Máquinas e Tratores",
] as const;
export type Categoria = (typeof categorias)[number];
export const estrelas = ["seguranca", "produtividade", "dirigibilidade", "jornada", "treinamentos"] as const;
export type Estrela = (typeof estrelas)[number];
export const pesos: Record<Estrela,number> = { seguranca: .3, produtividade: .25, dirigibilidade: .2, jornada: .15, treinamentos: .1 };
export const rotulos:Record<Estrela,string> = {seguranca:"Segurança",produtividade:"Produtividade",dirigibilidade:"Dirigibilidade",jornada:"Jornada",treinamentos:"Treinamentos"};
export function rotuloEstrela(e:Estrela,categoria:Categoria|null):string {
 if(categoria==="Operadores de Máquinas e Tratores") {if(e==="dirigibilidade")return "Eficiência Operacional";if(e==="jornada")return "Conservação/Operação";}
 return rotulos[e];
}
export type Pessoa = { id:string; nome:string; matricula:string; empresa:string; filial:string; categoria:Categoria|null; funcao:string; situacao:"Ativo"|"Férias"|"Desligado"; tipo:"Motorista"|"Operador"; dataAdmissao?:string|null };
export type Notas = Partial<Record<Estrela,number>>;
export const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
export type Periodo="mensal"|"ciclo1"|"ciclo2"|"ciclo3"|"anual";
export const periodos:{id:Periodo;nome:string}[]=[
 {id:"mensal",nome:"Mensal"},{id:"ciclo1",nome:"Ciclo 1"},{id:"ciclo2",nome:"Ciclo 2"},{id:"ciclo3",nome:"Ciclo 3"},{id:"anual",nome:"Anual"}
];
export function mesesPeriodo(categoria:Categoria,periodo:Periodo,mes:number):number[]{
 if(periodo==="mensal")return [mes];
 if(periodo==="anual")return categoria==="Sucro"?[2,3,4,5,6,7,8,9,10]:Array.from({length:12},(_,i)=>i);
 const idx=Number(periodo.slice(-1))-1;
 return categoria==="Sucro"?Array.from({length:3},(_,i)=>2+idx*3+i):Array.from({length:4},(_,i)=>idx*4+i);
}
export type Avaliacao={pessoa:Pessoa;fonteDirigibilidade?:FonteDirigibilidade|null;notas:Notas;score:number|null;status:"Elegível"|"Inelegível"|"Pendente";posicao:number|null;faltantes:string[];mensais:(number|null)[]};
/** Prioridade oficial: score > admissão mais antiga > chave estável. */
export function compararRanking(a:Avaliacao,b:Avaliacao,scoreCrescente=false):number {
  const scoreA=a.score??-1;
  const scoreB=b.score??-1;
  const diferenca=scoreCrescente?scoreA-scoreB:scoreB-scoreA;
  if(diferenca!==0)return diferenca;

  // Datas ISO AAAA-MM-DD podem ser comparadas lexicalmente.
  const dataA=a.pessoa.dataAdmissao??null;
  const dataB=b.pessoa.dataAdmissao??null;

  if(dataA&&dataB&&dataA!==dataB)return dataA.localeCompare(dataB);
  if(dataA&&!dataB)return -1;
  if(!dataA&&dataB)return 1;

  // Se ambos tiverem a mesma admissão, desempate apenas técnico.
  return a.pessoa.empresa.localeCompare(b.pessoa.empresa,"pt-BR")
    || a.pessoa.matricula.localeCompare(b.pessoa.matricula,"pt-BR",{numeric:true})
    || a.pessoa.id.localeCompare(b.pessoa.id,"pt-BR",{numeric:true});
}
export const formatarNota=(v:number|null|undefined)=>v===null||v===undefined?"—":v.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});

/** Entrada rastreável: nota efetiva prevalece mesmo quando é zero. */
export type NotaRastreavel = { id:string; original:number; efetiva:number; ajustada:boolean };
export type NotasRastreaveis = Partial<Record<Estrela,NotaRastreavel>>;
export type ObterNotas = (pessoa:Pessoa,mes:number)=>Notas;
/** Projeção explícita da view para o cálculo, sem perder o valor original. */
export function notasEfetivas(registros:NotasRastreaveis):Notas {
 const saida:Notas={};
 for(const estrela of estrelas){
  const registro=registros[estrela];
  if(registro!==undefined)saida[estrela]=registro.efetiva;
 }
 return saida;
}

export function avaliarComNotas(pessoa:Pessoa,periodo:Periodo,mes:number,obterNotas:ObterNotas):Avaliacao{
 const indices=pessoa.categoria?mesesPeriodo(pessoa.categoria,periodo,mes):[];
 const amostras=indices.map(i=>obterNotas(pessoa,i));
 const faltantes=[...new Set(amostras.flatMap((n,i)=>estrelas.filter(e=>n[e]===undefined).map(e=>`${meses[indices[i]]}: ${rotulos[e]}`)))];
 const inseguro=amostras.some(n=>estrelas.some(e=>n[e]===0));
 const mensais=amostras.map(n=>estrelas.some(e=>n[e]===undefined)?null:Math.round(estrelas.reduce((s,e)=>s+(n[e]??0)*pesos[e],0)*100)/100);
 const score=mensais.some(s=>s===null)?null:Math.round(mensais.reduce<number>((s,v)=>s+(v??0),0)/mensais.length*100)/100;
 const notas:Object=Object.fromEntries(estrelas.map(e=>[e,amostras.every(n=>n[e]!==undefined)?Math.round(amostras.reduce((s,n)=>s+(n[e]??0),0)/amostras.length*100)/100:undefined]));
 return {pessoa,notas:notas as Notas,score,status:faltantes.length?"Pendente":inseguro?"Inelegível":"Elegível",posicao:null,faltantes,mensais};
}

/** Posições são calculadas por segmento ANTES de aplicar filtros de filial. */
export function classificarComNotas(participantes:readonly Pessoa[],periodo:Periodo,mes:number,obterNotas:ObterNotas):Avaliacao[]{
 const registros=participantes.filter(p=>p.categoria!==null&&p.situacao!=="Desligado"&&!(periodo==="mensal"&&p.categoria==="Sucro"&&(mes<2||mes>10))).map(p=>avaliarComNotas(p,periodo,mes,obterNotas));
 const resultado:Avaliacao[]=[];
 for(const categoria of categorias){
   const setor=registros.filter(r=>r.pessoa.categoria===categoria).sort(compararRanking);
   let pos=0;
   for(const r of setor){if(r.status==="Elegível")r.posicao=++pos; resultado.push(r);}
 }
 return resultado;
}

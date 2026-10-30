/** Dados completamente fictícios. PROIBIDO usá-los para premiação ou decisões de RH. */
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
export type Pessoa = { id:string; nome:string; matricula:string; empresa:string; filial:string; categoria:Categoria|null; funcao:string; situacao:"Ativo"|"Férias"|"Desligado"; tipo:"Motorista"|"Operador" };
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
 situacao:situacao as Pessoa["situacao"],tipo:tipo as Pessoa["tipo"]
}));
export type Notas = Partial<Record<Estrela,number>>;
export const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
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
   if(p.id==="m008") delete notas.dirigibilidade; // Bebidas: fonte IDT.
   if(p.id==="m010") delete notas.dirigibilidade; // Fonte Maxtrack atribuída apenas na simulação.
   if(p.id==="m015") delete notas.dirigibilidade; // Operadores: Eficiência Operacional.
   if(p.id==="m016") delete notas.jornada; // Operadores: Conservação/Operação.
   if(p.id==="m019") return {}; // Simula mês sem nenhuma avaliação recebida.
 }
 return notas;
}
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
export type Avaliacao={pessoa:Pessoa;notas:Notas;score:number|null;status:"Elegível"|"Inelegível"|"Pendente";posicao:number|null;faltantes:string[];mensais:(number|null)[]};
export function avaliarPessoa(pessoa:Pessoa,periodo:Periodo,mes=0):Avaliacao{
 const indices=pessoa.categoria?mesesPeriodo(pessoa.categoria,periodo,mes):[];
 const amostras=indices.map(i=>notasDe(pessoa,i));
 const faltantes=[...new Set(amostras.flatMap((n,i)=>estrelas.filter(e=>n[e]===undefined).map(e=>`${meses[indices[i]]}: ${rotulos[e]}`)))];
 const inseguro=amostras.some(n=>estrelas.some(e=>n[e]===0));
 const mensais=amostras.map(n=>estrelas.some(e=>n[e]===undefined)?null:Math.round(estrelas.reduce((s,e)=>s+(n[e]??0)*pesos[e],0)*100)/100);
 const score=mensais.some(s=>s===null)?null:Math.round(mensais.reduce<number>((s,v)=>s+(v??0),0)/mensais.length*100)/100;
 const notas:Object=Object.fromEntries(estrelas.map(e=>[e,amostras.every(n=>n[e]!==undefined)?Math.round(amostras.reduce((s,n)=>s+(n[e]??0),0)/amostras.length*100)/100:undefined]));
 return {pessoa,notas:notas as Notas,score,status:faltantes.length?"Pendente":inseguro?"Inelegível":"Elegível",posicao:null,faltantes,mensais};
}
/** Posições são calculadas por segmento ANTES de aplicar filtros de filial. */
export function ranking(periodo:Periodo,mes:number):Avaliacao[]{
 const registros=pessoas.filter(p=>p.categoria!==null&&p.situacao!=="Desligado"&&!(periodo==="mensal"&&p.categoria==="Sucro"&&(mes<2||mes>10))).map(p=>avaliarPessoa(p,periodo,mes));
 const resultado:Avaliacao[]=[];
 for(const categoria of categorias){
   const setor=registros.filter(r=>r.pessoa.categoria===categoria).sort((a,b)=>(b.score??-1)-(a.score??-1));
   let pos=0;
   for(const r of setor){if(r.status==="Elegível")r.posicao=++pos; resultado.push(r);}
 }
 return resultado;
}
export const formatarNota=(v:number|null|undefined)=>v===null||v===undefined?"—":v.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});

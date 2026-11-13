/** Validação e leitura temporal, sem atribuição de elegibilidade ou notas. */
export type FeriasRH={
 id:string;colaborador_id:string;inicio:string;termino:string;dias_gozo:number;
};
export type HistoricoCategoriaRH={
 id:string;colaborador_id:string;categoria_id:number|null;
 origem:"automatica"|"manual"|"nao_participa";
 competencia_inicio:string;competencia_fim:string|null;
};
export type PeriodoRH={inicio:string;termino:string};
const DATA=/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export function dataValida(data:unknown):data is string{
 if(typeof data!=="string"||!DATA.test(data))return false;
 const [a,m,d]=data.split("-").map(Number);
 const verificada=new Date(Date.UTC(a,m-1,d));
 return verificada.getUTCFullYear()===a&&verificada.getUTCMonth()+1===m&&verificada.getUTCDate()===d;
}
export function periodoCompetencia(competencia:string):PeriodoRH{
 if(!dataValida(competencia)||!competencia.endsWith("-01"))throw new Error("Competência inválida");
 const [ano,mes]=competencia.split("-").map(Number);
 const ultimo=new Date(Date.UTC(ano,mes,0)).getUTCDate();
 return {inicio:competencia,termino:competencia.slice(0,8)+String(ultimo).padStart(2,"0")};
}
export function intercepta(a:PeriodoRH,b:PeriodoRH):boolean{
 return a.inicio<=b.termino&&b.inicio<=a.termino;
}
function idsPermitidos(colaboradores:readonly {id:string}[]):Set<string>{
 return new Set(colaboradores.map(c=>c.id));
}
export function validarFerias(registros:readonly FeriasRH[],colaboradores:readonly {id:string}[]):FeriasRH[]{
 const permitidos=idsPermitidos(colaboradores),ids=new Set<string>();
 return registros.map(reg=>{
  if(!reg||typeof reg.id!=="string"||!reg.id||ids.has(reg.id)||!permitidos.has(reg.colaborador_id)
   ||!dataValida(reg.inicio)||!dataValida(reg.termino)||reg.inicio>reg.termino
   ||!Number.isInteger(reg.dias_gozo)||reg.dias_gozo<=0)
   throw new Error("Registro de férias inválido ou fora do escopo RLS");
  ids.add(reg.id);return reg;
 });
}
export function validarHistoricoCategorias(registros:readonly HistoricoCategoriaRH[],colaboradores:readonly {id:string}[]):HistoricoCategoriaRH[]{
 const permitidos=idsPermitidos(colaboradores),ids=new Set<string>();
 return registros.map(reg=>{
  if(!reg||typeof reg.id!=="string"||!reg.id||ids.has(reg.id)||!permitidos.has(reg.colaborador_id)
   ||!dataValida(reg.competencia_inicio)
   ||reg.competencia_fim!==null&&!dataValida(reg.competencia_fim)
   ||reg.competencia_fim!==null&&reg.competencia_fim<reg.competencia_inicio
   ||!["automatica","manual","nao_participa"].includes(reg.origem)
   ||reg.categoria_id!==null&&(!Number.isInteger(reg.categoria_id)||reg.categoria_id<=0)
   ||reg.origem==="nao_participa"&&reg.categoria_id!==null
   ||reg.origem!=="nao_participa"&&reg.categoria_id===null)
   throw new Error("Histórico de categorias inválido ou fora do escopo RLS");
  ids.add(reg.id);return reg;
 });
}
export function eventosCompetencia<T extends {colaborador_id:string}>(registros:readonly T[],id:string,
 intervalo:(r:T)=>PeriodoRH,competencia:string):T[]{
 const periodo=periodoCompetencia(competencia);
 return registros.filter(r=>r.colaborador_id===id&&intercepta(intervalo(r),periodo));
}

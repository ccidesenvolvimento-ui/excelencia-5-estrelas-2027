/**
 * Leitura integral (não paginada para o consumidor) sob RLS e sessão SSR.
 * Uso somente no servidor Node opt-in. Sem service_role, sem fallback demo.
 * Importante: filiais autorizadas NÃO representam o ranking global da empresa.
 */
import "server-only";
import { criarClienteAutenticadoServidor } from "@/lib/supabase/sessao-servidor";
import { categorias, estrelas, type Categoria, type Estrela, type NotaRastreavel } from "@/lib/calculo-ranking";

const TAMANHO_PAGINA=500;
const LIMITE_PAGINAS=200;
const VALIDAS=new Set<string>(estrelas);
const CATEGORIAS=new Set<string>(categorias);
const COMPETENCIA=/^2027-(0[1-9]|1[0-2])-01$/;

export type NotaEfetivaBanco={
 id:string;colaborador_id:string;competencia:string;estrela:string;
 nota:number;nota_efetiva:number;possui_ajuste:boolean;
};
export type ColaboradorBanco={
 id:string;empresa_id:string;matricula:string;nome:string;filial_id:string|null;
 categoria_id:number|null;funcao:string|null;situacao_rh:string|null;
 participa_programa:boolean;categorizacao_status:string;
 desligado_manual:boolean;desligado_em:string|null;
};
export type CategoriaBanco={id:number;nome:string};
export type RegistroCalculo={
 colaboradorId:string;competencia:string;estrela:Estrela;
 registro:NotaRastreavel;
};
export type BaseRankingAutorizada={
 escopo:"filiais-autorizadas";rankingOficial:false;
 colaboradores:ColaboradorBanco[];
 categorias:CategoriaBanco[];
 registros:RegistroCalculo[];
 alertas:string[];
};

/** Contrato de seleção PostgREST, deliberadamente mínimo para testes. */
type Resultado<T>={data:T[]|null;error:{message:string}|null};
type Consulta<T>={
 order:(coluna:string,opcoes:{ascending:boolean})=>Consulta<T>;
 range:(inicio:number,fim:number)=>PromiseLike<Resultado<T>>;
};
export type FontePaginada<T>=(tabela:string,colunas:string)=>Consulta<T>;

/** Falha fechada em erro, limite excedido, duplicação ou resposta inesperada. */
export async function lerTodasPaginas<T extends {id:string|number}>(
 fonte:FontePaginada<T>,tabela:string,colunas:string
):Promise<T[]>{
 const saida:T[]=[];
 const ids=new Set<string>();
 for(let pagina=0;pagina<LIMITE_PAGINAS;pagina++){
  const inicio=pagina*TAMANHO_PAGINA;
  const {data,error}=await fonte(tabela,colunas).order("id",{ascending:true}).range(inicio,inicio+TAMANHO_PAGINA-1);
  if(error||!Array.isArray(data))throw new Error("Consulta incompleta: "+tabela);
  for(const item of data){
   if(!item||(typeof item.id!=="string"&&typeof item.id!=="number")||!item.id||ids.has(String(item.id)))throw new Error("Registro duplicado ou inválido: "+tabela);
   ids.add(String(item.id));saida.push(item);
  }
  if(data.length<TAMANHO_PAGINA)return saida;
 }
 throw new Error("Limite de paginação excedido: "+tabela);
}

function numero(v:unknown):number{
 const n=typeof v==="number"?v:typeof v==="string"&&v.trim()?Number(v):NaN;
 if(!Number.isFinite(n)||n<0||n>100||Math.abs(Math.round(n*100)-n*100)>1e-7)
  throw new Error("Valor de nota inválido");
 return n;
}
/** Converte NUMERIC do PostgREST sem perder nota original nem zero. */
export function prepararRegistros(
 notas:readonly NotaEfetivaBanco[],colaboradores:readonly ColaboradorBanco[]
):RegistroCalculo[]{
 const autorizados=new Set(colaboradores.map(c=>c.id));
 const chaves=new Set<string>();
 return notas.map(n=>{
  if(!autorizados.has(n.colaborador_id)||!COMPETENCIA.test(n.competencia)||!VALIDAS.has(n.estrela)
    ||typeof n.id!=="string"||!n.id||typeof n.possui_ajuste!=="boolean")
   throw new Error("Metadados de nota inválidos ou não autorizados");
  const chave=n.colaborador_id+"|"+n.competencia+"|"+n.estrela;
  if(chaves.has(chave))throw new Error("Nota duplicada por competência e pilar");
  chaves.add(chave);
  const original=numero(n.nota),efetiva=numero(n.nota_efetiva);
  if(n.estrela==="seguranca"&&(![0,100].includes(original)||efetiva!==original||n.possui_ajuste))
   throw new Error("Segurança inconsistente");
  if(!n.possui_ajuste&&original!==efetiva)throw new Error("Nota efetiva diverge sem ajuste");
  return {colaboradorId:n.colaborador_id,competencia:n.competencia,estrela:n.estrela as Estrela,
   registro:{id:n.id,original,efetiva,ajustada:n.possui_ajuste}};
 });
}

function alertasMetadados(
 colaboradores:readonly ColaboradorBanco[],categoriasBanco:readonly CategoriaBanco[]
):string[]{
 const mapa=new Map(categoriasBanco.map(c=>[c.id,c.nome]));
 const problemas:string[]=[];
 for(const c of colaboradores){
  if(!c.participa_programa)continue;
  if(!c.filial_id)problemas.push("Filial não informada: "+c.id);
  if(c.categoria_id===null||!CATEGORIAS.has(mapa.get(c.categoria_id)??""))
   problemas.push("Categoria não validada: "+c.id);
  if(!c.matricula||!c.nome)problemas.push("Identificação incompleta: "+c.id);
 }
 // O schema não dispõe de admissão e a leitura por RLS não é global.
 problemas.push("Desempate por data de admissão ainda indisponível no schema.");
 problemas.push("Categorias históricas, férias e fechamento de Segurança exigem validação antes do ranking oficial.");
 problemas.push("Classificação global não pode ser reconstruída somente com filiais visíveis sob RLS.");
 return problemas;
}

export async function consultarBaseRankingEfetivo():Promise<BaseRankingAutorizada>{
 if(process.env.EXCELENCIA_AUTH_GUARD_ENABLED!=="true"||process.env.EXCELENCIA_AJUSTES_API_ENABLED!=="true")
  throw new Error("Consulta Node de homologação desabilitada");
 const cliente=await criarClienteAutenticadoServidor();
 const usuario=await cliente.auth.getUser();
 if(usuario.error||!usuario.data.user)throw new Error("Sessão não autenticada");
 // Somente chave pública com sessão de usuário; as políticas RLS decidem visibilidade.
 const fonte= ((tabela:string,colunas:string)=>cliente.from(tabela).select(colunas)) as unknown as FontePaginada<NotaEfetivaBanco>;
 const [notas,colaboradores,categoriasLidas]=await Promise.all([
  lerTodasPaginas<NotaEfetivaBanco>(fonte as FontePaginada<NotaEfetivaBanco>,
   "notas_mensais_efetivas","id,colaborador_id,competencia,estrela,nota,nota_efetiva,possui_ajuste"),
  lerTodasPaginas<ColaboradorBanco>(fonte as unknown as FontePaginada<ColaboradorBanco>,
   "colaboradores","id,empresa_id,matricula,nome,filial_id,categoria_id,funcao,situacao_rh,participa_programa,categorizacao_status,desligado_manual,desligado_em"),
  lerTodasPaginas<CategoriaBanco>(fonte as unknown as FontePaginada<CategoriaBanco>,"categorias","id,nome")
 ]);
 // A view não filtra por ano. Rejeita dados de outras competências na projeção,
 // sem transformar a ausência de notas em zero.
 const apenas2027=notas.filter(n=>n.competencia.startsWith("2027-"));
 const registros=prepararRegistros(apenas2027,colaboradores);
 return {escopo:"filiais-autorizadas",rankingOficial:false,colaboradores,
  categorias:categoriasLidas,registros,alertas:alertasMetadados(colaboradores,categoriasLidas)};
}

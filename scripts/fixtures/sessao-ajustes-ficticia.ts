// SOMENTE TESTE CI #71. Substitui TEMPORARIAMENTE a sessão SSR no runner.
// Nunca importar este arquivo diretamente da aplicação e nunca publicá-lo em produção.
import "server-only";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

type Papel = "admin-filial-a" | "admin-filial-b" | "comum" | "inativo";
type Registro = { id:string; colaborador_id:string; competencia:string; estrela:string; nota:number; nota_efetiva:number; possui_ajuste:boolean };
const nota:Registro = {
 id:"62000000-0000-4000-8000-000000000030",
 colaborador_id:"62000000-0000-4000-8000-000000000020",
 competencia:"2027-10-01",estrela:"produtividade",nota:75,nota_efetiva:75,possui_ajuste:false
};
const seguranca:Registro={...nota,id:"62000000-0000-4000-8000-000000000031",estrela:"seguranca",nota:0,nota_efetiva:0};
const historico:{id:number;nota_mensal_id:string;nota_anterior:number;nota_nova:number;justificativa:string;usuario_id:string;criado_em:string}[]=[];
const colaborador={
 id:nota.colaborador_id,matricula:"AJ-001",nome:"Motorista fictício",filial_id:"62000000-0000-4000-8000-000000000011"
};
function resultado(data:unknown,error:null|{code:string,message:string}=null){return {data,error};}
function consulta(tabela:string,papel:Papel){
 let competencia="",estrela="",lista:string[]|null=null,limite=100,offset=0,fim=49;
 const builder={
  select(_campos:string){return builder;},
  order(_campo:string,_opcoes?:unknown){return builder;},
  range(inicio:number,termino:number){offset=inicio;fim=termino;return builder;},
  eq(coluna:string,valor:string){if(coluna==="competencia")competencia=valor;if(coluna==="estrela")estrela=valor;return builder;},
  in(_coluna:string,ids:string[]){lista=ids;return builder;},
  limit(n:number){limite=n;return builder;},
  then(resolve:(valor:ReturnType<typeof resultado>)=>unknown,reject?:(erro:unknown)=>unknown){
   try{
    const permitido=papel==="admin-filial-a";
    let dados:unknown[]=[];
    if(permitido){
     if(tabela==="notas_mensais_efetivas")
      dados=[nota,seguranca].filter(n=>(!competencia||n.competencia===competencia)&&(!estrela||n.estrela===estrela)).slice(offset,fim+1);
     if(tabela==="colaboradores")dados=lista?.includes(colaborador.id)?[colaborador]:[];
     if(tabela==="ajustes_notas")dados=historico.filter(h=>lista?.includes(h.nota_mensal_id)).slice(0,limite);
    }
    return Promise.resolve(resultado(dados)).then(resolve,reject);
   }catch(e){return Promise.reject(e).then(resolve,reject);}
  }
 };
 return builder;
}
export async function criarClienteAutenticadoServidor():Promise<SupabaseClient>{
 const loja=await cookies();
 const bruto=loja.get("e5_teste_papel")?.value;
 const papel=(["admin-filial-a","admin-filial-b","comum","inativo"].includes(bruto??"")?bruto:"comum") as Papel;
 const autenticado=Boolean(bruto);
 return {
  auth:{async getUser(){return resultado(autenticado?{user:{id:papel}}:{user:null});}},
  async rpc(nome:string,args?:Record<string,unknown>){
   if(nome==="eh_administrador_ativo")return resultado(papel==="admin-filial-a"||papel==="admin-filial-b");
   if(nome!=="registrar_ajuste_nota")return resultado(null,{code:"42883",message:"Função indisponível"});
   if(papel!=="admin-filial-a")return resultado(null,{code:"42501",message:"Filial não autorizada"});
   const id=args?.p_nota_mensal_id, nova=args?.p_nota_nova, esperada=args?.p_nota_esperada;
   if(id===seguranca.id)return resultado(null,{code:"22023",message:"Segurança é imutável"});
   if(id!==nota.id)return resultado(null,{code:"42501",message:"Registro de outra filial"});
   if(esperada!==nota.nota_efetiva)return resultado(null,{code:"40001",message:"Versão de nota obsoleta"});
   if(typeof nova!=="number"||nova<0||nova>100)return resultado(null,{code:"22023",message:"Nota inválida"});
   const anterior=nota.nota_efetiva;
   nota.nota_efetiva=nova;
   nota.possui_ajuste=true;
   const evento={
    id:historico.length+1,nota_mensal_id:nota.id,nota_anterior:anterior,
    nota_nova:nova,justificativa:String(args?.p_justificativa??""),
    usuario_id:papel,criado_em:"2027-10-01T12:00:00.000Z"
   };
   historico.push(evento);
   return resultado(evento.id);
  },
  from(tabela:string){return consulta(tabela,papel);}
 } as unknown as SupabaseClient;
}

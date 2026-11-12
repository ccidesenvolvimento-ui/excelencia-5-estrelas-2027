// #75 — ROTA SOMENTE DE TESTE; copiada para src/app/api/ci-login/route.ts
// pelo runner descartável e removida no EXIT. Nunca integrar em produção.
import { criarClienteAutenticadoServidor } from "@/lib/supabase/sessao-servidor";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 if(process.env.E5_E2E_LOCAL_ONLY!=="true"||process.env.SUPABASE_URL!=="http://127.0.0.1:54321")
  return Response.json({erro:"Recurso indisponível"},{status:503});
 const body=await request.json();
 if(typeof body.email!=="string"||typeof body.password!=="string")
  return Response.json({erro:"Dados inválidos"},{status:422});
 const cliente=await criarClienteAutenticadoServidor();
 const {data,error}=await cliente.auth.signInWithPassword({email:body.email,password:body.password});
 if(error||!data.user)return Response.json({erro:"Credenciais inválidas"},{status:401});
 return Response.json({autenticado:true},{headers:{"Cache-Control":"no-store"}});
}

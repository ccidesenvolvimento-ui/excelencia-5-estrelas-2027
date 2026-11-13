/**
 * Supabase Auth em Server Components/Server Actions (Next.js App Router).
 *
 * Este módulo apenas fornece um cliente SSR e verifica a identidade remota.
 * NÃO autoriza acesso a tabelas corporativas; permissões/RLS são outra etapa.
 * NÃO habilita sozinho login/logout nem substitui Cloudflare Access.
 */
import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function obterConfiguracaoSupabase(): { url: string; chavePublicavel: string } {
  const url = process.env.SUPABASE_URL;
  const chavePublicavel = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chavePublicavel) {
    throw new Error("Supabase Auth não configurado no servidor.");
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL inválida.");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error("SUPABASE_URL deve usar HTTPS sem credenciais.");
  }
  if (!chavePublicavel.startsWith("sb_publishable_")) {
    throw new Error("Exige chave publicável do Supabase, nunca service_role.");
  }
  return { url: parsed.toString().replace(/\/$/, ""), chavePublicavel };
}

/**
 * Read de cookies é permitido em Server Components.
 * A renovação de cookies deve ser feita por proxy/middleware dedicado, a ser
 * implementado e testado antes de ativar o login (issue futura).
 */
export async function criarClienteAutenticadoServidor() {
  const { url, chavePublicavel } = obterConfiguracaoSupabase();
  const cookieStore = await cookies();

  return createServerClient(url, chavePublicavel, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Em Server Component o Next.js impede escrita de cookies.
          // Sem proxy de refresh: não tratar este cliente como sessão completa.
        }
      },
    },
  });
}

/** Verifica usuário com servidor Auth, não com getSession() local. */
export async function verificarUsuarioSupabase() {
  const supabase = await criarClienteAutenticadoServidor();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

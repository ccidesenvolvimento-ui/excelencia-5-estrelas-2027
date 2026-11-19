/**
 * Cliente Supabase restrito a módulos server-side do Next.js.
 *
 * Não possui permissões administrativas, não persiste sessão e não consulta
 * dados corporativos. Futuras leituras/escritas exigirão Auth e políticas RLS.
 *
 * NÃO importar de componentes com "use client".
 */
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function configuracao(): { url: string; chavePublicavel: string } {
  const url = process.env.SUPABASE_URL;
  const chavePublicavel = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !chavePublicavel) {
    throw new Error(
      "Integração Supabase não configurada no servidor. Defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL inválida.");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error("SUPABASE_URL deve utilizar HTTPS, sem credenciais embutidas.");
  }
  if (!chavePublicavel.startsWith("sb_publishable_")) {
    throw new Error("Utilize somente a chave publicável sb_publishable_ do Supabase.");
  }
  return { url: parsed.toString().replace(/\/$/, ""), chavePublicavel };
}

/**
 * Usar apenas após implementar identidade de usuário e autorização na API.
 * A chave publicável não contorna RLS; este cliente não representa um usuário.
 */
export function criarClienteSupabaseServidor(): SupabaseClient {
  const { url, chavePublicavel } = configuracao();
  return createClient(url, chavePublicavel, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

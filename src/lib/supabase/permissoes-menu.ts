"use client";

import {
  clienteSupabaseBrowser,
  loginSupabaseHabilitado,
} from "./cliente-browser";

/**
 * Obtém somente as permissões do usuário autenticado.
 * A RLS restringe a consulta ao próprio usuário.
 *
 * Falhas resultam em nenhuma permissão.
 * Esta função não substitui a autorização no servidor.
 */
export async function obterPermissoesMenu(): Promise<string[]> {
  if (!loginSupabaseHabilitado) return [];

  try {
    const supabase = clienteSupabaseBrowser();
    if (!supabase) return [];

    const { data: identidade, error: erroAuth } =
      await supabase.auth.getUser();

    if (erroAuth || !identidade.user) return [];

    const usuarioId = identidade.user.id;

    const { data: perfil, error: erroPerfil } =
      await supabase
        .from("perfis")
        .select("usuario_id")
        .eq("usuario_id", usuarioId)
        .eq("ativo", true)
        .maybeSingle();

    if (erroPerfil || !perfil) return [];

    const { data: filiais, error: erroFiliais } =
      await supabase
        .from("filiais_usuario")
        .select("filial_id")
        .eq("usuario_id", usuarioId)
        .limit(1);

    if (erroFiliais || !filiais?.length) return [];

    const { data: permissoes, error: erroPermissoes } =
      await supabase
        .from("permissoes_usuario")
        .select("permissao")
        .eq("usuario_id", usuarioId);

    if (erroPermissoes || !permissoes) return [];

    return permissoes.map(item => item.permissao);
  } catch {
    return [];
  }
}

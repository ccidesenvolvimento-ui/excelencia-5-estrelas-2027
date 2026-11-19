import "server-only";

import { criarClienteAutenticadoServidor } from "./sessao-servidor";

export const AREAS_CORPORATIVAS = [
  "Visão geral",
  "Ranking e relatórios",
  "Pendências",
  "Importações",
  "RH0034",
  "Configurações",
] as const;

export const OPERACOES_CORPORATIVAS = [
  "Visualizar",
  "Importar",
  "Editar",
  "Exportar",
] as const;

export type AreaCorporativa = typeof AREAS_CORPORATIVAS[number];
export type OperacaoCorporativa = typeof OPERACOES_CORPORATIVAS[number];

export type PermissaoCorporativa =
  `${AreaCorporativa}:${OperacaoCorporativa}`;

export type ContextoCorporativo = {
  usuarioId: string;
  nome: string;
  administrador: boolean;
  filiais: string[];
  permissoes: string[];
};

/**
 * Obtém a autorização a partir da sessão autenticada e das políticas RLS.
 * Não utiliza service_role nem dados de autorização do navegador.
 * Qualquer falha na validação resulta em acesso negado.
 */
export async function obterContextoCorporativo():
  Promise<ContextoCorporativo | null> {
  try {
    const supabase = await criarClienteAutenticadoServidor();

    const { data: identidade, error: erroAuth } =
      await supabase.auth.getUser();

    if (erroAuth || !identidade.user) return null;

    const usuarioId = identidade.user.id;

    const { data: perfil, error: erroPerfil } =
      await supabase
        .from("perfis")
        .select("usuario_id,nome,administrador,ativo")
        .eq("usuario_id", usuarioId)
        .eq("ativo", true)
        .maybeSingle();

    if (erroPerfil || !perfil || !perfil.ativo) return null;

    const { data: filiais, error: erroFiliais } =
      await supabase
        .from("filiais_usuario")
        .select("filial_id")
        .eq("usuario_id", usuarioId);

    if (erroFiliais || !filiais?.length) return null;

    const { data: permissoes, error: erroPermissoes } =
      await supabase
        .from("permissoes_usuario")
        .select("permissao")
        .eq("usuario_id", usuarioId);

    if (erroPermissoes || !permissoes) return null;

    return {
      usuarioId,
      nome: perfil.nome,
      administrador: perfil.administrador === true,
      filiais: filiais.map(f => f.filial_id),
      permissoes: permissoes.map(p => p.permissao),
    };
  } catch {
    return null;
  }
}

/**
 * Verifica uma operação e, opcionalmente, seu escopo por filial.
 * Administradores também precisam de concessão explícita.
 */
export function possuiPermissaoCorporativa(
  contexto: ContextoCorporativo | null,
  permissao: PermissaoCorporativa,
  filialId?: string
): boolean {
  if (!contexto || contexto.filiais.length === 0) return false;

  if (!contexto.permissoes.includes(permissao)) return false;

  if (filialId !== undefined && !contexto.filiais.includes(filialId)) {
    return false;
  }

  return true;
}

/**
 * Mapeamento central das páginas corporativas.
 *
 * Cada rota exige a permissão Visualizar correspondente
 * à aba Usuários e Acessos.
 *
 * Não consulta o banco nem concede acesso.
 */

export const PERMISSOES_ROTAS = {
  "/visao-geral": "Visão geral:Visualizar",
  "/painel": "Visão geral:Visualizar",

  "/ranking": "Ranking e relatórios:Visualizar",
  "/relatorios": "Ranking e relatórios:Visualizar",

  "/pendencias": "Pendências:Visualizar",

  "/importacoes": "Importações:Visualizar",

  "/rh0034": "RH0034:Visualizar",

  "/configuracoes": "Configurações:Visualizar",
  "/usuarios": "Configurações:Visualizar",
  "/diagnostico": "Configurações:Visualizar",
} as const;

export type RotaCorporativa =
  keyof typeof PERMISSOES_ROTAS;

export type PermissaoVisualizacao =
  typeof PERMISSOES_ROTAS[RotaCorporativa];

export function permissaoParaRota(
  pathname: string
): PermissaoVisualizacao | null {
  const caminho = pathname.replace(/[/]+$/, "") || "/";

  for (const [rota, permissao] of Object.entries(
    PERMISSOES_ROTAS
  )) {
    if (
      caminho === rota ||
      caminho.startsWith(`${rota}/`)
    ) {
      return permissao;
    }
  }

  // Rota desconhecida: não significa autorização concedida.
  // O controlador de acesso deverá negar por padrão.
  return null;
}

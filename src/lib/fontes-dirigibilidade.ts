/** Fonte por avaliação, a ser preenchida pela coluna da planilha importada.
 * A demonstração não importa linhas e não consulta configuração/localStorage por filial.
 */
export type FonteDirigibilidade = "IDT" | "Gobrax" | "Maxtrack";
export const OPCOES_FONTE: readonly FonteDirigibilidade[] = ["IDT", "Gobrax", "Maxtrack"];

export function fonteDaAvaliacao(avaliacao: {
  pessoa: { tipo: string };
  fonteDirigibilidade?: FonteDirigibilidade | null;
}): string {
  if (avaliacao.pessoa.tipo === "Operador") return "Critério próprio dos operadores";
  const fonte = avaliacao.fonteDirigibilidade;
  return fonte && OPCOES_FONTE.includes(fonte) ? fonte : "Não informada";
}

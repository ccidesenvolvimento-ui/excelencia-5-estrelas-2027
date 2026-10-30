import type { Avaliacao, Estrela } from "./dados-demo";

/** Somente os cinco pilares exibidos na Central de Pendências.
 * As fontes IDT/Gobrax/Maxtrack são CONFIGURAÇÕES DE FILIAL, nunca tipos de pendência.
 * Para operadores, os critérios específicos são agrupados nas respectivas posições dos cinco pilares.
 */
export const opcoesPendencia = [
  { valor: "", titulo: "Todas as pendências" },
  { valor: "sem-seguranca", titulo: "Sem Segurança" },
  { valor: "sem-produtividade", titulo: "Sem Produtividade" },
  { valor: "sem-dirigibilidade", titulo: "Sem Dirigibilidade" },
  { valor: "sem-jornada", titulo: "Sem Jornada" },
  { valor: "sem-treinamentos", titulo: "Sem Treinamentos" },
] as const;

export type TipoPendencia = (typeof opcoesPendencia)[number]["valor"];
type TipoEspecifico = Exclude<TipoPendencia, "">;
export const nomesPendencia: Record<TipoEspecifico, string> = {
  "sem-seguranca": "Sem Segurança",
  "sem-produtividade": "Sem Produtividade",
  "sem-dirigibilidade": "Sem Dirigibilidade",
  "sem-jornada": "Sem Jornada",
  "sem-treinamentos": "Sem Treinamentos",
};
const relacao: readonly { estrela: Estrela; codigo: TipoEspecifico }[] = [
  { estrela: "seguranca", codigo: "sem-seguranca" },
  { estrela: "produtividade", codigo: "sem-produtividade" },
  { estrela: "dirigibilidade", codigo: "sem-dirigibilidade" },
  { estrela: "jornada", codigo: "sem-jornada" },
  { estrela: "treinamentos", codigo: "sem-treinamentos" },
];

export function identificarPendencias(registro: Avaliacao): TipoEspecifico[] {
  if (registro.status !== "Pendente") return [];
  return relacao.filter(x => registro.notas[x.estrela] === undefined).map(x => x.codigo);
}

/** Mantém somente uma linha por colaborador, mesmo com várias notas ausentes. */
export function atendeTipoPendencia(registro: Avaliacao, filtro: TipoPendencia): boolean {
  return !filtro || identificarPendencias(registro).includes(filtro);
}
export function rotulosPendencias(registro: Avaliacao): string[] {
  return identificarPendencias(registro).map(codigo => nomesPendencia[codigo]);
}

import { categorias, meses, ranking, type Avaliacao } from "./dados-demo";

/** Mantém a média usada pelo card e ordena apenas sua apresentação. */
export function mediasPorSegmento(registros: readonly Avaliacao[], categoria = "Todas") {
  return categorias.filter(c => categoria === "Todas" || categoria === c).map(nome => {
    const casos = registros.filter(r => r.pessoa.categoria === nome && r.score !== null);
    const media = casos.length ? casos.reduce((s, r) => s + (r.score ?? 0), 0) / casos.length : null;
    return { nome, media, avaliados: casos.length };
  }).sort((a, b) => a.media === null ? (b.media === null ? 0 : 1) : b.media === null ? -1 : b.media - a.media);
}

/** Média por avaliação, sem transformar ausência em zero ou excluir inelegíveis. */
export function mediaCompleta(registros: readonly Pick<Avaliacao, "score" | "status">[]): number | null {
  const scores = registros.filter(r => r.status !== "Pendente").map(r => r.score)
    .filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  return scores.length ? scores.reduce((s, score) => s + score, 0) / scores.length : null;
}

/** A origem recebe somente o mês; filtros da Visão Geral não participam da série. */
export function evolucaoGeral(obterMes = (mes: number) => ranking("mensal", mes)) {
  return meses.map((_, mes) => mediaCompleta(obterMes(mes)));
}

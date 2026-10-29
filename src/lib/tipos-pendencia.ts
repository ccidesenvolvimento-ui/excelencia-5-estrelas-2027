import type { Avaliacao, Estrela } from "./dados-demo";

/**
 * Classificação de pendências para a interface de demonstração.
 * Nunca inferir Gobrax ou Maxtrack apenas pelo segmento em produção:
 * a fonte esperada deve ser fornecida por um cadastro/mapeamento validado.
 */
export const opcoesPendencia = [
  { valor: "", titulo: "Todas as pendências" },
  { valor: "sem-nenhum-dado", titulo: "Sem nenhum dado" },
  { valor: "sem-seguranca", titulo: "Sem Segurança" },
  { valor: "sem-produtividade", titulo: "Sem Produtividade" },
  { valor: "sem-dirigibilidade", titulo: "Sem Dirigibilidade (qualquer fonte)" },
  { valor: "sem-idt", titulo: "Sem IDT" },
  { valor: "sem-gobrax", titulo: "Sem Gobrax" },
  { valor: "sem-maxtrack", titulo: "Sem Maxtrack" },
  { valor: "sem-fonte-definida", titulo: "Dirigibilidade sem fonte definida" },
  { valor: "sem-jornada", titulo: "Sem Jornada" },
  { valor: "sem-treinamentos", titulo: "Sem Treinamentos" },
  { valor: "sem-eficiencia", titulo: "Sem Eficiência Operacional" },
  { valor: "sem-conservacao", titulo: "Sem Conservação/Operação" },
] as const;

export type TipoPendencia = (typeof opcoesPendencia)[number]["valor"];
type TipoEspecifico = Exclude<TipoPendencia, "">;
export const nomesPendencia: Record<TipoEspecifico, string> = Object.fromEntries(
  opcoesPendencia.filter(p => p.valor !== "").map(p => [p.valor, p.titulo])
) as Record<TipoEspecifico, string>;

/** Fontes inventadas apenas para motoristas fictícios da base de testes. */
const fontesDirigibilidadeDemo: Record<string, "gobrax" | "maxtrack"> = {
  m004: "gobrax",
  m010: "maxtrack",
};

export function identificarPendencias(registro: Avaliacao): TipoEspecifico[] {
  if (registro.status !== "Pendente") return [];
  const faltando = (estrela: Estrela) => registro.notas[estrela] === undefined;
  const resultado: TipoEspecifico[] = [];
  const pessoa = registro.pessoa;
  const operador = pessoa.tipo === "Operador";

  if (faltando("seguranca")) resultado.push("sem-seguranca");
  if (faltando("produtividade")) resultado.push("sem-produtividade");

  if (faltando("dirigibilidade")) {
    if (operador) {
      resultado.push("sem-eficiencia");
    } else {
      resultado.push("sem-dirigibilidade");
      if (pessoa.categoria === "Bebidas") {
        resultado.push("sem-idt");
      } else if (fontesDirigibilidadeDemo[pessoa.id] === "gobrax") {
        resultado.push("sem-gobrax");
      } else if (fontesDirigibilidadeDemo[pessoa.id] === "maxtrack") {
        resultado.push("sem-maxtrack");
      } else {
        resultado.push("sem-fonte-definida");
      }
    }
  }

  if (faltando("jornada")) resultado.push(operador ? "sem-conservacao" : "sem-jornada");
  if (faltando("treinamentos")) resultado.push("sem-treinamentos");

  const estrelas: Estrela[] = ["seguranca", "produtividade", "dirigibilidade", "jornada", "treinamentos"];
  if (estrelas.every(faltando)) resultado.unshift("sem-nenhum-dado");
  return resultado;
}

/** O filtro inclui pessoas com várias pendências, sem duplicar registros. */
export function atendeTipoPendencia(registro: Avaliacao, filtro: TipoPendencia): boolean {
  return !filtro || identificarPendencias(registro).includes(filtro);
}

/** Não repetimos o agrupador genérico junto das fontes específicas. */
export function rotulosPendencias(registro: Avaliacao): string[] {
  const codigos = identificarPendencias(registro);
  if (codigos.includes("sem-nenhum-dado")) return [nomesPendencia["sem-nenhum-dado"]];
  return codigos
    .filter(codigo => codigo !== "sem-dirigibilidade")
    .map(codigo => nomesPendencia[codigo]);
}

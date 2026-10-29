/** Validação demonstrativa: apenas metadados locais, sem ler ou enviar o XLSX. */
export type ResultadoSelecao = { tipo: "ok" | "erro"; texto: string };
const LIMITE_BYTES = 15 * 1024 * 1024;

export function conferirSelecaoRh0034(nome: string, tamanho: number): ResultadoSelecao {
  if (!/\.xlsx$/i.test(nome)) return { tipo: "erro", texto: "Formato não aceito. Selecione um arquivo .xlsx da RH0034." };
  if (tamanho === 0) return { tipo: "erro", texto: "O arquivo selecionado está vazio." };
  if (tamanho > LIMITE_BYTES) return { tipo: "erro", texto: "O arquivo ultrapassa o limite demonstrativo de 15 MB." };
  return {
    tipo: "ok",
    texto: "Seleção conferida: formato e tamanho aceitos. O arquivo NÃO foi lido, enviado, validado por linha ou importado. A confirmação real dependerá do ambiente autenticado.",
  };
}

/** Mapeamento por filial APENAS para a demonstração pública.
 * Na implantação real, a configuração pertence ao banco e exige permissão, validação e auditoria.
 */
export type FonteDirigibilidade = "IDT" | "Gobrax" | "Maxtrack";
export const CHAVE_FONTES_DEMO = "excelencia-5-estrelas-fontes-filiais-v09";
export const FONTES_DEMO_INICIAIS: Record<string, FonteDirigibilidade> = {
  Lavras: "Maxtrack",
  Jataí: "Gobrax",
  Itabira: "Gobrax",
  Contagem: "IDT",
  Betim: "Maxtrack",
  Varginha: "Gobrax",
  Formiga: "Gobrax",
};
const permitidas: FonteDirigibilidade[] = ["IDT", "Gobrax", "Maxtrack"];
export const OPCOES_FONTE: readonly FonteDirigibilidade[] = permitidas;

export function validarFontes(valor: unknown): Record<string, FonteDirigibilidade> {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  return Object.fromEntries(Object.entries(valor).filter(([filial, fonte]) =>
    filial.length > 0 && permitidas.includes(fonte as FonteDirigibilidade)
  )) as Record<string, FonteDirigibilidade>;
}

export function carregarFontesDemo(): Record<string, FonteDirigibilidade> {
  if (typeof window === "undefined") return { ...FONTES_DEMO_INICIAIS };
  try {
    const salvo = window.localStorage.getItem(CHAVE_FONTES_DEMO);
    return salvo === null ? { ...FONTES_DEMO_INICIAIS } : validarFontes(JSON.parse(salvo));
  } catch { return { ...FONTES_DEMO_INICIAIS }; }
}

export function gravarFontesDemo(fontes: Record<string, FonteDirigibilidade>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE_FONTES_DEMO, JSON.stringify(fontes));
    window.dispatchEvent(new Event("fontes-dirigibilidade-demo-alteradas"));
  } catch { /* armazenamento indisponível: permanece no estado React */ }
}

export function fonteFilial(filial: string, fontes: Record<string, FonteDirigibilidade>): FonteDirigibilidade | null {
  return fontes[filial] ?? null;
}

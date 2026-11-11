import type { Estrela } from "./dados-demo";

/** Regra compartilhada apenas com a pré-visualização fictícia da UI.
 * A RPC SQL deve revalidar tudo autonomamente antes de qualquer escrita real.
 */
export function validarAjusteNota({original,novaNota,justificativa,estrela}:{
  original:number;novaNota:string;justificativa:string;estrela:Estrela
}):string|null {
  if(estrela==="seguranca") return "Segurança não admite ajuste manual.";
  const valor=novaNota.trim().replace(",",".");
  if(!/^(?:\d{1,3})(?:\.\d{1,2})?$/.test(valor)) return "Informe uma nota de 0 a 100, com até duas casas decimais.";
  const nova=Number(valor);
  if(!Number.isFinite(nova)||nova<0||nova>100) return "A nota deve estar entre 0 e 100.";
  if(Math.round(nova*100)===Math.round(original*100)) return "A nova nota deve ser diferente da nota efetiva.";
  const motivo=justificativa.trim();
  if(motivo.length<15||motivo.length>1000) return "Informe uma justificativa de 15 a 1000 caracteres.";
  return null;
}

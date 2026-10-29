import type { ReactNode } from "react";

/** Ícones vetoriais com traço uniforme, sem fontes externas ou dependências. */
export type NomeIconeSistema =
  | "visao" | "painel" | "ranking" | "pendencias" | "importacoes"
  | "rh" | "relatorios" | "usuarios" | "configuracoes" | "diagnostico"
  | "painel-fechar" | "painel-abrir" | "menu" | "fechar" | "seta" | "estrela";

const desenhos: Record<NomeIconeSistema, ReactNode> = {
  visao: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  painel: <><path d="M3 3v18h18"/><path d="M7 16v-4M12 16V8M17 16v-7"/></>,
  ranking: <><path d="M3 17h4v4H3zM10 12h4v9h-4zM17 8h4v13h-4z"/><path d="m4 11 5-4 4 2 6-5"/><path d="M16 4h3v3"/></>,
  pendencias: <><circle cx="12" cy="12" r="9"/><path d="M12 6.8V12l3.5 2.2"/></>,
  importacoes: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
  rh: <><circle cx="9" cy="7.5" r="3.5"/><path d="M2.5 21v-2.1a5.5 5.5 0 0 1 5.5-5.5h2a5.5 5.5 0 0 1 5.5 5.5V21M18.5 7v7M15 10.5h7"/></>,
  relatorios: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/><path d="M8 17v-3M11 17v-5M14 17v-2M17 17v-6"/></>,
  usuarios: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 11l2 2 3-4M17 3.5a4 4 0 0 1 3 3"/></>,
  configuracoes: <><path d="M10.4 2.4h3.2l.5 2.1 1.6.7 2-.9 2.3 2.3-.9 2 .7 1.6 2.1.5v3.2l-2.1.5-.7 1.6.9 2-2.3 2.3-2-.9-1.6.7-.5 2.1h-3.2l-.5-2.1-1.6-.7-2 .9-2.3-2.3.9-2-.7-1.6-2.1-.5v-3.2l2.1-.5.7-1.6-.9-2 2.3-2.3 2 .9 1.6-.7z"/><circle cx="12" cy="12" r="3"/></>,
  diagnostico: <><path d="M8 7 6.5 4M16 7l1.5-3M5 10 2 8M19 10l3-2M5 16l-3 2M19 16l3 2"/><rect x="6" y="7" width="12" height="14" rx="5"/><path d="M6 13h12M12 13v8M9 3h6"/></>,
  "painel-fechar": <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 9l-3 3 3 3"/></>,
  "painel-abrir": <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m4-12 3 3-3 3"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  fechar: <path d="M18 6 6 18M6 6l12 12"/>,
  seta: <path d="M5 12h14m-6-6 6 6-6 6"/>,
  estrela: <path d="m12 2 3.1 6.5 7.1 1-5.1 5 .9 7-6-3.4-6 3.4.9-7-5.1-5 7.1-1z"/>,
};

export function IconeSistema({ nome, tamanho = 20, classe }: { nome: NomeIconeSistema; tamanho?: number; classe?: string }) {
  return <svg className={classe} width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{desenhos[nome]}</svg>;
}

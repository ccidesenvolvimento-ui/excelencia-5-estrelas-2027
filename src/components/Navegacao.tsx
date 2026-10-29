"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { IconeSistema, type NomeIconeSistema } from "@/components/IconesSistema";

type ItemMenu = { url: string; titulo: string; icone: NomeIconeSistema };
const itens: ItemMenu[] = [
  { url: "/", titulo: "Visão geral", icone: "visao" },
  { url: "/painel", titulo: "Painel", icone: "painel" },
  { url: "/ranking", titulo: "Ranking", icone: "ranking" },
  { url: "/pendencias", titulo: "Pendências", icone: "pendencias" },
  { url: "/importacoes", titulo: "Importações", icone: "importacoes" },
  { url: "/rh0034", titulo: "Cadastro RH0034", icone: "rh" },
  { url: "/relatorios", titulo: "Relatórios", icone: "relatorios" },
  { url: "/usuarios", titulo: "Usuários e acessos", icone: "usuarios" },
  { url: "/configuracoes", titulo: "Configurações", icone: "configuracoes" },
  { url: "/diagnostico", titulo: "Testes e erros", icone: "diagnostico" },
];
const CHAVE_MENU = "excelencia-5-estrelas-sidebar-recolhida";

export function Navegacao({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [recolhida, setRecolhida] = useState(false);
  const [expansaoTemporaria, setExpansaoTemporaria] = useState(false);
  const [mobileAberto, setMobileAberto] = useState(false);
  const expandida = !recolhida || expansaoTemporaria;

  useEffect(() => {
    try { setRecolhida(window.localStorage.getItem(CHAVE_MENU) === "sim"); } catch { /* modo privativo */ }
  }, []);
  useEffect(() => { setMobileAberto(false); }, [caminho]);
  useEffect(() => {
    if (!mobileAberto) return;
    const tecla = (evento: KeyboardEvent) => { if (evento.key === "Escape") setMobileAberto(false); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [mobileAberto]);

  function alternarRecolhimento() {
    const proximo = !recolhida;
    setRecolhida(proximo);
    setExpansaoTemporaria(false);
    try { window.localStorage.setItem(CHAVE_MENU, proximo ? "sim" : "nao"); } catch { /* modo privativo */ }
  }

  return <div className={`app-shell ${recolhida ? "nav-recolhida" : ""} ${expansaoTemporaria ? "nav-hover" : ""}`}>
    <aside
      className={`sidebar ${mobileAberto ? "sidebar-aberta" : ""}`}
      aria-label="Menu do sistema"
      onMouseEnter={() => { if (recolhida) setExpansaoTemporaria(true); }}
      onMouseLeave={() => setExpansaoTemporaria(false)}
      onFocusCapture={() => { if (recolhida) setExpansaoTemporaria(true); }}
      onBlurCapture={evento => {
        if (recolhida && !evento.currentTarget.contains(evento.relatedTarget as Node | null)) {
          setExpansaoTemporaria(false);
        }
      }}
    >
      <div className="branding">
        <div className="branding-top">
          <Link href="/" className="branding-home" aria-label="Ir para Visão geral" onClick={() => setMobileAberto(false)}>
            <img className="branding-imagem" src={`${base}/marca-programa.png`} alt="Programa Excelência 5 Estrelas" />
            <span className="branding-marca-mini"><IconeSistema nome="estrela" tamanho={23}/></span>
          </Link>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={alternarRecolhimento}
            title={recolhida ? "Manter menu expandido" : "Recolher menu"}
            aria-label={recolhida ? "Fixar menu expandido" : "Recolher menu para exibir só ícones"}
            aria-pressed={recolhida}
          >
            <IconeSistema nome={recolhida ? "painel-abrir" : "painel-fechar"} tamanho={19}/>
          </button>
          <button type="button" className="mobile-close" aria-label="Fechar menu" onClick={() => setMobileAberto(false)}><IconeSistema nome="fechar" tamanho={19}/></button>
        </div>
        <span className="branding-subtitulo">Plataforma de avaliação · 2027</span>
      </div>
      <div className="ambiente" title="Ambiente demonstrativo sem dados reais">
        <span className="ambiente-ponto" aria-hidden="true" />
        <span className="ambiente-texto">AMBIENTE DE DEMONSTRAÇÃO</span>
      </div>
      <nav id="menu-lateral" className="menu" aria-label="Páginas do sistema">
        {itens.map(item => <Link
          key={item.url}
          href={item.url}
          aria-label={item.titulo}
          aria-current={caminho === item.url ? "page" : undefined}
          className={caminho === item.url ? "ativo" : ""}
          title={!expandida && !mobileAberto ? item.titulo : undefined}
          onClick={() => {
            setMobileAberto(false);
            // Clique em um ícone recolhido fixa o menu aberto, além de navegar.
            if (recolhida) {
              setRecolhida(false);
              setExpansaoTemporaria(false);
              try { window.localStorage.setItem(CHAVE_MENU, "nao"); } catch { /* modo privativo */ }
            }
          }}
        >
          <span className="menu-icone"><IconeSistema nome={item.icone} tamanho={20}/></span>
          <span className="menu-rotulo">{item.titulo}</span>
        </Link>)}
      </nav>
      <div className="sidebar-rodape">
        <span className="rodape-expandido">Dados fictícios · Nenhuma informação corporativa<br/>v0.4 · Protótipo visual</span>
        <span className="rodape-recolhido" aria-label="Protótipo versão 0.4">v0.4</span>
      </div>
    </aside>

    <div className="workspace">
      <header className="header">
        <button type="button" className="menu-toggle" onClick={() => setMobileAberto(v => !v)} aria-label={mobileAberto ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileAberto} aria-controls="menu-lateral">
          <IconeSistema nome="menu" tamanho={22}/>
        </button>
        <div><strong>Excelência 5 Estrelas</strong><span>Programa de reconhecimento operacional</span></div>
        <span className="chip-demo">DEMO · 2027</span>
      </header>
      <div className="area-conteudo">{children}</div>
    </div>
    {mobileAberto && <button type="button" className="overlay" aria-label="Fechar menu lateral" onClick={() => setMobileAberto(false)} />}
  </div>;
}

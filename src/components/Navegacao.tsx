"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { IconeSistema, type NomeIconeSistema } from "@/components/IconesSistema";

type ItemMenu = { url: string; titulo: string; icone: NomeIconeSistema };
const itens: ItemMenu[] = [
  { url: "/", titulo: "Visão geral", icone: "visao" },
  { url: "/ranking", titulo: "Ranking", icone: "ranking" },
  { url: "/pendencias", titulo: "Pendências", icone: "pendencias" },
  { url: "/importacoes", titulo: "Importações", icone: "importacoes" },
  { url: "/rh0034", titulo: "Cadastro RH0034", icone: "rh" },
  { url: "/configuracoes", titulo: "Configurações", icone: "configuracoes" },
  { url: "/diagnostico", titulo: "Testes e erros", icone: "diagnostico" },
  { url: "/motorista", titulo: "Portal do motorista", icone: "rh" },
];
const CHAVE_MENU = "excelencia-5-estrelas-sidebar-modo-v05";
type ModoMenu = "flutuante" | "fixo";

export function Navegacao({ children }: { children: ReactNode }) {
  const caminho = (usePathname() || "/").replace(/\/+$/, "") || "/";
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  // No primeiro acesso a navegação começa flutuante. Só o botão superior fixa o menu.
  const [modoMenu, setModoMenu] = useState<ModoMenu>("flutuante");
  const [expansaoTemporaria, setExpansaoTemporaria] = useState(false);
  const [mobileAberto, setMobileAberto] = useState(false);
  const flutuante = modoMenu === "flutuante";
  const expandida = !flutuante || expansaoTemporaria;

  useEffect(() => {
    try {
      setModoMenu(window.localStorage.getItem(CHAVE_MENU) === "fixo" ? "fixo" : "flutuante");
    } catch { /* armazenamento indisponível */ }
  }, []);
  useEffect(() => { setMobileAberto(false); }, [caminho]);
  useEffect(() => {
    if (!mobileAberto) return;
    const tecla = (evento: KeyboardEvent) => { if (evento.key === "Escape") setMobileAberto(false); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [mobileAberto]);

  function alternarModo() {
    const proximo: ModoMenu = flutuante ? "fixo" : "flutuante";
    setModoMenu(proximo);
    setExpansaoTemporaria(false);
    try { window.localStorage.setItem(CHAVE_MENU, proximo); } catch { /* armazenamento indisponível */ }
  }

  // A rota pública tem experiência independente e mobile-first, sem o painel administrativo.
  if(caminho === "/motorista" || caminho.startsWith("/motorista/") || (base && (caminho===`${base}/motorista` || caminho.startsWith(`${base}/motorista/`)))) return <>{children}</>;

  return <div className={`app-shell ${flutuante ? "nav-recolhida" : "nav-fixa"} ${flutuante && expansaoTemporaria ? "nav-hover" : ""}`}>
    <aside
      className={`sidebar ${mobileAberto ? "sidebar-aberta" : ""}`}
      aria-label="Menu do sistema"
      onMouseEnter={() => { if (flutuante) setExpansaoTemporaria(true); }}
      onMouseLeave={() => setExpansaoTemporaria(false)}
      onFocusCapture={() => { if (flutuante) setExpansaoTemporaria(true); }}
      onBlurCapture={evento => {
        if (flutuante && !evento.currentTarget.contains(evento.relatedTarget as Node | null)) {
          setExpansaoTemporaria(false);
        }
      }}
    >
      <div className="branding">
        <div className="branding-top">
          <Link href="/" className="branding-home" aria-label="Ir para Visão geral" onClick={() => { setMobileAberto(false); if (flutuante) setExpansaoTemporaria(false); }}>
            <img className="branding-imagem" src={`${base}/marca-programa.png`} alt="Programa Excelência 5 Estrelas" />
            <span className="branding-marca-mini"><img className="estrela-oficial-mini" src={`${base}/estrela-oficial-5-estrelas.png`} alt="Símbolo oficial do Programa 5 Estrelas" /></span>
          </Link>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={alternarModo}
            title={flutuante ? "Fixar menu aberto" : "Ativar menu flutuante"}
            aria-label={flutuante ? "Fixar menu lateral aberto" : "Ativar menu lateral flutuante"}
            aria-pressed={!flutuante}
          >
            <IconeSistema nome={flutuante ? "painel-abrir" : "painel-fechar"} tamanho={19}/>
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
            // Navegar NÃO altera o modo. Se flutuante, recolhe após a escolha.
            if (flutuante) setExpansaoTemporaria(false);
          }}
        >
          <span className="menu-icone"><IconeSistema nome={item.icone} tamanho={20}/></span>
          <span className="menu-rotulo">{item.titulo}</span>
        </Link>)}
      </nav>
      <div className="sidebar-rodape">
        <span className="rodape-expandido">Dados fictícios · Nenhuma informação corporativa<br/>v0.8 · Protótipo visual</span>
        <span className="rodape-recolhido" aria-label="Protótipo versão 0.8">v0.8</span>
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

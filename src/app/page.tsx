"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  categorias,
  formatarNota,
  meses,
  periodos,
  pessoas,
  ranking,
  type Categoria,
  type Periodo,
} from "@/lib/dados-demo";
import estilo from "./visao-geral.module.css";

type IconeNome = "pessoas" | "check" | "alerta" | "pendente" | "seta" | "ranking" | "arquivo" | "rh" | "chart";

function Icone({ nome, tamanho = 20 }: { nome: IconeNome; tamanho?: number }) {
  const desenhos: Record<IconeNome, string> = {
    pessoas: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    check: "M20 6 9 17l-5-5",
    alerta: "M12 9v4 M12 17h.01 M10.3 3.7 2-1a3 3 0 0 1 3.4 0l8.1 14a3 3 0 0 1-2.6 4.5H5a3 3 0 0 1-2.6-4.5l8-14Z",
    pendente: "M12 6v6l4 2 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
    seta: "M5 12h14 M13 6l6 6-6 6",
    ranking: "M3 17h4v4H3z M10 12h4v9h-4z M17 5h4v16h-4z M4 8l5-3 4 2 6-5",
    arquivo: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8",
    rh: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M16 7h6 M19 4v6",
    chart: "M3 3v18h18 M7 15l4-4 4 2 5-7",
  };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={desenhos[nome]} />
    </svg>
  );
}

function CartaoMetrica({
  icone, titulo, valor, descricao, cor,
}: {
  icone: IconeNome;
  titulo: string;
  valor: string | number;
  descricao: string;
  cor: "azul" | "verde" | "vermelho" | "amarelo";
}) {
  return (
    <article className={`${estilo.metrica} ${estilo[`metrica_${cor}`]}`}>
      <div className={estilo.metricaTopo}>
        <span className={estilo.metricaTitulo}>{titulo}</span>
        <span className={estilo.metricaIcone}><Icone nome={icone} /></span>
      </div>
      <strong className={estilo.metricaNumero}>{valor}</strong>
      <span className={estilo.metricaDescricao}>{descricao}</span>
    </article>
  );
}

function IconeLink({ href, icone, titulo, texto }: { href: string; icone: IconeNome; titulo: string; texto: string }) {
  return (
    <Link className={estilo.atalho} href={href}>
      <span className={estilo.atalhoIcone}><Icone nome={icone} tamanho={19}/></span>
      <span className={estilo.atalhoTexto}><strong>{titulo}</strong><small>{texto}</small></span>
      <span className={estilo.atalhoSeta}><Icone nome="seta" tamanho={18}/></span>
    </Link>
  );
}

function linhaSerie(serie: (number | null)[]): string {
  return serie.flatMap((v, i) => v === null ? [] : [`${24 + i * 62},${141 - v * 1.18}`]).map((p, i) => `${i === 0 ? "M" : "L"} ${p}`).join(" ");
}

export default function VisaoGeral() {
  const [periodo, setPeriodo] = useState<Periodo>("mensal");
  const [mes, setMes] = useState(3);
  const [categoria, setCategoria] = useState<string>("Todas");
  const [filial, setFilial] = useState("Todas");

  const filiais = useMemo(() => {
    const valores = pessoas
      .filter(p => p.categoria !== null && (categoria === "Todas" || p.categoria === categoria))
      .map(p => p.filial);
    return [...new Set(valores)].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [categoria]);

  const registros = useMemo(() => ranking(periodo, mes).filter(r =>
    (categoria === "Todas" || r.pessoa.categoria === categoria) &&
    (filial === "Todas" || r.pessoa.filial === filial)
  ), [periodo, mes, categoria, filial]);

  const elegiveis = registros.filter(r => r.status === "Elegível");
  const inelegiveis = registros.filter(r => r.status === "Inelegível");
  const pendentes = registros.filter(r => r.status === "Pendente");
  const completos = [...elegiveis, ...inelegiveis];
  const scoreMedio = completos.length
    ? completos.reduce((total, r) => total + (r.score ?? 0), 0) / completos.length
    : null;
  const taxaElegiveis = completos.length ? Math.round(elegiveis.length / completos.length * 100) : 0;
  const total = registros.length;
  const distElegiveis = total ? elegiveis.length / total * 100 : 0;
  const distInelegiveis = total ? inelegiveis.length / total * 100 : 0;

  const mediasSegmento = useMemo(() => categorias
    .filter(c => categoria === "Todas" || categoria === c)
    .map(c => {
      const casos = registros.filter(r => r.pessoa.categoria === c && r.score !== null);
      const media = casos.length ? casos.reduce((s, r) => s + (r.score ?? 0), 0) / casos.length : null;
      return { nome: c, media, avaliados: casos.length };
    }), [categoria, registros]);

  const evolucao = useMemo(() => meses.map((_, i) => {
    const registrosMes = ranking("mensal", i).filter(r =>
      (categoria === "Todas" || r.pessoa.categoria === categoria) &&
      (filial === "Todas" || r.pessoa.filial === filial) && r.score !== null
    );
    return registrosMes.length ? registrosMes.reduce((s, r) => s + (r.score ?? 0), 0) / registrosMes.length : null;
  }), [categoria, filial]);

  const foraDeClassificacao = pessoas.filter(p => p.categoria === null && p.tipo !== "Empilhadeira").length;
  const emFerias = pessoas.filter(p => p.situacao === "Férias" && p.categoria &&
    (categoria === "Todas" || p.categoria === categoria) &&
    (filial === "Todas" || p.filial === filial)).length;
  const linha = linhaSerie(evolucao);

  return (
    <main className={estilo.pagina}>
      <div className={estilo.cabecalho}>
        <div>
          <div className={estilo.sobreTitulo}><span className={estilo.pontoAzul}/> PAINEL GERENCIAL <span className={estilo.divisor}>/</span> VISÃO GERAL</div>
          <h1 className={estilo.titulo}>Visão geral <span>da excelência.</span></h1>
          <p className={estilo.subtitulo}>Acompanhe desempenho, elegibilidade e pendências do Programa Excelência 5 Estrelas.</p>
        </div>
        <Link href="/ranking" className={estilo.botaoPrincipal}>Acessar ranking <Icone nome="seta" tamanho={17}/></Link>
      </div>

      <div className={estilo.alertaDemo} role="note"><span className={estilo.sinalDemo}>DEMO</span> Ambiente visual de testes com dados fictícios de 2027. Não representa resultados oficiais da Expresso Nepomuceno.</div>

      <div className={estilo.filtros}>
        <div className={estilo.filtrosLabel}><span>◫</span> Filtros da visão</div>
        <label className={estilo.filtro}><span>Período</span><select value={periodo} onChange={e => setPeriodo(e.target.value as Periodo)}>{periodos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
        {periodo === "mensal" && <label className={estilo.filtro}><span>Mês</span><select value={mes} onChange={e => setMes(Number(e.target.value))}>{meses.map((m, i) => <option key={m} value={i}>{m}/2027</option>)}</select></label>}
        <label className={`${estilo.filtro} ${estilo.filtroLongo}`}><span>Segmento</span><select value={categoria} onChange={e => {setCategoria(e.target.value); setFilial("Todas");}}><option value="Todas">Todos os segmentos</option>{categorias.map(c => <option value={c} key={c}>{c}</option>)}</select></label>
        <label className={estilo.filtro}><span>Filial</span><select value={filial} onChange={e => setFilial(e.target.value)}><option value="Todas">Todas as filiais</option>{filiais.map(f => <option key={f}>{f}</option>)}</select></label>
      </div>

      <section className={estilo.resumo} aria-label="Indicadores principais do período">
        <CartaoMetrica icone="pessoas" titulo="Participantes no período" valor={total} descricao="Cadastros simulados ativos na avaliação" cor="azul" />
        <CartaoMetrica icone="check" titulo="Elegíveis" valor={elegiveis.length} descricao="Cinco estrelas completas e positivas" cor="verde" />
        <CartaoMetrica icone="alerta" titulo="Inelegíveis" valor={inelegiveis.length} descricao="Pelo menos uma estrela zerada" cor="vermelho" />
        <CartaoMetrica icone="pendente" titulo="Pendências" valor={pendentes.length} descricao="Faltam notas; fora do ranking" cor="amarelo" />
      </section>

      <div className={estilo.primeiraLinha}>
        <section className={estilo.painel} aria-labelledby="segTitulo">
          <div className={estilo.painelCabecalho}><div><div className={estilo.painelTag}>DESEMPENHO OPERACIONAL</div><h2 id="segTitulo">Score médio por segmento</h2><p>Média das avaliações completas, por categoria.</p></div><span className={estilo.iconePainel}><Icone nome="chart"/></span></div>
          <div className={estilo.listaSegmentos}>
            {mediasSegmento.map(c => <div className={estilo.segmento} key={c.nome}>
              <div className={estilo.segmentoTitulo}><strong>{c.nome}</strong><span>{c.avaliados} avaliado{c.avaliados !== 1 ? "s" : ""}</span></div>
              <div className={estilo.segmentoGrafico}><span className={estilo.segmentoTrilho}><span style={{ width: `${c.media ?? 0}%` }} /></span><strong>{formatarNota(c.media)}</strong></div>
            </div>)}
          </div>
          <p className={estilo.painelNota}>A comparação entre segmentos é apenas ilustrativa; não altera os rankings oficiais de cada categoria.</p>
        </section>

        <div className={estilo.colunaDireita}>
          <section className={estilo.painel} aria-labelledby="elegTitulo">
            <div className={estilo.painelCabecalho}><div><div className={estilo.painelTag}>AVALIAÇÕES NO PERÍODO</div><h2 id="elegTitulo">Situação geral</h2></div></div>
            <div className={estilo.graficoSituacao}>
              <div className={estilo.anel} style={{background: total ? `conic-gradient(#40d8a5 0% ${distElegiveis}%, #ff8f97 ${distElegiveis}% ${distElegiveis + distInelegiveis}%, #eebd67 ${distElegiveis + distInelegiveis}% 100%)` : "#284662"}}>
                <div className={estilo.anelCentro}><strong>{taxaElegiveis}%</strong><span>elegíveis entre<br/>avaliados completos</span></div>
              </div>
              <div className={estilo.legendaSituacao}>
                <div><span className={`${estilo.bolinha} ${estilo.bVerde}`} /><span>Elegíveis</span><strong>{elegiveis.length}</strong></div>
                <div><span className={`${estilo.bolinha} ${estilo.bVermelha}`} /><span>Inelegíveis</span><strong>{inelegiveis.length}</strong></div>
                <div><span className={`${estilo.bolinha} ${estilo.bAmarela}`} /><span>Pendentes</span><strong>{pendentes.length}</strong></div>
              </div>
            </div>
          </section>
          <section className={`${estilo.painel} ${estilo.painelScore}`}>
            <div className={estilo.painelTag}>NOTA CONSOLIDADA · DADOS FICTÍCIOS</div>
            <div className={estilo.scoreLinha}><span>Score médio</span><strong>{formatarNota(scoreMedio)} <small>/ 100</small></strong></div>
            <div className={estilo.scoreTrilho}><span style={{width:`${scoreMedio ?? 0}%`}}/></div>
            <p>Considera apenas avaliações completas nos filtros selecionados.</p>
          </section>
        </div>
      </div>

      <div className={estilo.segundaLinha}>
        <section className={estilo.painel} aria-labelledby="evolucaoTitulo">
          <div className={estilo.painelCabecalho}><div><div className={estilo.painelTag}>TENDÊNCIA DO ANO · SIMULAÇÃO</div><h2 id="evolucaoTitulo">Evolução mensal do score</h2><p>Média entre participantes com avaliações completas em cada mês.</p></div></div>
          <div className={estilo.graficoLinha}>
            <div className={estilo.graficoEscala}><span>100</span><span>75</span><span>50</span></div>
            <svg viewBox="0 0 730 170" preserveAspectRatio="none" role="img" aria-label="Gráfico ilustrativo da média mensal de notas em 2027">
              <defs><linearGradient id="grafico-degradado" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#49beff" stopOpacity=".25"/><stop offset="1" stopColor="#49beff" stopOpacity="0"/></linearGradient></defs>
              <path d="M24 23 H706 M24 82 H706 M24 141 H706" stroke="#31516d" strokeWidth="1" strokeDasharray="5 8" fill="none"/>
              {linha && <><path d={`${linha} L706 156 L24 156 Z`} fill="url(#grafico-degradado)"/><path d={linha} fill="none" stroke="#51caff" strokeWidth="3" vectorEffect="non-scaling-stroke"/></>}
              {evolucao.map((v, i) => v === null ? null : <circle key={meses[i]} cx={24 + i * 62} cy={141 - v * 1.18} r="4.2" fill="#071c31" stroke="#67d4ff" strokeWidth="2.5"><title>{meses[i]}: {formatarNota(v)}</title></circle>)}
            </svg>
          </div>
          <div className={estilo.graficoMeses}>{meses.map(m => <span key={m}>{m}</span>)}</div>
        </section>

        <section className={estilo.painel} aria-labelledby="atencaoTitulo">
          <div className={estilo.painelCabecalho}><div><div className={estilo.painelTag}>ACOMPANHAMENTO</div><h2 id="atencaoTitulo">Pontos de atenção</h2><p>Itens para investigação na demonstração.</p></div></div>
          <div className={estilo.atencoes}>
            <Link href="/pendencias" className={estilo.atencao}><span className={estilo.alertaCirculo}>!</span><span><strong>{pendentes.length} pendência{pendentes.length === 1 ? "" : "s"} de avaliação</strong><small>Verificar notas ainda não informadas</small></span><Icone nome="seta" tamanho={16}/></Link>
            <Link href="/rh0034" className={estilo.atencao}><span className={estilo.alertaCirculoAzul}>?</span><span><strong>{foraDeClassificacao} classificação{foraDeClassificacao === 1 ? "" : "ões"} em aberto</strong><small>Sem categoria na base fictícia completa</small></span><Icone nome="seta" tamanho={16}/></Link>
            <div className={estilo.atencao}><span className={estilo.alertaCirculoNeutro}>◷</span><span><strong>{emFerias} colaborador{emFerias === 1 ? "" : "es"} em férias</strong><small>Tratamento especial apenas no fechamento do ciclo</small></span></div>
          </div>
        </section>
      </div>

      <section className={estilo.atalhosSecao} aria-label="Atalhos do sistema">
        <div className={estilo.atalhosCabecalho}><div><div className={estilo.painelTag}>ACESSO RÁPIDO</div><h2>Continue de onde precisa.</h2></div><span>Principais áreas do sistema</span></div>
        <div className={estilo.gradeAtalhos}>
          <IconeLink href="/ranking" icone="ranking" titulo="Ranking" texto="Consulte notas e posições" />
          <IconeLink href="/pendencias" icone="pendente" titulo="Pendências" texto="Investigue avaliações incompletas" />
          <IconeLink href="/importacoes" icone="arquivo" titulo="Importações" texto="Baixe os modelos Excel oficiais" />
          <IconeLink href="/rh0034" icone="rh" titulo="Cadastro RH0034" texto="Classifique os colaboradores" />
        </div>
      </section>

      <p className={estilo.rodape}>Protótipo visual v0.3 · Dados fictícios · Cálculos ilustrativos · Sem conexão com banco de dados.</p>
    </main>
  );
}

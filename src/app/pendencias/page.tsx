"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AvisoDemo } from "@/components/Elementos";
import { categorias, meses, pessoas, ranking, type Avaliacao } from "@/lib/dados-demo";
import { exportarCsv } from "@/lib/exportar";
import { carregarFontesDemo, fonteFilial, type FonteDirigibilidade } from "@/lib/fontes-dirigibilidade";
import { atendeTipoPendencia, identificarPendencias, nomesPendencia, opcoesPendencia, rotulosPendencias, type TipoPendencia } from "@/lib/tipos-pendencia";
import "./pendencias.css";

type Ordenar = "nome" | "matricula" | "filial" | "segmento" | "pendencias";
const PALETA: Record<Exclude<TipoPendencia, "">, string> = {
  "sem-seguranca": "seguranca",
  "sem-produtividade": "produtividade",
  "sem-dirigibilidade": "dirigibilidade",
  "sem-jornada": "jornada",
  "sem-treinamentos": "treinamentos",
};
const compararTexto = (a: string, b: string) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });

export default function Pendencias() {
  const [mes, setMes] = useState(3);
  const [tipo, setTipo] = useState<TipoPendencia>("");
  const [categoria, setCategoria] = useState("");
  const [filial, setFilial] = useState("");
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenar>("nome");
  const [direcao, setDirecao] = useState<"asc" | "desc">("asc");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(8);
  const [detalhe, setDetalhe] = useState<Avaliacao | null>(null);
  const [fontes, setFontes] = useState<Record<string, FonteDirigibilidade>>({});

  useEffect(() => {
    const atualizar = () => setFontes(carregarFontesDemo());
    atualizar();
    window.addEventListener("storage", atualizar);
    window.addEventListener("fontes-dirigibilidade-demo-alteradas", atualizar);
    return () => {
      window.removeEventListener("storage", atualizar);
      window.removeEventListener("fontes-dirigibilidade-demo-alteradas", atualizar);
    };
  }, []);
  useEffect(() => {
    if (!detalhe) return;
    const fechar = (e: KeyboardEvent) => { if (e.key === "Escape") setDetalhe(null); };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [detalhe]);

  const filiais = useMemo(() => [...new Set(
    pessoas.filter(p => p.categoria !== null && (!categoria || p.categoria === categoria)).map(p => p.filial)
  )].sort(compararTexto), [categoria]);
  const pendentes = useMemo(() => ranking("mensal", mes).filter(r => r.status === "Pendente"), [mes]);
  const faltantes = useMemo(() => pendentes.filter(r =>
    (!categoria || r.pessoa.categoria === categoria) &&
    (!filial || r.pessoa.filial === filial) &&
    atendeTipoPendencia(r, tipo) &&
    `${r.pessoa.nome} ${r.pessoa.matricula}`.toLocaleLowerCase("pt-BR").includes(busca.trim().toLocaleLowerCase("pt-BR"))
  ).sort((a, b) => {
    const valores = (r: Avaliacao) => ordenacao === "nome" ? r.pessoa.nome :
      ordenacao === "matricula" ? r.pessoa.matricula :
      ordenacao === "filial" ? r.pessoa.filial :
      ordenacao === "segmento" ? r.pessoa.categoria ?? "" :
      String(identificarPendencias(r).length).padStart(3, "0");
    const resultado = compararTexto(valores(a), valores(b));
    return (direcao === "asc" ? 1 : -1) * resultado;
  }), [pendentes, categoria, filial, tipo, busca, ordenacao, direcao]);

  const totalPaginas = Math.max(1, Math.ceil(faltantes.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const exibidos = faltantes.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);
  const primeiro = faltantes.length ? (paginaAtual - 1) * porPagina + 1 : 0;
  const ultimo = Math.min(faltantes.length, paginaAtual * porPagina);

  function limpar() {
    setMes(3); setTipo(""); setCategoria(""); setFilial(""); setBusca("");
    setPagina(1); setOrdenacao("nome"); setDirecao("asc");
  }
  function ordenar(coluna: Ordenar) {
    if (ordenacao === coluna) setDirecao(v => v === "asc" ? "desc" : "asc");
    else { setOrdenacao(coluna); setDirecao("asc"); }
    setPagina(1);
  }
  function exportar() {
    exportarCsv(`pendencias_${meses[mes].toLowerCase()}_2027_DEMO.csv`, [
      ["Nome", "Matrícula", "Filial", "Segmento", "Competência", "Pendências", "Fonte configurada de Dirigibilidade", "Situação"],
      ...faltantes.map(r => [
        r.pessoa.nome, r.pessoa.matricula, r.pessoa.filial, r.pessoa.categoria ?? "", `${meses[mes]}/2027`,
        rotulosPendencias(r).join(" | "),
        r.pessoa.tipo === "Motorista" && identificarPendencias(r).includes("sem-dirigibilidade") ? fonteFilial(r.pessoa.filial, fontes) ?? "Não definida" : "—",
        "Pendente",
      ]),
    ]);
  }

  return <main className="cp-pagina">
    <div className="cp-titulo">
      <div className="cp-kicker">QUALIDADE DE DADOS <span>/</span> PROGRAMA EXCELÊNCIA 5 ESTRELAS</div>
      <h1>Central de Pendências</h1>
      <p>Acompanhe os colaboradores com avaliações incompletas e identifique os cinco critérios do Programa Excelência 5 Estrelas.</p>
    </div>
    <AvisoDemo texto="Ambiente público de demonstração: apenas nomes e notas fictícios. Não utilize arquivos corporativos reais. As fontes configuradas por filial são exemplos locais, sem conexão com o RH ou o banco de dados."/>

    <section className="cp-card cp-filtros" aria-labelledby="cp-titulo-filtros">
      <div className="cp-secao-cabecalho"><span className="cp-secao-icone"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16l-6.5 7.5V20l-3-2v-5.5z"/></svg></span><h2 id="cp-titulo-filtros">Filtros</h2></div>
      <div className="cp-filtros-grid">
        <label className="cp-campo"><span>Tipo de pendência</span><select value={tipo} onChange={e => { setTipo(e.target.value as TipoPendencia); setPagina(1); }}>
          {opcoesPendencia.map(item => <option value={item.valor} key={item.valor}>{item.titulo}</option>)}
        </select></label>
        <label className="cp-campo"><span>Filial</span><select value={filial} onChange={e => { setFilial(e.target.value); setPagina(1); }}>
          <option value="">Todas as filiais</option>{filiais.map(f => <option key={f}>{f}</option>)}
        </select></label>
        <label className="cp-campo"><span>Segmento</span><select value={categoria} onChange={e => { setCategoria(e.target.value); setFilial(""); setPagina(1); }}>
          <option value="">Todos os segmentos</option>{categorias.map(c => <option key={c}>{c}</option>)}
        </select></label>
        <label className="cp-campo"><span>Competência</span><select value={mes} onChange={e => {setMes(Number(e.target.value)); setPagina(1);}}>
          {meses.map((m, i) => <option key={m} value={i}>{m}/2027</option>)}
        </select></label>
        <label className="cp-campo cp-busca"><span>Nome ou matrícula</span><input type="search" placeholder="Pesquisar colaborador" value={busca} onChange={e => {setBusca(e.target.value);setPagina(1);}}/></label>
      </div>
      <div className="cp-rodape-filtros">
        <p><span className="cp-info">i</span> A fonte da Dirigibilidade é definida por filial em <Link href="/configuracoes#fontes-dirigibilidade">Configurações</Link>.</p>
        <button type="button" className="cp-btn cp-btn-limpar" onClick={limpar}>↻ <span>Limpar filtros</span></button>
      </div>
    </section>

    <section className="cp-card cp-registros" aria-labelledby="cp-titulo-registros">
      <div className="cp-tabela-cabecalho">
        <div className="cp-agrupamento"><span className="cp-secao-icone"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg></span><h2 id="cp-titulo-registros">Colaboradores com pendências</h2><span className="cp-contador">{faltantes.length}</span></div>
        <button type="button" className="cp-btn cp-btn-exportar" onClick={exportar}>↓ <span>Exportar CSV</span></button>
      </div>
      <div className="cp-tabela-area"><table className="cp-tabela"><thead><tr>
        {([
          ["nome", "Nome"], ["matricula", "Matrícula"], ["filial", "Filial"], ["segmento", "Segmento"], ["pendencias", "Pendência"],
        ] as [Ordenar, string][]).map(([campo, rotulo]) => <th key={campo} aria-sort={ordenacao === campo ? (direcao === "asc" ? "ascending" : "descending") : undefined}><button type="button" onClick={() => ordenar(campo)} aria-label={`Ordenar por ${rotulo}`}>{rotulo} <span className="cp-setas">{ordenacao === campo ? (direcao === "asc" ? "↑" : "↓") : "↕"}</span></button></th>)}
        <th>Situação</th><th>Ações</th>
      </tr></thead><tbody>
        {exibidos.map(r => <tr key={r.pessoa.id}>
          <td className="cp-nome">{r.pessoa.nome}</td><td className="cp-matricula">{r.pessoa.matricula}</td>
          <td>{r.pessoa.filial}</td><td>{r.pessoa.categoria}</td>
          <td><div className="cp-etiquetas">{identificarPendencias(r).map(codigo => <span key={codigo} className={`cp-etiqueta cp-${PALETA[codigo]}`}>{nomesPendencia[codigo]}</span>)}</div></td>
          <td><span className="cp-estado"><i aria-hidden="true"/>Pendente</span></td>
          <td><button type="button" className="cp-ver" title={`Ver pendências de ${r.pessoa.nome}`} aria-label={`Ver pendências de ${r.pessoa.nome}`} onClick={() => setDetalhe(r)}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.2 12s3.5-6.5 9.8-6.5S21.8 12 21.8 12s-3.5 6.5-9.8 6.5S2.2 12 2.2 12Z"/><circle cx="12" cy="12" r="2.7"/></svg></button></td>
        </tr>)}
        {!faltantes.length && <tr><td colSpan={7} className="cp-vazio">Nenhuma pendência encontrada. Ajuste os filtros ou selecione outra competência.</td></tr>}
      </tbody></table></div>
      <div className="cp-paginacao">
        <span>Mostrando {primeiro} a {ultimo} de {faltantes.length} registros</span>
        <div className="cp-controle-pagina"><label>Itens por página <select value={porPagina} onChange={e => { setPorPagina(Number(e.target.value)); setPagina(1); }}><option value={8}>8</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
          <button type="button" disabled={paginaAtual <= 1} aria-label="Página anterior" onClick={() => setPagina(p => Math.max(1, p - 1))}>‹</button>
          <span className="cp-pagina-atual">{paginaAtual} / {totalPaginas}</span>
          <button type="button" disabled={paginaAtual >= totalPaginas} aria-label="Próxima página" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}>›</button>
        </div>
      </div>
    </section>
    <p className="cp-nota">Uma nota ausente gera pendência; uma nota igual a zero gera inelegibilidade. Um colaborador com várias pendências aparece uma única vez na tabela e em cada filtro correspondente. A exportação considera todos os resultados filtrados.</p>

    {detalhe && <div className="cp-modal-fundo" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setDetalhe(null); }}><div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-dialog-titulo">
      <div className="cp-modal-top"><div><span className="cp-kicker">DETALHES DA AVALIAÇÃO</span><h2 id="cp-dialog-titulo">{detalhe.pessoa.nome}</h2><p>Matrícula {detalhe.pessoa.matricula} · {detalhe.pessoa.filial} · {meses[mes]}/2027</p></div><button type="button" aria-label="Fechar detalhes" onClick={() => setDetalhe(null)}>×</button></div>
      <div className="cp-etiquetas cp-modal-etiquetas">{identificarPendencias(detalhe).map(c => <span key={c} className={`cp-etiqueta cp-${PALETA[c]}`}>{nomesPendencia[c]}</span>)}</div>
      {identificarPendencias(detalhe).includes("sem-dirigibilidade") && <div className="cp-detalhe-fonte"><strong>Fonte de Dirigibilidade da filial:</strong> {detalhe.pessoa.tipo === "Operador" ? "Critério próprio dos operadores" : fonteFilial(detalhe.pessoa.filial, fontes) ?? "Não definida em Configurações"}</div>}
      <p className="cp-modal-aviso">Este é um registro fictício. Não existe edição de notas nem importação real nesta demonstração.</p>
      <button type="button" className="cp-btn cp-btn-fechar" onClick={() => setDetalhe(null)}>Fechar</button>
    </div></div>}
  </main>;
}

"use client";

import { useMemo, useState } from "react";
import "./pendencias.css";
import { AvisoDemo, Cabecalho, BlocoTitulo } from "@/components/Elementos";
import { pessoas, ranking, meses, categorias } from "@/lib/dados-demo";
import { exportarCsv } from "@/lib/exportar";
import {
  atendeTipoPendencia,
  opcoesPendencia,
  rotulosPendencias,
  type TipoPendencia,
} from "@/lib/tipos-pendencia";

export default function Pendencias() {
  const [mes, setMes] = useState(3);
  const [categoria, setCategoria] = useState("");
  const [filial, setFilial] = useState("");
  const [tipo, setTipo] = useState<TipoPendencia>("");
  const [busca, setBusca] = useState("");

  const filiais = useMemo(
    () => [...new Set(
      pessoas.filter(p => p.categoria !== null && (!categoria || p.categoria === categoria))
        .map(p => p.filial)
    )].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [categoria]
  );

  const pendentes = useMemo(
    () => ranking("mensal", mes).filter(r => r.status === "Pendente"),
    [mes]
  );
  const faltantes = useMemo(() => pendentes.filter(r =>
    (!categoria || r.pessoa.categoria === categoria) &&
    (!filial || r.pessoa.filial === filial) &&
    atendeTipoPendencia(r, tipo) &&
    `${r.pessoa.nome} ${r.pessoa.matricula}`
      .toLocaleLowerCase("pt-BR")
      .includes(busca.trim().toLocaleLowerCase("pt-BR"))
  ), [pendentes, categoria, filial, tipo, busca]);

  const segmentosPendentes = new Set(faltantes.map(r => r.pessoa.categoria)).size;
  const filiaisPendentes = new Set(faltantes.map(r => r.pessoa.filial)).size;
  const nomeTipo = opcoesPendencia.find(p => p.valor === tipo)?.titulo ?? "Todas as pendências";

  function limpar() {
    setMes(3);
    setCategoria("");
    setFilial("");
    setTipo("");
    setBusca("");
  }

  function exportar() {
    exportarCsv(`pendencias_${meses[mes].toLowerCase()}_2027_DEMO.csv`, [
      ["Nome", "Matrícula", "Segmento", "Filial", "Competência", "Tipo(s) de pendência", "Informações ausentes"],
      ...faltantes.map(r => [
        r.pessoa.nome,
        r.pessoa.matricula,
        r.pessoa.categoria ?? "",
        r.pessoa.filial,
        `${meses[mes]}/2027`,
        rotulosPendencias(r).join(" | "),
        r.faltantes.join(" | "),
      ]),
    ]);
  }

  return <>
    <Cabecalho
      tag="QUALIDADE DE DADOS / ACOMPANHAMENTO"
      titulo="Central de Pendências"
      descricao="Encontre avaliações incompletas, filtre pelo tipo de dado ausente e exporte somente os registros selecionados."
      acao={<button type="button" className="botao" onClick={exportar}>↓ Exportar CSV</button>}
    />
    <AvisoDemo texto="Pendências abaixo derivam de dados fictícios. As fontes Gobrax/Maxtrack são simuladas para testes. A verificação real dependerá dos arquivos importados, do mapeamento de fontes e da RH0034." />

    <div className="controles" role="group" aria-label="Filtros da Central de Pendências">
      <div className="campo">
        <label htmlFor="pend-mes">Competência</label>
        <select id="pend-mes" value={mes} onChange={e => setMes(Number(e.target.value))}>
          {meses.map((m, i) => <option value={i} key={m}>{m}/2027</option>)}
        </select>
      </div>
      <div className="campo" style={{ flex: "2 1 195px" }}>
        <label htmlFor="pend-cat">Segmento</label>
        <select id="pend-cat" value={categoria} onChange={e => { setCategoria(e.target.value); setFilial(""); }}>
          <option value="">Todos os segmentos</option>
          {categorias.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="pend-filial">Filial</label>
        <select id="pend-filial" value={filial} onChange={e => setFilial(e.target.value)}>
          <option value="">Todas as filiais</option>
          {filiais.map(f => <option key={f}>{f}</option>)}
        </select>
      </div>
      <div className="campo" style={{ flex: "1.5 1 210px" }}>
        <label htmlFor="pend-tipo">Tipo de pendência</label>
        <select id="pend-tipo" value={tipo} onChange={e => setTipo(e.target.value as TipoPendencia)}>
          {opcoesPendencia.map(opcao => <option key={opcao.valor} value={opcao.valor}>{opcao.titulo}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="pend-busca">Nome ou matrícula</label>
        <input id="pend-busca" type="search" placeholder="Pesquisar colaborador" value={busca} onChange={e => setBusca(e.target.value)} />
      </div>
      <button className="botao botao-claro" type="button" onClick={limpar}>Limpar filtros</button>
    </div>

    <div className="mod-grid-estatisticas" aria-live="polite">
      <div className="mod-estatistica amarelo"><small>Pendências encontradas</small><strong>{faltantes.length}</strong><span>Fora do ranking</span></div>
      <div className="mod-estatistica"><small>Segmentos envolvidos</small><strong>{segmentosPendentes}</strong><span>Com avaliações incompletas</span></div>
      <div className="mod-estatistica"><small>Filiais envolvidas</small><strong>{filiaisPendentes}</strong><span>Dentro dos filtros</span></div>
      <div className="mod-estatistica"><small>Competência</small><strong>{meses[mes]}</strong><span>2027 · Dados fictícios</span></div>
    </div>

    <section className="painel">
      <BlocoTitulo
        superior="REGISTROS PENDENTES / FILTROS COMBINADOS"
        titulo="Avaliações com dados ausentes"
        descricao="Uma pessoa pode ter várias pendências, mas aparece apenas uma vez na tabela. Nota zero não é pendência."
      />
      <div className="mod-resumo-filtro" style={{ marginBottom: 14 }} aria-live="polite">
        <strong>Tipo:</strong> {nomeTipo} <span aria-hidden="true">·</span> <strong>{faltantes.length}</strong> resultado{faltantes.length === 1 ? "" : "s"} nos filtros atuais
      </div>
      <div className="tabela-scroll">
        <table className="tabela">
          <thead><tr>
            <th>Colaborador</th><th>Matrícula</th><th>Segmento</th><th>Filial</th>
            <th>Tipo(s) de pendência</th><th>Situação</th>
          </tr></thead>
          <tbody>
            {faltantes.map(r => <tr key={r.pessoa.id}>
              <td><strong>{r.pessoa.nome}</strong></td>
              <td>{r.pessoa.matricula}</td>
              <td>{r.pessoa.categoria}</td>
              <td>{r.pessoa.filial}</td>
              <td className="texto-alerta">
                <div className="pendencia-etiquetas">
                  {rotulosPendencias(r).map(rotulo => <span className="pendencia-etiqueta" key={rotulo}>{rotulo}</span>)}
                </div>
              </td>
              <td><span className="estado pendente">Pendente</span></td>
            </tr>)}
            {faltantes.length === 0 && <tr><td colSpan={6} className="mod-vazio">
              <strong>Nenhuma pendência encontrada.</strong>
              Não existem registros com esse tipo de pendência e os demais filtros selecionados.
            </td></tr>}
          </tbody>
        </table>
      </div>
    </section>
    <div className="bloco-info">
      <strong>Regra do programa:</strong> nota ausente não significa zero. Sem Segurança indica falta de informação, não uma penalização. As fontes IDT, Gobrax e Maxtrack devem ser verificadas por dados confiáveis na implementação real. Férias serão tratadas após o fechamento do ciclo, e desligamentos no ambiente autenticado.
    </div>
  </>;
}

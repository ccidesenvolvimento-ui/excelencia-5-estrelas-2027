"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { AvisoDemo, Cabecalho, BlocoTitulo } from "@/components/Elementos";
import { categorias, pessoas } from "@/lib/dados-demo";
import estilos from "./rh0034.module.css";
import { conferirSelecaoRh0034, type ResultadoSelecao } from "@/lib/validar-rh0034";

const STORAGE = "demo-classificacao-2027";

export default function RH0034() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoSelecao | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("pendente");
  const [filialFiltro, setFilialFiltro] = useState("");
  const [funcaoFiltro, setFuncaoFiltro] = useState("");
  const [situacaoFiltro, setSituacaoFiltro] = useState("");
  const [correcoes, setCorrecoes] = useState<Record<string, string>>({});
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    try {
      const salvo = JSON.parse(window.localStorage.getItem(STORAGE) || "{}");
      if (salvo && typeof salvo === "object" && !Array.isArray(salvo)) setCorrecoes(salvo);
    } catch { /* armazenamento opcional */ }
    setCarregou(true);
  }, []);

  const elegiveisBase = pessoas;
  const classificacaoDe = (p: typeof pessoas[number]) =>
    correcoes[p.id] ?? p.categoria ?? "";

  const pendentes = elegiveisBase.filter(p => !classificacaoDe(p)).length;
  const classificados = elegiveisBase.filter(p => {
    const c = classificacaoDe(p);
    return Boolean(c) && c !== "excluido";
  }).length;

  const filiais = useMemo(() => [...new Set(pessoas.map(p => p.filial))].sort((a, b) => a.localeCompare(b, "pt-BR")), []);
  const funcoes = useMemo(() => [...new Set(pessoas.map(p => p.funcao))].sort((a, b) => a.localeCompare(b, "pt-BR")), []);

  const lista = useMemo(() => pessoas.filter(p => {
    const atribuida = classificacaoDe(p);
    const termo = `${p.nome} ${p.matricula} ${p.empresa} ${p.filial}`.toLocaleLowerCase("pt-BR");
    const classeCorreta = !categoriaFiltro ||
      (categoriaFiltro === "pendente" ? !atribuida : atribuida === categoriaFiltro);
    return termo.includes(busca.toLocaleLowerCase("pt-BR")) && classeCorreta &&
      (!filialFiltro || p.filial === filialFiltro) &&
      (!funcaoFiltro || p.funcao === funcaoFiltro) &&
      (!situacaoFiltro || p.situacao === situacaoFiltro);
  }), [busca, categoriaFiltro, filialFiltro, funcaoFiltro, situacaoFiltro, correcoes]);

  function alterar(id: string, valor: string) {
    const novo = { ...correcoes, [id]: valor };
    setCorrecoes(novo);
    try { window.localStorage.setItem(STORAGE, JSON.stringify(novo)); } catch { /* armazenamento opcional */ }
  }
  function limparClassificacoes() {
    setCorrecoes({});
    try { window.localStorage.removeItem(STORAGE); } catch { /* armazenamento opcional */ }
  }
  function selecionar(arquivoEscolhido: File | null) {
    setArquivo(arquivoEscolhido);
    setResultado(null);
  }
  function aoSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(false);
    selecionar(evento.dataTransfer.files?.[0] ?? null);
  }
  function conferir() {
    if (!arquivo) { setResultado({ tipo: "erro", texto: "Selecione a planilha RH0034 antes de continuar." }); return; }
    setResultado(conferirSelecaoRh0034(arquivo.name, arquivo.size));
  }

  return <>
    <Cabecalho
      tag="CADASTRO CORPORATIVO / RH0034"
      titulo="Cadastro e importação RH0034"
      descricao="Entrada mensal do cadastro oficial de colaboradores, seguida da conferência de lotação e classificação nas categorias do programa."
    />
    <AvisoDemo texto="Ambiente público de demonstração: NÃO selecione planilhas corporativas reais. A pré-verificação considera apenas o nome e o tamanho do arquivo; não há leitura, envio ou gravação. As classificações abaixo usam exclusivamente dados fictícios." />

    <div className="mod-grid-estatisticas">
      <div className="mod-estatistica"><small>Cadastros de teste</small><strong>{pessoas.length}</strong><span>Amostra fictícia</span></div>
      <div className="mod-estatistica verde"><small>Classificados</small><strong>{classificados}</strong><span>Participam na simulação</span></div>
      <div className="mod-estatistica amarelo"><small>A classificar</small><strong>{pendentes}</strong><span>Revisão complementar</span></div>
      <div className="mod-estatistica"><small>Filiais presentes</small><strong>{filiais.length}</strong><span>Na amostra demonstrativa</span></div>
    </div>

    <section className="painel" aria-labelledby="titulo-importar-rh0034">
      <div className={estilos.cabecalhoImportacao}>
        <BlocoTitulo superior="ENTRADA DE DADOS · ARQUIVO DE ORIGEM" titulo="Importar planilha RH0034" descricao="Selecione o arquivo mensal gerado pelo RH. A importação efetiva será habilitada após a configuração de autenticação e banco de dados." />
        <span className={estilos.selo}>PRÉVIA DE INTERFACE</span>
      </div>
      <div className={estilos.importacaoGrade}>
        <div className={estilos.areaArquivo}>
          <div
            className={`${estilos.zonaSoltar} ${arrastando ? estilos.arrastando : ""}`}
            onDragOver={e => { e.preventDefault(); setArrastando(true); }}
            onDragLeave={() => setArrastando(false)}
            onDrop={aoSoltar}
          >
            <span className={estilos.iconeArquivo} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-7m-3 3 3-3 3 3"/></svg>
            </span>
            <strong>Arraste a planilha RH0034 ou escolha o arquivo</strong>
            <span>Formato XLSX · até 15 MB · nenhuma informação será enviada</span>
            <input ref={inputRef} id="rh0034-arquivo" className={estilos.inputArquivo} type="file" accept=".xlsx" onChange={e => selecionar(e.currentTarget.files?.[0] ?? null)} />
            <button type="button" className="botao botao-secundario" onClick={() => inputRef.current?.click()}>Escolher arquivo XLSX</button>
          </div>
          {arquivo && <div className={estilos.arquivoEscolhido}>
            <span aria-hidden="true">▣</span>
            <div><strong>{arquivo.name}</strong><small>{(arquivo.size / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB · arquivo selecionado localmente</small></div>
            <button type="button" title="Remover seleção" aria-label="Remover arquivo selecionado" onClick={() => { selecionar(null); if (inputRef.current) inputRef.current.value = ""; }}>×</button>
          </div>}
          <div className={estilos.acoesArquivo}>
            <button type="button" className="botao" onClick={conferir}>Pré-verificar arquivo (demo)</button>
            <button type="button" className="botao botao-secundario" disabled title="Será habilitado somente após integração segura com o backend">Confirmar importação</button>
          </div>
          {resultado && <div className={`${estilos.resultado} ${resultado.tipo === "erro" ? estilos.resultadoErro : estilos.resultadoOk}`} role="status">{resultado.texto}</div>}
        </div>
        <div className={estilos.areaStatus}>
          <div className={estilos.linhaStatus}><span>Status da importação real</span><strong>Não disponível na demo</strong></div>
          <div className={estilos.linhaStatus}><span>Última importação confirmada</span><strong>Nenhuma</strong></div>
          <div className={estilos.linhaStatus}><span>Registros adicionados / atualizados</span><strong>—</strong></div>
          <div className={estilos.divisor}/>
          <h3>Etapas previstas</h3>
          <ol className={estilos.etapas}>
            <li><span>01</span> Selecionar planilha RH0034</li>
            <li><span>02</span> Validar colunas e identificar empresa + matrícula</li>
            <li><span>03</span> Conferir novos cadastros, alterações e férias</li>
            <li><span>04</span> Confirmar lote e encaminhar exceções à classificação</li>
          </ol>
          <p className={estilos.notaPrivacidade}>Somente a RH0034 poderá criar ou atualizar cadastros no sistema definitivo. Nenhum modelo de planilha RH0034 será disponibilizado para download.</p>
        </div>
      </div>
    </section>

    <section className="painel" aria-labelledby="titulo-classificar-rh0034">
      <div className={estilos.cabecalhoImportacao}>
        <BlocoTitulo superior="ASSISTENTE DE CLASSIFICAÇÃO" titulo="Colaboradores que precisam de revisão" descricao="Classifique os casos não resolvidos ou consulte os já classificados. As alterações abaixo são apenas demonstrações locais." />
        <span className={estilos.selo}>DADOS FICTÍCIOS</span>
      </div>
      <div className="controles">
        <div className="campo" style={{flex:"2 1 200px"}}><label htmlFor="rh-busca">Pesquisar colaborador</label><input id="rh-busca" type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Nome, matrícula ou empresa"/></div>
        <div className="campo" style={{flex:"1 1 200px"}}><label htmlFor="rh-categoria">Classificação</label><select id="rh-categoria" value={categoriaFiltro} onChange={e=>setCategoriaFiltro(e.target.value)}><option value="pendente">A classificar</option><option value="">Todas</option>{categorias.map(c=><option key={c} value={c}>{c}</option>)}<option value="excluido">Não participa</option></select></div>
        <div className="campo" style={{flex:"1 1 135px"}}><label htmlFor="rh-filial">Filial</label><select id="rh-filial" value={filialFiltro} onChange={e=>setFilialFiltro(e.target.value)}><option value="">Todas</option>{filiais.map(f=><option key={f}>{f}</option>)}</select></div>
        <div className="campo" style={{flex:"1 1 140px"}}><label htmlFor="rh-funcao">Função</label><select id="rh-funcao" value={funcaoFiltro} onChange={e=>setFuncaoFiltro(e.target.value)}><option value="">Todas</option>{funcoes.map(f=><option key={f}>{f}</option>)}</select></div>
        <div className="campo" style={{flex:"1 1 130px"}}><label htmlFor="rh-situacao">Situação RH</label><select id="rh-situacao" value={situacaoFiltro} onChange={e=>setSituacaoFiltro(e.target.value)}><option value="">Todas</option><option>Ativo</option><option>Férias</option><option>Desligado</option></select></div>
        <button className="botao botao-claro" type="button" onClick={() => {setBusca("");setCategoriaFiltro("pendente");setFilialFiltro("");setFuncaoFiltro("");setSituacaoFiltro("");}}>Limpar filtros</button>
      </div>
      <div className={estilos.barraResultado}><span>{lista.length} colaborador{lista.length===1?"":"es"} na seleção</span><button type="button" className="botao botao-secundario" onClick={limparClassificacoes}>Reiniciar classificações da demo</button></div>
      <div className="tabela-scroll"><table className="tabela"><thead><tr><th>Colaborador</th><th>Empresa / matrícula</th><th>Filial</th><th>Função</th><th>Situação RH</th><th>Classificação (simulação)</th></tr></thead><tbody>
        {lista.map(p => <tr key={p.id}><td><strong>{p.nome}</strong></td><td>{p.empresa} · {p.matricula}</td><td>{p.filial}</td><td>{p.funcao}</td><td><span className="mod-status">{p.situacao}</span></td><td><div className="campo"><select aria-label={`Classificação de ${p.nome}`} disabled={!carregou} value={classificacaoDe(p)} onChange={e=>alterar(p.id,e.target.value)}><option value="">A classificar</option>{categorias.map(c=><option key={c} value={c}>{c}</option>)}<option value="excluido">Não participa</option></select></div></td></tr>)}
        {lista.length===0&&<tr><td colSpan={6} className="mod-vazio"><strong>Nenhum colaborador com esses filtros.</strong> Se todas as pendências foram classificadas, selecione “Todas” em Classificação para visualizar o restante.</td></tr>}
      </tbody></table></div>
      <div className={estilos.rodapeClassificacao}><span>As classificações de demonstração ficam somente neste navegador e não alteram os rankings.</span><button className="botao botao-claro" type="button" disabled title="Regras automáticas exigem prévia dos afetados, aprovação e auditoria no backend">Criar regra automática (em breve)</button></div>
    </section>
    <div className="mod-sem-backend"><strong>Próxima fase técnica:</strong> leitura real da RH0034 com validação de todas as linhas antes de confirmar, deduplicação por empresa + matrícula, classificação por filial/segmento, elegibilidade de funções permitidas, férias e auditoria. Nesta demonstração não existe importação, gravação ou acesso a dados reais.</div>
  </>;
}

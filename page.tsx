"use client";

import {useEffect,useMemo,useState} from "react";
import {AvisoDemo,Cabecalho,Estado,BlocoTitulo} from "@/components/Elementos";
import {categorias,meses,periodos,pessoas,ranking,formatarNota,estrelas,rotuloEstrela,type Periodo,type Categoria,type Avaliacao} from "@/lib/dados-demo";
import {exportarCsv} from "@/lib/exportar";

type Ordem = "maior"|"menor";

type RelatorioVisualProps = {
  base:string;
  categoria:Categoria;
  periodo:Periodo;
  periodoTexto:string;
  contexto:string;
  filial:string;
  ordem:Ordem;
  busca:string;
  limite:number;
  listaTotal:number;
  elegiveisTotal:number;
  pendentes:number;
  relatorio:Avaliacao[];
  colunas:string[];
  geradoEm:string;
  scoreMedio:number|null;
  melhorScore:number|null;
};

const nomePeriodo = (periodo:Periodo,mes:number) => `${periodos.find(p=>p.id===periodo)?.nome??periodo}${periodo==="mensal" ? ` · ${meses[mes]}/2027`:" · 2027"}`;
const textoOrdenacao = (ordem:Ordem) => ordem==="maior" ? "Score: maior primeiro" : "Score: menor primeiro";
const medalhas = ["Ouro","Prata","Bronze"] as const;
const estilosMedalha = ["ouro","prata","bronze"] as const;

function RelatorioVisual({base,categoria,periodo,periodoTexto,contexto,filial,ordem,busca,limite,listaTotal,elegiveisTotal,pendentes,relatorio,colunas,geradoEm,scoreMedio,melhorScore}:RelatorioVisualProps){
  const topTres=relatorio.slice(0,3);
  return <div className="mod-report-page">
    <section className="mod-report-hero">
      <div className="mod-report-branding">
        <div className="mod-report-simbolo"><img src={`${base}/estrela-oficial-5-estrelas.png`} alt="Símbolo do Programa 5 Estrelas"/></div>
        <div className="mod-report-brand-copy">
          <img className="mod-report-logo" src={`${base}/marca-programa.png`} alt="Programa Excelência 5 Estrelas 2027"/>
          <span className="mod-report-kicker">Relatório visual de ranking</span>
          <h3>{categoria} · Top {limite}</h3>
          <p>{contexto}</p>
        </div>
      </div>
      <div className="mod-report-hero-side">
        <span className="mod-report-badge">DEMO · NÃO OFICIAL</span>
        <strong>Classificação e desempenho</strong>
        <small>Gerado em {geradoEm}</small>
      </div>
    </section>

    <section className="mod-report-summary-grid">
      <article className="mod-report-summary-card">
        <span>Participantes visíveis</span>
        <strong>{listaTotal}</strong>
        <small>Registros encontrados para os filtros atuais</small>
      </article>
      <article className="mod-report-summary-card destaque">
        <span>Elegíveis no relatório</span>
        <strong>{relatorio.length}</strong>
        <small>Posições oficiais até o Top {limite}</small>
      </article>
      <article className="mod-report-summary-card">
        <span>Score médio do recorte</span>
        <strong>{formatarNota(scoreMedio)}</strong>
        <small>Média dos elegíveis exibidos na saída</small>
      </article>
      <article className="mod-report-summary-card">
        <span>Melhor score</span>
        <strong>{formatarNota(melhorScore)}</strong>
        <small>Maior resultado elegível encontrado</small>
      </article>
    </section>

    <section className="mod-report-meta-grid">
      <div className="mod-report-meta-item"><span>Período</span><strong>{periodoTexto}</strong></div>
      <div className="mod-report-meta-item"><span>Segmento</span><strong>{categoria}</strong></div>
      <div className="mod-report-meta-item"><span>Filial</span><strong>{filial||"Todas as filiais"}</strong></div>
      <div className="mod-report-meta-item"><span>Ordenação</span><strong>{textoOrdenacao(ordem)}</strong></div>
    </section>

    <section className="mod-report-section">
      <div className="mod-report-section-head">
        <div>
          <span className="mod-sobre-titulo">RESUMO EXECUTIVO</span>
          <h4>Leitura do recorte aplicado</h4>
        </div>
        <p>Este relatório usa os mesmos filtros do ranking. Filtrar por nome ou filial reduz a visualização, mas não recalcula posições oficiais fora desse recorte.</p>
      </div>
      <div className="mod-report-note-grid">
        <article className="mod-report-note">
          <strong>Visão do segmento</strong>
          <p>{elegiveisTotal} colaboradores elegíveis e {pendentes} pendentes neste segmento, considerando os filtros ativos.</p>
        </article>
        <article className="mod-report-note">
          <strong>Critério de saída</strong>
          <p>Somente elegíveis com posição oficial entram na saída. O relatório destaca até o Top {limite} do segmento selecionado.</p>
        </article>
        <article className="mod-report-note">
          <strong>Busca aplicada</strong>
          <p>{busca ? `Filtro de colaborador ativo: ${busca}.` : "Nenhum filtro por colaborador foi aplicado neste relatório."}</p>
        </article>
      </div>
    </section>

    {!!topTres.length&&<section className="mod-report-section">
      <div className="mod-report-section-head">
        <div>
          <span className="mod-sobre-titulo">DESTAQUES</span>
          <h4>Pódio do ranking</h4>
        </div>
        <p>Os melhores colocados do recorte oficial aparecem em destaque para facilitar leitura gerencial e apresentação executiva.</p>
      </div>
      <div className="mod-report-podium">
        {topTres.map((registro,indice)=><article key={registro.pessoa.id} className={`mod-report-podium-card ${estilosMedalha[indice]??""}`}>
          <div className="mod-report-podium-topo">
            <span className="mod-report-podium-medalha">{medalhas[indice]??`${registro.posicao}º lugar`}</span>
            <strong>{registro.posicao}º</strong>
          </div>
          <h5>{registro.pessoa.nome}</h5>
          <p>{registro.pessoa.filial} · Matrícula {registro.pessoa.matricula}</p>
          <div className="mod-report-podium-score">
            <span>Score médio</span>
            <b>{formatarNota(registro.score)}</b>
          </div>
        </article>)}
      </div>
    </section>}

    <section className="mod-report-section">
      <div className="mod-report-section-head">
        <div>
          <span className="mod-sobre-titulo">DETALHAMENTO</span>
          <h4>Classificação completa do relatório</h4>
        </div>
        <p>As colunas seguem a lógica da tela principal: ciclos mensais exibem as cinco estrelas; anual mostra a evolução por mês e o score médio consolidado.</p>
      </div>
      <div className="tabela-scroll mod-relatorio-local mod-relatorio-tematico">
        <table className="tabela">
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Colaborador</th>
              <th>Filial</th>
              <th>Matrícula</th>
              {colunas.map((coluna,indice)=><th key={`${coluna}-${indice}`}>{coluna}</th>)}
              <th>Score médio</th>
            </tr>
          </thead>
          <tbody>
            {relatorio.map(registro=><tr key={registro.pessoa.id}>
              <td><strong>{registro.posicao}º</strong></td>
              <td>{registro.pessoa.nome}</td>
              <td>{registro.pessoa.filial}</td>
              <td>{registro.pessoa.matricula}</td>
              {periodo==="anual"
                ? registro.mensais.map((valor,indice)=><td key={`${registro.pessoa.id}-${indice}`}>{formatarNota(valor)}</td>)
                : estrelas.map(estrela=><td key={`${registro.pessoa.id}-${estrela}`}>{formatarNota(registro.notas[estrela])}</td>)}
              <td><strong>{formatarNota(registro.score)}</strong></td>
            </tr>)}
            {!relatorio.length&&<tr><td colSpan={colunas.length+5} className="mod-vazio"><strong>Nenhum elegível dentro do Top {limite}.</strong>Revise os filtros ou aumente o limite do relatório.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section className="mod-report-footer-grid">
      <article className="mod-report-footer-card">
        <strong>Observações importantes</strong>
        <p>Pendentes não entram no ranking, inelegíveis não recebem posição oficial e este ambiente continua marcado como demonstração, com dados fictícios.</p>
      </article>
      <article className="mod-report-footer-card">
        <strong>Uso recomendado</strong>
        <p>Utilize a opção “Salvar como PDF” para gerar uma versão visual para apresentação. O CSV permanece disponível para tratamento em Excel.</p>
      </article>
    </section>
  </div>;
}

export default function Ranking(){
 const [periodo,setPeriodo]=useState<Periodo>("mensal");
 const [mes,setMes]=useState(3);
 const [categoria,setCategoria]=useState<Categoria>(categorias[0]);
 const [filial,setFilial]=useState("");
 const [ordem,setOrdem]=useState<Ordem>("maior");
 const [busca,setBusca]=useState("");
 const [relatorioAberto,setRelatorioAberto]=useState(false);
 const [limite,setLimite]=useState(20);
 const base=process.env.NEXT_PUBLIC_BASE_PATH ?? "";
 const filiais=useMemo(()=>[...new Set(pessoas.filter(p=>p.categoria===categoria).map(p=>p.filial))].sort((a,b)=>a.localeCompare(b,"pt-BR")),[categoria]);
 const todos=useMemo(()=>ranking(periodo,mes),[periodo,mes]);
 const doSegmento=todos.filter(r=>r.pessoa.categoria===categoria);
 const pendentes=doSegmento.filter(r=>r.status==="Pendente" && (!filial||r.pessoa.filial===filial)).length;
 const lista=useMemo(()=>todos.filter(r=>r.pessoa.categoria===categoria && r.status!=="Pendente" && (!filial||r.pessoa.filial===filial) && `${r.pessoa.nome} ${r.pessoa.matricula}`.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))).sort((a,b)=>ordem==="maior"?(b.score??0)-(a.score??0):(a.score??0)-(b.score??0)),[todos,categoria,filial,busca,ordem]);
 const elegiveis=lista.filter(r=>r.status==="Elegível");
 const inelegiveis=lista.filter(r=>r.status==="Inelegível");
 const relatorio=lista.filter(r=>r.status==="Elegível" && r.posicao!==null && r.posicao<=limite);
 const colunas=periodo==="anual"?meses.slice(categoria==="Sucro"?2:0,categoria==="Sucro"?11:12):estrelas.map(e=>rotuloEstrela(e,categoria));
 const periodoTexto=nomePeriodo(periodo,mes);
 const contexto=`${periodoTexto} · ${categoria} · ${filial||"Todas as filiais"}`;
 const scoreMedioRelatorio=useMemo(()=>relatorio.length?Math.round(relatorio.reduce((soma,item)=>soma+(item.score??0),0)/relatorio.length*100)/100:null,[relatorio]);
 const melhorScore=relatorio[0]?.score ?? null;
 const geradoEm=useMemo(()=>new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date()),[periodoTexto,categoria,filial,ordem,busca,limite,relatorio.length]);

 useEffect(()=>{
  if(!relatorioAberto)return;
  const tecla=(e:KeyboardEvent)=>{if(e.key==="Escape")setRelatorioAberto(false)};
  window.addEventListener("keydown",tecla);
  return ()=>window.removeEventListener("keydown",tecla);
 },[relatorioAberto]);

 function csv(){
   const cabecalho=["Posição oficial","Nome","Filial","Matrícula","Segmento","Período",...colunas,"Score médio"];
   exportarCsv(`ranking_${categoria.toLowerCase().replace(/[^a-z0-9]+/gi,"-")}_top-${limite}_${periodo}_DEMO.csv`,[cabecalho,...relatorio.map(r=>[
    r.posicao??"",r.pessoa.nome,r.pessoa.filial,r.pessoa.matricula,categoria,periodoTexto,
    ...(periodo==="anual"?r.mensais.map(v=>formatarNota(v)):estrelas.map(e=>formatarNota(r.notas[e]))),formatarNota(r.score)
   ])]);
 }

 function imprimir(){
  document.body.classList.add("imprimindo-relatorio");
  const limpar=()=>{document.body.classList.remove("imprimindo-relatorio");window.removeEventListener("afterprint",limpar)};
  window.addEventListener("afterprint",limpar);
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.print()));
 }

 return <>
   <Cabecalho tag="DESEMPENHO OPERACIONAL / RANKINGS" titulo="Ranking de Excelência" descricao="Compare as cinco estrelas, consulte as posições por segmento e gere relatórios diretamente dos filtros selecionados." acao={<button className="botao" type="button" onClick={()=>setRelatorioAberto(true)}>▤ Gerar relatório</button>}/>
   <AvisoDemo texto="Rankings e relatórios demonstrativos com dados fictícios. Colaboradores pendentes não aparecem na classificação; os resultados não são oficiais."/>
   <div className="controles no-print">
     <div className="campo"><label htmlFor="rank-periodo">Período</label><select id="rank-periodo" value={periodo} onChange={e=>setPeriodo(e.target.value as Periodo)}>{periodos.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
     {periodo==="mensal"&&<div className="campo"><label htmlFor="rank-mes">Competência</label><select id="rank-mes" value={mes} onChange={e=>setMes(Number(e.target.value))}>{meses.map((m,i)=><option value={i} key={m}>{m}/2027</option>)}</select></div>}
     <div className="campo" style={{flex:"2 1 225px"}}><label htmlFor="rank-segmento">Segmento</label><select id="rank-segmento" value={categoria} onChange={e=>{setCategoria(e.target.value as Categoria);setFilial("");}}>{categorias.map(c=><option key={c}>{c}</option>)}</select></div>
     <div className="campo"><label htmlFor="rank-filial">Filial</label><select id="rank-filial" value={filial} onChange={e=>setFilial(e.target.value)}><option value="">Todas as filiais</option>{filiais.map(f=><option key={f}>{f}</option>)}</select></div>
     <div className="campo"><label htmlFor="rank-ordem">Ordenação</label><select id="rank-ordem" value={ordem} onChange={e=>setOrdem(e.target.value as Ordem)}><option value="maior">Score: maior primeiro</option><option value="menor">Score: menor primeiro</option></select></div>
     <div className="campo"><label htmlFor="rank-busca">Colaborador</label><input id="rank-busca" type="search" placeholder="Nome ou matrícula" value={busca} onChange={e=>setBusca(e.target.value)}/></div>
   </div>
   <div className="mod-grid-estatisticas">
      <div className="mod-estatistica"><small>Visíveis no ranking</small><strong>{lista.length}</strong><span>Para os filtros atuais</span></div>
      <div className="mod-estatistica verde"><small>Elegíveis</small><strong>{elegiveis.length}</strong><span>Com posição oficial</span></div>
      <div className="mod-estatistica vermelho"><small>Inelegíveis</small><strong>{inelegiveis.length}</strong><span>Sem posição</span></div>
      <div className="mod-estatistica amarelo"><small>Pendentes</small><strong>{pendentes}</strong><span>Não entram no ranking</span></div>
   </div>
   <section className="painel">
      <BlocoTitulo superior="CLASSIFICAÇÃO / 2027" titulo={categoria} descricao={`${periodoTexto} · ${filial||"Todas as filiais"}`} acao={<div className="mod-chips"><span className="mod-chip">Posições oficiais por segmento</span><button className="botao botao-secundario" type="button" onClick={()=>setRelatorioAberto(true)}>Gerar relatório ↗</button></div>}/>
      <div className="tabela-scroll"><table className="tabela"><thead><tr><th>Pos.</th><th>Colaborador / Filial</th><th>Situação</th>{colunas.map((c,i)=><th key={`${c}-${i}`}>{c}</th>)}<th>Score médio</th></tr></thead><tbody>
       {lista.map(r=><tr key={r.pessoa.id}><td><strong>{r.posicao??"—"}</strong></td><td><strong>{r.pessoa.nome} / {r.pessoa.filial}</strong><br/><small className="texto-muted">{r.pessoa.matricula}</small></td><td><Estado tipo={r.status}/></td>{periodo==="anual"?r.mensais.map((v,i)=><td key={i}>{formatarNota(v)}</td>):estrelas.map(e=><td key={e}>{formatarNota(r.notas[e])}</td>)}<td><strong>{formatarNota(r.score)}</strong></td></tr>)}
       {!lista.length&&<tr><td colSpan={colunas.length+4} className="mod-vazio"><strong>Nenhuma avaliação encontrada.</strong>Altere os filtros ou consulte a Central de Pendências.</td></tr>}
      </tbody></table></div>
      <p className="nota-rodape">Ciclos: médias dos cinco pilares. Anual: pontuações mensais e Score Médio. O segmento Sucro usa mar–nov. A posição não muda ao filtrar ou inverter a ordenação. Férias ainda não são estimadas nesta demonstração.</p>
   </section>
   {relatorioAberto&&<div className="mod-report-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setRelatorioAberto(false)}}><div className="mod-report-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-relatorio"><header><div><div className="mod-sobre-titulo">RELATÓRIO / PRÉVIA DEMONSTRATIVA</div><h2 id="titulo-relatorio">Relatório visual de Ranking</h2><p>Agora a saída já nasce alinhada à identidade do Programa 5 Estrelas, pronta para apresentação e exportação em PDF pelo navegador.</p></div><button className="mod-fechar" aria-label="Fechar prévia" type="button" onClick={()=>setRelatorioAberto(false)}>×</button></header>
       <div className="mod-report-filtros"><div className="campo"><label htmlFor="top-n">Limite Top N</label><input id="top-n" min={1} max={500} type="number" value={limite} onChange={e=>setLimite(Math.max(1,Math.min(500,Number(e.target.value)||1)))}/></div><span className="mod-chip">{periodoTexto}</span><span className="mod-chip">{categoria}</span><span className="mod-chip">{filial||"Todas as filiais"}</span><span className="mod-chip">{textoOrdenacao(ordem)}</span>{busca&&<span className="mod-chip">Busca: {busca}</span>}</div>
       <div className="mod-resumo-filtro"><strong>{relatorio.length} participantes elegíveis nesta prévia.</strong> O layout abaixo representa a identidade visual do relatório e não apenas uma listagem simples.</div>
       <RelatorioVisual base={base} categoria={categoria} periodo={periodo} periodoTexto={periodoTexto} contexto={contexto} filial={filial} ordem={ordem} busca={busca} limite={limite} listaTotal={lista.length} elegiveisTotal={elegiveis.length} pendentes={pendentes} relatorio={relatorio} colunas={colunas} geradoEm={geradoEm} scoreMedio={scoreMedioRelatorio} melhorScore={melhorScore}/>
       <p className="mod-report-watermark">Demonstração não oficial. O botão “Salvar como PDF” usa a impressão do navegador e já aplica esta composição visual como base do documento.</p>
       <div className="mod-report-botao"><button className="botao botao-claro" type="button" onClick={()=>setRelatorioAberto(false)}>Voltar ao ranking</button><button className="botao botao-secundario" type="button" onClick={csv}>↓ Exportar CSV</button><button className="botao" type="button" onClick={imprimir}>▤ Salvar como PDF</button></div>
       </div></div>}
   <section id="relatorio-impressao" className="mod-report-print" aria-label="Relatório pronto para impressão">
      <RelatorioVisual base={base} categoria={categoria} periodo={periodo} periodoTexto={periodoTexto} contexto={contexto} filial={filial} ordem={ordem} busca={busca} limite={limite} listaTotal={lista.length} elegiveisTotal={elegiveis.length} pendentes={pendentes} relatorio={relatorio} colunas={colunas} geradoEm={geradoEm} scoreMedio={scoreMedioRelatorio} melhorScore={melhorScore}/>
   </section>
 </>;
}

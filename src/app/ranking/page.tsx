"use client";

import {useEffect,useMemo,useState} from "react";
import {AvisoDemo,Cabecalho,Estado,BlocoTitulo} from "@/components/Elementos";
import {categorias,meses,periodos,pessoas,ranking,formatarNota,estrelas,rotuloEstrela,type Periodo,type Categoria} from "@/lib/dados-demo";
import {exportarCsv} from "@/lib/exportar";

type Ordem = "maior"|"menor";
const nomePeriodo = (periodo:Periodo,mes:number) => `${periodos.find(p=>p.id===periodo)?.nome??periodo}${periodo==="mensal" ? ` · ${meses[mes]}/2027`:" · 2027"}`;

export default function Ranking(){
 const [periodo,setPeriodo]=useState<Periodo>("mensal");
 const [mes,setMes]=useState(3);
 const [categoria,setCategoria]=useState<Categoria>(categorias[0]);
 const [filial,setFilial]=useState("");
 const [ordem,setOrdem]=useState<Ordem>("maior");
 const [busca,setBusca]=useState("");
 const [relatorioAberto,setRelatorioAberto]=useState(false);
 const [limite,setLimite]=useState(20);
 const filiais=useMemo(()=>[...new Set(pessoas.filter(p=>p.categoria===categoria).map(p=>p.filial))].sort((a,b)=>a.localeCompare(b,"pt-BR")),[categoria]);
 const todos=useMemo(()=>ranking(periodo,mes),[periodo,mes]);
 const doSegmento=todos.filter(r=>r.pessoa.categoria===categoria);
 const pendentes=doSegmento.filter(r=>r.status==="Pendente" && (!filial||r.pessoa.filial===filial)).length;
 const lista=useMemo(()=>todos.filter(r=>r.pessoa.categoria===categoria && r.status!=="Pendente" && (!filial||r.pessoa.filial===filial) && `${r.pessoa.nome} ${r.pessoa.matricula}`.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))).sort((a,b)=>ordem==="maior"?(b.score??0)-(a.score??0):(a.score??0)-(b.score??0)),[todos,categoria,filial,busca,ordem]);
 const elegiveis=lista.filter(r=>r.status==="Elegível");
 const inelegiveis=lista.filter(r=>r.status==="Inelegível");
 // Só entram os elegíveis que já pertencem ao Top N OFICIAL da categoria.
 // Filtro por filial e ordenação não renumeram as posições.
 const relatorio=lista.filter(r=>r.status==="Elegível" && r.posicao!==null && r.posicao<=limite);
 const colunas=periodo==="anual"?meses.slice(categoria==="Sucro"?2:0,categoria==="Sucro"?11:12):estrelas.map(e=>rotuloEstrela(e,categoria));
 const periodoTexto=nomePeriodo(periodo,mes);
 const contexto=`${periodoTexto} · ${categoria} · ${filial||"Todas as filiais"}`;

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
  // Agenda o print depois que o modo de impressão foi aplicado ao DOM.
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
      <div className="tabela-scroll"><table className="tabela"><thead><tr><th>Pos.</th><th>Colaborador — Filial</th><th>Situação</th>{colunas.map((c,i)=><th key={`${c}-${i}`}>{c}</th>)}<th>Score médio</th></tr></thead><tbody>
       {lista.map(r=><tr key={r.pessoa.id}><td><strong>{r.posicao??"—"}</strong></td><td><strong>{r.pessoa.nome} — {r.pessoa.filial}</strong><br/><small className="texto-muted">{r.pessoa.matricula}</small></td><td><Estado tipo={r.status}/></td>{periodo==="anual"?r.mensais.map((v,i)=><td key={i}>{formatarNota(v)}</td>):estrelas.map(e=><td key={e}>{formatarNota(r.notas[e])}</td>)}<td><strong>{formatarNota(r.score)}</strong></td></tr>)}
       {!lista.length&&<tr><td colSpan={colunas.length+4} className="mod-vazio"><strong>Nenhuma avaliação encontrada.</strong>Altere os filtros ou consulte a Central de Pendências.</td></tr>}
      </tbody></table></div>
      <p className="nota-rodape">Ciclos: médias dos cinco pilares. Anual: pontuações mensais e Score Médio. O segmento Sucro usa mar–nov. A posição não muda ao filtrar ou inverter a ordenação. Férias ainda não são estimadas nesta demonstração.</p>
   </section>
   {relatorioAberto&&<div className="mod-report-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setRelatorioAberto(false)}}><div className="mod-report-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-relatorio"><header><div><div className="mod-sobre-titulo">RELATÓRIO / PRÉVIA DEMONSTRATIVA</div><h2 id="titulo-relatorio">Gerar relatório de Ranking</h2><p>Usando os mesmos filtros e a mesma ordenação que aparecem no Ranking.</p></div><button className="mod-fechar" aria-label="Fechar prévia" type="button" onClick={()=>setRelatorioAberto(false)}>×</button></header>
       <div className="mod-report-filtros"><div className="campo"><label htmlFor="top-n">Limite Top N</label><input id="top-n" min={1} max={500} type="number" value={limite} onChange={e=>setLimite(Math.max(1,Math.min(500,Number(e.target.value)||1)))}/></div><span className="mod-chip">{periodoTexto}</span><span className="mod-chip">{categoria}</span><span className="mod-chip">{filial||"Todas as filiais"}</span><span className="mod-chip">{ordem==="maior"?"Maior score primeiro":"Menor score primeiro"}</span>{busca&&<span className="mod-chip">Busca: {busca}</span>}</div>
       <div className="mod-resumo-filtro"><strong>{relatorio.length} participantes elegíveis nesta prévia.</strong> Somente posições oficiais até {limite}; filtros por filial e nome não puxam outras posições para completar o Top N.</div>
       <div className="tabela-scroll mod-relatorio-local" style={{marginTop:16}}><table className="tabela"><thead><tr><th>Pos.</th><th>Colaborador — Filial</th><th>Matrícula</th><th>Score médio</th></tr></thead><tbody>{relatorio.map(r=><tr key={r.pessoa.id}><td>{r.posicao}º</td><td>{r.pessoa.nome} — {r.pessoa.filial}</td><td>{r.pessoa.matricula}</td><td>{formatarNota(r.score)}</td></tr>)}{!relatorio.length&&<tr><td colSpan={4} className="vazio">Nenhum elegível dentro do Top {limite} para estes filtros.</td></tr>}</tbody></table></div>
       <p className="mod-report-watermark">Demonstração não oficial. PDF: impressão do navegador. CSV compatível com Excel; XLSX e PDF automatizados dependem do backend seguro.</p>
       <div className="mod-report-botao"><button className="botao botao-claro" type="button" onClick={()=>setRelatorioAberto(false)}>Voltar ao ranking</button><button className="botao botao-secundario" type="button" onClick={csv}>↓ Exportar CSV</button><button className="botao" type="button" onClick={imprimir}>▤ Salvar como PDF</button></div>
       </div></div>}
   <section id="relatorio-impressao" className="mod-report-print" aria-label="Relatório pronto para impressão">
       <h1>Programa Excelência 5 Estrelas 2027</h1><p>RELATÓRIO DEMONSTRATIVO — NÃO OFICIAL</p><h2>{categoria} — Top {limite}</h2><p>{contexto} · Ordenação: {ordem==="maior"?"Score decrescente":"Score crescente"}{busca?` · Pesquisa: ${busca}`:""}</p>
       <table><thead><tr><th>Posição</th><th>Colaborador — Filial</th><th>Matrícula</th><th>Score médio</th></tr></thead><tbody>{relatorio.map(r=><tr key={r.pessoa.id}><td>{r.posicao}º</td><td>{r.pessoa.nome} — {r.pessoa.filial}</td><td>{r.pessoa.matricula}</td><td>{formatarNota(r.score)}</td></tr>)}{!relatorio.length&&<tr><td colSpan={4}>Nenhum elegível encontrado.</td></tr>}</tbody></table><p>Dados fictícios gerados para testes de interface e regras de negócio.</p>
   </section>
 </>;
}

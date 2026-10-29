"use client";
import {useMemo,useState} from "react";
import {AvisoDemo,Cabecalho,BlocoTitulo} from "@/components/Elementos";
import {pessoas,ranking,meses,categorias} from "@/lib/dados-demo";
import {exportarCsv} from "@/lib/exportar";

export default function Pendencias(){
 const [mes,setMes]=useState(3);
 const [categoria,setCategoria]=useState("");
 const [filial,setFilial]=useState("");
 const [busca,setBusca]=useState("");
 const filiais=useMemo(()=>[...new Set(pessoas.filter(p=>!categoria||p.categoria===categoria).map(p=>p.filial))].sort((a,b)=>a.localeCompare(b,"pt-BR")),[categoria]);
 const pendentes=useMemo(()=>ranking("mensal",mes).filter(r=>r.status==="Pendente"),[mes]);
 const faltantes=pendentes.filter(r=>(!categoria||r.pessoa.categoria===categoria)&&(!filial||r.pessoa.filial===filial)&&`${r.pessoa.nome} ${r.pessoa.matricula}`.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")));
 const segmentosPendentes=new Set(faltantes.map(r=>r.pessoa.categoria)).size;
 const filiaisPendentes=new Set(faltantes.map(r=>r.pessoa.filial)).size;
 function limpar(){setCategoria("");setFilial("");setBusca("")}
 function exportar(){exportarCsv(`pendencias_${meses[mes].toLowerCase()}_2027_DEMO.csv`,[["Nome","Matrícula","Segmento","Filial","Competência","Informações ausentes"],...faltantes.map(r=>[r.pessoa.nome,r.pessoa.matricula,r.pessoa.categoria??"",r.pessoa.filial,`${meses[mes]}/2027`,r.faltantes.join(" | ")])]);}
 return <>
 <Cabecalho tag="QUALIDADE DE DADOS / ACOMPANHAMENTO" titulo="Central de Pendências" descricao="Encontre avaliações incompletas, identifique os pilares ausentes e exporte a relação filtrada para tratamento." acao={<button type="button" className="botao" onClick={exportar}>↓ Exportar CSV</button>}/>
 <AvisoDemo texto="Pendências abaixo derivam de dados fictícios. A verificação real de férias, desligamentos e arquivos ausentes depende da futura integração segura com a RH0034."/>
 <div className="controles"><div className="campo"><label htmlFor="pend-mes">Competência</label><select id="pend-mes" value={mes} onChange={e=>setMes(Number(e.target.value))}>{meses.map((m,i)=><option value={i} key={m}>{m}/2027</option>)}</select></div>
 <div className="campo" style={{flex:"2 1 195px"}}><label htmlFor="pend-cat">Segmento</label><select id="pend-cat" value={categoria} onChange={e=>{setCategoria(e.target.value);setFilial("")}}><option value="">Todos os segmentos</option>{categorias.map(c=><option key={c}>{c}</option>)}</select></div>
 <div className="campo"><label htmlFor="pend-filial">Filial</label><select id="pend-filial" value={filial} onChange={e=>setFilial(e.target.value)}><option value="">Todas as filiais</option>{filiais.map(f=><option key={f}>{f}</option>)}</select></div>
 <div className="campo"><label htmlFor="pend-busca">Nome ou matrícula</label><input id="pend-busca" type="search" placeholder="Pesquisar colaborador" value={busca} onChange={e=>setBusca(e.target.value)}/></div><button className="botao botao-claro" type="button" onClick={limpar}>Limpar filtros</button></div>
 <div className="mod-grid-estatisticas"><div className="mod-estatistica amarelo"><small>Pendências encontradas</small><strong>{faltantes.length}</strong><span>Fora do ranking</span></div><div className="mod-estatistica"><small>Segmentos envolvidos</small><strong>{segmentosPendentes}</strong><span>Com avaliações incompletas</span></div><div className="mod-estatistica"><small>Filiais envolvidas</small><strong>{filiaisPendentes}</strong><span>Dentro dos filtros</span></div><div className="mod-estatistica"><small>Competência</small><strong>{meses[mes]}</strong><span>2027 · Dados fictícios</span></div></div>
 <section className="painel"><BlocoTitulo superior="REGISTROS NÃO ELEGÍVEIS À CLASSIFICAÇÃO" titulo="Avaliações com dados ausentes" descricao="As linhas mostram quais estrelas ainda não possuem nota; não representam nota zero."/><div className="tabela-scroll"><table className="tabela"><thead><tr><th>Colaborador</th><th>Matrícula</th><th>Segmento</th><th>Filial</th><th>Campos ausentes</th><th>Situação</th></tr></thead><tbody>{faltantes.map(r=><tr key={r.pessoa.id}><td><strong>{r.pessoa.nome}</strong></td><td>{r.pessoa.matricula}</td><td>{r.pessoa.categoria}</td><td>{r.pessoa.filial}</td><td className="texto-alerta">{r.faltantes.join(" · ")}</td><td><span className="estado pendente">Pendente</span></td></tr>)}{faltantes.length===0&&<tr><td colSpan={6} className="mod-vazio"><strong>Nenhuma pendência encontrada.</strong>Experimente mudar o período ou limpar os filtros.</td></tr>}</tbody></table></div></section>
 <div className="bloco-info"><strong>Regra do programa:</strong> nota ausente não significa zero. Férias são identificadas na RH0034; a estimativa do score só poderá ocorrer após o fechamento do ciclo, preservando as avaliações individuais. Desligamentos e casos especiais serão tratados no ambiente autenticado.</div>
 </>;
}

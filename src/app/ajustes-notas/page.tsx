"use client";

import { useMemo, useState } from "react";
import { AvisoDemo, BlocoTitulo, Cabecalho } from "@/components/Elementos";
import { meses, notasDe, pessoas, rotulos, estrelas, type Estrela } from "@/lib/dados-demo";
import { ModalAjusteNotaDemo } from "@/components/ModalAjusteNotaDemo";
import "./ajustes-notas.css";

type Registro = {
  id:string; pessoaId:string; matricula:string; nome:string; filial:string;
  mes:number; estrela:Estrela; original:number; efetiva:number;
};
const registros:Registro[] = pessoas.flatMap(p =>
  meses.flatMap((_,mes) => {
    const notas = notasDe(p,mes);
    return estrelas.flatMap(estrela => {
      const nota = notas[estrela];
      return nota === undefined ? [] : [{
        id:`${p.id}-${mes}-${estrela}`,pessoaId:p.id,matricula:p.matricula,
        nome:p.nome,filial:p.filial,mes,estrela,original:nota,efetiva:nota
      }];
    });
  })
);

const dataHoje = "11/11/2026";

export default function AjustesNotas() {
  const [busca,setBusca]=useState("");
  const [filial,setFilial]=useState("");
  const [mes,setMes]=useState("9");
  const [estrela,setEstrela]=useState<Estrela|"">("");
  const [selecionado,setSelecionado]=useState<string|null>(null);
  const [mensagem,setMensagem]=useState("");

  const filiais=useMemo(()=>[...new Set(pessoas.map(p=>p.filial))].sort((a,b)=>a.localeCompare(b,"pt-BR")),[]);
  const linhas=useMemo(()=>registros.filter(r=>{
    const termo=busca.trim().toLocaleLowerCase("pt-BR");
    return (!termo || [r.nome,r.matricula].some(x=>x.toLocaleLowerCase("pt-BR").includes(termo)))
      && (!filial || r.filial===filial)
      && (mes==="" || r.mes===Number(mes))
      && (!estrela || r.estrela===estrela);
  }).slice(0,80),[busca,filial,mes,estrela]);
  const registro=registros.find(r=>r.id===selecionado)??null;
  function escolher(r:Registro){setSelecionado(r.id);setMensagem("");}
  function filtrar(){setSelecionado(null);setMensagem("");}
  return <main className="ajustes-admin">
    <Cabecalho tag="ADMINISTRAÇÃO / AVALIAÇÕES" titulo="Ajustes administrativos de notas"
      descricao="Consulte notas por motorista, filial, competência e pilar. Revise a alteração e seu motivo antes da confirmação administrativa."/>
    <AvisoDemo texto="Protótipo com colaboradores e notas fictícios. Não consulta o Supabase, não modifica rankings e não registra alterações; o botão final é apenas uma pré-visualização."/>
    <section className="painel">
      <BlocoTitulo superior="LOCALIZAR AVALIAÇÃO" titulo="Consultar notas" descricao="Selecione um registro para visualizar a origem e preparar a correção."/>
      <div className="ajustes-filtros">
        <div className="campo"><label htmlFor="aj-busca">Nome ou matrícula</label><input id="aj-busca" value={busca} onChange={e=>{setBusca(e.target.value);filtrar()}} placeholder="Pesquisar motorista"/></div>
        <div className="campo"><label htmlFor="aj-filial">Filial</label><select id="aj-filial" value={filial} onChange={e=>{setFilial(e.target.value);filtrar()}}><option value="">Todas as filiais</option>{filiais.map(f=><option key={f}>{f}</option>)}</select></div>
        <div className="campo"><label htmlFor="aj-mes">Competência</label><select id="aj-mes" value={mes} onChange={e=>{setMes(e.target.value);filtrar()}}><option value="">Todos os meses</option>{meses.map((m,i)=><option value={i} key={m}>{m}/2027</option>)}</select></div>
        <div className="campo"><label htmlFor="aj-pilar">Pilar</label><select id="aj-pilar" value={estrela} onChange={e=>{setEstrela(e.target.value as Estrela|"");filtrar()}}><option value="">Todos os pilares</option>{estrelas.map(e=><option value={e} key={e}>{rotulos[e]}</option>)}</select></div>
      </div>
      <p className="nota-rodape" role="status">{linhas.length} registros fictícios exibidos (limite de 80 por consulta).</p>
      <div className="tabela-scroll"><table className="tabela ajustes-tabela"><thead><tr><th>Motorista / Matrícula</th><th>Filial</th><th>Competência</th><th>Pilar</th><th>Original</th><th>Efetiva</th><th>Ação</th></tr></thead><tbody>
        {linhas.map(r=><tr key={r.id} className={selecionado===r.id?"ajustes-selecionado":""}><td><strong>{r.nome}</strong><small>{r.matricula}</small></td><td>{r.filial}</td><td>{meses[r.mes]}/2027</td><td>{rotulos[r.estrela]}</td><td>{r.original.toFixed(2).replace(".",",")}</td><td>{r.efetiva.toFixed(2).replace(".",",")}</td><td><button type="button" className="botao botao-claro" onClick={()=>escolher(r)} aria-label={`Selecionar nota de ${r.nome} em ${rotulos[r.estrela]}`}>Selecionar</button></td></tr>)}
        {linhas.length===0&&<tr><td colSpan={7}>Nenhuma avaliação fictícia atende aos filtros.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="painel">
      <BlocoTitulo superior="HISTÓRICO E AUDITORIA" titulo="Rastreabilidade" descricao="As correções reais terão autor, data, valor anterior, novo valor e justificativa."/>
      <div className="ajustes-alerta"><strong>Histórico de produção indisponível nesta demonstração.</strong><p>Os registros serão consultados em ajustes_notas após a integração com autenticação e Supabase.</p></div>
      <div className="ajustes-evento"><span className="rotulo-chave">EXEMPLO EXPLICATIVO · NÃO REGISTRADO</span><p><strong>Produtividade: 75,00 → 90,00</strong></p><p>Correção de divergência confirmada pelo setor de Produtividade.</p><small>Data de referência: {dataHoje} · Autor: Administrador fictício</small></div>
      <div className="ajustes-alerta"><strong>Proteção contra reimportação</strong><p>Notas corrigidas não podem ser substituídas por nova planilha sem resolução explícita do conflito.</p></div>
    </section>
    {registro&&<ModalAjusteNotaDemo key={registro.id} nota={registro}
      aoFechar={()=>setSelecionado(null)}
      aoConcluir={()=>{setSelecionado(null);setMensagem("Pré-visualização concluída. Nenhum ajuste foi enviado ou salvo. A efetivação dependerá de autenticação e integração segura.");}}/>}
    {mensagem&&<p role="status" className="bloco-info">{mensagem}</p>}
  </main>;
}

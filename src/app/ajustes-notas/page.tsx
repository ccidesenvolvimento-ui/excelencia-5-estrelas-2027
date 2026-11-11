"use client";

import { useMemo, useState } from "react";
import { AvisoDemo, BlocoTitulo, Cabecalho } from "@/components/Elementos";
import { meses, notasDe, pessoas, rotulos, estrelas, type Estrela } from "@/lib/dados-demo";
import { validarAjusteNota } from "@/lib/validar-ajuste-nota";
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

const exemplo = registros.find(r=>r.estrela==="produtividade") ?? registros[0];
const dataHoje = "11/11/2026";

export default function AjustesNotas() {
  const [busca,setBusca]=useState("");
  const [filial,setFilial]=useState("");
  const [mes,setMes]=useState("9");
  const [estrela,setEstrela]=useState<Estrela|"">("");
  const [selecionado,setSelecionado]=useState<string>(exemplo?.id??"");
  const [novaNota,setNovaNota]=useState("90");
  const [justificativa,setJustificativa]=useState("Correção de divergência confirmada pelo setor de Produtividade.");
  const [mostrarConfirmacao,setMostrarConfirmacao]=useState(false);
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
  const podeAnalisar=registro!==null&&registro.estrela!=="seguranca";
  const erro=registro ? validarAjusteNota({original:registro.efetiva,novaNota,justificativa,estrela:registro.estrela}) : "Selecione uma nota.";
  function escolher(r:Registro){
    setSelecionado(r.id);
    setNovaNota(r.efetiva===90?"75":"90");
    setJustificativa("Correção de divergência confirmada pelo setor de Produtividade.");
    setMostrarConfirmacao(false);setMensagem("");
  }
  function filtrar(){setMostrarConfirmacao(false);setMensagem("");}
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
    <div className="ajustes-colunas">
      <section className="painel">
        <BlocoTitulo superior="CONFERÊNCIA" titulo="Preparar correção" descricao="A nota de origem sempre permanece preservada."/>
        {registro?<><div className="ajustes-identificacao"><strong>{registro.nome}</strong><span>{registro.matricula} · {registro.filial} · {meses[registro.mes]}/2027 · {rotulos[registro.estrela]}</span></div>
          <div className="ajustes-valores"><div><small>Nota importada</small><strong>{registro.original.toFixed(2).replace(".",",")}</strong></div><div><small>Nota efetiva</small><strong>{registro.efetiva.toFixed(2).replace(".",",")}</strong></div></div>
          {registro.estrela==="seguranca"?
            <div className="ajustes-alerta" role="status"><strong>Segurança: edição manual bloqueada.</strong><p>Notas 0 e 100 decorrem de advertências e acidentes. Qualquer correção exige revisar a informação de origem e preservar a auditoria.</p></div>:
            <><div className="campo"><label htmlFor="aj-nova">Nova nota (0 a 100)</label><input id="aj-nova" type="text" inputMode="decimal" value={novaNota} onChange={e=>{setNovaNota(e.target.value);setMostrarConfirmacao(false)}} placeholder="Ex.: 90,00"/></div>
              <div className="campo"><label htmlFor="aj-just">Justificativa obrigatória (15–1000 caracteres)</label><textarea id="aj-just" rows={4} maxLength={1000} value={justificativa} onChange={e=>{setJustificativa(e.target.value);setMostrarConfirmacao(false)}}/></div>
              <p className="nota-rodape">{justificativa.trim().length}/1000 caracteres. A correção efetiva exigirá autenticação, autorização por filial e auditoria no servidor.</p>
              {erro&&<p className="ajustes-erro" role="alert">{erro}</p>}
              <button type="button" className="botao" disabled={!!erro} onClick={()=>{setMostrarConfirmacao(true);setMensagem("")}}>Revisar ajuste (demo)</button></>}
        </>:<p>Selecione uma nota na tabela.</p>}
      </section>
      <section className="painel">
        <BlocoTitulo superior="HISTÓRICO E AUDITORIA" titulo="Rastreabilidade" descricao="Ao entrar em operação, cada correção terá autor, data, valores e justificativa registrados no banco."/>
        <div className="ajustes-alerta"><strong>Histórico de produção indisponível nesta demonstração.</strong><p>O registro real será consultado em `ajustes_notas`. Nenhuma alteração feita aqui persiste ou altera a classificação.</p></div>
        <div className="ajustes-evento"><span className="rotulo-chave">EXEMPLO EXPLICATIVO · NÃO REGISTRADO</span><p><strong>Produtividade: 75,00 → 90,00</strong></p><p>Correção de divergência confirmada pelo setor de Produtividade.</p><small>Data de referência: {dataHoje} · Autor: Administrador fictício</small></div>
        <div className="ajustes-alerta"><strong>Proteção contra reimportação</strong><p>Notas corrigidas não poderão ser sobrescritas por uma nova planilha sem tratamento explícito do conflito. O histórico não poderá ser apagado.</p></div>
      </section>
    </div>
    {mostrarConfirmacao&&registro&&podeAnalisar&&!erro&&<div className="ajustes-overlay" role="presentation"><section className="ajustes-dialogo" role="dialog" aria-modal="true" aria-labelledby="aj-confirma-titulo"><h2 id="aj-confirma-titulo">Conferência do ajuste</h2><p>{registro.nome} · {registro.matricula} · {rotulos[registro.estrela]}</p><p><strong>{registro.efetiva.toFixed(2).replace(".",",")} → {Number(novaNota.replace(",",".")).toFixed(2).replace(".",",")}</strong></p><p>Justificativa: {justificativa.trim()}</p><div className="ajustes-acoes"><button type="button" className="botao botao-claro" onClick={()=>setMostrarConfirmacao(false)}>Voltar e editar</button><button type="button" className="botao" onClick={()=>{setMostrarConfirmacao(false);setMensagem("Pré-visualização concluída. Nenhum ajuste foi enviado ou salvo. A efetivação dependerá de autenticação e integração segura.");}}>Concluir pré-visualização (sem salvar)</button></div></section></div>}
    {mensagem&&<p role="status" className="bloco-info">{mensagem}</p>}
  </main>;
}

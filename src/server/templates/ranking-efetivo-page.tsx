"use client";
/** Template de prévia isolada: instalar apenas no runner Node protegido. */
import {useEffect,useState} from "react";
import type { PreviaRanking } from "@/lib/projecao-ranking-efetivo";
import type { DiagnosticoProntidao } from "@/lib/diagnostico-prontidao-ranking";
import type { ConciliacaoSeguranca } from "@/lib/conciliacao-seguranca";
import type { MatrizBloqueios } from "@/lib/matriz-bloqueios-homologacao";
type Previa=PreviaRanking & {diagnostico?:DiagnosticoProntidao;seguranca?:ConciliacaoSeguranca;matriz?:MatrizBloqueios};
const pilares=["seguranca","produtividade","dirigibilidade","jornada","treinamentos"] as const;
const titulo:{[k:string]:string}={seguranca:"Segurança",produtividade:"Produtividade",dirigibilidade:"Dirigibilidade",jornada:"Jornada",treinamentos:"Treinamentos"};
const meses=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const formatar=(n:number|null|undefined)=>n===null||n===undefined?"—":n.toFixed(2).replace(".",",");
export default function PreviaRankingNotasEfetivas(){
 const [mes,setMes]=useState(9);
 const [dados,setDados]=useState<Previa|null>(null);
 const [erro,setErro]=useState("");
 const [carregando,setCarregando]=useState(true);
 const [exportando,setExportando]=useState<"pdf"|"xlsx"|"json"|null>(null);
 useEffect(()=>{
  let cancelado=false;
  setCarregando(true);setErro("");setDados(null);
  fetch("/api/ranking-efetivo?mes="+mes,{credentials:"same-origin",cache:"no-store"})
   .then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.erro||"Consulta indisponível.");return data as Previa})
   .then(data=>{if(!cancelado){setDados(data);setCarregando(false)}})
   .catch(e=>{if(!cancelado){setErro(e instanceof Error?e.message:"Consulta indisponível.");setCarregando(false)}});
  return ()=>{cancelado=true};
 },[mes]);
 async function exportar(formato:"pdf"|"xlsx"|"json"){
  if(!dados||carregando||exportando)return;
  setExportando(formato);setErro("");
  try{
   if(formato==="json"){
    if(!dados.matriz)throw new Error("Matriz de homologação indisponível.");
    const relatorio=await import("@/lib/sumario-homologacao");
    relatorio.baixarSumarioHomologacao(dados.matriz);
   } else {
    const arquivo=await import("@/lib/exportar-previa-efetiva");
    if(formato==="pdf")arquivo.baixarPreviaPdf(dados);
    else await arquivo.baixarPreviaXlsx(dados);
   }
  }catch(e){setErro(e instanceof Error?e.message:"Falha na exportação da prévia.")}
  finally{setExportando(null);}
 }
 return <main className="conteudo">
  <header className="cabecalho-premium"><span>HOMOLOGAÇÃO / SOMENTE FILIAIS AUTORIZADAS</span>
   <h1>Prévia de scores efetivos</h1>
   <p>Somente consulta autenticada. Não é ranking oficial, não atribui posições e não deve ser usado para premiações ou decisões de RH.</p>
  </header>
  <section className="painel">
   <div className="campo"><label htmlFor="previa-mes">Competência em 2027</label>
    <select id="previa-mes" value={mes} onChange={e=>setMes(Number(e.target.value))}>
     {meses.map((m,i)=><option key={m} value={i}>{m}/2027</option>)}
    </select>
   </div>
   {carregando&&<p role="status">Consultando notas autorizadas…</p>}
   {erro&&<p role="alert">{erro}</p>}
   {dados&&<><p role="status">{dados.linhas.length} colaboradores na prévia autorizada. Posições oficiais indisponíveis.</p>
    <div className="ajustes-filtros">
     <button type="button" className="botao botao-claro" disabled={!!exportando} onClick={()=>void exportar("pdf")}>
      {exportando==="pdf"?"Gerando PDF…":"Exportar prévia PDF (não oficial)"}
     </button>
     <button type="button" className="botao botao-claro" disabled={!!exportando} onClick={()=>void exportar("xlsx")}>
      {exportando==="xlsx"?"Gerando Excel…":"Exportar prévia XLSX (não oficial)"}
     </button>
    </div>
    <div className="tabela-scroll"><table className="tabela"><thead><tr><th>Colaborador / Matrícula</th><th>Filial</th><th>Segmento</th>
     {pilares.map(p=><th key={p}>{titulo[p]}</th>)}<th>Score</th><th>Situação provisória</th></tr></thead>
     <tbody>{dados.linhas.map(l=><tr key={l.id}><td>{l.nome} / {l.matricula}</td><td>{l.filialId}</td><td>{l.categoria}</td>
      {pilares.map(p=><td key={p} title={l.notas[p]?.ajustada?"Nota ajustada; original "+formatar(l.notas[p]?.original):"Nota original"}>
       {formatar(l.notas[p]?.efetiva)}{l.notas[p]?.ajustada?" *":""}</td>)}
      <td>{formatar(l.score)}</td><td>{l.status}{l.faltantes.length?" — "+l.faltantes.join("; "):""}</td>
     </tr>)}</tbody>
    </table></div>
    <p>* Valor efetivo corrigido; nota original preservada para auditoria.</p>
    {dados.diagnostico&&<section aria-label="Diagnóstico de prontidão" className="painel">
     <h2>Diagnóstico de prontidão — não oficial</h2>
     <p>Somente filiais autorizadas. As verificações a seguir não certificam cobertura global nem situação de RH.</p>
     <p><strong>{dados.diagnostico.participantesAnalisados}</strong> participantes analisados;
      {" "}<strong>{dados.diagnostico.registrosComNotasCompletas}</strong> com cinco notas;
      {" "}<strong>{dados.diagnostico.registrosPendentes}</strong> com notas ausentes.</p>
     <div className="tabela-scroll"><table className="tabela"><thead><tr><th>Colaborador</th><th>Notas presentes</th><th>Férias no mês</th><th>Categoria histórica</th><th>Pilares ausentes</th><th>Impedimentos cadastrais</th></tr></thead>
     <tbody>{dados.diagnostico.linhas.map(l=><tr key={l.colaboradorId}><td>{l.nome} / {l.matricula}</td>
      <td>{l.notasPresentes}/5</td><td>{l.feriasNoMes===null?"Não consultado":l.feriasNoMes}</td><td>{l.categoriasHistoricasNoMes===null?"Não consultado":l.categoriasHistoricasNoMes+" registro(s)"}</td><td>{l.pilaresAusentes.join(", ")||"Nenhum"}</td><td>{l.motivos.join(", ")||"Nenhum"}</td>
     </tr>)}</tbody></table></div>
     <p>Fontes RH: {dados.diagnostico.fontesHistoricasLidas?"consultadas sob RLS (sem homologação de regras de RH)":"não consultadas"}.</p>
     <h3>Impedimentos para classificação oficial</h3>
     <ul>{dados.diagnostico.impedimentosGlobais.map(m=><li key={m}>{m.replaceAll("_"," ")}</li>)}</ul>
    </section>}
    {dados.seguranca&&<section aria-label="Conciliação de Segurança" className="painel">
     <h2>Conciliação de Segurança — não oficial</h2>
     <p>Penalizações consultadas: {dados.seguranca.fonteLida?"sim, sob RLS":"não"}.
      Advertências: {dados.seguranca.totalAdvertencias}; acidentes: {dados.seguranca.totalAcidentes}.
      Fontes ainda sem fechamento homologado.</p>
     <div className="tabela-scroll"><table className="tabela"><thead><tr>
      <th>Colaborador</th><th>Advertências</th><th>Acidentes</th><th>Nota Segurança</th><th>Revisões necessárias</th>
     </tr></thead><tbody>{dados.seguranca.linhas.map(l=><tr key={l.colaboradorId}>
      <td>{l.nome} / {l.matricula}</td><td>{l.advertencias}</td><td>{l.acidentes}</td>
      <td>{formatar(l.notaSeguranca)}</td><td>{l.conflitos.join(", ")||"Nenhuma divergência identificada"}</td>
     </tr>)}</tbody></table></div>
     <ul>{dados.seguranca.avisos.map(a=><li key={a}>{a}</li>)}</ul>
    </section>}
    {dados.matriz&&<section aria-label="Matriz de bloqueios para homologação" className="painel">
     <h2>Matriz de bloqueios — classificação oficial indisponível</h2>
     <p role="status"><strong>{dados.matriz.situacao}</strong> — Apenas filiais autorizadas sob RLS.
      Nenhum resultado desta página autoriza posições, premiações ou decisões de RH.</p>
     <p>Participantes analisados: {dados.matriz.participantesAnalisados}.
      Com cinco notas informadas: {dados.matriz.completosNasNotas}.
      Com impedimentos de homologação: {dados.matriz.totalComBloqueios}.</p>
     <p>Bloqueios por classe: dados {dados.matriz.quantidadesPorClasse.dados};
      Segurança {dados.matriz.quantidadesPorClasse.seguranca};
      RH {dados.matriz.quantidadesPorClasse.rh};
      governança {dados.matriz.quantidadesPorClasse.governanca}.</p>
     <button type="button" className="botao botao-claro" disabled={!!exportando}
      onClick={()=>void exportar("json")}>
      {exportando==="json"?"Gerando sumário…":"Exportar sumário agregado JSON (sem dados pessoais)"}
     </button>
     <h3>Comprovações globais ainda necessárias</h3>
     <ul>{dados.matriz.requisitosGlobaisNaoComprovados.map(r=><li key={r}>{r.replaceAll("_"," ")}</li>)}</ul>
     <p>Fontes de acidentes e advertências consultadas não equivalem a fontes fechadas.
      A ausência de penalização não gera nota 100.</p>
    </section>}
    <section aria-label="Avisos de homologação"><h2>Limitações desta prévia</h2><ul>{dados.avisos.map((a,i)=><li key={i}>{a}</li>)}</ul></section>
   </>}
  </section>
 </main>;
}

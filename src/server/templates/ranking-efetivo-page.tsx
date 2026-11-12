"use client";
/** Template de prévia isolada: instalar apenas no runner Node protegido. */
import {useEffect,useState} from "react";
import type { PreviaRanking } from "@/lib/projecao-ranking-efetivo";
type Previa=PreviaRanking;
const pilares=["seguranca","produtividade","dirigibilidade","jornada","treinamentos"];
const titulo:{[k:string]:string}={seguranca:"Segurança",produtividade:"Produtividade",dirigibilidade:"Dirigibilidade",jornada:"Jornada",treinamentos:"Treinamentos"};
const meses=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const formatar=(n:number|null|undefined)=>n===null||n===undefined?"—":n.toFixed(2).replace(".",",");
export default function PreviaRankingNotasEfetivas(){
 const [mes,setMes]=useState(9);
 const [dados,setDados]=useState<Previa|null>(null);
 const [erro,setErro]=useState("");
 const [carregando,setCarregando]=useState(true);
 const [exportando,setExportando]=useState<"pdf"|"xlsx"|null>(null);
 useEffect(()=>{
  let cancelado=false;
  setCarregando(true);setErro("");setDados(null);
  fetch("/api/ranking-efetivo?mes="+mes,{credentials:"same-origin",cache:"no-store"})
   .then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.erro||"Consulta indisponível.");return data as Previa})
   .then(data=>{if(!cancelado){setDados(data);setCarregando(false)}})
   .catch(e=>{if(!cancelado){setErro(e instanceof Error?e.message:"Consulta indisponível.");setCarregando(false)}});
  return ()=>{cancelado=true};
 },[mes]);
 async function exportar(formato:"pdf"|"xlsx"){
  if(!dados||carregando||exportando)return;
  setExportando(formato);setErro("");
  try{
   const arquivo=await import("@/lib/exportar-previa-efetiva");
   if(formato==="pdf")arquivo.baixarPreviaPdf(dados);
   else await arquivo.baixarPreviaXlsx(dados);
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
    <section aria-label="Avisos de homologação"><h2>Limitações desta prévia</h2><ul>{dados.avisos.map((a,i)=><li key={i}>{a}</li>)}</ul></section>
   </>}
  </section>
 </main>;
}

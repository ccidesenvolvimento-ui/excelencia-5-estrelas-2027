"use client";
// Modal real opt-in. Disponível SOMENTE na rota Node instalada no runner de teste.
// Nunca substituir ModalAjusteNotaDemo: GitHub Pages permanece 100% demonstrativo.
import {useEffect,useRef,useState} from "react";
import {validarAjusteNota} from "@/lib/validar-ajuste-nota";
import type {Estrela} from "@/lib/dados-demo";
export type NotaReal={
 id:string; competencia:string; estrela:Estrela; nota:number; nota_efetiva:number;
 possui_ajuste:boolean; colaborador:{id:string;matricula:string;nome:string;filial_id:string};
};
const fmt=(n:number)=>n.toFixed(2).replace(".",",");
const nomes:{[K in Estrela]:string}={
 seguranca:"Segurança",produtividade:"Produtividade",dirigibilidade:"Dirigibilidade",jornada:"Jornada",treinamentos:"Treinamentos"
};
export function ModalAjusteNotaReal({nota,aoFechar,aoGravar}:{
 nota:NotaReal;aoFechar:()=>void;aoGravar:(valor:number,justificativa:string)=>Promise<void>;
}){
 const [nova,setNova]=useState(nota.nota_efetiva===90?"85":"90");
 const [just,setJust]=useState("");
 const [revisando,setRevisando]=useState(false);
 const [gravando,setGravando]=useState(false);
 const [erroHttp,setErroHttp]=useState("");
 const fecharRef=useRef<HTMLButtonElement>(null);
 const dialogRef=useRef<HTMLElement>(null);
 const erro=validarAjusteNota({original:nota.nota_efetiva,novaNota:nova,justificativa:just,estrela:nota.estrela});
 const bloqueado=nota.estrela==="seguranca";
 useEffect(()=>{
  const anterior=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const overflow=document.body.style.overflow;document.body.style.overflow="hidden";fecharRef.current?.focus();
  function teclado(e:KeyboardEvent){
   if(e.key==="Escape"){if(!gravando){e.preventDefault();aoFechar();}return;}
   if(e.key!=="Tab"||!dialogRef.current)return;
   const els=Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled),input:not(:disabled),textarea:not(:disabled)"))
     .filter(el=>el.getClientRects().length>0);
   if(!els.length)return;
   if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els[els.length-1].focus();}
   else if(!e.shiftKey&&document.activeElement===els[els.length-1]){e.preventDefault();els[0].focus();}
  }
  document.addEventListener("keydown",teclado);
  return()=>{document.body.style.overflow=overflow;document.removeEventListener("keydown",teclado);anterior?.focus();};
 },[aoFechar,gravando]);
 async function confirmar(){
  if(erro||gravando||bloqueado)return;
  setGravando(true);setErroHttp("");
  try{await aoGravar(Number(nova.replace(",",".")),just.trim());}
  catch(e){setErroHttp(e instanceof Error?e.message:"Não foi possível salvar. Recarregue a página.");setRevisando(false);}
  finally{setGravando(false);}
 }
 return <div className="ajustes-overlay ajustes-overlay-embaçado" style={{backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)"}} onMouseDown={e=>{if(e.target===e.currentTarget&&!gravando)aoFechar();}}>
  <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="aj-real-titulo" className="ajustes-dialogo ajustes-editor">
   <header className="ajustes-modal-cabecalho"><div><span className="rotulo-chave">AJUSTE ADMINISTRATIVO / HOMOLOGAÇÃO</span>
    <h2 id="aj-real-titulo">{revisando?"Conferir alteração":"Alterar nota do motorista"}</h2>
    <p>Ambiente autenticado de testes. A confirmação registra uma correção auditada.</p></div>
    <button ref={fecharRef} type="button" disabled={gravando} className="ajustes-modal-fechar" aria-label="Fechar ajuste" onClick={aoFechar}>×</button>
   </header>
   <div className="ajustes-identificacao"><strong>{nota.colaborador.nome}</strong><span>Matrícula {nota.colaborador.matricula} · {nota.competencia} · {nomes[nota.estrela]}</span></div>
   <div className="ajustes-valores"><div><small>Nota original</small><strong>{fmt(nota.nota)}</strong></div><div><small>Nota efetiva</small><strong>{fmt(nota.nota_efetiva)}</strong></div></div>
   {bloqueado?<div className="ajustes-alerta" role="status"><strong>Segurança: edição manual bloqueada.</strong><p>Revisar advertências e acidentes na origem.</p></div>:
    revisando?<div className="ajustes-resumo-confirmacao"><p>Nota anterior: <strong>{fmt(nota.nota_efetiva)}</strong></p>
      <p>Nova nota: <strong>{fmt(Number(nova.replace(",",".")))}</strong></p><p>Justificativa: {just.trim()}</p>
      <p>Esta ação registra histórico e auditoria no banco de homologação.</p></div>:
    <><div className="campo"><label htmlFor="aj-real-nova">Nova nota (0 a 100)</label>
      <input id="aj-real-nova" value={nova} disabled={gravando} onChange={e=>setNova(e.target.value)} inputMode="decimal"/></div>
      <div className="campo"><label htmlFor="aj-real-just">Justificativa obrigatória</label>
      <textarea id="aj-real-just" rows={4} maxLength={1000} value={just} disabled={gravando} onChange={e=>setJust(e.target.value)}/></div>
      {erro&&<p className="ajustes-erro" role="alert">{erro}</p>}</>}
   {erroHttp&&<p className="ajustes-erro" role="alert">{erroHttp}</p>}
   <div className="ajustes-acoes">
    <button type="button" className="botao botao-claro" disabled={gravando} onClick={revisando?()=>setRevisando(false):aoFechar}>{revisando?"Voltar e editar":"Fechar"}</button>
    {!bloqueado&&(revisando?<button type="button" className="botao" disabled={gravando} onClick={confirmar}>{gravando?"Registrando…":"Confirmar e registrar ajuste"}</button>:
    <button type="button" className="botao" disabled={!!erro||gravando} onClick={()=>setRevisando(true)}>Revisar ajuste</button>)}
   </div>
  </section>
 </div>;
}

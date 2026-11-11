"use client";

import { useEffect, useRef, useState } from "react";
import { rotulos, meses, type Estrela } from "@/lib/dados-demo";
import { validarAjusteNota } from "@/lib/validar-ajuste-nota";

export type NotaSelecionada = {
  id:string; nome:string; matricula:string; filial:string; mes:number;
  estrela:Estrela; original:number; efetiva:number;
};

function formatar(n:number) { return n.toFixed(2).replace(".",","); }

export function ModalAjusteNotaDemo({nota,aoFechar,aoConcluir}:{
  nota:NotaSelecionada; aoFechar:()=>void; aoConcluir:()=>void;
}) {
  const [novaNota,setNovaNota]=useState(nota.efetiva===90?"75":"90");
  const [justificativa,setJustificativa]=useState("Correção de divergência confirmada pelo setor de Produtividade.");
  const [confirmando,setConfirmando]=useState(false);
  const dialogo=useRef<HTMLElement>(null);
  const fechar=useRef<HTMLButtonElement>(null);
  const erro=validarAjusteNota({original:nota.efetiva,novaNota,justificativa,estrela:nota.estrela});
  const seguranca=nota.estrela==="seguranca";
  useEffect(()=>{
    const anterior=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    fechar.current?.focus();
    function teclado(event:KeyboardEvent) {
      if(event.key==="Escape") {event.preventDefault();aoFechar();return;}
      if(event.key!=="Tab" || !dialogo.current)return;
      const elementos=Array.from(dialogo.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]'))
        .filter(el=>el.getClientRects().length>0);
      if(!elementos.length)return;
      const primeiro=elementos[0],ultimo=elementos[elementos.length-1];
      if(event.shiftKey && document.activeElement===primeiro) {event.preventDefault();ultimo.focus();}
      else if(!event.shiftKey && document.activeElement===ultimo) {event.preventDefault();primeiro.focus();}
    }
    document.addEventListener("keydown",teclado);
    return ()=>{document.body.style.overflow=overflow;document.removeEventListener("keydown",teclado);anterior?.focus();};
  },[aoFechar]);

  return <div className="ajustes-overlay ajustes-overlay-embaçado" style={{backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)"}} onMouseDown={e=>{if(e.target===e.currentTarget)aoFechar();}}>
    <section ref={dialogo} role="dialog" aria-modal="true" aria-labelledby="aj-modal-titulo" aria-describedby="aj-modal-descricao" className="ajustes-dialogo ajustes-editor">
      <header className="ajustes-modal-cabecalho">
        <div><span className="rotulo-chave">AJUSTE ADMINISTRATIVO / DEMONSTRAÇÃO</span><h2 id="aj-modal-titulo">{confirmando?"Conferir alteração":"Alterar nota do motorista"}</h2>
          <p id="aj-modal-descricao">Exemplo fictício. Nenhuma nota será salva nesta tela.</p></div>
        <button ref={fechar} type="button" className="ajustes-modal-fechar" aria-label="Fechar ajuste" onClick={aoFechar}>×</button>
      </header>
      <div className="ajustes-identificacao"><strong>{nota.nome}</strong><span>Matrícula {nota.matricula} · {nota.filial} · {meses[nota.mes]}/2027 · {rotulos[nota.estrela]}</span></div>
      <div className="ajustes-valores"><div><small>Nota original</small><strong>{formatar(nota.original)}</strong></div><div><small>Nota efetiva</small><strong>{formatar(nota.efetiva)}</strong></div></div>
      {seguranca?<div className="ajustes-alerta" role="status"><strong>Segurança: edição manual bloqueada.</strong><p>Notas 0 ou 100 são calculadas a partir de advertências e acidentes. Uma correção exige revisão auditada dos registros de origem.</p></div>:confirmando?
        <div className="ajustes-resumo-confirmacao">
          <p><strong>Nota anterior:</strong> {formatar(nota.efetiva)}</p>
          <p><strong>Nova nota:</strong> {formatar(Number(novaNota.replace(",",".")))}</p>
          <p><strong>Justificativa:</strong> {justificativa.trim()}</p>
          <div className="ajustes-alerta"><strong>Somente pré-visualização.</strong><p>Nenhum dado será enviado ao Supabase, nem ao ranking ou ao histórico de produção.</p></div>
        </div>:
        <>
          <div className="campo"><label htmlFor="aj-nova">Nova nota (0 a 100)</label><input id="aj-nova" type="text" inputMode="decimal" value={novaNota} onChange={e=>setNovaNota(e.target.value)} placeholder="Ex.: 90,00"/></div>
          <div className="campo"><label htmlFor="aj-just">Justificativa obrigatória (15–1000 caracteres)</label><textarea id="aj-just" rows={4} maxLength={1000} value={justificativa} onChange={e=>setJustificativa(e.target.value)}/></div>
          <p className="nota-rodape">{justificativa.trim().length}/1000 caracteres. O ajuste real exigirá administrador autorizado e auditoria.</p>
          {erro&&<p className="ajustes-erro" role="alert">{erro}</p>}
        </>}
      <div className="ajustes-acoes">
        {confirmando?<button type="button" className="botao botao-claro" onClick={()=>setConfirmando(false)}>Voltar e editar</button>:<button type="button" className="botao botao-claro" onClick={aoFechar}>Fechar</button>}
        {!seguranca&&(confirmando?
          <button type="button" className="botao" onClick={aoConcluir}>Concluir pré-visualização (sem salvar)</button>:
          <button type="button" className="botao" disabled={!!erro} onClick={()=>setConfirmando(true)}>Revisar ajuste (demo)</button>)}
      </div>
    </section>
  </div>;
}

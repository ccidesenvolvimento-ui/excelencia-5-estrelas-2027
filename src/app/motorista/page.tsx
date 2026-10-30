"use client";

import {useEffect,useMemo,useState,type FormEvent} from "react";
import {avaliacaoDaMatricula,buscarMotorista,normalizarMatricula,periodoDisponivel} from "@/lib/consulta-motorista";
import {estrelas,formatarNota,meses,mesesPeriodo,periodos,pesos,rotuloEstrela,type Periodo,type Pessoa} from "@/lib/dados-demo";
import styles from "./portal.module.css";

type EventoInstalar=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
type Plataforma="ios"|"android"|"outro";

const base=process.env.NEXT_PUBLIC_BASE_PATH??"";

function Icone({nome,tamanho=20}:{nome:"estrela"|"trofeu"|"grafico"|"check"|"seguranca"|"voltar"|"celular"|"link";tamanho?:number}){
  const desenhos={
    estrela:"M12 2l3.1 6.4 7.1 1-5.1 5 .9 7-6-3.3-6 3.3.9-7-5.1-5 7.1-1L12 2z",
    trofeu:"M7 4h10v7a5 5 0 0 1-10 0V4z M7 6H4v3a4 4 0 0 0 4 4 M17 6h3v3a4 4 0 0 1-4 4 M12 16v4 M8 21h8",
    grafico:"M3 3v18h18 M7 16l4-4 3 2 5-7",
    check:"M20 6L9 17l-5-5",
    seguranca:"M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z M9 12l2 2 4-4",
    voltar:"M19 12H5 M11 18l-6-6 6-6",
    celular:"M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M11 18h2",
    link:"M10 13a5 5 0 0 0 7.6.5l3-3A5 5 0 0 0 13.5 3l-2 2 M14 11a5 5 0 0 0-7.6-.5l-3 3A5 5 0 0 0 10.5 21l2-2",
  };
  return <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={desenhos[nome]}/></svg>;
}

function AvisoDemo(){return <div className={styles.avisoDemo}><span className={styles.pontoDemo}/><span>AMBIENTE DE DEMONSTRAÇÃO · NOTAS FICTÍCIAS</span></div>;}

export default function PortalMotorista(){
 const [campo,setCampo]=useState("");
 const [pessoa,setPessoa]=useState<Pessoa|null>(null);
 const [erro,setErro]=useState("");
 const [periodo,setPeriodo]=useState<Periodo>("mensal");
 const [mes,setMes]=useState(3);
 const [eventoInstalar,setEventoInstalar]=useState<EventoInstalar|null>(null);
 const [instalado,setInstalado]=useState(false);
 const [plataforma,setPlataforma]=useState<Plataforma>("outro");
 const [instrucoes,setInstrucoes]=useState(false);
 const [copiado,setCopiado]=useState(false);

 useEffect(()=>{
   const ua=navigator.userAgent;
   setPlataforma(/iPhone|iPad|iPod/.test(ua)?"ios":/Android/.test(ua)?"android":"outro");
   setInstalado(window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as Navigator & {standalone?:boolean}).standalone===true));
   const quandoInstalar=(event:Event)=>{event.preventDefault();setEventoInstalar(event as EventoInstalar)};
   const quandoInstalado=()=>{setInstalado(true);setEventoInstalar(null);setInstrucoes(false)};
   window.addEventListener("beforeinstallprompt",quandoInstalar);
   window.addEventListener("appinstalled",quandoInstalado);
   if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")){
     navigator.serviceWorker.register(`${base}/motorista/sw.js`,{scope:`${base}/motorista/`,updateViaCache:"none"}).catch(()=>{/* instalação de atalho continua disponível */});
   }
   return ()=>{window.removeEventListener("beforeinstallprompt",quandoInstalar);window.removeEventListener("appinstalled",quandoInstalado)};
 },[]);

 const avaliacao=useMemo(()=>pessoa?avaliacaoDaMatricula(pessoa,periodo,mes):null,[pessoa,periodo,mes]);
 const calendarioValido=pessoa?periodoDisponivel(pessoa,periodo,mes):false;
 const nomePeriodo=periodo==="mensal"?`${meses[mes]}/2027`:`${periodos.find(p=>p.id===periodo)?.nome??periodo} · 2027`;
 const desempenhoDisponivel=Boolean(avaliacao&&calendarioValido);
 const score=avaliacao?.score??null;
 const iniciais=pessoa?.nome.split(/\s+/).slice(0,2).map(p=>p.charAt(0)).join("")??"";

 function consultar(evento:FormEvent<HTMLFormElement>){
   evento.preventDefault();
   const resultado=buscarMotorista(campo);
   if(resultado.tipo==="encontrado"){
     setPessoa(resultado.pessoa);setErro("");setCampo("");setPeriodo("mensal");setMes(3);
   }else if(resultado.tipo==="ambiguo"){
     setErro("Essa matrícula aparece mais de uma vez. Procure o responsável pelo programa para confirmar seu cadastro.");
   }else{
     setErro("Matrícula não encontrada nesta demonstração. Confira os caracteres e tente novamente.");
   }
 }
 function sair(){setPessoa(null);setCampo("");setErro("");}
 async function instalar(){
   if(eventoInstalar){
     try{await eventoInstalar.prompt();await eventoInstalar.userChoice;setEventoInstalar(null)}catch{setInstrucoes(true)}
   }else setInstrucoes(v=>!v);
 }
 async function copiarLink(){
   const url=`${window.location.origin}${base}/motorista/`;
   try{await navigator.clipboard.writeText(url);setCopiado(true)}catch{setInstrucoes(true)}
 }

 return <main className={styles.portal}>
   <div className={styles.luzTopo} aria-hidden="true"/>
   <header className={styles.cabecalho}>
     <div className={styles.marca}><img src={`${base}/marca-programa.png`} alt="Programa Excelência 5 Estrelas 2027"/><span className={styles.marcaSeparador}/><span className={styles.marcaSelo}>ÁREA DO<br/><strong>MOTORISTA</strong></span></div>
     <button type="button" className={styles.botaoInstalar} onClick={instalar} disabled={instalado} aria-expanded={instrucoes}><Icone nome="celular" tamanho={18}/><span>{instalado?"App instalado":eventoInstalar?"Instalar aplicativo":"Instalar no celular"}</span></button>
   </header>
   <div className={styles.container}>
     <AvisoDemo/>
     {instrucoes&&!instalado&&<section className={styles.instrucoes} aria-label="Como instalar o aplicativo">
       <div><strong>Adicionar à tela inicial</strong><p>{plataforma==="ios"?"No iPhone, abra este endereço no Safari, toque em Compartilhar e escolha ‘Adicionar à Tela de Início’.":plataforma==="android"?"No Android, abra este link no Chrome, toque no menu ⋮ e escolha ‘Instalar aplicativo’ ou ‘Adicionar à tela inicial’.":"No navegador do celular, abra o menu e procure ‘Instalar aplicativo’ ou ‘Adicionar à tela inicial’."} O acesso às notas requer conexão com a internet.</p></div>
       <button type="button" onClick={()=>setInstrucoes(false)} aria-label="Fechar instruções">×</button>
     </section>}
     {!pessoa? <>
       <section className={styles.boasVindas}>
         <div className={styles.brilhoEstrela} aria-hidden="true"><img src={`${base}/estrela-oficial-5-estrelas.png`} alt=""/></div>
         <span className={styles.sobretitulo}>SUA JORNADA DE EXCELÊNCIA</span>
         <h1>Seu desempenho.<br/><span>Suas conquistas.</span></h1>
         <p>Consulte suas cinco estrelas, acompanhe sua pontuação e veja sua posição no ranking do seu segmento.</p>
       </section>
       <section className={styles.painelEntrada} aria-labelledby="titulo-acesso">
         <div className={styles.painelEntradaTopo}><span className={styles.painelMiniIcon}><Icone nome="estrela" tamanho={22}/></span><div><span className={styles.miniRotulo}>CONSULTA INDIVIDUAL</span><h2 id="titulo-acesso">Acesse seu painel</h2></div></div>
         <p>Informe sua matrícula para visualizar suas avaliações demonstrativas.</p>
         <form onSubmit={consultar} className={styles.form}>
           <label htmlFor="matricula-portal">Sua matrícula</label>
           <input id="matricula-portal" type="text" value={campo} onChange={e=>{setCampo(e.target.value);setErro("")}} maxLength={30} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="Ex.: F004" required aria-invalid={Boolean(erro)} aria-describedby={erro?"erro-matricula":undefined}/>
           {erro&&<p id="erro-matricula" className={styles.erro} role="alert">{erro}</p>}
           <button type="submit" className={styles.botaoPrincipal}>Consultar meu desempenho <span aria-hidden="true">→</span></button>
         </form>
         <div className={styles.exemplo}>Teste com uma matrícula fictícia, como <button type="button" onClick={()=>{setCampo("F004");setErro("")}}>F004</button>.</div>
       </section>
     </>:<>
       <section className={styles.perfilTopo}>
         <div className={styles.identidade}>
           <div className={styles.avatar} aria-hidden="true">{iniciais}</div>
           <div className={styles.perfilNome}><span className={styles.miniRotulo}>MEU PAINEL · 2027</span><h1>Olá, {pessoa.nome.split(" ")[0]}!</h1><p>{pessoa.nome}</p><div className={styles.identidadeChips}><span>Matrícula {pessoa.matricula}</span><span>{pessoa.categoria??"Segmento pendente"}</span><span>{pessoa.filial}</span></div></div>
         </div>
         <button type="button" className={styles.trocar} onClick={sair}><Icone nome="voltar" tamanho={17}/> Trocar matrícula</button>
       </section>
       <section className={styles.filtros} aria-label="Selecionar período da avaliação">
         <div><span className={styles.miniRotulo}>ACOMPANHE SUA EVOLUÇÃO</span><h2>Meu desempenho</h2></div>
         <div className={styles.filtrosControles}>
           <label>Período<select value={periodo} onChange={e=>setPeriodo(e.target.value as Periodo)}>{periodos.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
           {periodo==="mensal"&&<label>Competência<select value={mes} onChange={e=>setMes(Number(e.target.value))}>{meses.map((m,i)=><option key={m} value={i}>{m}/2027</option>)}</select></label>}
         </div>
       </section>
       <section className={styles.resumo} aria-label="Resumo do resultado">
         <article className={styles.cartaoScore}>
           <div className={styles.cartaoCabecalho}><Icone nome="grafico" tamanho={21}/><span>SCORE MÉDIO</span></div>
           <div className={styles.pontuacao}>{formatarNota(score)}{score!==null&&<span>/ 100</span>}</div>
           <p>{nomePeriodo}</p>
         </article>
         <article className={styles.cartaoPosicao}>
           <div className={styles.cartaoCabecalho}><Icone nome="trofeu" tamanho={21}/><span>COLOCAÇÃO</span></div>
           <div className={styles.colocacao}>{avaliacao?.posicao!==null && avaliacao?.posicao!==undefined?`${avaliacao.posicao}º`:"—"}</div>
           <p>{pessoa.categoria?`Ranking de ${pessoa.categoria}`:"Sem segmento definido"}</p>
         </article>
       </section>
       <div className={`${styles.situacao} ${avaliacao?.status==="Elegível"?styles.situacaoOk:avaliacao?.status==="Inelegível"?styles.situacaoNao:styles.situacaoPendente}`} role="status">
         <div><span className={styles.situacaoIcone}><Icone nome={avaliacao?.status==="Elegível"?"check":"seguranca"} tamanho={20}/></span><div><strong>{avaliacao?.status==="Elegível"?"Elegível para o ranking":avaliacao?.status==="Inelegível"?"Inelegível neste período":"Avaliação indisponível ou pendente"}</strong><p>{avaliacao?.status==="Elegível"?"Suas cinco estrelas estão completas e aptas à classificação.":avaliacao?.status==="Inelegível"?"Uma ou mais estrelas receberam nota zero. Você não recebe posição oficial neste período.":!calendarioValido?"Este período não faz parte do calendário de avaliações do seu segmento.":"Ainda faltam avaliações ou definição de segmento. Não é atribuída posição enquanto houver pendências."}</p></div></div>
       </div>
       <section className={styles.estrelasSecao}>
         <div className={styles.tituloSecao}><div><span className={styles.miniRotulo}>VISÃO POR CATEGORIA</span><h2>Minhas cinco estrelas</h2></div><span className={styles.competencia}>{nomePeriodo}</span></div>
         <div className={styles.gradeEstrelas}>
           {estrelas.map((estrela,index)=>{
             const nota=desempenhoDisponivel?avaliacao?.notas[estrela]:undefined;
             const nome=rotuloEstrela(estrela,pessoa.categoria);
             const percentual=Math.max(0,Math.min(100,nota??0));
             return <article key={estrela} className={styles.estrelaCard}>
               <div className={styles.estrelaCardCabecalho}><span className={styles.numeroEstrela}>0{index+1}</span><Icone nome="estrela" tamanho={19}/></div>
               <h3>{nome}</h3><span className={styles.peso}>{Math.round(pesos[estrela]*100)}% do score</span>
               <div className={styles.valorEstrela}>{formatarNota(nota)}<small>{nota!==null&&nota!==undefined?" / 100":"Sem nota"}</small></div>
               <div className={styles.trilho} aria-label={`${nome}: ${nota===undefined?"não disponível":`${formatarNota(nota)} de 100`}`}><span style={{width:`${percentual}%`}}/></div>
               {nota===0?<small className={styles.notaZero}>Nota zero — inelegibilidade</small>:nota===undefined?<small className={styles.notaAusente}>Aguardando avaliação</small>:<small className={styles.notaRegistrada}>Avaliação registrada</small>}
             </article>;
           })}
         </div>
       </section>
       {periodo!=="mensal" && avaliacao && pessoa.categoria && <section className={styles.evolucao}>
         <div className={styles.tituloSecao}><div><span className={styles.miniRotulo}>HISTÓRICO DO PERÍODO</span><h2>Notas por mês</h2></div></div>
         <div className={styles.mesesGrade}>{mesesPeriodo(pessoa.categoria,periodo,mes).map((numero,index)=><div className={styles.mesItem} key={numero}><span>{meses[numero]}</span><strong>{formatarNota(avaliacao.mensais[index])}</strong></div>)}</div>
       </section>}
       <section className={styles.entenda}>
         <span className={styles.miniRotulo}>COMO FUNCIONA</span><h2>Entenda sua pontuação</h2>
         <p>O score combina Segurança (30%), Produtividade (25%), Dirigibilidade (20%), Jornada (15%) e Treinamentos (10%). A posição é calculada entre colaboradores elegíveis do mesmo segmento, mantendo a colocação do ranking principal.</p>
         <p>Notas em branco são pendências, não são zero. Nota zero gera inelegibilidade. As avaliações de ciclos e anual seguem os meses previstos para cada segmento.</p>
       </section>
     </>}
     <footer className={styles.rodape}>
       <div><img src={`${base}/estrela-oficial-5-estrelas.png`} alt=""/><span>Programa Excelência 5 Estrelas · 2027</span></div>
       <p>Ambiente visual de testes. Não representa dados oficiais. Matrícula não é autenticação; dados reais precisarão de acesso protegido.</p>
       <button type="button" onClick={copiarLink} className={styles.copiar}><Icone nome="link" tamanho={15}/>{copiado?"Link copiado":"Copiar link deste portal"}</button>
     </footer>
   </div>
 </main>;
}

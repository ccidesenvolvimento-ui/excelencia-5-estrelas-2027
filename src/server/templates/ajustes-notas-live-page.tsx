"use client";
// Template opt-in: instalar SOMENTE em build Node protegido da homologação.
// Esta rota NÃO existe nos artefatos estáticos nem no app oficial.
import {useCallback,useEffect,useMemo,useState} from "react";
import {Cabecalho,BlocoTitulo} from "@/components/Elementos";
import {ModalAjusteNotaReal,type NotaReal} from "@/components/ModalAjusteNotaReal";
import "@/app/ajustes-notas/ajustes-notas.css";
type Historico={id:number;nota_mensal_id:string;nota_anterior:number;nota_nova:number;justificativa:string;usuario_id:string;criado_em:string};
type Dados={notas:NotaReal[];historico:Historico[];proximoOffset:number|null;erro?:string};
const nomes:{[key:string]:string}={seguranca:"Segurança",produtividade:"Produtividade",dirigibilidade:"Dirigibilidade",jornada:"Jornada",treinamentos:"Treinamentos"};
const formatar=(n:number)=>Number(n).toFixed(2).replace(".",",");
export default function AjustesNotasHomologacao(){
 const [dados,setDados]=useState<Dados>({notas:[],historico:[],proximoOffset:null});
 const [mes,setMes]=useState("2027-10-01");
 const [pilar,setPilar]=useState("");
 const [busca,setBusca]=useState("");
 const [filial,setFilial]=useState("");
 const [selecionado,setSelecionado]=useState<string|null>(null);
 const [carregando,setCarregando]=useState(true);
 const [erro,setErro]=useState("");
 const [aviso,setAviso]=useState("");
 const buscar=useCallback(async()=>{
  setCarregando(true);setErro("");
  try{
   const params=new URLSearchParams();if(mes)params.set("competencia",mes);if(pilar)params.set("estrela",pilar);
   const resposta=await fetch("/api/ajustes-notas?"+params,{cache:"no-store",credentials:"same-origin"});
   const conteudo:Dados=await resposta.json();
   if(!resposta.ok)throw new Error(resposta.status===401?"Sessão encerrada. Entre novamente.":resposta.status===403?"Seu perfil não tem permissão para consultar ajustes.":conteudo.erro||"Falha ao consultar avaliações.");
   setDados(conteudo);
  }catch(e){setErro(e instanceof Error?e.message:"Falha ao consultar avaliações.");setDados({notas:[],historico:[],proximoOffset:null});}
  finally{setCarregando(false);}
 },[mes,pilar]);
 useEffect(()=>{void buscar();},[buscar]);
 const filiais=useMemo(()=>[...new Set(dados.notas.map(n=>n.colaborador.filial_id))], [dados.notas]);
 const linhas=useMemo(()=>dados.notas.filter(n=>{
  const termo=busca.trim().toLocaleLowerCase("pt-BR");
  return (!termo||[n.colaborador.nome,n.colaborador.matricula].some(t=>t.toLocaleLowerCase("pt-BR").includes(termo)))
   &&(!filial||n.colaborador.filial_id===filial);
 }),[dados.notas,busca,filial]);
 const nota=dados.notas.find(n=>n.id===selecionado)??null;
 async function salvar(novaNota:number,justificativa:string){
  if(!nota)throw new Error("Nota não selecionada.");
  const resposta=await fetch("/api/ajustes-notas",{
   method:"POST",cache:"no-store",credentials:"same-origin",
   headers:{"content-type":"application/json"},
   body:JSON.stringify({notaId:nota.id,novaNota,notaEsperada:nota.nota_efetiva,justificativa})
  });
  const resultado:{registrado?:boolean;erro?:string}=await resposta.json();
  if(!resposta.ok||!resultado.registrado)throw new Error(resposta.status===409?"A nota foi alterada por outra sessão. Feche o modal e atualize os dados.":resultado.erro||"A correção não foi registrada.");
  setSelecionado(null);setAviso("Ajuste registrado no banco de homologação e histórico atualizado.");
  await buscar();
 }
 return <main className="ajustes-admin">
  <Cabecalho tag="ADMINISTRAÇÃO / HOMOLOGAÇÃO" titulo="Ajustes administrativos de notas"
    descricao="Ambiente autenticado de homologação. As correções são gravadas somente no banco de testes."/>
  <section className="painel">
   <BlocoTitulo superior="CONSULTA AUTENTICADA" titulo="Localizar avaliação" descricao="As informações retornadas respeitam as permissões por filial."/>
   <div className="ajustes-filtros">
    <div className="campo"><label htmlFor="aj-real-busca">Nome ou matrícula</label><input id="aj-real-busca" value={busca} onChange={e=>setBusca(e.target.value)}/></div>
    <div className="campo"><label htmlFor="aj-real-filial">Filial (ID)</label><select id="aj-real-filial" value={filial} onChange={e=>setFilial(e.target.value)}><option value="">Todas autorizadas</option>{filiais.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
    <div className="campo"><label htmlFor="aj-real-mes">Competência</label><select id="aj-real-mes" value={mes} onChange={e=>setMes(e.target.value)}><option value="2027-10-01">Outubro/2027</option><option value="">Todas (50 por página)</option></select></div>
    <div className="campo"><label htmlFor="aj-real-pilar">Pilar</label><select id="aj-real-pilar" value={pilar} onChange={e=>setPilar(e.target.value)}><option value="">Todos</option>{Object.keys(nomes).map(e=><option key={e} value={e}>{nomes[e]}</option>)}</select></div>
   </div>
   {carregando?<p role="status">Consultando notas autorizadas…</p>:
    <p role="status">{linhas.length} registros autorizados exibidos{dados.proximoOffset!==null?" (há mais páginas a consultar)":""}.</p>}
   {erro&&<p role="alert" className="ajustes-erro">{erro}</p>}
   {aviso&&<p role="status" className="bloco-info">{aviso}</p>}
   <div className="tabela-scroll"><table className="tabela ajustes-tabela"><thead><tr><th>Motorista / matrícula</th><th>Filial</th><th>Competência</th><th>Pilar</th><th>Original</th><th>Efetiva</th><th>Ação</th></tr></thead>
   <tbody>{linhas.map(n=><tr key={n.id}><td><strong>{n.colaborador.nome}</strong><small>{n.colaborador.matricula}</small></td><td>{n.colaborador.filial_id}</td><td>{n.competencia}</td><td>{nomes[n.estrela]}</td><td>{formatar(n.nota)}</td><td>{formatar(n.nota_efetiva)}</td><td><button type="button" className="botao botao-claro" onClick={()=>{setSelecionado(n.id);setAviso("");}}>Selecionar</button></td></tr>)}
   {!carregando&&linhas.length===0&&<tr><td colSpan={7}>Nenhuma avaliação autorizada nesta consulta.</td></tr>}</tbody></table></div>
  </section>
  <section className="painel"><BlocoTitulo superior="AUDITORIA" titulo="Histórico de ajustes" descricao="Eventos retornados pelo banco sob as políticas de autorização por filial."/>
    {dados.historico.map(h=><div className="ajustes-evento" key={h.id}>
     <p><strong>{formatar(h.nota_anterior)} → {formatar(h.nota_nova)}</strong></p>
     <p>{h.justificativa}</p><small>Autor: {h.usuario_id} · {h.criado_em}</small>
    </div>)}
    {!dados.historico.length&&<p>Nenhum ajuste registrado nesta consulta.</p>}
  </section>
  {nota&&<ModalAjusteNotaReal key={nota.id+":"+nota.nota_efetiva} nota={nota} aoFechar={()=>setSelecionado(null)} aoGravar={salvar}/>}
 </main>;
}

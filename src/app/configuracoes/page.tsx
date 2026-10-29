"use client";

import {useEffect,useState} from "react";
import {AvisoDemo,Cabecalho,BlocoTitulo} from "@/components/Elementos";
import {categorias,estrelas,pesos,rotulos} from "@/lib/dados-demo";

type Aba="regras"|"usuarios"|"seguranca";
type Perfil="Administrador"|"Analista"|"Consulta";
type UsuarioDemo={id:string;nome:string;perfil:Perfil;filiais:string[];permissoes:string[];ativo:boolean};
const OPERACOES=["Visualizar", "Importar", "Editar", "Exportar"];
const ABAS=["Visão geral","Ranking e relatórios","Pendências","Importações","RH0034","Configurações"];
const FILIAIS=["Lavras", "Jataí", "Itabira", "Contagem", "Betim"];
const ADMINS:UsuarioDemo[]=Array.from({length:3},(_,i)=>({id:`admin-${i+1}`,nome:`Administrador ${String(i+1).padStart(2,"0")}`,perfil:"Administrador",filiais:["Todas"],permissoes:[],ativo:true}));
const INICIAIS:UsuarioDemo[]=[...ADMINS,{id:"consulta-001",nome:"Usuário demonstração",perfil:"Consulta",filiais:["Lavras"],permissoes:["Visão geral:Visualizar","Ranking e relatórios:Visualizar"],ativo:true}];
const STORAGE="excelencia-5-estrelas-usuarios-demo-v06";
const abas:{id:Aba;nome:string}[]=[{id:"regras",nome:"Regras e ciclos"},{id:"usuarios",nome:"Usuários e acessos"},{id:"seguranca",nome:"Segurança e auditoria"}];

export default function Configuracoes(){
 const [aba,setAba]=useState<Aba>("regras");
 const [usuarios,setUsuarios]=useState<UsuarioDemo[]>(INICIAIS);
 const [selecionado,setSelecionado]=useState("consulta-001");
 const [novoNome,setNovoNome]=useState("");
 const [novoPerfil,setNovoPerfil]=useState<Perfil>("Consulta");
 const [carregado,setCarregado]=useState(false);
 const [aviso,setAviso]=useState("");
 useEffect(()=>{
   if(window.location.hash==="#usuarios")setAba("usuarios");
   else if(window.location.hash==="#seguranca")setAba("seguranca");
   try{const salvo=JSON.parse(localStorage.getItem(STORAGE)||"null") as UsuarioDemo[]|null;
     if(Array.isArray(salvo) && salvo.length>=3 && salvo.every(x=>x&&typeof x.id==="string"&&typeof x.nome==="string"&&Array.isArray(x.filiais)&&Array.isArray(x.permissoes)&&typeof x.ativo==="boolean"&&["Administrador","Analista","Consulta"].includes(x.perfil)))setUsuarios(salvo);
   }catch{/* armazenamento desabilitado */}
   setCarregado(true);
 },[]);
 useEffect(()=>{if(carregado){try{localStorage.setItem(STORAGE,JSON.stringify(usuarios))}catch{/* navegador bloqueou */}}},[usuarios,carregado]);
 function mudarAba(proxima:Aba){setAba(proxima);if(typeof window!=="undefined")window.history.replaceState(null,"",proxima==="regras"?window.location.pathname:`#${proxima}`);}
 const usuario=usuarios.find(u=>u.id===selecionado)??usuarios[0];
 function atualizar(alteracoes:Partial<UsuarioDemo>){if(!usuario||usuario.perfil==="Administrador")return;setUsuarios(atual=>atual.map(u=>u.id===usuario.id?{...u,...alteracoes}:u));setAviso("Preferências de demonstração alteradas somente neste navegador.")}
 function criarUsuario(){const nome=novoNome.trim();if(nome.length<3){setAviso("Preencha um nome fictício com pelo menos três caracteres.");return}
   const novo:UsuarioDemo={id:`teste-${Date.now()}`,nome,perfil:novoPerfil,filiais:novoPerfil==="Administrador"?["Todas"]:[],permissoes:[],ativo:true};
   setUsuarios(atual=>[...atual,novo]);setSelecionado(novo.id);setNovoNome("");setAviso("Perfil de teste criado localmente. Nenhuma conta real foi criada.");
 }
 function reset(){setUsuarios(INICIAIS);setSelecionado("consulta-001");setAviso("Simulação redefinida para os perfis fictícios iniciais.")}
 return <>
 <Cabecalho tag="ADMINISTRAÇÃO / PROGRAMA 2027" titulo="Configurações do sistema" descricao="Reúna metodologia, ciclos de avaliação, usuários, acessos por filial e requisitos de auditoria em uma só área."/>
 <AvisoDemo texto="Nesta versão pública, as regras são informativas e os perfis de usuários são uma simulação local. Nenhum acesso real é criado ou autorizado."/>
 <div className="mod-tabbar" role="tablist" aria-label="Áreas de configurações">{abas.map(a=><button key={a.id} type="button" role="tab" aria-selected={aba===a.id} className="mod-tab" onClick={()=>mudarAba(a.id)}>{a.nome}</button>)}</div>
 {aba==="regras"&&<>
 <div className="mod-grid-estatisticas"><div className="mod-estatistica"><small>Categorias</small><strong>08</strong><span>Competitivas</span></div><div className="mod-estatistica"><small>Estrelas</small><strong>05</strong><span>Por avaliação</span></div><div className="mod-estatistica"><small>Ciclos</small><strong>03</strong><span>Além do anual</span></div><div className="mod-estatistica"><small>Fechamento mensal</small><strong>12</strong><span>Do mês seguinte</span></div></div>
 <div className="dois-lados"><section className="painel"><BlocoTitulo superior="METODOLOGIA" titulo="Pesos dos cinco pilares" descricao="Distribuição provisória, sujeita a aprovação final."/><div className="barras">{estrelas.map(e=><div key={e} className="barra-item"><span>{rotulos[e]}</span><div><i style={{width:`${pesos[e]*100}%`}}/></div><span>{pesos[e]*100}%</span></div>)}</div><p className="nota-rodape">Operadores utilizam critérios específicos para as estrelas operacionais.</p></section>
 <section className="painel"><BlocoTitulo superior="CALENDÁRIO" titulo="Períodos de avaliação" descricao="Ciclos diferentes para a operação Sucro."/><div className="tabela-scroll"><table className="tabela"><thead><tr><th>Período</th><th>Demais segmentos</th><th>Sucro</th></tr></thead><tbody><tr><td>Ciclo 1</td><td>Jan–Abr</td><td>Mar–Mai</td></tr><tr><td>Ciclo 2</td><td>Mai–Ago</td><td>Jun–Ago</td></tr><tr><td>Ciclo 3</td><td>Set–Dez</td><td>Set–Nov</td></tr><tr><td>Anual</td><td>Jan–Dez</td><td>Mar–Nov</td></tr></tbody></table></div></section></div>
 <section className="painel"><BlocoTitulo superior="ESTRUTURA COMPETITIVA" titulo="Oito categorias participantes" descricao="Operadores de empilhadeira estão excluídos do programa."/><div className="mod-categoria-lista">{categorias.map((c,i)=><div className="mod-categoria-item" key={c}><span className="rotulo-chave">{String(i+1).padStart(2,"0")} / CATEGORIA</span><div style={{marginTop:7}}>{c}</div></div>)}</div></section>
 <section className="painel"><BlocoTitulo superior="REGRAS TRANSVERSAIS" titulo="Princípios da avaliação"/><ol className="passos"><li>Segurança: 100 somente após validação das duas planilhas; 0 para quem tiver advertência ou acidente.</li><li>Qualquer estrela com zero elimina a elegibilidade do ciclo e do anual correspondente.</li><li>Nota ausente é pendência, nunca um zero automático.</li><li>Férias: estimativa apenas no fechamento de ciclo, sem alterar as cinco notas originais.</li><li>Fechamento mensal no dia 12 do mês seguinte, ou próximo dia útil se cair no fim de semana.</li><li>Alterações após fechamento: somente administradores e com auditoria.</li></ol></section>
 </>}
 {aba==="usuarios"&&<>
 <div className="mod-grid-estatisticas"><div className="mod-estatistica"><small>Administradores iniciais</small><strong>03</strong><span>Acesso global previsto</span></div><div className="mod-estatistica"><small>Perfis em demonstração</small><strong>{usuarios.length}</strong><span>Dados somente no navegador</span></div><div className="mod-estatistica"><small>Filiais de exemplo</small><strong>{FILIAIS.length}</strong><span>Selecionáveis para testes</span></div><div className="mod-estatistica"><small>Autenticação real</small><strong>—</strong><span>Não implementada</span></div></div>
 <section className="painel"><BlocoTitulo superior="CONTROLE DE ACESSOS / SIMULAÇÃO" titulo="Usuários e permissões" descricao="Escolha um perfil fictício, simule permissões por área e selecione filiais autorizadas." acao={<button className="botao botao-claro" type="button" onClick={reset}>Redefinir demonstração</button>}/>
 <div className="mod-accessos"><div><div className="campo"><label htmlFor="usuario-selecionado">Perfil para visualizar / configurar</label><select id="usuario-selecionado" value={usuario?.id??""} onChange={e=>{setSelecionado(e.target.value);setAviso("")}}>{usuarios.map(u=><option key={u.id} value={u.id}>{u.nome} — {u.perfil}</option>)}</select></div>
 <div className="mod-sem-backend" style={{marginTop:15}}>Os três administradores iniciais possuem acesso global e ficam bloqueados para edição nesta simulação. Os demais perfis podem ser configurados localmente. Em produção, todos os acessos serão validados no servidor e no banco.</div>
 <div className="mod-bloco-titulo" style={{marginTop:22}}><div><h2>Criar perfil de teste</h2><p>Não envia convites nem cria usuários reais.</p></div></div>
 <div className="campo"><label htmlFor="nome-novo">Nome fictício</label><input id="nome-novo" value={novoNome} onChange={e=>setNovoNome(e.target.value)} placeholder="Ex.: Analista de demonstração" maxLength={80}/></div><div className="campo" style={{marginTop:10}}><label htmlFor="perfil-novo">Tipo de perfil</label><select id="perfil-novo" value={novoPerfil} onChange={e=>setNovoPerfil(e.target.value as Perfil)}><option>Consulta</option><option>Analista</option><option>Administrador</option></select></div><button type="button" className="botao" style={{marginTop:13}} onClick={criarUsuario}>+ Adicionar perfil de teste</button>
 </div><div>{usuario&&<><div className="mod-bloco-titulo"><div><h2>{usuario.nome}</h2><p>{usuario.perfil} · {usuario.perfil==="Administrador"?"Todas as filiais":"Acesso específico por filial"}</p></div><label style={{display:"flex",gap:7,alignItems:"center"}}><input type="checkbox" checked={usuario.ativo} disabled={usuario.perfil==="Administrador"} onChange={e=>atualizar({ativo:e.target.checked})}/> Ativo</label></div>
 <div className="rotulo-chave" style={{marginBottom:12}}>FILIAIS PERMITIDAS</div><div className="mod-grupo-checks">{FILIAIS.map(f=><label className="mod-check" key={f}><input type="checkbox" disabled={usuario.perfil==="Administrador"} checked={usuario.perfil==="Administrador"||usuario.filiais.includes(f)} onChange={e=>atualizar({filiais:e.target.checked?[...usuario.filiais,f]:usuario.filiais.filter(x=>x!==f)})}/><span>{f}</span></label>)}</div>
 <div className="rotulo-chave" style={{margin:"22px 0 12px"}}>PERMISSÕES POR ABA E OPERAÇÃO</div><div className="tabela-scroll"><table className="tabela mod-permissoes"><thead><tr><th>Área</th>{OPERACOES.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{ABAS.map(area=><tr key={area}><td>{area}</td>{OPERACOES.map(op=><td key={op}><input type="checkbox" aria-label={`${area}: ${op}`} disabled={usuario.perfil==="Administrador"} checked={usuario.perfil==="Administrador"||usuario.permissoes.includes(`${area}:${op}`)} onChange={e=>{const k=`${area}:${op}`;atualizar({permissoes:e.target.checked?[...usuario.permissoes,k]:usuario.permissoes.filter(x=>x!==k)})}}/></td>)}</tr>)}</tbody></table></div></>}</div></div>
 {aviso&&<p role="status" className="bloco-info">{aviso}</p>}
 </section>
 <section className="painel"><BlocoTitulo superior="POLÍTICA DE ACESSOS" titulo="Matriz de autorização prevista"/><div className="tabela-scroll"><table className="tabela"><thead><tr><th>Perfil</th><th>Visualizar</th><th>Importar</th><th>Editar</th><th>Exportar</th><th>Filiais</th></tr></thead><tbody><tr><td>Administrador (3 iniciais)</td><td>Sim</td><td>Sim</td><td>Com auditoria</td><td>Sim</td><td>Todas</td></tr><tr><td>Analista autorizado</td><td>Conforme concessão</td><td>Conforme concessão</td><td>Conforme concessão</td><td>Conforme concessão</td><td>Específicas</td></tr><tr><td>Consulta</td><td>Conforme concessão</td><td>Não, por padrão</td><td>Não, por padrão</td><td>Conforme concessão</td><td>Específicas</td></tr></tbody></table></div></section>
 </>}
 {aba==="seguranca"&&<><section className="painel"><BlocoTitulo superior="SEGURANÇA CORPORATIVA" titulo="Requisitos antes de habilitar dados reais" descricao="A demonstração é pública, portanto não deve possuir dados pessoais, chaves privadas ou endpoints de edição reais."/><ol className="passos"><li>Autenticação corporativa segura (Supabase Auth ou provedor aprovado).</li><li>Row Level Security por usuário, filial e operação.</li><li>Backend autenticado para importação e validação integral das planilhas.</li><li>Auditoria imutável de alterações e fechamento da competência.</li><li>Exportações protegidas pelas mesmas regras do banco de dados.</li></ol></section><section className="painel"><BlocoTitulo superior="AUDITORIA" titulo="Registro de alterações — estrutura prevista"/><div className="tabela-scroll"><table className="tabela"><thead><tr><th>Data e hora</th><th>Responsável</th><th>Tipo de alteração</th><th>Antes / Depois</th></tr></thead><tbody><tr><td colSpan={4} className="mod-vazio">Sem registros: não existe auditoria conectada nesta demonstração.</td></tr></tbody></table></div></section></>}
 </>;
}

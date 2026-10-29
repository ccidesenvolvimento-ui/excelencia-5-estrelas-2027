"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
const links=[
 ["/","Visão geral","⌂"],["/painel","Painel","▦"],["/ranking","Ranking","★"],["/pendencias","Pendências","!"],
 ["/importacoes","Importações","⇩"],["/rh0034","Cadastro RH0034","☰"],["/relatorios","Relatórios","▤"],
 ["/usuarios","Usuários e acessos","♙"],["/configuracoes","Configurações","⚙"],["/diagnostico","Testes e erros","⌁"]
];
export function Navegacao({children}:{children:React.ReactNode}){
 const [aberto,setAberto]=useState(false);
 const caminho=usePathname();
 const base=process.env.NEXT_PUBLIC_BASE_PATH??"";
 return <div className="app-shell">
  <aside className={`sidebar ${aberto?"sidebar-aberta":""}`}>
   <div className="branding"><img src={`${base}/marca-programa.png`} alt="Marca do Programa Excelência 5 Estrelas" /><span>Plataforma de avaliação · 2027</span></div>
   <div className="ambiente">● AMBIENTE DE DEMONSTRAÇÃO</div>
   <nav className="menu" aria-label="Navegação principal">
     {links.map(([url,titulo,icone])=><Link onClick={()=>setAberto(false)} key={url} href={url} className={caminho===url?"ativo":""}><span className="menu-icone">{icone}</span>{titulo}</Link>)}
   </nav>
   <div className="sidebar-rodape">Dados fictícios · Nenhuma informação enviada ao servidor<br/>v0.2 · Protótipo navegável</div>
  </aside>
  <div className="workspace"><header className="header"><button type="button" className="menu-toggle" onClick={()=>setAberto(!aberto)} aria-label="Abrir navegação">☰</button><div><strong>Excelência 5 Estrelas</strong><span>Programa de reconhecimento operacional</span></div><span className="chip-demo">DEMO · 2027</span></header><div className="area-conteudo">{children}</div></div>
  {aberto&&<button aria-label="Fechar menu" className="overlay" onClick={()=>setAberto(false)}/>}
 </div>;
}

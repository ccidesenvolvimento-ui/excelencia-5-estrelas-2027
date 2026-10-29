import Link from "next/link";
import type {ReactNode} from "react";

export function Cabecalho({tag,titulo,descricao,acao}:{tag:string;titulo:string;descricao:string;acao?:ReactNode}){
 return <header className="cabecalho cabecalho-premium"><div className="cabecalho-conteudo"><div className="eyebrow"><span className="ponto-identidade"/>{tag}</div><h1>{titulo}</h1><p>{descricao}</p></div>{acao&&<div className="cabecalho-acao">{acao}</div>}</header>;
}
export function AvisoDemo({texto}:{texto?:string}){
 return <div className="aviso-demo aviso-demo-premium"><strong>DEMONSTRAÇÃO</strong><span>{texto||"Todos os colaboradores e notas exibidos são fictícios. Nenhum dado corporativo é consultado ou alterado."}</span></div>;
}
export function CartaoNavegacao({url,titulo,descricao,icone}:{url:string;titulo:string;descricao:string;icone:string}){
 return <Link href={url} className="cartao-navegacao"><div className="icone-modulo">{icone}</div><div><h3>{titulo}</h3><p>{descricao}</p></div><span aria-hidden>↗</span></Link>;
}
export function Estado({tipo}:{tipo:"Elegível"|"Inelegível"|"Pendente"}){
 return <span className={`estado ${tipo.toLowerCase().replace("í","i").replace("ê","e")}`}>{tipo}</span>;
}
export function BlocoTitulo({superior,titulo,descricao,acao}:{superior?:string;titulo:string;descricao?:string;acao?:ReactNode}){
 return <div className="mod-bloco-titulo"><div>{superior&&<span className="mod-sobre-titulo">{superior}</span>}<h2>{titulo}</h2>{descricao&&<p>{descricao}</p>}</div>{acao}</div>;
}

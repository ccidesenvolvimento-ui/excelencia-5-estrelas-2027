import Link from "next/link";
export function Cabecalho({tag,titulo,descricao}:{tag:string;titulo:string;descricao:string}){return <header className="cabecalho"><div className="eyebrow">{tag}</div><h1>{titulo}</h1><p>{descricao}</p></header>}
export function AvisoDemo({texto}:{texto?:string}){return <div className="aviso-demo"><strong>Ambiente de demonstração</strong><span>{texto||"Todos os colaboradores e notas exibidos são fictícios. Nenhum dado corporativo é consultado ou alterado."}</span></div>}
export function CartaoNavegacao({url,titulo,descricao,icone}:{url:string;titulo:string;descricao:string;icone:string}){return <Link href={url} className="cartao-navegacao"><div className="icone-modulo">{icone}</div><div><h3>{titulo}</h3><p>{descricao}</p></div><span aria-hidden>↗</span></Link>}
export function Estado({tipo}:{tipo:"Elegível"|"Inelegível"|"Pendente"}){return <span className={`estado ${tipo.toLowerCase().replace("í","i").replace("ê","e")}`}>{tipo}</span>}

import Link from "next/link";
import { Topo } from "@/components/Topo";
import { modelos } from "@/lib/modelos";
export default function Importacoes() {
  return <><Topo/><main className="container">
    <div className="kicker">MÓDULO 01 · IMPORTAÇÕES</div>
    <h1>Modelos <span>oficiais</span> para download</h1>
    <p className="lead">Escolha a estrela, baixe a planilha padrão e preencha os campos. A função de envio e validação da importação será desenvolvida na próxima entrega.</p>
    <div className="lista-modelos">
      {modelos.map((m,i)=><article className="modelo" key={m.id}>
        <div className="numero">{String(i+1).padStart(2,"0")}</div>
        <div className="modelo-info"><h2>{m.titulo}</h2><p>{m.subtitulo}</p></div>
        <a href={`/modelos/${m.arquivo}`} download={m.arquivo} className="botao botao-secundario" aria-label={`Baixar modelo ${m.titulo}`}>↓ Baixar XLSX</a>
      </article>)}
    </div>
    <aside className="orientacao"><strong>Regras de uso</strong><p>Os modelos de avaliação não cadastram funcionários. Cadastros novos devem vir exclusivamente da RH0034. As planilhas de Segurança contêm apenas motoristas penalizados; a nota de 100 só poderá ser gerada após a validação dos dois relatórios.</p></aside>
    <Link href="/" className="voltar">← Voltar à visão geral</Link>
  </main></>;
}

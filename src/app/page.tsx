import Link from "next/link";
import { Topo } from "@/components/Topo";
const blocos = [
  {titulo: "Cadastro RH0034", descricao: "A única fonte autorizada para cadastrar novos motoristas. Classificação e férias serão implementadas neste módulo.", estado: "Próxima implementação"},
  {titulo: "Modelos de importação", descricao: "Seis planilhas oficiais para download: Segurança (2), Produtividade, Dirigibilidade, Jornada e Treinamentos.", estado: "Downloads disponíveis"},
  {titulo: "Central de Pendências", descricao: "Identificação das notas ausentes e tratamento de férias ao final do ciclo.", estado: "Planejado"},
  {titulo: "Rankings e relatórios", descricao: "Mensal, ciclos e anual, com filtros, elegibilidade e Top personalizado.", estado: "Planejado"},
];
export default function Home() {
  return <><Topo/><main className="container">
    <div className="kicker">INTELIGÊNCIA OPERACIONAL / DECAM · 2027</div>
    <h1>Sistema de <span>avaliação</span> e premiação</h1>
    <p className="lead">Base inicial do projeto aprovado. As regras de negócio estão documentadas e o primeiro módulo disponível é o download dos modelos de avaliação.</p>
    <section className="grade" aria-label="Módulos do sistema">
      {blocos.map(b=><article className="cartao" key={b.titulo}>
        <div className="rotulo">{b.estado}</div><h2>{b.titulo}</h2><p>{b.descricao}</p>
      </article>)}
    </section>
    <div className="faixa"><div><strong>Modelos prontos para preencher</strong><p>Baixe individualmente os arquivos Excel padronizados, sem precisar solicitar modelos aos administradores.</p></div><Link className="botao" href="/importacoes">Acessar importações →</Link></div>
    <p className="aviso">Esta versão é uma fundação técnica, sem autenticação nem importação de dados reais habilitadas. Não utilizar com dados corporativos em produção.</p>
  </main></>;
}

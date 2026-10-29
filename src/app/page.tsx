import {AvisoDemo,Cabecalho,CartaoNavegacao} from "@/components/Elementos";
export default function Home(){return <><Cabecalho tag="EXPRESSO NEPOMUCENO · 2027" titulo="Uma visão completa da excelência operacional" descricao="Ambiente público de testes para navegar, revisar regras e encontrar falhas antes da integração com os dados reais."/><AvisoDemo/><div className="cards-metricas"><div className="metrica"><small>Categorias competitivas</small><strong>08</strong><span>Inclui operadores de máquinas e tratores</span></div><div className="metrica"><small>Pilares de avaliação</small><strong>05</strong><span>Segurança + quatro critérios</span></div><div className="metrica"><small>Modelos oficiais Excel</small><strong>06</strong><span>Disponíveis para download</span></div><div className="metrica"><small>Base de testes</small><strong>2027</strong><span>Dados totalmente fictícios</span></div></div><h2 className="titulo-secao">Módulos do sistema</h2><div className="grade-modulos">
<CartaoNavegacao url="/painel" titulo="Painel de desempenho" descricao="Visão resumida dos indicadores e elegibilidade." icone="▦"/>
<CartaoNavegacao url="/ranking" titulo="Ranking de excelência" descricao="Notas ponderadas, ciclos e posições por categoria." icone="★"/>
<CartaoNavegacao url="/pendencias" titulo="Central de pendências" descricao="Identificar avaliações incompletas e exportar relação." icone="!"/>
<CartaoNavegacao url="/importacoes" titulo="Importação de planilhas" descricao="Baixar os seis arquivos padronizados e verificar a interface." icone="⇩"/>
<CartaoNavegacao url="/rh0034" titulo="Cadastro RH0034" descricao="Prévia do cadastro único e classificação por categoria." icone="☰"/>
<CartaoNavegacao url="/relatorios" titulo="Relatórios" descricao="Selecionar segmento, Top N e imprimir relatório de testes." icone="▤"/>
<CartaoNavegacao url="/usuarios" titulo="Permissões e acessos" descricao="Arquitetura prevista para usuários e filiais." icone="♙"/>
<CartaoNavegacao url="/diagnostico" titulo="Testes e registro de erros" descricao="Checagens automáticas e formulário de observações." icone="⌁"/>
</div></>}

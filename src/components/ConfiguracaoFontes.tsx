"use client";
import { useEffect, useState } from "react";
import { pessoas } from "@/lib/dados-demo";
import {
  FONTES_DEMO_INICIAIS, OPCOES_FONTE, carregarFontesDemo, gravarFontesDemo,
  type FonteDirigibilidade,
} from "@/lib/fontes-dirigibilidade";

const filiais = [...new Set(pessoas.filter(p => p.tipo === "Motorista").map(p => p.filial))]
  .sort((a, b) => a.localeCompare(b, "pt-BR"));

export function ConfiguracaoFontes() {
  const [fontes, setFontes] = useState<Record<string, FonteDirigibilidade>>({ ...FONTES_DEMO_INICIAIS });
  const [aviso, setAviso] = useState("");
  useEffect(() => { setFontes(carregarFontesDemo()); }, []);
  function trocar(filial: string, fonte: string) {
    const nova = { ...fontes };
    if (OPCOES_FONTE.includes(fonte as FonteDirigibilidade)) nova[filial] = fonte as FonteDirigibilidade;
    else delete nova[filial];
    setFontes(nova);
    gravarFontesDemo(nova);
    setAviso(`Parâmetro de ${filial} atualizado somente nesta demonstração.`);
  }
  function redefinir() {
    const padrao = { ...FONTES_DEMO_INICIAIS };
    setFontes(padrao);
    gravarFontesDemo(padrao);
    setAviso("Parâmetros fictícios iniciais restaurados neste navegador.");
  }
  return <section className="painel" id="fontes-dirigibilidade">
    <div className="mod-bloco-titulo"><div>
      <div className="rotulo-chave">CONFIGURAÇÃO POR FILIAL / DEMONSTRAÇÃO</div>
      <h2>Fonte da Dirigibilidade</h2>
      <p>Defina qual sistema alimenta a nota de Dirigibilidade de cada filial. A Central exibirá somente “Sem Dirigibilidade”, independentemente da fonte selecionada.</p>
    </div><button className="botao botao-claro" type="button" onClick={redefinir}>Restaurar exemplo</button></div>
    <div className="tabela-scroll"><table className="tabela"><thead><tr><th>Filial</th><th>Sistema de avaliação</th><th>Situação</th></tr></thead><tbody>
      {filiais.map(filial => <tr key={filial}><td><strong>{filial}</strong></td><td>
        <div className="campo"><label style={{position:"absolute",width:1,height:1,overflow:"hidden",clipPath:"inset(50%)",whiteSpace:"nowrap"}} htmlFor={`fonte-${filial}`}>Fonte de {filial}</label>
        <select id={`fonte-${filial}`} value={fontes[filial] ?? ""} onChange={e => trocar(filial, e.target.value)}>
          <option value="">Não definida</option>{OPCOES_FONTE.map(f => <option key={f}>{f}</option>)}
        </select></div></td><td><span className={`mod-status ${fontes[filial] ? "" : "texto-alerta"}`}>
          {fontes[filial] ? "Definida na demonstração" : "A configurar"}
        </span></td></tr>)}
    </tbody></table></div>
    {aviso && <p className="bloco-info" role="status">{aviso}</p>}
    <p className="nota-rodape">Os valores iniciais são exemplos fictícios, não definições operacionais da empresa. As alterações ficam no navegador. No sistema definitivo, somente usuários autorizados poderão alterar essa configuração, com registro de histórico e data de vigência.</p>
  </section>;
}

"use client";

import { useEffect, useState } from "react";
import { BlocoTitulo } from "@/components/Elementos";

type Perfil = {
  usuario_id: string;
  nome: string;
  administrador: boolean;
  ativo: boolean;
};

type Filial = {
  id: string;
  nome: string;
  ativa: boolean;
};

type Vinculo = {
  usuario_id: string;
  filial_id: string;
};

type Permissao = {
  usuario_id: string;
  permissao: string;
};

type DadosAdministrativos = {
  usuarios: Perfil[];
  filiais: Filial[];
  vinculos: Vinculo[];
  permissoes: Permissao[];
};

const AREAS = [
  "Visão geral",
  "Ranking e relatórios",
  "Pendências",
  "Importações",
  "RH0034",
  "Configurações",
];

const OPERACOES = [
  "Visualizar",
  "Importar",
  "Editar",
  "Exportar",
];

export function UsuariosCorporativos() {
  const [dados, setDados] = useState<DadosAdministrativos | null>(null);
  const [selecionado, setSelecionado] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const controlador = new AbortController();

    async function carregar() {
      try {
        const resposta = await fetch("/api/admin/usuarios", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controlador.signal,
        });

        if (resposta.status === 401 || resposta.status === 403) {
          setErro("Você não possui autorização para consultar usuários e acessos.");
          return;
        }

        if (!resposta.ok) {
          setErro("Não foi possível consultar os dados administrativos.");
          return;
        }

        const resultado: unknown = await resposta.json();

        if (
          !resultado ||
          typeof resultado !== "object" ||
          !("usuarios" in resultado) ||
          !("filiais" in resultado) ||
          !("vinculos" in resultado) ||
          !("permissoes" in resultado)
        ) {
          throw new Error("Resposta administrativa inválida.");
        }

        const recebido = resultado as DadosAdministrativos;

        if (
          !Array.isArray(recebido.usuarios) ||
          !Array.isArray(recebido.filiais) ||
          !Array.isArray(recebido.vinculos) ||
          !Array.isArray(recebido.permissoes)
        ) {
          throw new Error("Formato administrativo inválido.");
        }

        if (controlador.signal.aborted) return;

        setDados(recebido);
        setSelecionado(recebido.usuarios[0]?.usuario_id ?? "");
      } catch (erroCapturado) {
        if (
          erroCapturado instanceof Error &&
          erroCapturado.name === "AbortError"
        ) return;

        if (!controlador.signal.aborted) {
          setErro("Falha na comunicação com a API administrativa.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => controlador.abort();
  }, []);

  if (carregando) {
    return <section className="painel" role="status">
      Consultando usuários e permissões...
    </section>;
  }

  if (erro || !dados) {
    return <section className="painel">
      <BlocoTitulo
        superior="CONTROLE DE ACESSOS"
        titulo="Consulta administrativa indisponível"
      />
      <p role="alert" className="bloco-info">
        {erro || "Os dados administrativos não estão disponíveis."}
      </p>
    </section>;
  }

  const usuario = dados.usuarios.find(
    u => u.usuario_id === selecionado
  );

  const filiaisUsuario = new Set(
    dados.vinculos
      .filter(v => v.usuario_id === selecionado)
      .map(v => v.filial_id)
  );

  const permissoesUsuario = new Set(
    dados.permissoes
      .filter(p => p.usuario_id === selecionado)
      .map(p => p.permissao)
  );

  return <>
    <div className="mod-grid-estatisticas">
      <div className="mod-estatistica">
        <small>Administradores cadastrados</small>
        <strong>{dados.usuarios.filter(u => u.administrador).length}</strong>
        <span>Perfis corporativos</span>
      </div>
      <div className="mod-estatistica">
        <small>Usuários cadastrados</small>
        <strong>{dados.usuarios.length}</strong>
        <span>Dados do Supabase</span>
      </div>
      <div className="mod-estatistica">
        <small>Filiais cadastradas</small>
        <strong>{dados.filiais.length}</strong>
        <span>Unidades disponíveis</span>
      </div>
      <div className="mod-estatistica">
        <small>Modo de acesso</small>
        <strong>Leitura</strong>
        <span>Alterações desabilitadas</span>
      </div>
    </div>

    <section className="painel">
      <BlocoTitulo
        superior="CONTROLE DE ACESSOS / SUPABASE"
        titulo="Usuários e permissões"
        descricao="Consulta corporativa somente leitura. As alterações ainda não estão habilitadas."
      />

      {dados.usuarios.length === 0 ? (
        <p className="bloco-info">
          Nenhum perfil corporativo foi encontrado.
        </p>
      ) : (
        <div className="mod-accessos">
          <div>
            <div className="campo">
              <label htmlFor="usuario-corporativo">
                Perfil para visualizar
              </label>
              <select
                id="usuario-corporativo"
                value={selecionado}
                onChange={e => setSelecionado(e.target.value)}
              >
                {dados.usuarios.map(u => (
                  <option key={u.usuario_id} value={u.usuario_id}>
                    {u.nome} — {u.administrador ? "Administrador" : "Usuário"}
                  </option>
                ))}
              </select>
            </div>

            <div className="mod-sem-backend" style={{ marginTop: 15 }}>
              Dados consultados no Supabase. Cadastro, edição e
              revogação de acessos serão habilitados somente após
              a homologação das permissões de escrita e auditoria.
            </div>
          </div>

          <div>
            {usuario && <>
              <div className="mod-bloco-titulo">
                <div>
                  <h2>{usuario.nome}</h2>
                  <p>
                    {usuario.administrador ? "Administrador" : "Usuário"}
                    {" · "}
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </p>
                </div>
                <label>
                  <input
                    type="checkbox"
                    checked={usuario.ativo}
                    disabled
                    readOnly
                  /> Ativo
                </label>
              </div>

              <div className="rotulo-chave" style={{ marginBottom: 12 }}>
                FILIAIS VINCULADAS
              </div>

              <div className="mod-grupo-checks">
                {dados.filiais.map(f => (
                  <label className="mod-check" key={f.id}>
                    <input
                      type="checkbox"
                      checked={filiaisUsuario.has(f.id)}
                      disabled
                      readOnly
                    />
                    <span>{f.nome}</span>
                  </label>
                ))}
              </div>

              <div className="rotulo-chave" style={{ margin: "22px 0 12px" }}>
                PERMISSÕES POR ABA E OPERAÇÃO
              </div>

              <div className="tabela-scroll">
                <table className="tabela mod-permissoes">
                  <thead>
                    <tr>
                      <th>Área</th>
                      {OPERACOES.map(op => <th key={op}>{op}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {AREAS.map(area => (
                      <tr key={area}>
                        <td>{area}</td>
                        {OPERACOES.map(op => (
                          <td key={op}>
                            <input
                              type="checkbox"
                              aria-label={`${area}: ${op}`}
                              checked={permissoesUsuario.has(`${area}:${op}`)}
                              disabled
                              readOnly
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>}
          </div>
        </div>
      )}
    </section>
  </>;
}

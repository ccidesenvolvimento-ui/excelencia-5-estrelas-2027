const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");

const fonte = fs.readFileSync(
  "src/lib/supabase/autorizacao-servidor.ts",
  "utf8"
);

const compilado = ts.transpileModule(fonte, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

let cenario = {};

function clienteSimulado() {
  return {
    auth: {
      getUser: async () => ({
        data: { user: cenario.identidade ?? null },
        error: null,
      }),
    },

    from(tabela) {
      assert.ok(
        ["perfis", "filiais_usuario", "permissoes_usuario"].includes(tabela),
        `Tabela inesperada: ${tabela}`
      );

      const consulta = {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return {
            data: cenario.perfil ?? null,
            error: null,
          };
        },
        then(resolve, reject) {
          return Promise.resolve({
            data: cenario[tabela] ?? [],
            error: null,
          }).then(resolve, reject);
        },
      };

      return consulta;
    },
  };
}

const modulo = { exports: {} };

vm.runInNewContext(compilado, {
  module: modulo,
  exports: modulo.exports,
  require(nome) {
    if (nome === "server-only") return {};

    if (nome === "./sessao-servidor") {
      return {
        criarClienteAutenticadoServidor: async () => clienteSimulado(),
      };
    }

    throw new Error(`Importação inesperada: ${nome}`);
  },
});

const {
  obterContextoCorporativo,
  possuiPermissaoCorporativa,
} = modulo.exports;

const permissao = "Ranking e relatórios:Visualizar";

async function executar() {
  // 1. Sem identidade autenticada.
  cenario = { identidade: null };
  assert.equal(await obterContextoCorporativo(), null);

  // 2. Sem perfil corporativo.
  cenario = {
    identidade: { id: "usuario-1" },
    perfil: null,
  };
  assert.equal(await obterContextoCorporativo(), null);

  // 3. Perfil ativo, mas sem filial.
  cenario = {
    identidade: { id: "usuario-1" },
    perfil: {
      usuario_id: "usuario-1",
      nome: "Usuário de teste",
      administrador: false,
      ativo: true,
    },
    filiais_usuario: [],
    permissoes_usuario: [],
  };
  assert.equal(await obterContextoCorporativo(), null);

  // 4. Filial presente, mas sem permissão.
  cenario.filiais_usuario = [{ filial_id: "filial-A" }];
  let contexto = await obterContextoCorporativo();

  assert.ok(contexto);
  assert.equal(
    possuiPermissaoCorporativa(contexto, permissao, "filial-A"),
    false
  );

  // 5. Permissão e filial corretas.
  cenario.permissoes_usuario = [{ permissao }];
  contexto = await obterContextoCorporativo();

  assert.equal(
    possuiPermissaoCorporativa(contexto, permissao, "filial-A"),
    true
  );

  // 6. Permissão existente, mas filial diferente.
  assert.equal(
    possuiPermissaoCorporativa(contexto, permissao, "filial-B"),
    false
  );

  // 7. Administrador sem permissão explícita.
  cenario.perfil.administrador = true;
  cenario.permissoes_usuario = [];

  contexto = await obterContextoCorporativo();

  assert.equal(
    possuiPermissaoCorporativa(contexto, permissao, "filial-A"),
    false
  );

  // 8. Perfil inativo.
  cenario.perfil.ativo = false;
  assert.equal(await obterContextoCorporativo(), null);

  console.log("Autorização corporativa: 8 cenários aprovados.");
}

executar().catch(erro => {
  console.error(erro);
  process.exitCode = 1;
});

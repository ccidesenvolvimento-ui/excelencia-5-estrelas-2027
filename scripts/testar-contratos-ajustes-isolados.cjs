// Issue #65 — regressão de contratos para a homologação isolada.
// Teste somente de leitura: não acessa rede, Supabase, Postgres ou arquivos de configuração.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const path = require("node:path");

const raiz = path.resolve(__dirname, "..");
const ler = caminho => fs.readFileSync(path.join(raiz,caminho),"utf8");
const sql = ler("supabase/migrations/20261111000200_ajustes_administrativos_notas.sql");
const demo = ler("src/app/ajustes-notas/page.tsx");
const modal = ler("src/components/ModalAjusteNotaDemo.tsx");
const casos = [
  ["Ajustes exigem RLS habilitada", /ALTER TABLE public\.ajustes_notas ENABLE ROW LEVEL SECURITY/i.test(sql)],
  ["Escritas diretas em ajustes são revogadas", /REVOKE ALL ON public\.ajustes_notas FROM PUBLIC, anon, authenticated/i.test(sql)],
  ["Notas efetivas respeitam invocador (RLS)", /CREATE VIEW public\.notas_mensais_efetivas WITH \(security_invoker = true\)/i.test(sql)],
  ["RPC exige administração ativa", /NOT public\.eh_administrador_ativo\(\)/i.test(sql)],
  ["RPC valida vínculo do colaborador", /NOT public\.pode_ler_colaborador\(v_nota\.colaborador_id\)/i.test(sql)],
  ["Segurança não admite edição manual", /v_nota\.estrela = 'seguranca'/i.test(sql)],
  ["Concorrência usa versão esperada", /v_anterior <> p_nota_esperada/i.test(sql)],
  ["Ajustes geram auditoria", /'ajuste_administrativo_nota'/i.test(sql)],
  ["Ajustes protegidos contra mutação", /CREATE TRIGGER ajustes_notas_append_only/i.test(sql)],
  ["Reimportação de nota ajustada bloqueada", /CREATE TRIGGER impedir_update_delete_nota_ajustada/i.test(sql)],
  ["Demonstração usa dados fictícios", /import .*dados-demo/.test(demo)],
  ["Demonstração não chama endpoint de escrita", !/fetch\s*\(|axios\.|\/api\/ajustes-notas/.test(demo+modal)],
  ["Modal avisa que não salva dados", /Nenhum dado será enviado ao Supabase/.test(modal)],
];
for(const [nome,ok] of casos) {
  assert.ok(ok,nome);
  console.log("✓ "+nome);
}
console.log(`✓ ${casos.length}/${casos.length} contratos locais confirmados (não substituem testes E2E)`);

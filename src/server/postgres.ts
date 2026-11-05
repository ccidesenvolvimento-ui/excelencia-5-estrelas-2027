/**
 * Cliente PostgreSQL exclusivo do lado do servidor para a homologação.
 * Não importar em componentes "use client" e nunca expor credenciais via NEXT_PUBLIC_*.
 * Nenhuma tela chama este módulo nesta etapa.
 */
import "server-only";
import { Pool } from "pg";

const config = () => {
  const host = process.env.EXCELENCIA_DB_HOST;
  const name = process.env.EXCELENCIA_DB_NAME;
  const user = process.env.EXCELENCIA_DB_USER;
  const password = process.env.EXCELENCIA_DB_PASSWORD;

  if (!host || !name || !user || !password) {
    throw new Error("PostgreSQL da homologação não configurado no servidor");
  }
  if (user !== "excelencia5_runtime") {
    throw new Error("Somente o papel de execução de privilégio mínimo é aceito");
  }

  return {
    host,
    database: name,
    user,
    password,
    port: Number(process.env.EXCELENCIA_DB_PORT || "5432"),
    max: 2,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 10000,
    application_name: "excelencia5-homologacao",
  };
};

let pool: Pool | undefined;
export function bancoHomologacao(): Pool {
  if (!pool) pool = new Pool(config());
  return pool;
}

export async function verificarCategoriasHomologacao(): Promise<number> {
  const resultado = await bancoHomologacao().query<{ total: string }>(
    "SELECT count(*)::text AS total FROM public.categorias"
  );
  return Number(resultado.rows[0]?.total ?? 0);
}

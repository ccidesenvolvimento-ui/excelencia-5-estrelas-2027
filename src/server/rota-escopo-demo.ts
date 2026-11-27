import { NextResponse } from "next/server";

import {
  obterContextoCorporativo,
  possuiPermissaoCorporativa,
} from "@/lib/supabase/autorizacao-servidor";

import {
  criarClienteAutenticadoServidor,
} from "@/lib/supabase/sessao-servidor";

import { pessoas } from "@/lib/dados-demo";

export const dynamic = "force-dynamic";

const MAPA_FILIAIS: Record<string, string> = {
  "Filial A - Teste RLS": "Lavras",
  "Filial B - Teste RLS": "Jataí",
};

function responder(dados: Record<string, unknown>, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  // Disponível apenas no laboratório autorizado.
  if (
    process.env.EXCELENCIA_AUTH_GUARD_ENABLED !== "true" ||
    process.env.EXCELENCIA_AUTH_DIAGNOSTICO_ENABLED !== "true"
  ) {
    return responder({ erro: "Escopo demonstrativo indisponível." }, 404);
  }

  const contexto = await obterContextoCorporativo();

  if (!contexto) {
    return responder({ erro: "Acesso não autorizado." }, 403);
  }

  const permissoes = [
    "Visão geral:Visualizar",
    "Ranking e relatórios:Visualizar",
    "Pendências:Visualizar",
  ] as const;

  if (!permissoes.some(p => possuiPermissaoCorporativa(contexto, p))) {
    return responder({ erro: "Permissão insuficiente." }, 403);
  }

  try {
    const supabase = await criarClienteAutenticadoServidor();

    const { data, error } = await supabase
      .from("filiais")
      .select("id,nome,ativa")
      .in("id", contexto.filiais);

    if (error || !data?.length) {
      return responder({ erro: "Filiais indisponíveis." }, 503);
    }

    // Não aceitar filiais desconhecidas no mapeamento do laboratório.
    if (
      data.length !== contexto.filiais.length ||
      data.some(f => !f.ativa || !Object.hasOwn(MAPA_FILIAIS, f.nome))
    ) {
      return responder({ erro: "Escopo de teste não configurado." }, 403);
    }

    const filiais = [...new Set(
      data.map(f => MAPA_FILIAIS[f.nome])
    )];

    const categorias = [...new Set(
      pessoas
        .filter(p => filiais.includes(p.filial) && p.categoria !== null)
        .map(p => p.categoria)
    )];

    return responder({
      filiais,
      categorias,
      demonstrativo: true,
    }, 200);
  } catch {
    return responder({ erro: "Falha ao validar escopo." }, 503);
  }
}

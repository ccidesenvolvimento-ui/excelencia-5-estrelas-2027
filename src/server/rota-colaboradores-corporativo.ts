import { NextResponse } from "next/server";

import {
  obterContextoCorporativo,
  possuiPermissaoCorporativa,
} from "@/lib/supabase/autorizacao-servidor";

import {
  criarClienteAutenticadoServidor,
  verificarUsuarioSupabase,
} from "@/lib/supabase/sessao-servidor";

export const dynamic = "force-dynamic";

function responder(dados: Record<string, unknown>, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  if (process.env.EXCELENCIA_AUTH_GUARD_ENABLED !== "true") {
    return responder({ erro: "Consulta corporativa desabilitada." }, 403);
  }

  try {
    const usuario = await verificarUsuarioSupabase();

    if (!usuario) {
      return responder({ erro: "Autenticação necessária." }, 401);
    }

    const contexto = await obterContextoCorporativo();

    if (!possuiPermissaoCorporativa(
      contexto,
      "Visão geral:Visualizar"
    )) {
      return responder({ erro: "Acesso não autorizado." }, 403);
    }

    if (!contexto || contexto.usuarioId !== usuario.id) {
      return responder({ erro: "Contexto inválido." }, 403);
    }

    const supabase = await criarClienteAutenticadoServidor();

    const { data, error } = await supabase
      .from("colaboradores")
      .select(
        "id,nome,matricula,filial_id,funcao,situacao_rh,categoria_id"
      )
      .in("filial_id", contexto.filiais)
      .order("nome");

    if (error) {
      return responder(
        { erro: "Falha na consulta corporativa." },
        503
      );
    }

    const filiaisPermitidas = new Set(contexto.filiais);

    const colaboradores = (data ?? []).filter(
      colaborador =>
        colaborador.filial_id !== null &&
        filiaisPermitidas.has(colaborador.filial_id)
    );

    if (colaboradores.length !== (data ?? []).length) {
      return responder(
        { erro: "Inconsistência no escopo de acesso." },
        503
      );
    }

    return responder({ colaboradores }, 200);
  } catch {
    return responder(
      { erro: "Não foi possível validar a consulta." },
      503
    );
  }
}

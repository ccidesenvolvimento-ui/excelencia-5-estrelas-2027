import { NextResponse } from "next/server";

import {
  obterContextoCorporativo,
  possuiPermissaoCorporativa,
} from "@/lib/supabase/autorizacao-servidor";

import {
  criarClienteAutenticadoServidor,
} from "@/lib/supabase/sessao-servidor";

export const dynamic = "force-dynamic";

function responder(
  dados: Record<string, unknown>,
  status: number
) {
  return NextResponse.json(dados, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  // Endpoint disponível somente no ambiente corporativo protegido.
  if (process.env.EXCELENCIA_AUTH_GUARD_ENABLED !== "true") {
    return responder(
      { erro: "Endpoint administrativo desabilitado." },
      403
    );
  }

  const contexto = await obterContextoCorporativo();

  if (
    !contexto ||
    !contexto.administrador ||
    !possuiPermissaoCorporativa(
      contexto,
      "Configurações:Visualizar"
    )
  ) {
    return responder(
      { erro: "Consulta administrativa não autorizada." },
      403
    );
  }

  try {
    const supabase = await criarClienteAutenticadoServidor();

    const [
      resultadoPerfis,
      resultadoFiliais,
      resultadoVinculos,
      resultadoPermissoes,
    ] = await Promise.all([
      supabase
        .from("perfis")
        .select("usuario_id,nome,administrador,ativo")
        .order("nome"),

      supabase
        .from("filiais")
        .select("id,nome,ativa")
        .order("nome"),

      supabase
        .from("filiais_usuario")
        .select("usuario_id,filial_id"),

      supabase
        .from("permissoes_usuario")
        .select("usuario_id,permissao"),
    ]);

    if (
      resultadoPerfis.error ||
      resultadoFiliais.error ||
      resultadoVinculos.error ||
      resultadoPermissoes.error
    ) {
      return responder(
        { erro: "Não foi possível consultar os dados administrativos." },
        503
      );
    }

    return responder(
      {
        usuarios: resultadoPerfis.data ?? [],
        filiais: resultadoFiliais.data ?? [],
        vinculos: resultadoVinculos.data ?? [],
        permissoes: resultadoPermissoes.data ?? [],
      },
      200
    );
  } catch {
    return responder(
      { erro: "Falha na consulta administrativa." },
      503
    );
  }
}

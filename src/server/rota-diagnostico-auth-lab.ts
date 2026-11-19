import { NextResponse } from "next/server";

import {
  obterContextoCorporativo,
  possuiPermissaoCorporativa,
} from "@/lib/supabase/autorizacao-servidor";

export const dynamic = "force-dynamic";

function resposta(status: number, autorizado: boolean) {
  return NextResponse.json(
    { autorizado },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET() {
  if (
    process.env.EXCELENCIA_AUTH_DIAGNOSTICO_ENABLED !== "true" ||
    process.env.EXCELENCIA_AUTH_GUARD_ENABLED !== "true"
  ) {
    return resposta(404, false);
  }

  const contexto = await obterContextoCorporativo();

  if (!contexto) {
    return resposta(403, false);
  }

  const autorizado = possuiPermissaoCorporativa(
    contexto,
    "Visão geral:Visualizar"
  );

  return resposta(autorizado ? 200 : 403, autorizado);
}

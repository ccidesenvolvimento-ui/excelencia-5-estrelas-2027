"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clienteSupabaseBrowser, loginSupabaseHabilitado } from "@/lib/supabase/cliente-browser";
import styles from "@/app/entrada.module.css";

const tiposPermitidos = new Set(["invite", "recovery", "email", "signup", "magiclink"]);

export function ConfirmarLinkSupabase() {
  const [mensagem, setMensagem] = useState("Verificando seu link de acesso...");
  useEffect(() => {
    let ativo = true;
    async function confirmar() {
      const cliente = clienteSupabaseBrowser();
      if (!loginSupabaseHabilitado || !cliente) {
        if (ativo) setMensagem("Autenticação indisponível neste ambiente.");
        return;
      }
      const url = new URL(window.location.href);
      const tokenHash = url.searchParams.get("token_hash");
      const tipo = url.searchParams.get("type") || url.searchParams.get("flow");
      const tipoFragmento = new URLSearchParams(url.hash.replace(/^#/, "")).get("type");
      // Não conservar tokens no histórico ou em links subsequentes.
      window.history.replaceState(null, "", url.pathname);
      try {
        if (tokenHash) {
          if (!tipo || !tiposPermitidos.has(tipo)) throw new Error("Tipo de link inválido");
          const { error } = await cliente.auth.verifyOtp({
            token_hash: tokenHash,
            type: tipo as "invite" | "recovery" | "email" | "signup" | "magiclink",
          });
          if (error) throw error;
        }
        const { data, error } = await cliente.auth.getUser();
        if (error || !data.user) throw new Error("Sessão ausente");
        const fluxo = tipo || tipoFragmento;
        window.location.replace(fluxo === "invite" || fluxo === "recovery"
          ? "/definir-senha" : "/login");
      } catch {
        if (ativo) setMensagem("Link inválido ou expirado. Solicite um novo convite ou uma nova recuperação de senha.");
      }
    }
    void confirmar();
    return () => { ativo = false; };
  }, []);

  return <section className={styles.loginPanel}>
    <h1>Confirmação de acesso</h1>
    <p className={styles.loginNotice} role="status">{mensagem}</p>
    <Link href="/login">Voltar ao login</Link>
  </section>;
}

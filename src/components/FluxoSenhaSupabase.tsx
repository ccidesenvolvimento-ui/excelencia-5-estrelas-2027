"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { clienteSupabaseBrowser, loginSupabaseHabilitado } from "@/lib/supabase/cliente-browser";
import styles from "@/app/entrada.module.css";

type Modo = "recuperar" | "definir";

export function FluxoSenhaSupabase({ modo }: { modo: Modo }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sessaoValida, setSessaoValida] = useState(false);

  useEffect(() => {
    if (modo !== "definir" || !loginSupabaseHabilitado) return;
    const cliente = clienteSupabaseBrowser();
    if (!cliente) return;
    let ativo = true;
    void cliente.auth.getUser().then(({ data, error }) => {
      if (ativo) setSessaoValida(!error && Boolean(data.user));
    });
    const { data } = cliente.auth.onAuthStateChange((_evento, sessao) => {
      if (ativo) setSessaoValida(Boolean(sessao));
    });
    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, [modo]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado || !loginSupabaseHabilitado) return;
    const cliente = clienteSupabaseBrowser();
    if (!cliente) return;
    setOcupado(true);
    setMensagem("");
    try {
      if (modo === "recuperar") {
        const destino = new URL("/auth/confirm", window.location.origin);
        destino.searchParams.set("flow", "recovery");
        // Mensagem neutra para não revelar se o e-mail existe.
        await cliente.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: destino.toString(),
        });
        setMensagem("Se o e-mail estiver cadastrado e o envio disponível, você receberá instruções.");
        setEmail("");
      } else {
        if (!sessaoValida) {
          setMensagem("Abra o link válido do convite ou da recuperação de senha antes de continuar.");
          return;
        }
        if (senha.length < 12 || !/[a-z]/.test(senha) || !/[A-Z]/.test(senha) ||
            !/[0-9]/.test(senha) || !/[^a-zA-Z0-9]/.test(senha)) {
          setMensagem("Use ao menos 12 caracteres, com maiúscula, minúscula, número e símbolo.");
          return;
        }
        if (senha !== confirmacao) {
          setMensagem("As senhas não coincidem.");
          return;
        }
        const { error } = await cliente.auth.updateUser({ password: senha });
        if (error) {
          setMensagem("Não foi possível definir a senha. Solicite um novo link ou contate o administrador.");
          return;
        }
        setMensagem("Senha atualizada. Você já pode acessar a área de login.");
        setSenha("");
        setConfirmacao("");
      }
    } catch {
      setMensagem("Não foi possível concluir a solicitação. Tente novamente mais tarde.");
    } finally {
      setOcupado(false);
    }
  }

  return <section className={styles.loginPanel}>
    <div className={styles.panelTop}><span className={styles.eyebrow}>ACESSO CORPORATIVO</span></div>
    <h1>{modo === "recuperar" ? "Recuperar senha" : "Definir senha"}</h1>
    {!loginSupabaseHabilitado ? (
      <p className={styles.loginNotice}>A autenticação ainda não está habilitada neste ambiente.</p>
    ) : modo === "definir" && !sessaoValida ? (
      <p className={styles.loginNotice}>Aguardando convite ou link de recuperação válido. Caso o link tenha expirado, solicite outro.</p>
    ) : (
      <form className={styles.fields} onSubmit={enviar}>
        {modo === "recuperar" ? <>
          <label htmlFor="email-recuperacao">E-mail cadastrado</label>
          <input id="email-recuperacao" type="email" required autoComplete="email" maxLength={254}
            value={email} onChange={e => setEmail(e.target.value)} disabled={ocupado} />
        </> : <>
          <label htmlFor="nova-senha">Nova senha</label>
          <input id="nova-senha" type="password" autoComplete="new-password" required
            value={senha} onChange={e => setSenha(e.target.value)} disabled={ocupado} />
          <label htmlFor="confirmar-senha">Confirmar senha</label>
          <input id="confirmar-senha" type="password" autoComplete="new-password" required
            value={confirmacao} onChange={e => setConfirmacao(e.target.value)} disabled={ocupado} />
        </>}
        <button className={styles.loginButton} disabled={ocupado} type="submit">
          {ocupado ? "Aguarde..." : modo === "recuperar" ? "Enviar instruções" : "Salvar nova senha"}
        </button>
      </form>
    )}
    <p className={styles.loginNotice} role="status" aria-live="polite">{mensagem}</p>
    <p className={styles.loginNotice}><Link href="/login">Voltar ao login</Link></p>
  </section>;
}

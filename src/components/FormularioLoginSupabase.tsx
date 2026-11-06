"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { SetaEntrada } from "@/components/EntradaInstitucional";
import styles from "@/app/entrada.module.css";

const habilitado =
  process.env.NEXT_PUBLIC_SUPABASE_LOGIN_ENABLED === "true" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_"));

function clienteNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!habilitado || !url || !chave) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
  } catch {
    return null;
  }
  return createBrowserClient(url, chave);
}

/**
 * Somente prova de autenticação com Supabase Auth.
 * Um usuário logado NÃO recebe autorização para dados corporativos.
 * O painel segue demonstrativo até termos guards SSR + RLS por filial.
 */
export function FormularioLoginSupabase() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [usuario, setUsuario] = useState<string | null>(null);

  useEffect(() => {
    if (!habilitado) return;
    const cliente = clienteNavegador();
    if (!cliente) return;
    let ativo = true;
    void cliente.auth.getUser().then(({ data, error }) => {
      if (ativo && !error) setUsuario(data.user?.email ?? null);
    });
    const { data: listener } = cliente.auth.onAuthStateChange((_evento, sessao) => {
      if (ativo && !sessao) setUsuario(null);
      // Tokens em cookies não concedem autorização: identidade validada no servidor futuramente.
    });
    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!habilitado || ocupado) return;
    const cliente = clienteNavegador();
    if (!cliente) {
      setMensagem("Autenticação indisponível. Procure a equipe de desenvolvimento.");
      return;
    }
    setOcupado(true);
    setMensagem("");
    try {
      const { error } = await cliente.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      setSenha("");
      if (error) {
        setMensagem("Não foi possível entrar. Confira as credenciais ou procure a equipe.");
        return;
      }
      const confirmado = await cliente.auth.getUser();
      if (confirmado.error || !confirmado.data.user) {
        await cliente.auth.signOut();
        setMensagem("Não foi possível validar sua sessão. Tente novamente.");
        return;
      }
      setUsuario(confirmado.data.user.email ?? "Usuário autenticado");
      setMensagem("Identidade verificada no Supabase. As áreas corporativas ainda estão em desenvolvimento.");
    } catch {
      setMensagem("Falha temporária ao conectar ao serviço de autenticação.");
    } finally {
      setOcupado(false);
    }
  }

  async function sair() {
    const cliente = clienteNavegador();
    if (!cliente || ocupado) return;
    setOcupado(true);
    try {
      const { error } = await cliente.auth.signOut();
      if (error) {
        setMensagem("Não foi possível encerrar sua sessão. Tente novamente.");
        return;
      }
      setUsuario(null);
      setEmail("");
      setSenha("");
      setMensagem("Sessão encerrada.");
    } finally {
      setOcupado(false);
    }
  }

  if (!habilitado) {
    return <>
      <div className={styles.availability} id="estado-acesso"><span className={styles.statusDot}/><span>Integração corporativa em preparação</span></div>
      <div className={styles.fields} aria-describedby="estado-acesso aviso-login">
        <label htmlFor="email-corporativo">E-mail corporativo</label>
        <input id="email-corporativo" type="email" placeholder="seu.nome@empresa.com.br" disabled autoComplete="off" />
        <label htmlFor="senha-corporativa">Senha</label>
        <input id="senha-corporativa" type="password" placeholder="Sua senha corporativa" disabled autoComplete="off" />
        <button type="button" disabled className={styles.loginButton}>Acesso ainda indisponível <SetaEntrada /></button>
      </div>
      <p id="aviso-login" className={styles.loginNotice}>O login será habilitado após a integração segura com o serviço de autenticação corporativa. Nenhuma credencial é coletada nesta versão.</p>
    </>;
  }

  if (usuario) {
    return <>
      <div className={styles.availability}><span className={styles.statusDot}/><span>Identidade autenticada</span></div>
      <p className={styles.loginNotice}>Sessão de teste: {usuario}. Nenhum acesso a avaliações ou colaboradores foi liberado.</p>
      <button type="button" className={styles.loginButton} disabled={ocupado} onClick={() => void sair()}>
        {ocupado ? "Encerrando sessão..." : "Sair da sessão"} <SetaEntrada />
      </button>
      <p className={styles.loginNotice} role="status" aria-live="polite">{mensagem}</p>
    </>;
  }

  return <>
    <div className={styles.availability} id="estado-acesso"><span className={styles.statusDot}/><span>Autenticação Supabase — Testes</span></div>
    <form className={styles.fields} onSubmit={enviar} aria-describedby="estado-acesso aviso-login">
      <label htmlFor="email-corporativo">E-mail corporativo</label>
      <input id="email-corporativo" type="email" placeholder="seu.nome@empresa.com.br" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />
      <label htmlFor="senha-corporativa">Senha</label>
      <input id="senha-corporativa" type="password" placeholder="Sua senha corporativa" autoComplete="current-password" required value={senha} onChange={e => setSenha(e.target.value)} />
      <button type="submit" disabled={ocupado} className={styles.loginButton}>{ocupado ? "Validando..." : "Entrar (teste)"} <SetaEntrada /></button>
    </form>
    <p id="aviso-login" className={styles.loginNotice}>Acesso temporário para contas previamente criadas pela equipe. Ainda não é possível consultar dados reais.</p>
    <p className={styles.loginNotice} role="status" aria-live="polite">{mensagem}</p>
  </>;
}

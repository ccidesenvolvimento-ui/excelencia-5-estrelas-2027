"use client";

import { useEffect, useState } from "react";
import { categorias } from "@/lib/dados-demo";

export type EscopoDemo = {
  filiais: string[];
  categorias: string[];
};

type EstadoEscopo =
  | { tipo: "carregando"; escopo: null }
  | { tipo: "erro"; escopo: null }
  | { tipo: "pronto"; escopo: EscopoDemo };

const corporativo =
  process.env.NEXT_PUBLIC_SUPABASE_LOGIN_ENABLED === "true" &&
  process.env.NEXT_PUBLIC_DEPLOY_TARGET !== "github-pages";

export function useEscopoDemo() {
  const [estado, setEstado] = useState<EstadoEscopo>({
    tipo: corporativo ? "carregando" : "pronto",
    escopo: corporativo
      ? null
      : { filiais: [], categorias: [...categorias] },
  } as EstadoEscopo);

  useEffect(() => {
    if (!corporativo) return;

    const controlador = new AbortController();

    async function carregar() {
      try {
        const resposta = await fetch("/api/auth-lab/escopo", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controlador.signal,
        });

        if (!resposta.ok) {
          throw new Error("Escopo não autorizado.");
        }

        const dados: unknown = await resposta.json();

        if (
          !dados ||
          typeof dados !== "object" ||
          !("demonstrativo" in dados) ||
          dados.demonstrativo !== true ||
          !("filiais" in dados) ||
          !Array.isArray(dados.filiais) ||
          !dados.filiais.every(
            (item: unknown) => typeof item === "string"
          ) ||
          !("categorias" in dados) ||
          !Array.isArray(dados.categorias) ||
          !dados.categorias.every(
            (item: unknown) =>
              typeof item === "string" &&
              categorias.some(categoria => categoria === item)
          )
        ) {
          throw new Error("Escopo demonstrativo inválido.");
        }

        if (!controlador.signal.aborted) {
          setEstado({
            tipo: "pronto",
            escopo: {
              filiais: dados.filiais,
              categorias: dados.categorias,
            },
          });
        }
      } catch {
        if (!controlador.signal.aborted) {
          setEstado({ tipo: "erro", escopo: null });
        }
      }
    }

    void carregar();

    return () => controlador.abort();
  }, []);

  return {
    corporativo,
    carregando: estado.tipo === "carregando",
    erro: estado.tipo === "erro",
    escopo: estado.escopo,
  };
}

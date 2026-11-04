"use client";

import Link from "next/link";
import type { PointerEvent } from "react";
import { SetaEntrada } from "./EntradaInstitucional";
import styles from "@/app/entrada.module.css";

// Atualiza só duas propriedades CSS no elemento; não renderiza React ao mover o cursor.
function iluminar(event: PointerEvent<HTMLAnchorElement>) {
  if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
  card.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
}

export function CardAcesso({ motorista = false }: { motorista?: boolean }) {
  return <Link href={motorista ? "/motorista" : "/login"}
    className={`${styles.card} ${motorista ? styles.driverCard : ""}`}
    onPointerMove={iluminar}
    onPointerLeave={event => {
      event.currentTarget.style.removeProperty("--spot-x");
      event.currentTarget.style.removeProperty("--spot-y");
    }}>
    <span className={styles.cardNumber}>{motorista ? "02" : "01"}<span>{motorista ? "DESEMPENHO & CONQUISTAS" : "GESTÃO & ACOMPANHAMENTO"}</span>
      <svg className={styles.cardIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        {motorista ? <><path d="M5 8l2-4h10l2 4M4 9h16v10H4zM4 14h16M7 19v2m10-2v2M7 11h2m6 0h2"/><path d="M10 4V2h4v2"/></> : <><path d="M4 21V6h10v15M14 11h6v10M2 21h20M7 9h4M7 13h4M7 17h4M17 14v4"/></>}
      </svg>
    </span>
    <div className={styles.cardMain}><h3>{motorista ? "Área do Motorista" : "Área Corporativa"}</h3></div>
    <p>{motorista ? "Seu desempenho, suas estrelas e sua evolução." : "Acesso corporativo para a gestão do programa."}</p>
    <span className={styles.cardAction}>Acessar área <span className={styles.arrow}><SetaEntrada /></span></span>
    <span className={styles.borderLight} aria-hidden="true" />
  </Link>;
}

import Link from "next/link";
import styles from "@/app/entrada.module.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function CabecalhoEntrada({ login = false }: { login?: boolean }) {
  return <header className={styles.header}>
    <Link href="/" className={styles.brand} aria-label="Programa Excelência 5 Estrelas 2027 — início">
      {/* A arte oficial é preservada, sem filtros ou redesenho. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${base}/marca-programa.png`} width="1170" height="381" alt="Programa 5 Estrelas 2027 — Expresso Nepomuceno" />
    </Link>
    <div className={styles.headerRight}><span className={styles.edition}>RECONHECIMENTO QUE NOS MOVE</span><span className={styles.year}>EDIÇÃO <strong>2027</strong></span></div>
    {login && <Link href="/" className={styles.back}>← <span>Voltar ao início</span></Link>}
  </header>;
}

export { EstrelaInstitucional } from "./EstrelaInstitucional";

export function RodapeEntrada() {
  return <footer className={styles.footer}><span>EXPRESSO NEPOMUCENO <span className={styles.footerDivider}>/</span> Excelência 5 Estrelas</span><span>Uma jornada de dedicação. Um reconhecimento à altura.</span></footer>;
}

export function SetaEntrada() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

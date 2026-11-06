import Link from "next/link";
import { CabecalhoEntrada, EstrelaInstitucional, RodapeEntrada } from "@/components/EntradaInstitucional";
import styles from "../entrada.module.css";
import { FormularioLoginSupabase } from "@/components/FormularioLoginSupabase";

export default function LoginCorporativo() {
  return <div className={`${styles.page} ${styles.home}`}>
    <a href="#conteudo" className={styles.skip}>Pular para o conteúdo</a>
    <div className={styles.container}>
      <CabecalhoEntrada login />
      <main id="conteudo" className={styles.loginMain}>
        <section className={styles.loginStory} aria-label="Reconhecimento e excelência">
          <p className={styles.eyebrow}><span /> QUEM MOVE A EXCELÊNCIA MERECE DESTAQUE.</p>
          <h1 className={styles.loginTitle}>Grandes conquistas.<br/><em>Pessoas extraordinárias.</em></h1>
          <EstrelaInstitucional compacta />
          <p className={styles.storyNote}>Uma visão dedicada a quem acompanha, desenvolve e reconhece o nosso time.</p>
        </section>
        <section className={styles.loginPanel} aria-labelledby="titulo-login">
          <div className={styles.panelTop}><span className={styles.eyebrow}>ACESSO CORPORATIVO</span><svg width="20" height="23" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M5 11V8a7 7 0 0 1 14 0v3M4 11h16v13H4zM12 16v4"/></svg></div>
          <h2 id="titulo-login">Bem-vindo à<br/>Área Corporativa.</h2>
          <p className={styles.panelIntro}>O próximo passo para acompanhar a excelência do nosso time.</p>
          <FormularioLoginSupabase />
          <div className={styles.demo}><span className={styles.demoTag}>AMBIENTE DEMONSTRATIVO</span><p>Conheça a plataforma com dados fictícios, sem acesso a informações corporativas.</p><Link href="/visao-geral" className={styles.demoButton}>Explorar demonstração <SetaEntrada /></Link></div>
          <p className={styles.driverLink}>É motorista? <Link href="/motorista">Acesse sua área →</Link></p>
        </section>
      </main>
      <RodapeEntrada />
    </div>
  </div>;
}

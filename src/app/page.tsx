import { CardAcesso } from "@/components/CardAcesso";
import { CabecalhoEntrada, EstrelaInstitucional, RodapeEntrada } from "@/components/EntradaInstitucional";
import styles from "./entrada.module.css";

export default function Entrada() {
  return <div className={styles.page}>
    <a href="#conteudo" className={styles.skip}>Pular para o conteúdo</a>
    <div className={styles.container}>
      <CabecalhoEntrada />
      <main id="conteudo">
        <section className={styles.hero} aria-labelledby="titulo-entrada">
          <div className={styles.heroText}>
            <p className={styles.eyebrow}><span /> PROGRAMA EXCELÊNCIA 5 ESTRELAS</p>
            <h1 id="titulo-entrada" className={styles.title}>A excelência<br/>será <em>reconhecida!</em></h1>
            <p className={styles.intro}>Por trás de cada conquista, existe quem faz a diferença. Um programa para valorizar a dedicação e reconhecer quem nos leva mais longe.</p>
            <div className={styles.signature}><span className={styles.fiveStars} aria-label="Cinco estrelas">✦ ✦ ✦ ✦ ✦</span><span>DEDICAÇÃO EM CADA CAMINHO.</span></div>
          </div>
          <EstrelaInstitucional />
        </section>
        <section className={styles.access} aria-labelledby="titulo-acessos">
          <div className={styles.accessHeading}><h2 id="titulo-acessos">Sua jornada começa aqui.</h2><span>ESCOLHA SUA ÁREA DE ACESSO</span></div>
          <div className={styles.cards}>
            <CardAcesso />
            <CardAcesso motorista />
          </div>
        </section>
      </main>
      <RodapeEntrada />
    </div>
  </div>;
}

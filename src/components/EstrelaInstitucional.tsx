"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import styles from "@/app/entrada.module.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const chaveAbertura = "excelencia-abertura-cinematografica-v1";

export function EstrelaInstitucional({ compacta = false }: { compacta?: boolean }) {
  const arte = useRef<HTMLDivElement>(null);
  const imagem = useRef<HTMLImageElement>(null);
  const inclinacao = useRef<HTMLDivElement>(null);
  const emAbertura = useRef(false);

  useEffect(() => {
    const img = imagem.current;
    if (!img || compacta) return;
    const movimento = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revelar = () => { if (arte.current) delete arte.current.dataset.intro; };
    if (movimento.matches) { revelar(); return; }
    try { if (sessionStorage.getItem(chaveAbertura)) { revelar(); return; } } catch { /* Sem storage: anima somente nesta montagem. */ }

    let cancelado = false;
    let limpar = () => {};
    async function abrir() {
      // A mesma arte precisa estar decodificada antes da passagem e da troca final.
      try { await img!.decode(); } catch { revelar(); return; }
      if (cancelado || movimento.matches) { revelar(); return; }
      const caixa = img!.getBoundingClientRect();
      if (!caixa.width || !caixa.height) { revelar(); return; }
      try { sessionStorage.setItem(chaveAbertura, "vista"); } catch { /* Armazenamento opcional. */ }
      const mobile = innerWidth < 768;
      const cx = caixa.left + caixa.width / 2;
      const cy = caixa.top + caixa.height / 2;
      const passagemX = innerWidth * (mobile ? .52 : .55);
      const passagemY = innerHeight * (mobile ? .43 : .36);
      const deslocar = (x: number, y: number, escala: number, giro: number, profundidade: number) =>
        `perspective(1000px) translate3d(${x - cx}px, ${y - cy}px, 0) rotateY(${profundidade}deg) rotateZ(${giro}deg) scale(${escala})`;
      const clone = img!.cloneNode() as HTMLImageElement;
      clone.removeAttribute("class");
      clone.setAttribute("data-flyby", "");
      clone.setAttribute("aria-hidden", "true");
      Object.assign(clone.style, {
        position: "fixed", left: `${caixa.left}px`, top: `${caixa.top}px`,
        width: `${caixa.width}px`, height: `${caixa.height}px`,
        objectFit: "contain", pointerEvents: "none", zIndex: "70",
        transformOrigin: "50% 50%", willChange: "transform, opacity",
        filter: "drop-shadow(0 0 18px #6acfff45)",
      });
      const clarão = document.createElement("div");
      clarão.setAttribute("data-clarao", "");
      clarão.setAttribute("aria-hidden", "true");
      Object.assign(clarão.style, {
        position: "fixed", inset: "0", zIndex: "71", pointerEvents: "none", opacity: "0",
        background: `radial-gradient(ellipse at ${mobile ? 52 : 55}% ${mobile ? 43 : 36}%, #e9fbff 0%, #addfff 24%, #76bdeeb3 56%, #8dcaff66 100%)`,
      });
      document.body.append(clone, clarão);
      img!.style.visibility = "hidden";
      revelar();
      emAbertura.current = true;
      const duracao = 2000;
      const voo = clone.animate([
        { offset: 0, opacity: 0, transform: deslocar(-caixa.width * .6, innerHeight * .73, .28, -20, -28) },
        { offset: .12, opacity: 1, transform: deslocar(innerWidth * .12, innerHeight * .62, .55, -14, -22) },
        { offset: .32, opacity: 1, transform: deslocar(innerWidth * .38, innerHeight * .48, mobile ? 1 : 1.3, -6, -12) },
        { offset: .48, opacity: 1, transform: deslocar(passagemX, passagemY, mobile ? Math.min(1.62, innerWidth * .94 / caixa.width) : 2.65, 5, 8), filter: "brightness(1.22) drop-shadow(0 0 35px #8bdeff99)" },
        { offset: .67, opacity: 1, transform: deslocar(innerWidth * (mobile ? .6 : .72), innerHeight * .34, mobile ? 1.08 : 1.3, 3, 5), filter: "drop-shadow(0 0 24px #7bd5ff66)" },
        { offset: 1, opacity: 1, transform: "perspective(1000px) translate3d(0,0,0) rotateY(0deg) rotateZ(0deg) scale(1)", filter: "drop-shadow(0 0 18px #6acfff45)" },
      ], { duration: duracao, easing: "ease-in-out", fill: "both" });
      const luz = clarão.animate([
        { opacity: 0, offset: 0 }, { opacity: 0, offset: .26 },
        { opacity: mobile ? .42 : .58, offset: .48 },
        { opacity: .16, offset: .68 }, { opacity: 0, offset: 1 },
      ], { duration: duracao, easing: "ease-in-out", fill: "both" });
      let concluido = false;
      limpar = () => {
        if (concluido) return;
        concluido = true;
        // A posição final do clone é a caixa exata da imagem real: troca no mesmo frame.
        img!.style.visibility = "";
        voo.cancel(); luz.cancel(); clone.remove(); clarão.remove();
        emAbertura.current = false;
        window.removeEventListener("resize", limpar);
        window.removeEventListener("scroll", limpar);
        movimento.removeEventListener("change", limpar);
      };
      window.addEventListener("resize", limpar, { once: true });
      window.addEventListener("scroll", limpar, { once: true, passive: true });
      movimento.addEventListener("change", limpar, { once: true });
      voo.finished.then(limpar).catch(() => {});
    }
    void abrir();
    return () => { cancelado = true; limpar(); };
  }, [compacta]);

  function inclinar(event: PointerEvent<HTMLDivElement>) {
    if (emAbertura.current || event.pointerType !== "mouse" ||
      !matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const alvo = inclinacao.current;
    if (!alvo) return;
    const caixa = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - caixa.left) / caixa.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - caixa.top) / caixa.height * 2 - 1));
    alvo.style.setProperty("--tilt-x", `${-y * 5}deg`);
    alvo.style.setProperty("--tilt-y", `${x * 5}deg`);
    alvo.dataset.hover = "true";
  }

  function restaurar() {
    const alvo = inclinacao.current;
    if (!alvo) return;
    alvo.style.removeProperty("--tilt-x");
    alvo.style.removeProperty("--tilt-y");
    delete alvo.dataset.hover;
  }

  return <div ref={arte} data-intro={compacta ? undefined : "aguardando"} className={`${styles.art} ${compacta ? styles.compact : ""}`} aria-hidden="true"
    onPointerMove={inclinar} onPointerLeave={restaurar}>
    <noscript><style>{`.${styles.art}[data-intro] .${styles.starTilt}{opacity:1}`}</style></noscript>
    <div className={styles.halo} />
    <div ref={inclinacao} className={styles.starTilt} data-estrela-interativa="">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imagem} className={styles.star} src={`${base}/estrela-oficial-5-estrelas.png`} width="256" height="256" alt="" />
    </div>
    <span className={styles.artLabel}>CADA CONQUISTA TEM SEU BRILHO.</span>
  </div>;
}

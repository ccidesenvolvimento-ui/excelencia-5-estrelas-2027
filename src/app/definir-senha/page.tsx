import { FluxoSenhaSupabase } from "@/components/FluxoSenhaSupabase";
import styles from "@/app/entrada.module.css";

export default function DefinirSenha() {
  return <main className={styles.page}><div className={styles.container}>
    <FluxoSenhaSupabase modo="definir" />
  </div></main>;
}

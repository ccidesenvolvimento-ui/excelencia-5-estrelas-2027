import { ConfirmarLinkSupabase } from "@/components/ConfirmarLinkSupabase";
import styles from "@/app/entrada.module.css";

export default function ConfirmarAcesso() {
  return <main className={styles.page}><div className={styles.container}>
    <ConfirmarLinkSupabase />
  </div></main>;
}

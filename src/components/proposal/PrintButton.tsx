"use client";

import styles from "./proposal.module.css";

export function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={styles.pprint}
    >
      {label}
    </button>
  );
}

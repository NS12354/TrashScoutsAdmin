"use client";

import Link from "next/link";
import styles from "./printable.module.css";

// Header actions for the printable agreement page: back link + print
// trigger. Lives in its own client component so the parent server
// page can stay server-rendered.

export function PrintableActions({ token }: { token: string }) {
  return (
    <div className={styles.actions}>
      <Link href={`/proposals/${token}`}>← Back to Proposal</Link>
      <button
        type="button"
        className={styles.pprint}
        onClick={() => window.print()}
      >
        Print / Save as PDF
      </button>
    </div>
  );
}

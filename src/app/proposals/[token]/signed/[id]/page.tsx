import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";
import {
  OPTIONAL_SERVICES,
  SERVICE_COPY,
  TERMS,
} from "@/lib/proposalConstants";
import {
  activeStreams,
  binText,
  presentModes,
  scheduleText,
  streamName,
  usd,
  type ProposalData,
} from "@/lib/proposalData";
import { PrintButton } from "@/components/proposal/PrintButton";
import styles from "@/components/proposal/proposal.module.css";

export const dynamic = "force-dynamic";

function fmtDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type FormData = {
  pname?: string;
  ctype?: string;
  svcaddr?: string;
  start?: string;
  startTbd?: boolean;
  access?: string;
  managed?: boolean;
  company?: string;
  mc_name?: string;
  mc_email?: string;
  mc_phone?: string;
  bc_same?: boolean;
  bc_name?: string;
  bc_email?: string;
  bc_phone?: string;
  oc_same?: boolean;
  oc_name?: string;
  oc_email?: string;
  oc_phone?: string;
};

function contactStr(name?: string, email?: string, phone?: string): string {
  return [name, email, phone].filter(Boolean).join(" · ");
}

export default async function SignedAgreementPage({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  const { token, id } = await params;
  const agreement = await prisma.signedAgreement.findUnique({
    where: { id },
    include: { proposal: true },
  });
  if (!agreement || agreement.proposal.token !== token) return notFound();

  const p = agreement.proposal;
  const data = p.data as unknown as ProposalData;
  const streams = activeStreams(data);
  const modes = presentModes(data);
  const fd = (agreement.formData ?? {}) as FormData;
  const signedAt = fmtDateTime(agreement.signedAt);
  const startStr =
    fd.startTbd || !fd.start
      ? "To be determined"
      : new Date(fd.start + "T00:00").toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

  const mcContact = contactStr(fd.mc_name, fd.mc_email, fd.mc_phone);
  const bc = fd.bc_same
    ? mcContact
    : contactStr(fd.bc_name, fd.bc_email, fd.bc_phone);
  const oc = fd.oc_same
    ? mcContact
    : contactStr(fd.oc_name, fd.oc_email, fd.oc_phone);

  return (
    <div className={styles.shell}>
      <div className={styles.actions}>
        <PrintButton label="Download / Save as PDF" />
      </div>

      <article className={styles.paper}>
        <div className={styles.agSignedBanner}>
          <div className={styles.agSignedTick}>✓</div>
          <div>
            <b>Agreement Signed</b>
            <span>
              Use &ldquo;Download / Save as PDF&rdquo; above to keep a copy of
              this signed agreement.
            </span>
          </div>
        </div>

        <header className={styles.phead}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_LOGO || "/brand/logo.jpg"}
            alt={BRAND_NAME}
            className={styles.plogo}
          />
          <div className={styles.pmeta}>
            Service Agreement
            <br />
            Signed {signedAt}
          </div>
        </header>

        <div className={styles.agSec}>
          <div className={styles.agSecH}>Property Information</div>
          <div className={styles.agKv}>
            {fd.pname && (
              <>
                <div className="k">Property / Account</div>
                <div className="v">{fd.pname}</div>
              </>
            )}
            {fd.ctype && (
              <>
                <div className="k">Customer Type</div>
                <div className="v">{fd.ctype}</div>
              </>
            )}
            {fd.svcaddr && (
              <>
                <div className="k">Service Address</div>
                <div className="v">{fd.svcaddr}</div>
              </>
            )}
            <div className="k">Start Date</div>
            <div className="v">{startStr}</div>
            {fd.access && (
              <>
                <div className="k">Access Notes</div>
                <div className="v">{fd.access}</div>
              </>
            )}
          </div>
        </div>

        <div className={styles.agSec}>
          <div className={styles.agSecH}>Contacts</div>
          <div className={styles.agKv}>
            {fd.managed && fd.company && (
              <>
                <div className="k">Management Company</div>
                <div className="v">{fd.company}</div>
              </>
            )}
            {mcContact && (
              <>
                <div className="k">Management Contact</div>
                <div className="v">{mcContact}</div>
              </>
            )}
            {bc && (
              <>
                <div className="k">Billing Contact</div>
                <div className="v">{bc}</div>
              </>
            )}
            {oc && (
              <>
                <div className="k">Onsite Contact</div>
                <div className="v">{oc}</div>
              </>
            )}
          </div>
        </div>

        <div className={styles.agSec}>
          <div className={styles.agSecH}>Services &amp; Schedule</div>
          <div className={styles.agRead}>
            {modes.map((m) => {
              if (m === "sow") {
                const sowStreams = streams.filter((s) => s.mode === "sow");
                return (
                  <div key={m} className={styles.pservice}>
                    <h3 className={styles.psvcH}>{SERVICE_COPY.sow.title}</h3>
                    <p className={styles.pintro}>{SERVICE_COPY.sow.lead}</p>
                    {sowStreams.map((s) => (
                      <p
                        key={s.id}
                        className={`${styles.pintro} ${styles.pscope}`}
                      >
                        {s.sowScope.trim() ||
                          "Custom scope of work as discussed with your team."}
                      </p>
                    ))}
                  </div>
                );
              }
              return (
                <div key={m} className={styles.pservice}>
                  <h3 className={styles.psvcH}>{SERVICE_COPY[m].title}</h3>
                  <p className={styles.pintro}>{SERVICE_COPY[m].body}</p>
                </div>
              );
            })}
            <table className={styles.ptable} style={{ marginTop: 14 }}>
              <thead>
                <tr>
                  <th>Service Line</th>
                  <th>Detail</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {streams.map((s) => (
                  <tr key={s.id}>
                    <td className={styles.pname}>{streamName(s)}</td>
                    <td>{binText(s)}</td>
                    <td>{scheduleText(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.agOpt}>
              <div className={styles.agOptH}>
                Optional services (provided on request, billed separately)
              </div>
              <ul className={styles.agOptList}>
                {OPTIONAL_SERVICES.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.agSec}>
          <div className={styles.agSecH}>Service Rate</div>
          <div className={styles.pprice} style={{ margin: 0 }}>
            <div className={styles.prateMain}>
              <span className={styles.plabel} style={{ margin: "0 0 3px" }}>
                Service Rate
              </span>
              <span className={styles.pamount}>
                {usd(p.weeklyPrice)}
                <span className={styles.ppermo}> / week</span>
              </span>
            </div>
            <div className={styles.prateMo}>
              <span className={styles.prateMoAmt}>{usd(p.monthlyPrice)}</span>
              <span className={styles.prateMoLbl}>Billed Monthly</span>
            </div>
          </div>
        </div>

        <div className={styles.agSec}>
          <div className={styles.agSecH}>Terms &amp; Conditions</div>
          <div className={styles.agTerms}>
            <div
              className={styles.agTermsScroll}
              style={{ maxHeight: "none", overflow: "visible" }}
            >
              <div className={styles.agTermsCols}>
                {TERMS.map(([h, t]) => (
                  <div key={h} className={styles.agTerm}>
                    <h4>{h}</h4>
                    <p>{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.agSec}>
          <div className={styles.agSecH}>Signature</div>
          <div className={styles.agSignedSig}>
            {agreement.signatureType === "drawn" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agreement.signatureValue} alt="signature" />
            ) : (
              <span
                className={styles.agSignedTyped}
                style={{
                  fontFamily: agreement.signatureFont || "cursive",
                }}
              >
                {agreement.signatureValue}
              </span>
            )}
          </div>
          <div className={styles.agSignedMeta}>
            <b>{agreement.signerName}</b>
            {agreement.signerTitle ? `, ${agreement.signerTitle}` : ""}
            <br />
            For {fd.pname || p.clientName}
            <br />
            Signed electronically {signedAt}
          </div>
        </div>

        <div className={styles.pfoot}>
          <div className={styles.pfootName}>
            {BRAND_NAME}® · Onsite Waste Services
          </div>
          <div className={styles.pfootContact}>
            520 3rd St #201, Oakland, CA 94607 ·  (510) 788-0462 · {" "}
            <a href="https://www.trashscouts.com">www.trashscouts.com</a>
          </div>
        </div>
      </article>
    </div>
  );
}

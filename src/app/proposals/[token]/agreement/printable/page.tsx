import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";
import {
  CUSTOMER_TYPES,
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
import { PrintableActions } from "@/components/proposal/PrintableActions";
import styles from "@/components/proposal/printable.module.css";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PrintableAgreementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposal = await prisma.proposal.findUnique({ where: { token } });
  if (!proposal) return notFound();

  const data = proposal.data as unknown as ProposalData;
  const streams = activeStreams(data);
  const modes = presentModes(data);

  return (
    <div className={styles.shell}>
      <div className={styles.paper}>
        <PrintableActions token={token} />

        <p className={styles.intro}>
          A print-ready agreement carrying over the service, schedule,
          and rate from the proposal. Type into the fields below — or
          print blank and fill it in by hand — then sign on the last
          page. The full terms &amp; conditions are included.
        </p>

        <header className={styles.head}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_LOGO || "/brand/logo.jpg"}
            alt={BRAND_NAME}
            className={styles.logo}
          />
          <div className={styles.meta}>
            Service Agreement
            <br />
            {fmtDate(proposal.createdAt)}
          </div>
        </header>

        {/* ───── Property information ───── */}
        <div className={styles.sec}>
          <div className={styles.secH}>Property Information</div>
          <div className={styles.fill}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Property / Account</span>
              <input
                type="text"
                className={styles.fieldInput}
                defaultValue={proposal.clientName}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Start Date</span>
              <input type="text" className={styles.fieldInput} />
            </div>
            <div className={`${styles.field} ${styles.fillFull}`}>
              <span className={styles.fieldLabel}>Service Address</span>
              <input
                type="text"
                className={styles.fieldInput}
                defaultValue={proposal.clientAddress ?? ""}
              />
            </div>
            <div className={`${styles.field} ${styles.fillFull}`}>
              <span className={styles.fieldLabel}>Customer Type</span>
              <div className={styles.ctypes}>
                {CUSTOMER_TYPES.map((t) => (
                  <label key={t} className={styles.ctype}>
                    <input type="checkbox" />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ───── Contacts ───── */}
        <div className={styles.sec}>
          <div className={styles.secH}>Contacts</div>
          <div className={styles.field} style={{ marginBottom: 12 }}>
            <span className={styles.fieldLabel}>Management Company</span>
            <input type="text" className={styles.fieldInput} />
          </div>
          <div className={styles.cgrid}>
            <div className={styles.cgH}></div>
            <div className={styles.cgH}>Name</div>
            <div className={styles.cgH}>Email</div>
            <div className={styles.cgH}>Phone</div>

            <div className={styles.cgL}>Management Contact</div>
            <input type="text" className={styles.fieldInput} />
            <input type="text" className={styles.fieldInput} />
            <input type="text" className={styles.fieldInput} />

            <div className={styles.cgL}>Billing Contact</div>
            <input type="text" className={styles.fieldInput} />
            <input type="text" className={styles.fieldInput} />
            <input type="text" className={styles.fieldInput} />

            <div className={styles.cgL}>Onsite Contact</div>
            <input type="text" className={styles.fieldInput} />
            <input type="text" className={styles.fieldInput} />
            <input type="text" className={styles.fieldInput} />
          </div>
        </div>

        {/* ───── Services & schedule (read-only carry-over) ───── */}
        <div className={styles.sec}>
          <div className={styles.secH}>Services &amp; Schedule</div>
          <div className={styles.read}>
            {modes.map((m) => {
              if (m === "sow") {
                // Carry each SOW stream's per-line scope text through
                // to the printable agreement so a Custom SOW
                // proposal doesn't lose its scope when downloaded.
                const sowStreams = streams.filter((s) => s.mode === "sow");
                return (
                  <div key={m} className={styles.pservice}>
                    <h3 className={styles.psvcH}>{SERVICE_COPY.sow.title}</h3>
                    <p className={styles.pintro}>{SERVICE_COPY.sow.lead}</p>
                    {sowStreams.map((s) => (
                      <p
                        key={s.id}
                        className={styles.pintro}
                        style={{
                          whiteSpace: "pre-line",
                          borderLeft: "3px solid #E7F1EA",
                          paddingLeft: 12,
                          marginTop: 6,
                          color: "#333",
                        }}
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
            <table className={styles.ptable}>
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
            <div className={styles.optBox}>
              <div className={styles.optH}>
                Optional services (provided on request, billed separately)
              </div>
              <ul className={styles.optList}>
                {OPTIONAL_SERVICES.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ───── Rate ───── */}
        <div className={styles.sec}>
          <div className={styles.secH}>Service Rate</div>
          <div className={styles.price}>
            <div>
              <div className={styles.fieldLabel} style={{ marginBottom: 4 }}>
                Service Rate
              </div>
              <span className={styles.priceAmt}>
                {usd(proposal.weeklyPrice)}
                <span className={styles.pricePer}> / week</span>
              </span>
            </div>
            <div className={styles.priceMo}>
              <div className={styles.priceMoAmt}>
                {usd(proposal.monthlyPrice)}
              </div>
              <div className={styles.priceMoLbl}>Billed Monthly</div>
            </div>
          </div>
        </div>

        {/* ───── Terms ───── */}
        <div className={styles.sec}>
          <div className={styles.secH}>Terms &amp; Conditions</div>
          <div className={styles.terms}>
            <div className={styles.termsCols}>
              {TERMS.map(([h, t]) => (
                <div key={h} className={styles.term}>
                  <h4>{h}</h4>
                  <p>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ───── Signature ───── */}
        <div className={`${styles.sec} ${styles.sigBlock}`}>
          <div className={styles.secH}>Signature</div>
          <div className={styles.sigRow}>
            <div className={`${styles.sigF} ${styles.sigSig}`}>
              <div className={styles.sigLine} />
              <div className={styles.sigCap}>Signature</div>
            </div>
            <div className={styles.sigF}>
              <div className={styles.sigLine} />
              <div className={styles.sigCap}>Date</div>
            </div>
          </div>
          <div className={styles.sigRow}>
            <div className={`${styles.sigF} ${styles.sigSig}`}>
              <div className={styles.sigLine} />
              <div className={styles.sigCap}>Printed Name</div>
            </div>
            <div className={styles.sigF}>
              <div className={styles.sigLine} />
              <div className={styles.sigCap}>Title</div>
            </div>
          </div>
        </div>

        <div className={styles.foot}>
          <div className={styles.footName}>
            {BRAND_NAME}® · Onsite Waste Services
          </div>
          <div>
            520 3rd St #201, Oakland, CA 94607 · (510) 788-0462 ·{" "}
            <a href="https://www.trashscouts.com">www.trashscouts.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}

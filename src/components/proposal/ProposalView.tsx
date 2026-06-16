import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";
import {
  OPTIONAL_SERVICES,
  SERVICE_COPY,
  WHY_BULLETS,
  WHY_GIVING,
} from "@/lib/proposalConstants";
import {
  activeStreams,
  binText,
  hasHaulerMode,
  presentModes,
  scheduleText,
  streamName,
  usd,
  type ProposalData,
} from "@/lib/proposalData";
import styles from "./proposal.module.css";

export type ProposalViewProps = {
  clientName: string;
  clientAddress: string | null;
  preparedBy: string | null;
  preparedDate: string;
  validUntil: string;
  monthlyPrice: number;
  weeklyPrice: number;
  data: ProposalData;
  acceptHref?: string | null;
  alreadyAccepted?: boolean;
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatProposalDates(
  preparedDate: Date,
  validUntil: Date,
): { preparedDate: string; validUntil: string } {
  return {
    preparedDate: fmtDate(preparedDate),
    validUntil: fmtDate(validUntil),
  };
}

export function ProposalView(props: ProposalViewProps) {
  const streams = activeStreams(props.data);
  const modes = presentModes(props.data);
  const hauler = hasHaulerMode(props.data);

  return (
    <article className={styles.paper}>
      <header className={styles.phead}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_LOGO || "/brand/logo.jpg"}
          alt={BRAND_NAME}
          className={styles.plogo}
        />
        <div className={styles.pmeta}>
          Service Proposal
          <br />
          {props.preparedDate}
          <br />
          <span className={styles.pmetaValid}>
            Pricing Valid Through {props.validUntil}
          </span>
        </div>
      </header>

      <div className={styles.pfor}>
        <div>
          <span className={styles.plabel}>Prepared For</span>
          {props.clientName || "Prospective Client"}
          {props.clientAddress && (
            <span className={styles.pforAddr}>{props.clientAddress}</span>
          )}
        </div>
        {props.preparedBy && (
          <div>
            <span className={styles.plabel}>Prepared By</span>
            {props.preparedBy}
          </div>
        )}
      </div>

      <section>
        <div className={styles.psecH}>Why Trash Scouts</div>
        <div className={styles.pwhy}>
          <ul className={styles.pwhyList}>
            {WHY_BULLETS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <div className={styles.pwhyGive}>{WHY_GIVING}</div>
        </div>
      </section>

      <section>
        <div className={styles.psecH}>Scope of Work</div>
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

        <table className={styles.ptable}>
          <thead>
            <tr>
              <th>Service Line</th>
              <th>Detail</th>
              <th>Service Schedule</th>
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
      </section>

      <section>
        <div className={styles.psecH}>What&apos;s Included</div>
        <ul className={styles.pbenefits}>
          {hauler && (
            <li>
              <span className={styles.pbT}>
                Dispatch &amp; hauler coordination
              </span>{" "}
              — if your hauler misses a pickup, our team makes the calls and
              arranges the return, so you never have to chase it down. At no
              extra charge.
            </li>
          )}
          <li>
            <span className={styles.pbT}>On-site monitoring</span> — we catch
            the issues that quietly disrupt service (blocked trash rooms,
            dumped appliances, broken dumpster wheels) and help get them
            resolved early.
          </li>
          <li>
            <span className={styles.pbT}>
              Contamination &amp; overflow watch
            </span>{" "}
            — we flag contamination and overflow and right-size your service
            to help you avoid fines and extra fees.
          </li>
          <li>
            <span className={styles.pbT}>Waste diversion reporting</span> —
            clear, visual reports that track your diversion rate and help you
            reach your goals.
          </li>
        </ul>
      </section>

      <section>
        <div className={styles.psecH}>Your Rate</div>
        <div className={styles.pprice}>
          <div className={styles.prateMain}>
            <span className={styles.plabel} style={{ margin: "0 0 3px" }}>
              Service Rate
            </span>
            <span className={styles.pamount}>
              {usd(props.weeklyPrice)}
              <span className={styles.ppermo}> / week</span>
            </span>
          </div>
          <div className={styles.prateMo}>
            <span className={styles.prateMoAmt}>
              {usd(props.monthlyPrice)}
            </span>
            <span className={styles.prateMoLbl}>Billed Monthly</span>
          </div>
        </div>
        <div className={styles.prateNote}>
          Weekly rate billed monthly, based on an average of 4.33 service
          weeks per month.
        </div>
      </section>

      <section>
        <div className={styles.psecH}>Optional Add-Ons</div>
        <ul className={styles.poptList}>
          {OPTIONAL_SERVICES.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <p className={styles.pterms}>
          Service begins upon a signed agreement. Pricing reflects the
          schedule shown; container or frequency changes may adjust the
          rate.
        </p>
      </section>

      {props.acceptHref && !props.alreadyAccepted && (
        <div className={styles.acceptCta}>
          <div className={styles.acceptCtaTxt}>
            <b>Ready to get started?</b>
            <span>
              Accept online and sign your service agreement in minutes — no
              printing, scanning, or emailing back.
            </span>
          </div>
          <a href={props.acceptHref} className={styles.acceptLg}>
            Accept this proposal →
          </a>
        </div>
      )}

      {props.alreadyAccepted && (
        <div
          className={styles.acceptCta}
          style={{ background: "#0E3F27" }}
        >
          <div className={styles.acceptCtaTxt}>
            <b>This proposal has been accepted.</b>
            <span>
              Thanks — we&apos;ll be in touch shortly. A copy of your signed
              agreement was emailed to you.
            </span>
          </div>
        </div>
      )}

      <div className={styles.pfoot}>
        <div className={styles.pfootName}>
          {BRAND_NAME}® · Onsite Waste Services
        </div>
        <div className={styles.pfootContact}>
          520 3rd St #201, Oakland, CA 94607 &nbsp;·&nbsp; (510) 788-0462
          &nbsp;·&nbsp;{" "}
          <a href="https://www.trashscouts.com">www.trashscouts.com</a>
        </div>
      </div>
    </article>
  );
}

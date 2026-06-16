"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import styles from "./proposal.module.css";

const SIG_FONTS: [string, string, string] = [
  "'Dancing Script', cursive",
  "'Sacramento', cursive",
  "'Caveat', cursive",
];

type FormState = {
  pname: string;
  ctype: string;
  svcaddr: string;
  start: string;
  startTbd: boolean;
  access: string;
  managed: boolean;
  company: string;
  mc_name: string;
  mc_email: string;
  mc_phone: string;
  bc_same: boolean;
  bc_name: string;
  bc_email: string;
  bc_phone: string;
  oc_same: boolean;
  oc_name: string;
  oc_email: string;
  oc_phone: string;
  signer: string;
  title: string;
  ack: boolean;
};

const blankForm = (): FormState => ({
  pname: "",
  ctype: "",
  svcaddr: "",
  start: "",
  startTbd: false,
  access: "",
  managed: true,
  company: "",
  mc_name: "",
  mc_email: "",
  mc_phone: "",
  bc_same: true,
  bc_name: "",
  bc_email: "",
  bc_phone: "",
  oc_same: false,
  oc_name: "",
  oc_email: "",
  oc_phone: "",
  signer: "",
  title: "",
  ack: false,
});

export function AgreementForm({
  token,
  proposalClientName,
  proposalAddress,
  preparedDate,
  data,
  monthlyPrice,
  weeklyPrice,
}: {
  token: string;
  proposalClientName: string;
  proposalAddress: string | null;
  preparedDate: string;
  data: ProposalData;
  monthlyPrice: number;
  weeklyPrice: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => {
    const f = blankForm();
    if (proposalClientName && proposalClientName !== "Prospective Client") {
      f.pname = proposalClientName;
    }
    if (proposalAddress) f.svcaddr = proposalAddress;
    return f;
  });
  const [sigMode, setSigMode] = useState<"draw" | "typed">("draw");
  const [sigDrawn, setSigDrawn] = useState(false);
  const [sigTyped, setSigTyped] = useState("");
  const [sigFont, setSigFont] = useState<string>(SIG_FONTS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [badFields, setBadFields] = useState<Set<string>>(new Set());

  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Set up the signature canvas — high-DPI, pointer + touch handlers.
  useEffect(() => {
    if (sigMode !== "draw") return;
    const c = sigCanvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1A1A1A";

    let drawing = false;
    let px = 0;
    let py = 0;

    const pos = (e: PointerEvent | TouchEvent): [number, number] => {
      const b = c.getBoundingClientRect();
      const t = "touches" in e && e.touches[0] ? e.touches[0] : (e as PointerEvent);
      return [t.clientX - b.left, t.clientY - b.top];
    };
    const down = (e: PointerEvent | TouchEvent) => {
      e.preventDefault();
      drawing = true;
      [px, py] = pos(e);
    };
    const move = (e: PointerEvent | TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const [x, y] = pos(e);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
      px = x;
      py = y;
      setSigDrawn(true);
    };
    const up = () => {
      drawing = false;
    };

    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    c.addEventListener("touchstart", down, { passive: false });
    c.addEventListener("touchmove", move, { passive: false });
    c.addEventListener("touchend", up);
    return () => {
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      c.removeEventListener("touchstart", down);
      c.removeEventListener("touchmove", move);
      c.removeEventListener("touchend", up);
    };
  }, [sigMode]);

  function clearSig() {
    const c = sigCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, c.width, c.height);
    setSigDrawn(false);
  }

  function patch<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (badFields.has(k as string)) {
      setBadFields((p) => {
        const s = new Set(p);
        s.delete(k as string);
        return s;
      });
    }
  }

  function required(): string[] {
    const r = ["pname", "ctype", "svcaddr", "mc_name", "mc_email", "signer"];
    if (form.managed) r.push("company");
    if (!form.bc_same) r.push("bc_name", "bc_email");
    return r;
  }

  async function submit() {
    setError(null);
    const bad = new Set<string>();
    for (const k of required()) {
      const v = (form as unknown as Record<string, unknown>)[k];
      if (!v || (typeof v === "string" && !v.trim())) bad.add(k);
    }
    if (bad.size) {
      setBadFields(bad);
      setError("Please complete the highlighted required fields.");
      return;
    }
    if (!form.ack) {
      setError("Please check the box to agree before signing.");
      return;
    }
    let signatureValue: string;
    let signatureFont: string | null = null;
    if (sigMode === "draw") {
      if (!sigDrawn) {
        setError("Please draw your signature, or switch to typing it.");
        return;
      }
      signatureValue = sigCanvasRef.current!.toDataURL("image/png");
    } else {
      if (!sigTyped.trim()) {
        setError("Please type your signature, or switch to drawing it.");
        return;
      }
      signatureValue = sigTyped.trim();
      signatureFont = sigFont;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proposals/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: { ...form },
          signatureType: sigMode === "draw" ? "drawn" : "typed",
          signatureValue,
          signatureFont,
          signerName: form.signer,
          signerTitle: form.title || null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Submission failed (${res.status})`);
      }
      const j = (await res.json()) as { id: string };
      router.push(`/proposals/${token}/signed/${j.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setSubmitting(false);
    }
  }

  const streams = activeStreams(data);
  const modes = presentModes(data);
  const isBad = (k: string) => badFields.has(k);

  return (
    <article className={styles.paper}>
      <div className={styles.actions}>
        <a href={`/proposals/${token}`}>← Back to Proposal</a>
        <span style={{ marginLeft: "auto" }} className={styles.agStep}>
          Step 2 of 2 · Review &amp; Sign
        </span>
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
          {preparedDate}
        </div>
      </header>

      <p className={styles.agIntro}>
        This agreement puts the service, schedule, and rate from your
        proposal in writing, alongside our terms. Fill in your account
        details, review, and sign below — you&apos;ll get a copy by email
        the moment you&apos;re done.
      </p>

      {/* SECTION 1 — Property info */}
      <div className={styles.agSec}>
        <div className={styles.agSecH}>
          <span className={styles.agSecHN}>1</span> Property Information
        </div>
        <div className={styles.agGrid}>
          <div className={`${styles.agF} ${styles["full"] ?? ""} full`}>
            <label>
              Property Name / Account Name{" "}
              <span className={styles.req}>*</span>
            </label>
            <input
              className={isBad("pname") ? styles.bad : ""}
              value={form.pname}
              onChange={(e) => patch("pname", e.target.value)}
              placeholder="The property or account this service is for"
            />
          </div>
          <div className={styles.agF}>
            <label>
              Customer Type <span className={styles.req}>*</span>
            </label>
            <select
              className={isBad("ctype") ? styles.bad : ""}
              value={form.ctype}
              onChange={(e) => patch("ctype", e.target.value)}
            >
              <option value="" disabled>
                Choose one
              </option>
              {CUSTOMER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.agF}>
            <label>Requested Start Date</label>
            <input
              type="date"
              value={form.start}
              disabled={form.startTbd}
              onChange={(e) => patch("start", e.target.value)}
              style={form.startTbd ? { opacity: 0.5 } : undefined}
            />
            <label
              className={`${styles.agInlineCheck} ${styles.agInlineCheckSm}`}
              style={{ marginTop: 7 }}
            >
              <input
                type="checkbox"
                checked={form.startTbd}
                onChange={(e) => {
                  patch("startTbd", e.target.checked);
                  if (e.target.checked) patch("start", "");
                }}
              />
              <span>To be determined</span>
            </label>
          </div>
          <div className={`${styles.agF} full`}>
            <label>
              Service Address <span className={styles.req}>*</span>
            </label>
            <input
              className={isBad("svcaddr") ? styles.bad : ""}
              value={form.svcaddr}
              onChange={(e) => patch("svcaddr", e.target.value)}
              placeholder="Street address where we service the bins"
            />
          </div>
        </div>
        <div className={`${styles.agF} full`} style={{ marginTop: 14 }}>
          <label>Access Notes &amp; Entry Instructions</label>
          <textarea
            value={form.access}
            onChange={(e) => patch("access", e.target.value)}
            placeholder="Gate code, key location, garage access, best entry point…"
          />
        </div>
      </div>

      {/* SECTION 2 — Contacts */}
      <div className={styles.agSec}>
        <div className={styles.agSecH}>
          <span className={styles.agSecHN}>2</span> Management &amp; Contacts
        </div>
        <label className={styles.agInlineCheck}>
          <input
            type="checkbox"
            checked={form.managed}
            onChange={(e) => patch("managed", e.target.checked)}
          />
          <span>This property is managed by a company</span>
        </label>
        {form.managed && (
          <div className={`${styles.agF} full`} style={{ marginTop: 12 }}>
            <label>
              Management / Property Ownership Company{" "}
              <span className={styles.req}>*</span>
            </label>
            <input
              className={isBad("company") ? styles.bad : ""}
              value={form.company}
              onChange={(e) => patch("company", e.target.value)}
              placeholder="Company that manages or owns the property"
            />
          </div>
        )}
        <div className={styles.agContacts}>
          {/* Management contact */}
          <div className={styles.agContact}>
            <div className={styles.agContactH}>
              <b>Management Contact</b>
              <span>Account &amp; management communication</span>
            </div>
            <div className={styles.agF}>
              <label>
                Name <span className={styles.req}>*</span>
              </label>
              <input
                className={isBad("mc_name") ? styles.bad : ""}
                value={form.mc_name}
                onChange={(e) => patch("mc_name", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className={styles.agF}>
              <label>
                Email <span className={styles.req}>*</span>
              </label>
              <input
                type="email"
                className={isBad("mc_email") ? styles.bad : ""}
                value={form.mc_email}
                onChange={(e) => patch("mc_email", e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div className={styles.agF}>
              <label>Phone (Optional)</label>
              <input
                type="tel"
                value={form.mc_phone}
                onChange={(e) => patch("mc_phone", e.target.value)}
                placeholder="(510) 000-0000"
              />
            </div>
          </div>

          {/* Billing contact */}
          <div className={styles.agContact}>
            <div className={styles.agContactH}>
              <b>Billing Contact</b>
              <span>Invoices emailed here — electronic invoices only</span>
            </div>
            <label
              className={`${styles.agInlineCheck} ${styles.agInlineCheckSm}`}
            >
              <input
                type="checkbox"
                checked={form.bc_same}
                onChange={(e) => patch("bc_same", e.target.checked)}
              />
              <span>Same as Management Contact</span>
            </label>
            {!form.bc_same && (
              <>
                <div className={styles.agF}>
                  <label>
                    Name <span className={styles.req}>*</span>
                  </label>
                  <input
                    className={isBad("bc_name") ? styles.bad : ""}
                    value={form.bc_name}
                    onChange={(e) => patch("bc_name", e.target.value)}
                  />
                </div>
                <div className={styles.agF}>
                  <label>
                    Email <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="email"
                    className={isBad("bc_email") ? styles.bad : ""}
                    value={form.bc_email}
                    onChange={(e) => patch("bc_email", e.target.value)}
                  />
                </div>
                <div className={styles.agF}>
                  <label>Phone (Optional)</label>
                  <input
                    type="tel"
                    value={form.bc_phone}
                    onChange={(e) => patch("bc_phone", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Onsite contact */}
          <div className={styles.agContact}>
            <div className={styles.agContactH}>
              <b>Onsite Contact</b>
              <span>Day-to-day, service-related communication</span>
            </div>
            <label
              className={`${styles.agInlineCheck} ${styles.agInlineCheckSm}`}
            >
              <input
                type="checkbox"
                checked={form.oc_same}
                onChange={(e) => patch("oc_same", e.target.checked)}
              />
              <span>Same as Management Contact</span>
            </label>
            {!form.oc_same && (
              <>
                <div className={styles.agF}>
                  <label>Name</label>
                  <input
                    value={form.oc_name}
                    onChange={(e) => patch("oc_name", e.target.value)}
                  />
                </div>
                <div className={styles.agF}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.oc_email}
                    onChange={(e) => patch("oc_email", e.target.value)}
                  />
                </div>
                <div className={styles.agF}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={form.oc_phone}
                    onChange={(e) => patch("oc_phone", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3 — Services covered (read-only summary) */}
      <div className={styles.agSec}>
        <div className={styles.agSecH}>
          <span className={styles.agSecHN}>3</span> Services Covered
        </div>
        <div className={styles.agRead}>
          {modes.map((m) => {
            if (m === "sow") {
              return (
                <div key={m} className={styles.pservice}>
                  <h3 className={styles.psvcH}>{SERVICE_COPY.sow.title}</h3>
                  <p className={styles.pintro}>{SERVICE_COPY.sow.lead}</p>
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

      {/* SECTION 4 — Rate */}
      <div className={styles.agSec}>
        <div className={styles.agSecH}>
          <span className={styles.agSecHN}>4</span> Service Rate
        </div>
        <div className={styles.pprice} style={{ margin: 0 }}>
          <div className={styles.prateMain}>
            <span className={styles.plabel} style={{ margin: "0 0 3px" }}>
              Service Rate
            </span>
            <span className={styles.pamount}>
              {usd(weeklyPrice)}
              <span className={styles.ppermo}> / week</span>
            </span>
          </div>
          <div className={styles.prateMo}>
            <span className={styles.prateMoAmt}>{usd(monthlyPrice)}</span>
            <span className={styles.prateMoLbl}>Billed Monthly</span>
          </div>
        </div>
        <div className={styles.prateNote} style={{ marginTop: 10 }}>
          Weekly rate billed monthly, prepaid, based on an average of 4.33
          service weeks per month.
        </div>
      </div>

      {/* SECTION 5 — Terms */}
      <div className={styles.agSec}>
        <div className={styles.agSecH}>
          <span className={styles.agSecHN}>5</span> Terms &amp; Conditions
        </div>
        <div className={styles.agTerms}>
          <div className={styles.agTermsScroll}>
            <div className={styles.agTermsCols}>
              {TERMS.map(([h, p]) => (
                <div key={h} className={styles.agTerm}>
                  <h4>{h}</h4>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.agTermsFoot}>
            Scroll to read all terms. The full text is included in your
            saved copy.
          </div>
        </div>
      </div>

      {/* SECTION 6 — Acknowledge + sign */}
      <div className={styles.agSec}>
        <div className={styles.agSecH}>
          <span className={styles.agSecHN}>6</span> Acknowledge &amp; Sign
        </div>
        <label className={styles.agAck}>
          <input
            type="checkbox"
            checked={form.ack}
            onChange={(e) => patch("ack", e.target.checked)}
          />
          <span>
            I have read and agree to the scope of work, the rate above, and
            the Terms &amp; Conditions, and I am authorized to sign on behalf
            of the account named above.
          </span>
        </label>

        <div className={styles.agSigTabs}>
          <button
            type="button"
            className={`${styles.agSigTab} ${sigMode === "draw" ? styles.agSigTabOn : ""}`}
            onClick={() => setSigMode("draw")}
          >
            Draw Signature
          </button>
          <button
            type="button"
            className={`${styles.agSigTab} ${sigMode === "typed" ? styles.agSigTabOn : ""}`}
            onClick={() => setSigMode("typed")}
          >
            Type Signature
          </button>
        </div>
        <div className={styles.agSigWrap}>
          {sigMode === "draw" ? (
            <div>
              <canvas
                ref={sigCanvasRef}
                className={styles.agSigPad}
                style={{ width: "100%", height: 150 }}
              />
              <div className={styles.agSigBase} />
              <button
                type="button"
                className={styles.agSigClear}
                onClick={clearSig}
              >
                Clear
              </button>
            </div>
          ) : (
            <div className={styles.agSigType}>
              <input
                value={sigTyped}
                onChange={(e) => setSigTyped(e.target.value)}
                placeholder="Type your full name"
              />
              <div className={styles.agSigStyles}>
                {SIG_FONTS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`${styles.agSigStyle} ${sigFont === f ? styles.agSigStyleOn : ""}`}
                    style={{ fontFamily: f }}
                    onClick={() => setSigFont(f)}
                  >
                    {sigTyped.trim() || "Your signature"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.agSignRow}>
          <div className={styles.agF}>
            <label>
              Printed Name <span className={styles.req}>*</span>
            </label>
            <input
              className={isBad("signer") ? styles.bad : ""}
              value={form.signer}
              onChange={(e) => patch("signer", e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className={styles.agF}>
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => patch("title", e.target.value)}
              placeholder="e.g. Property Manager"
            />
          </div>
        </div>

        <button
          type="button"
          className={styles.agSubmit}
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Sign & Accept Agreement"}
        </button>
        {error && <div className={styles.agErr}>{error}</div>}
      </div>
    </article>
  );
}

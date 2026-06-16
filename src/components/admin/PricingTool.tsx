"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";
import { autofillStreamsFromSchedule } from "@/lib/pricing";
import {
  SentProposalsList,
  type SentProposalRow,
} from "@/components/admin/SentProposalsList";
import styles from "./PricingTool.module.css";

export type PricingPropertyOption = {
  id: string;
  name: string;
  address: string;
  schedule: Array<{
    binType: string;
    action: string;
    binCount: number | null;
    binSize: number | null;
    dayOfWeek: number;
  }>;
};

export type SavedPricingQuote = {
  id: string;
  propertyId: string;
  propertyName: string;
  clientName: string;
  preparedBy: string | null;
  monthlyPrice: number;
  weeklyPrice: number;
  createdByName: string | null;
  createdAt: string;
};

/* ─── Constants ported from the standalone HTML ─────────────────── */

const RATE = {
  cart: { d1: 2, d2: 4, d3: 5 } as Record<Distance, number>,
  dumpster: { d1: 5, d2: 7, d3: 10 } as Record<Distance, number>,
  compactor: 5,
};

const LOADING = 1;
const STAIRS: Record<Stairs, number> = { none: 0, short: 5, long: 10 };
const ELEV = 5;
const TRUCK = 5;
const WEEKS = 4.3333;

const MINS = {
  carts: 0,
  dumpsters: 0,
  sowMin: 15,
  pull: 1,
  push: 1,
  elevTrips: 1,
  truckBins: 1,
} as const;

const STEP = { sowMin: 15 } as Record<string, number>;

const DIST: Array<[Distance, string]> = [
  ["d1", "0–50 ft"],
  ["d2", "50–100 ft"],
  ["d3", "100–200 ft"],
];

const STAIR_OPT: Array<[Stairs, string]> = [
  ["none", "None"],
  ["short", "Short (0–10)"],
  ["long", "Long (10–20)"],
];

const MODE_OPT: Array<[Mode, string]> = [
  ["both", "Pull + push"],
  ["pull", "Pull only"],
  ["cycle", "Bin cycle/swap"],
  ["sow", "Custom SOW"],
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const FULLDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SERVICE_COPY: Record<
  Mode,
  { title: string; body?: string; lead?: string }
> = {
  both: {
    title: "Push & pull valet service",
    body: "Before each scheduled pickup, we move your full carts and dumpsters from the enclosure to the curb for your hauler, then return them once they've been serviced. Every visit includes up to five minutes of cleanup to collect any waste left behind.",
  },
  pull: {
    title: "Pull-out service",
    body: "Before each scheduled pickup, we move your full carts and dumpsters out to the curb, staged and ready for your hauler. Every visit includes up to five minutes of cleanup.",
  },
  cycle: {
    title: "Bin cycle & swap service",
    body: "Dedicated on-site support that keeps your trash room flowing — cycling, swapping, and rotating containers so no single bin overfills and capacity stays balanced. Every visit includes the same cleanup, issue reporting, and service recommendations.",
  },
  sow: {
    title: "Monitor & maintenance service",
    lead: "A custom scope of work, tailored to what your property needs:",
  },
};

/* ─── Types ─────────────────────────────────────────────────────── */

type Distance = "d1" | "d2" | "d3";
type Stairs = "none" | "short" | "long";
type Mode = "both" | "pull" | "cycle" | "sow";
type StreamChoice =
  | ""
  | "Landfill"
  | "Organics"
  | "Recycling"
  | "Bottles/Cans"
  | "__other__";

type Stream = {
  id: number;
  stream: StreamChoice;
  customName: string;
  carts: number;
  dumpsters: number;
  sowMin: number;
  sowScope: string;
  dumpIsCompactor: boolean;
  dist: Distance;
  split: boolean;
  cartDist: Distance;
  dumpDist: Distance;
  mode: Mode;
  days: Set<number>;
  splitSched: boolean;
  cartDays: Set<number>;
  dumpDays: Set<number>;
  pull: number;
  push: number;
  stairs: Stairs;
  elev: boolean;
  elevTrips: number;
  truck: boolean;
  truckBins: number;
};

let nextStreamId = 0;
function newStream(): Stream {
  return {
    id: ++nextStreamId,
    stream: "",
    customName: "",
    carts: 0,
    dumpsters: 0,
    sowMin: 15,
    sowScope: "",
    dumpIsCompactor: false,
    dist: "d1",
    split: false,
    cartDist: "d1",
    dumpDist: "d1",
    mode: "both",
    days: new Set(),
    splitSched: false,
    cartDays: new Set(),
    dumpDays: new Set(),
    pull: 2,
    push: 1,
    stairs: "none",
    elev: false,
    elevTrips: 1,
    truck: false,
    truckBins: 1,
  };
}

/* ─── Helpers ───────────────────────────────────────────────────── */

function usd(n: number, cents = false): string {
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    })
  );
}

function cdaysOf(s: Stream): Set<number> {
  return s.splitSched ? s.cartDays : s.days;
}

function ddaysOf(s: Stream): Set<number> {
  return s.splitSched ? s.dumpDays : s.days;
}

function moveDayOn(s: Stream, d: number): boolean {
  return (
    (s.carts > 0 && cdaysOf(s).has(d)) ||
    (s.dumpsters > 0 && ddaysOf(s).has(d))
  );
}

function moveHandling(s: Stream, which: "pull" | "push", d: number): number {
  const cd = s.split ? s.cartDist : s.dist;
  const dd = s.split ? s.dumpDist : s.dist;
  const carts = cdaysOf(s).has(d) ? s.carts : 0;
  const dumps = ddaysOf(s).has(d) ? s.dumpsters : 0;
  let h = Math.ceil(carts / 2) * RATE.cart[cd] + dumps * RATE.dumpster[dd];
  // Compactor-style dumpster: 5-min cycle per dumpster on the pull-out only.
  if (which === "pull" && s.dumpIsCompactor) h += dumps * RATE.compactor;
  return h;
}

function cycleHandling(s: Stream, d: number): number {
  const carts = cdaysOf(s).has(d) ? s.carts : 0;
  const dumps = ddaysOf(s).has(d) ? s.dumpsters : 0;
  return (carts + dumps) * RATE.compactor;
}

function bins(s: Stream): number {
  return s.carts + s.dumpsters;
}

function hasMove(s: Stream): boolean {
  return (s.mode === "both" || s.mode === "pull") && bins(s) > 0;
}

function hasCycle(s: Stream): boolean {
  return s.mode === "cycle" && bins(s) > 0;
}

function hasSow(s: Stream): boolean {
  return s.mode === "sow" && s.sowMin > 0;
}

function hasUnits(s: Stream): boolean {
  return s.mode === "sow" ? s.sowMin > 0 : bins(s) > 0;
}

function scheduled(s: Stream): boolean {
  if (s.mode === "sow") return s.sowMin > 0 && s.days.size > 0;
  return (
    (s.carts > 0 && cdaysOf(s).size > 0) ||
    (s.dumpsters > 0 && ddaysOf(s).size > 0)
  );
}

function tripLabor(
  list: Stream[],
  handlingFn: (s: Stream) => number,
  crewKey: "pull" | "push",
  drive: number,
  cleanup: number,
  opts: { noCleanup?: boolean } = {},
): number {
  let handling = 0;
  let stairs = 0;
  let elevT = 0;
  let truckB = 0;
  let crew = 0;
  for (const s of list) {
    handling += handlingFn(s);
    stairs = Math.max(stairs, STAIRS[s.stairs]);
    elevT += s.elev ? s.elevTrips : 0;
    truckB += s.truck ? s.truckBins : 0;
    crew = Math.max(crew, s[crewKey]);
  }
  const cleanupMin = opts.noCleanup ? 0 : cleanup;
  const minutes = drive + LOADING + handling + cleanupMin + stairs + elevT * ELEV + truckB * TRUCK;
  return minutes * crew;
}

function fmtDays(set: Set<number>, full = false): string {
  const names = full ? FULLDAYS : DAYS;
  const sorted = [...set].sort((a, b) => a - b);
  if (full) {
    const ds = sorted.map((d) => FULLDAYS[d] + "s");
    if (ds.length <= 1) return ds[0] || "";
    return ds.slice(0, -1).join(", ") + " & " + ds[ds.length - 1];
  }
  return sorted.map((d) => names[d]).join(", ");
}

function binText(s: Stream): string {
  if (s.mode === "sow") return s.sowMin + " min on site";
  const p: string[] = [];
  if (s.dumpsters)
    p.push(
      s.dumpsters +
        (s.dumpIsCompactor && s.mode !== "cycle"
          ? " compactor dumpster"
          : " dumpster") +
        (s.dumpsters > 1 ? "s" : ""),
    );
  if (s.carts) p.push(s.carts + " cart" + (s.carts > 1 ? "s" : ""));
  return p.join(", ");
}

function schedText(s: Stream): string {
  if (s.mode !== "sow" && s.splitSched) {
    const pp: string[] = [];
    if (s.carts > 0 && s.cartDays.size)
      pp.push("Carts: " + fmtDays(s.cartDays, true));
    if (s.dumpsters > 0 && s.dumpDays.size)
      pp.push("Dumpsters: " + fmtDays(s.dumpDays, true));
    return pp.join(" · ");
  }
  return fmtDays(s.days, true);
}

function streamDisplayName(s: Stream): string {
  if (s.stream === "__other__") return s.customName.trim() || "Other";
  return s.stream || "Waste stream";
}

function extrasLabel(s: Stream): string {
  const ex: string[] = [];
  if (s.stairs !== "none") ex.push("stairs");
  if (s.elev) ex.push("elevator");
  if (s.truck) ex.push("truck");
  return ex.length ? ex.join(" · ") : "none";
}

/* ─── Save / load serialization ──────────────────────────────────
 * Streams hold Sets which JSON can't carry verbatim, so we convert
 * them to arrays on save and back to Sets on load. The wrapping
 * envelope also captures global settings so a reopened quote
 * restores the exact calculator state.
 */

type SerializedStream = Omit<Stream, "days" | "cartDays" | "dumpDays"> & {
  days: number[];
  cartDays: number[];
  dumpDays: number[];
};

type SerializedTool = {
  v: 1;
  streams: SerializedStream[];
  drive: number;
  cleanup: number;
  wage: number;
  overhead: number;
  minPrice: number;
  margin: number;
};

function serializeStream(s: Stream): SerializedStream {
  return {
    ...s,
    days: [...s.days],
    cartDays: [...s.cartDays],
    dumpDays: [...s.dumpDays],
  };
}

function deserializeStream(s: SerializedStream): Stream {
  return {
    ...s,
    id: ++nextStreamId,
    days: new Set(s.days ?? []),
    cartDays: new Set(s.cartDays ?? []),
    dumpDays: new Set(s.dumpDays ?? []),
  };
}

/* ─── Top-level component ───────────────────────────────────────── */

export function PricingTool({
  properties,
  savedQuotes,
  sentProposals = [],
}: {
  properties: PricingPropertyOption[];
  savedQuotes: SavedPricingQuote[];
  sentProposals?: SentProposalRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Guard so the URL-param effect only auto-loads once per mount —
  // otherwise switching properties manually would re-trigger it.
  const handledDeepLink = useRef(false);
  const [streams, setStreams] = useState<Stream[]>(() => [newStream()]);
  const [propertyId, setPropertyId] = useState<string>("");
  const [propName, setPropName] = useState("");
  const [propAddress, setPropAddress] = useState("");
  const [propBy, setPropBy] = useState("");
  const [drive, setDrive] = useState(5);
  const [cleanup, setCleanup] = useState(5);
  const [wage, setWage] = useState(25);
  const [overhead, setOverhead] = useState(25);
  const [minPrice, setMinPrice] = useState(0);
  const [margin, setMargin] = useState(50);
  const [showProposal, setShowProposal] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const calc = useMemo(() => {
    const active = streams.filter(scheduled);
    const orphan = streams.filter(
      (s) => hasUnits(s) && !scheduled(s),
    ).length;
    let weekly = 0;
    let pullTrips = 0;
    let pushTrips = 0;
    let cycleVisits = 0;
    let sowVisits = 0;

    for (let d = 0; d < 7; d++) {
      const pullList = active.filter((s) => hasMove(s) && moveDayOn(s, d));
      if (pullList.length) {
        weekly += tripLabor(
          pullList,
          (s) => moveHandling(s, "pull", d),
          "pull",
          drive,
          cleanup,
        );
        pullTrips++;
      }
      const pushList = active.filter(
        (s) => hasMove(s) && s.mode === "both" && moveDayOn(s, d),
      );
      if (pushList.length) {
        weekly += tripLabor(
          pushList,
          (s) => moveHandling(s, "push", d),
          "push",
          drive,
          cleanup,
        );
        pushTrips++;
      }
      const cycleList = active.filter((s) => hasCycle(s) && moveDayOn(s, d));
      if (cycleList.length) {
        weekly += tripLabor(
          cycleList,
          (s) => cycleHandling(s, d),
          "pull",
          drive,
          cleanup,
        );
        cycleVisits++;
      }
      const sowList = active.filter((s) => hasSow(s) && s.days.has(d));
      if (sowList.length) {
        weekly += tripLabor(
          sowList,
          (s) => s.sowMin,
          "pull",
          drive,
          cleanup,
          { noCleanup: true },
        );
        sowVisits++;
      }
    }

    const monthMin = weekly * WEEKS;
    const hours = monthMin / 60;
    const labor = hours * wage;
    const cost = labor * (1 + overhead / 100);
    let price = cost / (1 - margin / 100);
    price = Math.max(price, minPrice);

    return {
      active,
      orphan,
      pullTrips,
      pushTrips,
      cycleVisits,
      sowVisits,
      hours,
      labor,
      cost,
      price: Math.round(price),
      has: active.length > 0,
    };
  }, [streams, drive, cleanup, wage, overhead, minPrice, margin]);

  function patchStream(id: number, patch: Partial<Stream>) {
    setStreams((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  function stepStream(id: number, field: keyof Stream, delta: number) {
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const min = (MINS as Record<string, number>)[field as string] ?? 0;
        const step = STEP[field as string] ?? 1;
        const cur = s[field] as unknown as number;
        return { ...s, [field]: Math.max(min, cur + delta * step) };
      }),
    );
  }

  function toggleDay(id: number, set: "days" | "cartDays" | "dumpDays", d: number) {
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newSet = new Set(s[set]);
        if (newSet.has(d)) newSet.delete(d);
        else newSet.add(d);
        return { ...s, [set]: newSet };
      }),
    );
  }

  function onSplitSchedToggle(id: number, on: boolean) {
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (on) {
          // Seed both split sets from the merged days if they're empty,
          // so flipping the toggle doesn't wipe what the admin had.
          if (s.cartDays.size === 0 && s.dumpDays.size === 0) {
            return {
              ...s,
              splitSched: true,
              cartDays: new Set(s.days),
              dumpDays: new Set(s.days),
            };
          }
          return { ...s, splitSched: true };
        }
        return {
          ...s,
          splitSched: false,
          days: new Set([...s.cartDays, ...s.dumpDays]),
        };
      }),
    );
  }

  function addStream() {
    setStreams((prev) => [...prev, newStream()]);
  }

  function removeStream(id: number) {
    setStreams((prev) => prev.filter((s) => s.id !== id));
  }

  function reset() {
    nextStreamId = 0;
    setStreams([newStream()]);
    setDrive(5);
    setCleanup(5);
    setWage(25);
    setOverhead(25);
    setMinPrice(0);
    setMargin(50);
    setPropertyId("");
    setPropName("");
    setPropAddress("");
    setPropBy("");
    setShowProposal(false);
    setSavedQuoteId(null);
    setSaveError(null);
  }

  function onPropertyChange(id: string) {
    // Switching properties clears any in-flight save state and
    // repopulates the calculator from the property's Service
    // Schedule when bin sizes are set. The "Prepared by" stays —
    // it's usually the same admin.
    setPropertyId(id);
    setSavedQuoteId(null);
    setSaveError(null);
    const p = id ? properties.find((x) => x.id === id) : null;
    setPropName(p?.name ?? "");
    setPropAddress(p?.address ?? "");
    nextStreamId = 0;

    if (p && p.schedule.length > 0) {
      const autofilled = autofillStreamsFromSchedule(p.schedule);
      if (autofilled.length > 0) {
        // Map each autofilled group onto a full Stream by starting
        // from newStream()'s defaults and overlaying the schedule-
        // derived fields. Everything stays editable — admin can tap
        // any field to override.
        setStreams(
          autofilled.map((a) => {
            const base = newStream();
            base.stream = a.stream as Stream["stream"];
            base.customName = a.customName;
            base.carts = a.carts;
            base.dumpsters = a.dumpsters;
            base.days = new Set(a.days);
            base.mode = a.mode;
            return base;
          }),
        );
        return;
      }
    }
    setStreams([newStream()]);
  }

  async function saveQuote() {
    if (!calc.has) return;
    if (!propertyId) {
      setSaveError(
        "Pick a property from the dropdown before saving — saved quotes are tied to a property.",
      );
      return;
    }
    setSaving(true);
    setSaveError(null);
    const data: SerializedTool = {
      v: 1,
      streams: streams.map(serializeStream),
      drive,
      cleanup,
      wage,
      overhead,
      minPrice,
      margin,
    };
    const weeklyPrice = Math.round(calc.price / WEEKS);
    try {
      const res = await fetch("/api/admin/pricing-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          clientName: propName.trim() || "Client",
          preparedBy: propBy.trim() || null,
          data,
          monthlyPrice: calc.price,
          weeklyPrice,
          breakEvenCost: calc.cost,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Save failed (${res.status})`);
      }
      const j = (await res.json()) as { id: string };
      setSavedQuoteId(j.id);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function reopen(quoteId: string) {
    try {
      const res = await fetch(`/api/admin/pricing-quotes/${quoteId}`);
      if (!res.ok) throw new Error(`Couldn't load quote (${res.status})`);
      const q = (await res.json()) as {
        id: string;
        propertyId: string;
        clientName: string;
        preparedBy: string | null;
        data: SerializedTool;
      };
      nextStreamId = 0;
      setPropertyId(q.propertyId);
      setPropName(q.clientName);
      setPropBy(q.preparedBy ?? "");
      setStreams(q.data.streams.map(deserializeStream));
      setDrive(q.data.drive);
      setCleanup(q.data.cleanup);
      setWage(q.data.wage);
      setOverhead(q.data.overhead);
      setMinPrice(q.data.minPrice);
      setMargin(q.data.margin);
      setSavedQuoteId(q.id);
      setSaveError(null);
      setShowProposal(false);
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        /* ignore */
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't reopen quote");
    }
  }

  async function deleteSaved(quoteId: string) {
    if (!confirm("Delete this saved quote? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/pricing-quotes/${quoteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      if (savedQuoteId === quoteId) setSavedQuoteId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  // Deep-link support for /admin/properties/[id]/pricing → calculator.
  // ?quote=<id> reopens a saved quote (fetches and loads everything);
  // ?property=<id> just preselects the property + autofills from its
  // schedule. Runs once per mount.
  useEffect(() => {
    if (handledDeepLink.current) return;
    const quoteParam = searchParams.get("quote");
    const propertyParam = searchParams.get("property");
    if (!quoteParam && !propertyParam) return;
    handledDeepLink.current = true;
    if (quoteParam) {
      void reopen(quoteParam);
    } else if (propertyParam) {
      onPropertyChange(propertyParam);
    }
    // We intentionally don't depend on the function refs — they're
    // stable enough for a once-per-mount effect, and we don't want
    // to re-fire when state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (showProposal && calc.has) {
    const proposalData = {
      v: 1 as const,
      streams: calc.active.map(serializeStream),
      drive,
      cleanup,
      wage,
      overhead,
      minPrice,
      margin,
    };
    return (
      <ProposalOutput
        propName={propName}
        propAddress={propAddress}
        propBy={propBy}
        streams={calc.active}
        monthlyPrice={calc.price}
        weeklyPrice={Math.round(calc.price / WEEKS)}
        breakEvenCost={calc.cost}
        proposalData={proposalData}
        propertyId={propertyId}
        savedQuoteId={savedQuoteId}
        onBack={() => setShowProposal(false)}
      />
    );
  }

  const multi = streams.length > 1;

  return (
    <div className={styles.root}>
      <div className={styles.wrap}>
        <header className={styles.top}>
          <BrandMark />
          <h1>Onsite Waste Pricing Tool</h1>
          <p>
            Add each service line, choose how your team handles it, and tap
            the days you&apos;re on site. Anything serviced on the same day
            automatically shares a trip — so the price stays consistent
            however you enter it.
          </p>
        </header>

        {sentProposals.length > 0 && (
          <div className={styles.card} style={{ marginBottom: 16 }}>
            <div className={styles.sectLabel} style={{ marginBottom: 10 }}>
              Sent proposals &amp; signed agreements
            </div>
            <SentProposalsList proposals={sentProposals} showProperty />
          </div>
        )}

        {savedQuotes.length > 0 && (
          <SavedQuotesList
            quotes={savedQuotes}
            onReopen={reopen}
            onDelete={deleteSaved}
          />
        )}

        <div className={styles.layout}>
          <div>
            <div className={styles.card}>
              <div className={styles.sectLabel} style={{ marginBottom: 10 }}>
                Property
              </div>
              {properties.length > 0 && (
                <select
                  className={styles.propfield}
                  value={propertyId}
                  onChange={(e) => onPropertyChange(e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  <option value="">— Pick a saved property to save against —</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                className={styles.propfield}
                value={propName}
                onChange={(e) => setPropName(e.target.value)}
                placeholder="Property / client name"
              />
              <input
                className={styles.propfield}
                value={propAddress}
                onChange={(e) => setPropAddress(e.target.value)}
                placeholder="Property address (optional)"
              />
              <input
                className={styles.propfield}
                value={propBy}
                onChange={(e) => setPropBy(e.target.value)}
                placeholder="Prepared by (optional)"
              />
            </div>

            {streams.map((s, i) => (
              <StreamCard
                key={s.id}
                s={s}
                index={i}
                multi={multi}
                onPatch={(patch) => patchStream(s.id, patch)}
                onStep={(field, delta) => stepStream(s.id, field, delta)}
                onToggleDay={(set, d) => toggleDay(s.id, set, d)}
                onSplitSched={(on) => onSplitSchedToggle(s.id, on)}
                onRemove={() => removeStream(s.id)}
              />
            ))}

            <button
              type="button"
              className={styles.addBtn}
              onClick={addStream}
            >
              + Add another service line
            </button>

            <details className={styles.card} style={{ padding: 0 }}>
              <summary
                style={{
                  listStyle: "none",
                  cursor: "pointer",
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 700,
                  fontSize: 17,
                  fontFamily: "var(--display)",
                }}
              >
                Advanced &amp; rates
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 13,
                    color: "var(--faint)",
                    marginLeft: "auto",
                    marginRight: 12,
                  }}
                >
                  defaults — edit only if needed
                </span>
              </summary>
              <div style={{ padding: "0 22px 20px" }}>
                <NumberField
                  label="Drive time per trip"
                  sub="Higher for out-of-area bids"
                  value={drive}
                  onChange={setDrive}
                  suffix="min"
                  min={0}
                />
                <NumberField
                  label="Cleanup time per trip"
                  value={cleanup}
                  onChange={setCleanup}
                  suffix="min"
                  min={0}
                />
                <NumberField
                  label="Loaded porter wage"
                  value={wage}
                  onChange={setWage}
                  prefix="$"
                  suffix="/hr"
                  step={0.5}
                  min={0}
                />
                <NumberField
                  label="Overhead"
                  value={overhead}
                  onChange={setOverhead}
                  suffix="%"
                  min={0}
                />
                <NumberField
                  label="Minimum monthly price"
                  sub="Quote never drops below this"
                  value={minPrice}
                  onChange={setMinPrice}
                  prefix="$"
                  step={5}
                  min={0}
                />
              </div>
            </details>
          </div>

          <ResultPanel
            has={calc.has}
            price={calc.price}
            cost={calc.cost}
            labor={calc.labor}
            hours={calc.hours}
            margin={margin}
            onMarginChange={setMargin}
            orphan={calc.orphan}
            streams={calc.active}
            pullTrips={calc.pullTrips}
            pushTrips={calc.pushTrips}
            cycleVisits={calc.cycleVisits}
            sowVisits={calc.sowVisits}
            onGenerate={() => setShowProposal(true)}
            onReset={reset}
            onSave={saveQuote}
            saving={saving}
            saved={!!savedQuoteId}
            saveError={saveError}
            propertyPicked={!!propertyId}
          />
        </div>

        <footer className={styles.foot}>
          Time standards from your <b>Pricing Table (6/2/2026)</b> · $25/hr ·
          25% overhead · 4.3333 wks/mo
        </footer>
      </div>
    </div>
  );
}

/* ─── Stream card ───────────────────────────────────────────────── */

function StreamCard({
  s,
  index,
  multi,
  onPatch,
  onStep,
  onToggleDay,
  onSplitSched,
  onRemove,
}: {
  s: Stream;
  index: number;
  multi: boolean;
  onPatch: (patch: Partial<Stream>) => void;
  onStep: (field: keyof Stream, delta: number) => void;
  onToggleDay: (set: "days" | "cartDays" | "dumpDays", d: number) => void;
  onSplitSched: (on: boolean) => void;
  onRemove: () => void;
}) {
  const splitActive = s.splitSched && s.mode !== "sow";

  return (
    <section className={styles.card}>
      <div className={styles.groupHead}>
        <span className={styles.qNum}>{index + 1}</span>
        <select
          className={`${styles.gselect} ${s.stream === "" ? styles.gselectEmpty : ""}`}
          value={s.stream}
          onChange={(e) =>
            onPatch({ stream: e.target.value as StreamChoice })
          }
        >
          <option value="">Select waste stream…</option>
          <option value="Landfill">Landfill</option>
          <option value="Organics">Organics</option>
          <option value="Recycling">Recycling</option>
          <option value="Bottles/Cans">Bottles/Cans</option>
          <option value="__other__">Other…</option>
        </select>
        {multi && (
          <button
            type="button"
            className={styles.rm}
            onClick={onRemove}
            title="Remove stream"
            aria-label="Remove stream"
          >
            ×
          </button>
        )}
      </div>

      {s.stream === "__other__" && (
        <input
          className={styles.gcustom}
          value={s.customName}
          onChange={(e) => onPatch({ customName: e.target.value })}
          placeholder="Name this stream"
        />
      )}

      <div className={styles.sect}>
        <div className={styles.sectLabel}>How we service it</div>
        <Seg
          options={MODE_OPT}
          value={s.mode}
          onChange={(v) => onPatch({ mode: v })}
          grid4
        />

        {!splitActive && (
          <>
            <Week
              value={s.days}
              onToggle={(d) => onToggleDay("days", d)}
            />
            <div className={styles.weekHint}>
              Tap each day this line is serviced. Two days = serviced twice a
              week.
            </div>
          </>
        )}

        {s.mode !== "sow" && (
          <div className={styles.toggleLine}>
            <div className={styles.rowLabel}>
              Carts &amp; dumpsters serviced on different days
              <span className={styles.sub}>
                e.g. dumpster Fridays, carts Tuesdays
              </span>
            </div>
            <Switch
              checked={s.splitSched}
              onChange={onSplitSched}
            />
          </div>
        )}

        {splitActive && (
          <div className={styles.reveal}>
            <div className={styles.miniLabel}>Cart service days</div>
            <Week
              value={s.cartDays}
              onToggle={(d) => onToggleDay("cartDays", d)}
            />
            <div className={styles.miniLabel} style={{ marginTop: 10 }}>
              Dumpster service days
            </div>
            <Week
              value={s.dumpDays}
              onToggle={(d) => onToggleDay("dumpDays", d)}
            />
          </div>
        )}
      </div>

      {s.mode !== "sow" && (
        <div className={styles.sect}>
          <div className={styles.sectLabel}>Bins on this line</div>
          <Stepper
            label="Carts"
            sub="Handled in pairs"
            value={s.carts}
            onStep={(d) => onStep("carts", d)}
          />
          <Stepper
            label="Dumpsters"
            sub="1–4 yard, one at a time"
            value={s.dumpsters}
            onStep={(d) => onStep("dumpsters", d)}
          />
          {(s.mode === "both" || s.mode === "pull") && (
            <div className={styles.toggleLine} style={{ paddingLeft: 2 }}>
              <div className={styles.rowLabel} style={{ fontWeight: 500, fontSize: 14 }}>
                Compactor-style dumpster
                <span className={styles.sub}>
                  Adds a 5-min cycle per dumpster on the pull-out
                </span>
              </div>
              <Switch
                checked={s.dumpIsCompactor}
                onChange={(v) => onPatch({ dumpIsCompactor: v })}
              />
            </div>
          )}
        </div>
      )}

      {s.mode !== "cycle" && s.mode !== "sow" && (
        <div className={styles.sect}>
          <div className={styles.sectLabel}>Distance to curb</div>
          <Seg
            options={DIST}
            value={s.dist}
            onChange={(v) => onPatch({ dist: v })}
          />
          <div className={styles.toggleLine}>
            <div className={styles.rowLabel}>
              Bins are in different spots
              <span className={styles.sub}>
                e.g. dumpster in the garage, carts at the curb
              </span>
            </div>
            <Switch
              checked={s.split}
              onChange={(v) => onPatch({ split: v })}
            />
          </div>
          {s.split && (
            <div className={styles.reveal}>
              <div className={styles.miniLabel}>Carts distance</div>
              <Seg
                options={DIST}
                value={s.cartDist}
                onChange={(v) => onPatch({ cartDist: v })}
              />
              <div className={styles.miniLabel}>Dumpsters distance</div>
              <Seg
                options={DIST}
                value={s.dumpDist}
                onChange={(v) => onPatch({ dumpDist: v })}
              />
            </div>
          )}
        </div>
      )}

      {s.mode === "sow" && (
        <div className={styles.sect}>
          <div className={styles.sectLabel}>Time on site</div>
          <Stepper
            label="Minutes per visit"
            sub="15-minute increments · drive time included, no cleanup"
            value={s.sowMin}
            onStep={(d) => onStep("sowMin", d)}
          />
          <div className={styles.scopeRow}>
            <div
              className={styles.rowLabel}
              style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}
            >
              Scope of work
              <span className={styles.sub}>
                Describe what the client requested — this appears on the
                proposal
              </span>
            </div>
            <textarea
              className={styles.sowscope}
              rows={3}
              value={s.sowScope}
              onChange={(e) => onPatch({ sowScope: e.target.value })}
              placeholder="e.g. Arms-length sort of all bins, pull contamination, break down and consolidate overflow, photo-document and report bulky items for removal."
            />
          </div>
        </div>
      )}

      <div className={styles.sect}>
        <div className={styles.sectLabel}>Crew</div>
        <Stepper
          label={
            s.mode === "sow"
              ? "Porters on site"
              : s.mode === "cycle"
                ? "Cycle / swap crew"
                : "Night pull crew"
          }
          sub="Porters — bump for difficulty or truck"
          value={s.pull}
          onStep={(d) => onStep("pull", d)}
        />
        {s.mode === "both" && (
          <Stepper
            label="Morning push crew"
            sub="Porters"
            value={s.push}
            onStep={(d) => onStep("push", d)}
          />
        )}
      </div>

      <details className={styles.acc}>
        <summary>
          Access &amp; extras
          <span className={styles.sm}>{extrasLabel(s)}</span>
          <span className="chev">▼</span>
        </summary>
        <div style={{ paddingTop: 6 }}>
          <div className={styles.miniLabel} style={{ marginTop: 4 }}>
            Stairs
          </div>
          <Seg
            options={STAIR_OPT}
            value={s.stairs}
            onChange={(v) => onPatch({ stairs: v })}
          />
          <div className={styles.toggleLine}>
            <div className={styles.rowLabel}>Elevator needed</div>
            <Switch
              checked={s.elev}
              onChange={(v) => onPatch({ elev: v })}
            />
          </div>
          {s.elev && (
            <div className={styles.reveal}>
              <Stepper
                label="Elevator trips per visit"
                value={s.elevTrips}
                onStep={(d) => onStep("elevTrips", d)}
                tight
              />
            </div>
          )}
          <div className={styles.toggleLine}>
            <div className={styles.rowLabel}>Scout truck needed</div>
            <Switch
              checked={s.truck}
              onChange={(v) => onPatch({ truck: v })}
            />
          </div>
          {s.truck && (
            <div className={styles.reveal}>
              <Stepper
                label="Bins strapped to truck"
                value={s.truckBins}
                onStep={(d) => onStep("truckBins", d)}
                tight
              />
            </div>
          )}
        </div>
      </details>
    </section>
  );
}

/* ─── Result panel ──────────────────────────────────────────────── */

function ResultPanel({
  has,
  price,
  cost,
  labor,
  hours,
  margin,
  onMarginChange,
  orphan,
  streams,
  pullTrips,
  pushTrips,
  cycleVisits,
  sowVisits,
  onGenerate,
  onReset,
  onSave,
  saving,
  saved,
  saveError,
  propertyPicked,
}: {
  has: boolean;
  price: number;
  cost: number;
  labor: number;
  hours: number;
  margin: number;
  onMarginChange: (v: number) => void;
  orphan: number;
  streams: Stream[];
  pullTrips: number;
  pushTrips: number;
  cycleVisits: number;
  sowVisits: number;
  onGenerate: () => void;
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  saveError: string | null;
  propertyPicked: boolean;
}) {
  return (
    <div className={styles.resultWrap}>
      <div className={styles.result}>
        <div className={styles.rEyebrow}>Monthly quote</div>
        <div className={styles.price}>
          {has ? usd(price) : "$0"}
          <span className={styles.per}> /mo</span>
        </div>
        {!has && (
          <div className={styles.emptyNote}>
            Set up a service line and tap its days to see a price.
          </div>
        )}
        {orphan > 0 && (
          <div className={styles.warn}>
            {orphan} {orphan > 1 ? "lines are" : "line is"} set up but missing
            service days — not yet in the price.
          </div>
        )}

        <div className={styles.sliderBlock}>
          <div className={styles.sliderHead}>
            <span className={styles.sliderT}>Margin</span>
            <span
              className={`${styles.sliderV} ${margin < 25 ? styles.caution : ""}`}
            >
              {margin}%
            </span>
          </div>
          <input
            type="range"
            className={styles.range}
            min={0}
            max={75}
            step={1}
            value={margin}
            onChange={(e) => onMarginChange(Number(e.target.value))}
          />
          <div className={styles.sliderFoot}>
            <span>At cost</span>
            <span>
              {has ? `break-even ${usd(Math.round(cost))}` : "break-even —"}
            </span>
          </div>
        </div>

        <div className={styles.breakdown}>
          {has &&
            streams.map((s) => {
              const nm = streamDisplayName(s);
              const dl =
                s.mode !== "sow" && s.splitSched
                  ? [
                      s.carts > 0 && s.cartDays.size
                        ? "C " + fmtDays(s.cartDays)
                        : "",
                      s.dumpsters > 0 && s.dumpDays.size
                        ? "D " + fmtDays(s.dumpDays)
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : fmtDays(s.days);
              const tag =
                s.mode === "sow"
                  ? " · custom SOW"
                  : s.mode === "cycle"
                    ? " · cycle/swap"
                    : s.mode === "pull"
                      ? " · pull only"
                      : "";
              return (
                <div key={s.id} className={styles.bdSched}>
                  <span>{nm}</span>
                  <span className={styles.bdV}>
                    {dl}
                    {tag}
                  </span>
                </div>
              );
            })}
          {has && <div className={styles.bdDivider} />}
          {pullTrips > 0 && (
            <BdRow label="Pull trips / week" value={pullTrips} />
          )}
          {pushTrips > 0 && (
            <BdRow label="Push trips / week" value={pushTrips} />
          )}
          {cycleVisits > 0 && (
            <BdRow label="Cycle visits / week" value={cycleVisits} />
          )}
          {sowVisits > 0 && (
            <BdRow label="SOW visits / week" value={sowVisits} />
          )}
          <BdRow
            label="Total trips / week"
            value={has ? pullTrips + pushTrips + cycleVisits + sowVisits : "—"}
          />
          <BdRow
            label="Labor hours / month"
            value={has ? `${hours.toFixed(1)} hrs` : "—"}
          />
          <BdRow label="Labor cost" value={has ? usd(labor, true) : "—"} />
          <BdRow
            label="+ overhead"
            value={has ? usd(cost - labor, true) : "—"}
          />
          <BdRow
            label="Your cost"
            value={has ? usd(cost, true) : "—"}
            total
          />
        </div>

        <button
          type="button"
          className={styles.gen}
          onClick={onGenerate}
          disabled={!has}
        >
          Generate client proposal
        </button>
        <button
          type="button"
          className={styles.gen}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#cfe3d5",
            marginTop: 8,
          }}
          onClick={onSave}
          disabled={!has || saving || saved}
        >
          {saved
            ? "✓ Saved to property"
            : saving
              ? "Saving…"
              : "Save quote to property"}
        </button>
        {!propertyPicked && has && (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#9dc4ac",
              textAlign: "center",
            }}
          >
            Pick a property at the top to enable saving.
          </div>
        )}
        {saveError && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12.5,
              color: "#ffd79a",
              padding: "8px 11px",
              background: "rgba(255,200,120,0.14)",
              border: "1px solid rgba(255,200,120,0.35)",
              borderRadius: 9,
            }}
          >
            {saveError}
          </div>
        )}
        <button
          type="button"
          className={styles.reset}
          onClick={onReset}
        >
          Reset for a new property
        </button>
      </div>
    </div>
  );
}

function BdRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number | string;
  total?: boolean;
}) {
  return (
    <div className={`${styles.bdRow} ${total ? styles.bdRowTotal : ""}`}>
      <span>{label}</span>
      <span className={styles.bdV}>{value}</span>
    </div>
  );
}

/* ─── Proposal output ──────────────────────────────────────────── */

function ProposalOutput({
  propName,
  propAddress,
  propBy,
  streams,
  monthlyPrice,
  weeklyPrice,
  breakEvenCost,
  proposalData,
  propertyId,
  savedQuoteId,
  onBack,
}: {
  propName: string;
  propAddress: string;
  propBy: string;
  streams: Stream[];
  monthlyPrice: number;
  weeklyPrice: number;
  breakEvenCost: number;
  proposalData: SerializedTool;
  propertyId: string;
  savedQuoteId: string | null;
  onBack: () => void;
}) {
  const name = propName.trim() || "Prospective Client";
  const address = propAddress.trim();
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const order: Mode[] = ["both", "pull", "cycle", "sow"];
  const present = order.filter((m) => streams.some((s) => s.mode === m));
  const hauler = present.some((m) => m !== "sow");
  const weekly = weeklyPrice;

  const benefits: Array<{ title: string; body: string }> = [];
  if (hauler) {
    benefits.push({
      title: "Dispatch & hauler coordination",
      body: "we work directly with your hauler so you don't have to. If your hauler misses one of their scheduled pickups, our team is the one that contacts them, makes the calls, waits on hold, and arranges the return pickup — so a pickup your hauler missed gets resolved without you chasing it down. All at no extra charge.",
    });
  }
  benefits.push(
    {
      title: "On-site waste monitoring",
      body: "on every visit we watch for the things that quietly disrupt your pickups, like bulky items blocking the trash room, appliances dumped in a container, or a broken dumpster wheel — catching them early and helping get them resolved so your scheduled service stays on track.",
    },
    {
      title: "Contamination & overflow watch",
      body: "we watch usage for contamination and overflow and recommend right-sizing your service to help you avoid overflow fees and contamination fines.",
    },
    {
      title: "Waste diversion reporting",
      body: "clear, visual reports of the waste you generate, reviewed with you to track your diversion rate and reach your goals.",
    },
  );

  return (
    <div className={styles.root}>
      <div className={styles.paper}>
        <div className={`${styles.proposalActions} ${styles.noPrint}`}>
          <button type="button" onClick={onBack}>
            ← Back to calculator
          </button>
          <SendProposalButton
            propertyId={propertyId}
            savedQuoteId={savedQuoteId}
            clientName={name}
            clientAddress={address}
            preparedBy={propBy.trim() || null}
            monthlyPrice={monthlyPrice}
            weeklyPrice={weeklyPrice}
            breakEvenCost={breakEvenCost}
            data={proposalData}
          />
          <button
            type="button"
            className={styles.pprint}
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>
        </div>

        <header className={styles.phead}>
          <BrandMark height={60} />
          <div className={styles.pmeta}>
            Service Proposal
            <br />
            {today}
          </div>
        </header>

        <div className={styles.pfor}>
          <div>
            <span className={styles.plabel}>Prepared for</span>
            {name}
            {address && (
              <div
                style={{
                  fontSize: 13,
                  color: "#777",
                  marginTop: 2,
                  fontWeight: 400,
                }}
              >
                {address}
              </div>
            )}
          </div>
          {propBy && (
            <div>
              <span className={styles.plabel}>Prepared by</span>
              {propBy}
            </div>
          )}
        </div>

        <h2 className={styles.ptitle}>Onsite Waste Service</h2>

        {present.map((m) => {
          if (m === "sow") {
            return (
              <div key={m} className={styles.pservice}>
                <h3 className={styles.psvcH}>{SERVICE_COPY.sow.title}</h3>
                <p className={styles.pintro}>{SERVICE_COPY.sow.lead}</p>
                {streams
                  .filter((s) => s.mode === "sow")
                  .map((s) => (
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
              <th>Service line</th>
              <th>Detail</th>
              <th>Service schedule</th>
            </tr>
          </thead>
          <tbody>
            {streams.map((s) => (
              <tr key={s.id}>
                <td className={styles.pname}>{streamDisplayName(s)}</td>
                <td>{binText(s)}</td>
                <td>{schedText(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.pincl}>
          <div className={styles.plabel} style={{ marginBottom: 12 }}>
            Included with your service
          </div>
          <ul className={styles.pbenefits}>
            {benefits.map((b) => (
              <li key={b.title}>
                <span className={styles.pbT}>{b.title}</span> — {b.body}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.pprice}>
          <div className={styles.prateMain}>
            <span className={styles.plabel} style={{ margin: "0 0 3px" }}>
              Service rate
            </span>
            <span className={styles.pamount}>
              {usd(weekly)}
              <span className={styles.ppermo}> / week</span>
            </span>
          </div>
          <div className={styles.prateMo}>
            <span className={styles.prateMoAmt}>{usd(monthlyPrice)}</span>
            <span className={styles.prateMoLbl}>billed monthly</span>
          </div>
        </div>
        <div className={styles.prateNote}>
          Weekly rate billed monthly, based on an average of 4.33 service
          weeks per month.
        </div>

        <div className={styles.popt}>
          <span className={styles.plabel}>Optional add-on services</span>
          <ul className={styles.poptList}>
            <li>Junk removal of bulky waste</li>
            <li>Pressure washing for trash room grounds</li>
            <li>
              Additional on-site cleanup beyond the scope of work — billed at
              $2 per minute (15-minute increments)
            </li>
          </ul>
        </div>

        <p className={styles.pterms}>
          This proposal is valid for 30 days from the date above. Service
          begins upon a signed agreement. Pricing reflects the schedule
          shown; changes to container count or collection frequency may
          adjust the rate.
        </p>

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
      </div>
    </div>
  );
}

/* ─── Small primitives ─────────────────────────────────────────── */

function Seg<T extends string>({
  options,
  value,
  onChange,
  grid4,
}: {
  options: Array<[T, string]>;
  value: T;
  onChange: (v: T) => void;
  grid4?: boolean;
}) {
  return (
    <div
      className={`${styles.seg} ${grid4 ? styles.segGrid4 : ""}`}
      role="group"
    >
      {options.map(([v, t]) => (
        <button
          key={v}
          type="button"
          className={value === v ? styles.segActive : ""}
          onClick={() => onChange(v)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Stepper({
  label,
  sub,
  value,
  onStep,
  tight,
}: {
  label: string;
  sub?: string;
  value: number;
  onStep: (delta: number) => void;
  tight?: boolean;
}) {
  return (
    <div className={tight ? styles.field : styles.row}>
      <div className={styles.rowLabel}>
        {label}
        {sub && <span className={styles.sub}>{sub}</span>}
      </div>
      <div className={styles.stepper}>
        <button type="button" onClick={() => onStep(-1)} aria-label="Decrease">
          −
        </button>
        <span className={styles.stepperVal}>{value}</span>
        <button type="button" onClick={() => onStep(1)} aria-label="Increase">
          +
        </button>
      </div>
    </div>
  );
}

function Week({
  value,
  onToggle,
}: {
  value: Set<number>;
  onToggle: (d: number) => void;
}) {
  return (
    <div className={styles.week}>
      {DAYS.map((d, i) => (
        <button
          key={d}
          type="button"
          className={value.has(i) ? styles.weekOn : ""}
          onClick={() => onToggle(i)}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={styles.switch}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.track} />
      <span className={styles.knob} />
    </label>
  );
}

function NumberField({
  label,
  sub,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min,
}: {
  label: string;
  sub?: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.rowLabel}>
        {label}
        {sub && <span className={styles.sub}>{sub}</span>}
      </div>
      <div className={styles.fieldInner}>
        {prefix && <span className={styles.unit}>{prefix}</span>}
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && <span className={styles.unit}>{suffix}</span>}
      </div>
    </div>
  );
}

function SavedQuotesList({
  quotes,
  onReopen,
  onDelete,
}: {
  quotes: SavedPricingQuote[];
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={styles.card} style={{ marginBottom: 16 }}>
      <div className={styles.sectLabel} style={{ marginBottom: 10 }}>
        Saved quotes
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)" }}>Property</th>
              <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)" }}>Client</th>
              <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)" }}>Monthly</th>
              <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)" }}>Saved</th>
              <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)" }}></th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id}>
                <td style={{ padding: "8px", borderBottom: "1px solid var(--line)" }}>
                  {q.propertyName}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid var(--line)" }}>
                  {q.clientName}
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid var(--line)",
                    fontFamily: "var(--display)",
                    fontWeight: 700,
                  }}
                >
                  {usd(q.monthlyPrice)}/mo
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid var(--line)",
                    color: "var(--muted)",
                    fontSize: 12.5,
                  }}
                >
                  {new Date(q.createdAt).toLocaleDateString()}
                  {q.createdByName && (
                    <span style={{ color: "var(--faint)" }}> · {q.createdByName}</span>
                  )}
                </td>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid var(--line)",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onReopen(q.id)}
                    style={{
                      border: "1px solid var(--line-strong)",
                      background: "var(--surface)",
                      borderRadius: 8,
                      padding: "4px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      color: "var(--ink)",
                    }}
                  >
                    Reopen
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(q.id)}
                    className={styles.rm}
                    style={{ marginLeft: 4 }}
                    aria-label="Delete quote"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SendProposalButton({
  propertyId,
  savedQuoteId,
  clientName,
  clientAddress,
  preparedBy,
  monthlyPrice,
  weeklyPrice,
  breakEvenCost,
  data,
}: {
  propertyId: string;
  savedQuoteId: string | null;
  clientName: string;
  clientAddress: string;
  preparedBy: string | null;
  monthlyPrice: number;
  weeklyPrice: number;
  breakEvenCost: number;
  data: SerializedTool;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentLink, setSentLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    if (!email.trim()) {
      setErr("Enter the client's email.");
      return;
    }
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propertyId || null,
          pricingQuoteId: savedQuoteId,
          clientName,
          clientAddress: clientAddress || null,
          clientEmail: email.trim(),
          preparedBy,
          data,
          monthlyPrice,
          weeklyPrice,
          breakEvenCost,
          message: message.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Send failed (${res.status})`);
      }
      const j = (await res.json()) as { token: string; emailSkipped?: boolean };
      setSentLink(`/proposals/${j.token}`);
      if (j.emailSkipped) {
        setErr(
          "Saved, but email wasn't sent (SENDGRID_API_KEY not set). Copy the link below.",
        );
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  if (sentLink) {
    const fullLink = `${typeof window !== "undefined" ? window.location.origin : ""}${sentLink}`;
    return (
      <div
        style={{
          flex: "1 1 100%",
          background: "#E7F1EA",
          border: "1px solid #CFE3D6",
          borderRadius: 9,
          padding: "10px 14px",
          fontSize: 13,
          color: "#0E3F27",
        }}
      >
        <b>✓ Proposal sent to {email}.</b> They&apos;ll receive a link to view
        and accept it.
        {err && (
          <div style={{ color: "#7C4A00", marginTop: 6 }}>{err}</div>
        )}
        <div style={{ marginTop: 6, fontSize: 12 }}>
          Link:{" "}
          <a
            href={sentLink}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#0E3F27", textDecoration: "underline" }}
          >
            {fullLink}
          </a>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        style={{
          background: "#1FA864",
          borderColor: "#1FA864",
          color: "#06281A",
          fontWeight: 700,
        }}
        onClick={() => setOpen(true)}
      >
        Send to client →
      </button>
    );
  }

  return (
    <div
      style={{
        flex: "1 1 100%",
        background: "#F7F6F1",
        border: "1px solid #ECEAE2",
        borderRadius: 9,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <input
        type="email"
        placeholder="Client email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: "9px 11px",
          borderRadius: 8,
          border: "1px solid #C7C5BB",
          fontSize: 14,
          fontFamily: "inherit",
        }}
      />
      <textarea
        placeholder="Optional note to include in the email…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        style={{
          padding: "9px 11px",
          borderRadius: 8,
          border: "1px solid #C7C5BB",
          fontSize: 13.5,
          fontFamily: "inherit",
          resize: "vertical",
          minHeight: 50,
        }}
      />
      {err && (
        <div style={{ color: "#C8442E", fontSize: 12 }}>{err}</div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={sending}
        >
          Cancel
        </button>
        <button
          type="button"
          style={{
          background: "#1FA864",
          borderColor: "#1FA864",
          color: "#06281A",
          fontWeight: 700,
        }}
          onClick={send}
          disabled={sending}
        >
          {sending ? "Sending…" : "Send proposal"}
        </button>
      </div>
    </div>
  );
}

function BrandMark({ height = 46 }: { height?: number }) {
  // Reuse the existing brand logo (same approach as DiversionReportBuilder).
  // Print-targeted so we use a plain <img> rather than next/image.
  const src = BRAND_LOGO || "/brand/logo.jpg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={BRAND_NAME}
      className={styles.toplogo}
      style={{ height }}
    />
  );
}

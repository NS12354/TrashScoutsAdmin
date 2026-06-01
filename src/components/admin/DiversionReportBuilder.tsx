"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  LinearScale,
  Legend,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";
import styles from "./DiversionReportBuilder.module.css";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Title,
  Tooltip,
);

// Bin sizes used in the volume-mode dropdown. cuyd is the per-pickup
// volume in cubic yards. Cart sizes are converted from gallons at
// 202 gal/cu yd (the standard waste-industry conversion).
const BIN_SIZES = [
  { label: "20 Gallon Cart", cuyd: 20 / 202 },
  { label: "32 Gallon Cart", cuyd: 32 / 202 },
  { label: "35 Gallon Cart", cuyd: 35 / 202 },
  { label: "64 Gallon Cart", cuyd: 64 / 202 },
  { label: "96 Gallon Cart", cuyd: 96 / 202 },
  { label: "1 Cubic Yard", cuyd: 1 },
  { label: "1.5 Cubic Yard", cuyd: 1.5 },
  { label: "2 Cubic Yard", cuyd: 2 },
  { label: "3 Cubic Yard", cuyd: 3 },
  { label: "4 Cubic Yard", cuyd: 4 },
  { label: "6 Cubic Yard", cuyd: 6 },
  { label: "7 Cubic Yard", cuyd: 7 },
  { label: "8 Cubic Yard", cuyd: 8 },
] as const;

const STREAM_COLORS: Record<string, string> = {
  Landfill: "#888780",
  "Mixed Recycling": "#378ADD",
  "Cardboard / Fiber": "#BA7517",
  "Bottles / Cans / Plastics": "#7F77DD",
  Organics: "#4a9e2f",
};

const STREAMS = [
  "Landfill",
  "Mixed Recycling",
  "Cardboard / Fiber",
  "Bottles / Cans / Plastics",
  "Organics",
] as const;

const DIVERTED = new Set<string>([
  "Mixed Recycling",
  "Cardboard / Fiber",
  "Bottles / Cans / Plastics",
  "Organics",
]);

const PROPERTY_TYPES = ["Commercial", "Residential / Apartment", "Mixed Use"];

type Mode = "volume" | "weight";

type Row = {
  id: number;
  stream: string;
  bins: number;
  sizeVal: number; // cu yd per pickup
  pickups: number;
  tons: string; // raw input string for tons/week
  lbs: string; // raw input string for lbs/week
};

export type PropertyOption = {
  id: string;
  name: string;
  address: string;
};

type Props = {
  properties: PropertyOption[];
};

let nextRowId = 0;
function newRow(stream: string): Row {
  return {
    id: nextRowId++,
    stream,
    bins: 1,
    sizeVal: 1,
    pickups: 1,
    tons: "",
    lbs: "",
  };
}

function rowWeeklyVolume(r: Row): number {
  return r.bins * r.sizeVal * r.pickups;
}

function rowWeeklyTons(r: Row): number | null {
  const lbs = parseFloat(r.lbs);
  if (Number.isFinite(lbs) && lbs > 0) return lbs / 2000;
  const t = parseFloat(r.tons);
  if (Number.isFinite(t) && t > 0) return t;
  return null;
}

export function DiversionReportBuilder({ properties }: Props) {
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [period, setPeriod] = useState("");
  const [propType, setPropType] = useState(PROPERTY_TYPES[0]!);
  const [propertyId, setPropertyId] = useState("");
  const [mode, setMode] = useState<Mode>("volume");
  const [rows, setRows] = useState<Row[]>(() => [
    newRow("Landfill"),
    newRow("Mixed Recycling"),
    newRow("Organics"),
  ]);
  const [generated, setGenerated] = useState<{
    clientName: string;
    address: string;
    period: string;
    propType: string;
    mode: Mode;
    rows: Row[];
  } | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  function onPropertyChange(id: string) {
    // Switching properties (or back to "None") is treated as starting a
    // fresh report — clear the previously entered period, waste-stream
    // rows, and any generated output so nothing leaks from the prior
    // property into the new one.
    setPropertyId(id);
    setPeriod("");
    setRows([
      newRow("Landfill"),
      newRow("Mixed Recycling"),
      newRow("Organics"),
    ]);
    setGenerated(null);
    const p = id ? properties.find((x) => x.id === id) : null;
    setClientName(p?.name ?? "");
    setAddress(p?.address ?? "");
  }

  function addRow() {
    setRows((prev) => {
      const used = new Set(prev.map((r) => r.stream));
      const nextStream =
        STREAMS.find((s) => !used.has(s)) ?? STREAMS[STREAMS.length - 1]!;
      return [...prev, newRow(nextStream)];
    });
  }

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function generate() {
    if (rows.length === 0) return;
    if (mode === "weight") {
      const hasData = rows.some((r) => {
        const t = rowWeeklyTons(r);
        return t != null && t > 0;
      });
      if (!hasData) {
        alert(
          "Enter actual weight data (tons or lbs) for at least one waste stream.",
        );
        return;
      }
    }
    setGenerated({
      clientName: clientName.trim() || "Client",
      address: address.trim(),
      period: period.trim() || "Current period",
      propType,
      mode,
      rows: rows.map((r) => ({ ...r })),
    });
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className={styles.root}>
      <div className={`${styles.pageHeader} ${styles.noPrint}`}>
        <BrandMark height={56} />
        <div style={{ textAlign: "right" }}>
          <div className={styles.headerReportLabel}>Waste Diversion</div>
          <div className={styles.headerReportTitle}>Report Builder</div>
        </div>
      </div>

      {/* ─ Property info ─────────────────────────────────────────────── */}
      <div className={`${styles.card} ${styles.noPrint}`}>
        <div className={styles.sectionTitle}>Property information</div>
        {properties.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <label className={styles.fieldLabel}>
              Prefill from saved property (optional)
            </label>
            <select
              className={styles.select}
              value={propertyId}
              onChange={(e) => onPropertyChange(e.target.value)}
            >
              <option value="">— None —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={styles.metaGrid}>
          <div>
            <label className={styles.fieldLabel}>Client / property name</label>
            <input
              className={styles.input}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Sunset Apartments"
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Address</label>
            <input
              className={styles.input}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Main St, Berkeley CA"
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Report period</label>
            <input
              className={styles.input}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. June 2025"
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Property type</label>
            <select
              className={styles.select}
              value={propType}
              onChange={(e) => setPropType(e.target.value)}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─ Measurement method ────────────────────────────────────────── */}
      <div className={`${styles.card} ${styles.noPrint}`}>
        <div className={styles.sectionTitle}>Measurement method</div>
        <div className={styles.modeToggle} role="group">
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === "volume" ? styles.active : ""}`}
            onClick={() => setMode("volume")}
          >
            By volume (bin sizes &amp; pickups)
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === "weight" ? styles.active : ""}`}
            onClick={() => setMode("weight")}
          >
            By weight (actual scale weights)
          </button>
        </div>

        <div className={styles.infoBox}>
          <div className={styles.infoBoxTitle}>
            Volume vs. weight — what it means for your clients
          </div>
          <p>
            <strong>Volume</strong> is calculated from the actual bin sizes
            and pickup frequency on record for the property. It reflects the
            scheduled collection program and is the standard method for
            day-to-day waste management reporting.
          </p>
          <p>
            <strong>Weight</strong> uses actual tonnage data from hauler
            invoices, MRF (material recovery facility) weight tickets, or
            composter receipts. Weight-based reporting is the gold standard
            for regulatory compliance and certification purposes.
          </p>
          <p style={{ marginTop: 8, fontWeight: 600 }}>
            Certifications &amp; agencies that require weight-based data:
          </p>
          <div className={styles.infoTags}>
            <span className={styles.infoTag}>CalRecycle (AB 341 / SB 1383)</span>
            <span className={styles.infoTag}>LEED v4 — MR credits</span>
            <span className={styles.infoTag}>TRUE Zero Waste</span>
            <span className={styles.infoTag}>EPA WasteWise</span>
            <span className={styles.infoTag}>GreenStar certification</span>
            <span className={styles.infoTag}>ISO 14001 EMS audits</span>
            <span className={styles.infoTag}>BOMA 360 / ENERGY STAR</span>
            <span className={styles.infoTag}>GHG Protocol Scope 3</span>
          </div>
        </div>

        {mode === "weight" && (
          <div className={styles.wtNote}>
            <strong>⚠ Weight mode — enter actual scale weights only.</strong>{" "}
            Use this mode when you have real data from hauler invoices, MRF
            weight tickets, or composter receipts. Don&apos;t estimate — use
            volume mode if you only have bin sizes and pickup schedules.
          </div>
        )}
      </div>

      {/* ─ Waste streams ─────────────────────────────────────────────── */}
      <div className={`${styles.card} ${styles.noPrint}`}>
        <div className={styles.sectionTitle}>Waste streams &amp; data entry</div>
        <div className={styles.streamTableWrap}>
          <table className={styles.streamTable}>
            <thead>
              <tr>
                <th style={{ minWidth: 160 }}>Waste stream</th>
                {mode === "volume" ? (
                  <>
                    <th style={{ minWidth: 70 }}># bins</th>
                    <th style={{ minWidth: 160 }}>Bin size</th>
                    <th style={{ minWidth: 110 }}>Pickups / week</th>
                  </>
                ) : (
                  <>
                    <th style={{ minWidth: 130 }}>Tons / week</th>
                    <th style={{ minWidth: 150 }}>— or — lbs / week</th>
                  </>
                )}
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        className={styles.dot}
                        style={{
                          background: STREAM_COLORS[r.stream] ?? "#888",
                        }}
                      />
                      <select
                        value={r.stream}
                        onChange={(e) =>
                          updateRow(r.id, { stream: e.target.value })
                        }
                        style={{ flex: 1 }}
                      >
                        {STREAMS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  {mode === "volume" ? (
                    <>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={r.bins}
                          onChange={(e) =>
                            updateRow(r.id, {
                              bins: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          style={{ width: 60 }}
                        />
                      </td>
                      <td>
                        <select
                          value={r.sizeVal}
                          onChange={(e) =>
                            updateRow(r.id, { sizeVal: Number(e.target.value) })
                          }
                          style={{ width: "100%" }}
                        >
                          {BIN_SIZES.map((s) => (
                            <option key={s.label} value={s.cuyd}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={r.pickups}
                          onChange={(e) =>
                            updateRow(r.id, {
                              pickups: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          style={{ width: 70 }}
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={0.001}
                          value={r.tons}
                          onChange={(e) =>
                            updateRow(r.id, { tons: e.target.value })
                          }
                          placeholder="e.g. 1.500"
                          style={{ width: 110 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={r.lbs}
                          onChange={(e) =>
                            updateRow(r.id, { lbs: e.target.value })
                          }
                          placeholder="e.g. 3000"
                          style={{ width: 110 }}
                        />
                      </td>
                    </>
                  )}
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeRow(r.id)}
                      aria-label="Remove row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className={styles.addBtn} onClick={addRow}>
          + Add waste stream
        </button>
      </div>

      <button
        type="button"
        className={`${styles.generateBtn} ${styles.noPrint}`}
        onClick={generate}
      >
        Generate diversion report
      </button>

      {generated && (
        <div ref={resultsRef} style={{ marginTop: "1rem" }}>
          <hr className={`${styles.divider} ${styles.noPrint}`} />
          <ReportOutput data={generated} />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Output ─────────────────────────────── */

function ReportOutput({
  data,
}: {
  data: {
    clientName: string;
    address: string;
    period: string;
    propType: string;
    mode: Mode;
    rows: Row[];
  };
}) {
  const { clientName, address, period, propType, mode, rows } = data;
  const isWt = mode === "weight";
  const unit = isWt ? "tons" : "cu yd";

  const stats = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    let diverted = 0;
    for (const r of rows) {
      const val = isWt ? rowWeeklyTons(r) ?? 0 : rowWeeklyVolume(r);
      map.set(r.stream, (map.get(r.stream) ?? 0) + val);
      total += val;
      if (DIVERTED.has(r.stream)) diverted += val;
    }
    const labels = [...map.keys()];
    const values = labels.map((l) => map.get(l) ?? 0);
    const colors = labels.map((l) => STREAM_COLORS[l] ?? "#888");
    const divRate = total > 0 ? (diverted / total) * 100 : 0;
    return { map, labels, values, colors, total, diverted, divRate };
  }, [rows, isWt]);

  const landfillWeekly = stats.map.get("Landfill") ?? 0;
  const landfillMonthly = landfillWeekly * 4.33;
  const divertedMonthly = stats.diverted * 4.33;

  const pieData = {
    labels: stats.labels,
    datasets: [
      {
        data: stats.values,
        backgroundColor: stats.colors,
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };
  const pieOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };
  const barData = {
    labels: ["Landfill", "Diverted"],
    datasets: [
      {
        data: [
          parseFloat(landfillMonthly.toFixed(isWt ? 3 : 2)),
          parseFloat(divertedMonthly.toFixed(isWt ? 3 : 2)),
        ],
        backgroundColor: ["#888780", "#4a9e2f"],
        borderRadius: 4,
      },
    ],
  };
  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 11 } } },
      x: { ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div>
      <div className={styles.reportHeader}>
        <BrandMark height={48} />
        <button
          type="button"
          className={`${styles.printBtn} ${styles.noPrint}`}
          onClick={() => window.print()}
        >
          Print / save PDF
        </button>
      </div>

      <div className={styles.reportTop}>
        <div>
          <div className={styles.reportClient}>
            {clientName} — Waste Diversion Report
          </div>
          <div className={styles.reportMeta}>
            {address && <>📍 {address} &nbsp;·&nbsp; </>}📅 {period} &nbsp;·&nbsp;
            🏢 {propType} &nbsp;·&nbsp; 📏 Measured by{" "}
            {isWt ? "weight (actual scale data)" : "volume"}
          </div>
        </div>
      </div>

      <div className={styles.metricGrid}>
        <Metric
          label={`Weekly ${isWt ? "weight" : "volume"}`}
          value={stats.total.toFixed(isWt ? 3 : 1)}
          unit={`${unit} / week`}
        />
        <Metric
          label="Diverted weekly"
          value={stats.diverted.toFixed(isWt ? 3 : 1)}
          unit={`${unit} / week`}
        />
        <Metric
          label="Diversion rate"
          value={`${stats.divRate.toFixed(1)}%`}
          unit={`of total ${isWt ? "weight" : "volume"}`}
          highlight
        />
        <Metric
          label="Annual total"
          value={(stats.total * 52).toFixed(isWt ? 1 : 0)}
          unit={`${unit} / year`}
        />
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>
            {isWt
              ? "Weight by waste stream (tons/week)"
              : "Volume by waste stream (cu yd/week)"}
          </div>
          <div className={styles.legendRow}>
            {stats.labels.map((l, i) => {
              const pct =
                stats.total > 0
                  ? (((stats.map.get(l) ?? 0) / stats.total) * 100).toFixed(1)
                  : "0";
              return (
                <span key={l} className={styles.legendItem}>
                  <span
                    className={styles.legendSq}
                    style={{ background: stats.colors[i] }}
                  />
                  {l} {pct}%
                </span>
              );
            })}
          </div>
          <div className={styles.chartWrap}>
            <Doughnut data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Diversion rate</div>
          <div className={styles.diversionPct}>
            {stats.divRate.toFixed(1)}%
          </div>
          <div className={styles.diversionDesc}>
            {stats.diverted.toFixed(isWt ? 3 : 2)} {unit} of{" "}
            {stats.total.toFixed(isWt ? 3 : 2)} {unit} diverted per week
          </div>
          <div className={styles.targetLabels}>
            <span>0%</span>
            <span>CA target 50%</span>
            <span>100%</span>
          </div>
          <div className={styles.diversionBarBg}>
            <div
              className={styles.diversionBarFill}
              style={{ width: `${Math.min(stats.divRate, 100)}%` }}
            />
          </div>
          <div>
            {stats.divRate >= 50 ? (
              <span className={`${styles.complianceBadge} ${styles.badgeGreen}`}>
                ✓ Meets CA 50% diversion target
              </span>
            ) : (
              <span className={`${styles.complianceBadge} ${styles.badgeAmber}`}>
                ⚠ {(50 - stats.divRate).toFixed(1)}% below CA target
              </span>
            )}
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <div className={styles.chartTitle}>
              {isWt
                ? "Monthly weight — landfill vs. diverted (tons)"
                : "Monthly volume — landfill vs. diverted (cu yd)"}
            </div>
            <div className={styles.barChartWrap}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ overflowX: "auto" }}>
        <div className={styles.sectionTitle}>
          {isWt
            ? "Weight summary by waste stream"
            : "Volume summary by waste stream"}
        </div>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Waste stream</th>
              {isWt ? (
                <>
                  <th>Tons/week</th>
                  <th>Lbs/week</th>
                  <th>Monthly (tons)</th>
                  <th>Annual (tons)</th>
                </>
              ) : (
                <>
                  <th>Bins</th>
                  <th>Bin size</th>
                  <th>Pickups/wk</th>
                  <th>Vol/pickup (cu yd)</th>
                  <th>Weekly (cu yd)</th>
                  <th>Monthly (cu yd)</th>
                  <th>Annual (cu yd)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const sizeName =
                BIN_SIZES.find((s) => Math.abs(s.cuyd - r.sizeVal) < 0.0001)
                  ?.label ?? "—";
              const wt = rowWeeklyTons(r) ?? 0;
              const vol = rowWeeklyVolume(r);
              return (
                <tr key={r.id}>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                      <span
                        className={styles.dot}
                        style={{
                          background: STREAM_COLORS[r.stream] ?? "#888",
                        }}
                      />
                      {r.stream}
                    </span>
                  </td>
                  {isWt ? (
                    <>
                      <td>{wt > 0 ? wt.toFixed(3) : "—"}</td>
                      <td>{wt > 0 ? (wt * 2000).toFixed(0) : "—"}</td>
                      <td>{wt > 0 ? (wt * 4.33).toFixed(3) : "—"}</td>
                      <td>{wt > 0 ? (wt * 52).toFixed(2) : "—"}</td>
                    </>
                  ) : (
                    <>
                      <td>{r.bins}</td>
                      <td>{sizeName}</td>
                      <td>{r.pickups}x</td>
                      <td>{r.sizeVal.toFixed(3)}</td>
                      <td>{vol.toFixed(2)}</td>
                      <td>{(vol * 4.33).toFixed(1)}</td>
                      <td>{(vol * 52).toFixed(0)}</td>
                    </>
                  )}
                </tr>
              );
            })}
            <tr>
              {isWt ? (
                <>
                  <td>Total</td>
                  <td>{stats.total.toFixed(3)}</td>
                  <td>{(stats.total * 2000).toFixed(0)}</td>
                  <td>{(stats.total * 4.33).toFixed(3)}</td>
                  <td>{(stats.total * 52).toFixed(2)}</td>
                </>
              ) : (
                <>
                  <td colSpan={5}>Total</td>
                  <td>{stats.total.toFixed(2)}</td>
                  <td>{(stats.total * 4.33).toFixed(1)}</td>
                  <td>{(stats.total * 52).toFixed(0)}</td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      <Footer />
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricLabel}>{label}</div>
      <div
        className={styles.metricValue}
        style={highlight ? { color: "var(--green)" } : undefined}
      >
        {value}
      </div>
      <div className={styles.metricUnit}>{unit}</div>
    </div>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className={styles.pageFooter}>
      <div className={styles.footerMain}>
        <div>
          <BrandMark height={42} />
          <div className={styles.footerTagline} style={{ marginTop: 8 }}>
            Providing onsite waste management services to commercial and
            residential properties — 7 days a week.
          </div>
        </div>
        <div className={styles.footerContact}>
          <strong>{BRAND_NAME}</strong>
          <br />
          520 3rd St, #201
          <br />
          Oakland, CA 94607
          <br />
          <a href="tel:5107880462">(510) 788-0462</a>
          <br />
          <a href="https://www.trashscouts.com">www.trashscouts.com</a>
        </div>
      </div>

      <div className={styles.footerDisclaimer}>
        <strong>* Report Disclaimer:</strong> This waste diversion report is
        prepared for informational purposes only. Figures are based solely on
        the scheduled collection services and data reported to {BRAND_NAME} for
        this property — including contracted bin sizes, pickup frequencies,
        and/or hauler-reported weights where provided. This report does not
        account for additional or on-call pickups, self-hauling by tenants or
        building staff, compactor pulls outside the standard schedule, or any
        waste removed through means other than the documented collection
        program. Actual diversion volumes or weights may differ. This report
        should not be used as the sole basis for regulatory compliance
        filings, certification applications, or formal diversion claims
        without supplemental verification from your licensed hauler or
        material recovery facility.
      </div>

      <div className={styles.footerCopy}>
        © {year} {BRAND_NAME}® &nbsp;·&nbsp; Oakland, CA &nbsp;·&nbsp; Report
        generated {today}
      </div>
    </div>
  );
}

function BrandMark({ height }: { height: number }) {
  // BRAND_LOGO is optional — fall back to brand name text if it's not set.
  // Using <img> rather than next/image because the report is print-targeted
  // and next/image's optimization layer is unnecessary churn here.
  const [src, setSrc] = useState(BRAND_LOGO || "/brand/logo.jpg");
  useEffect(() => {
    setSrc(BRAND_LOGO || "/brand/logo.jpg");
  }, []);
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={BRAND_NAME}
        style={{ height, width: "auto", display: "block" }}
        onError={() => setSrc("")}
      />
      {!src && (
        <span style={{ fontWeight: 700, letterSpacing: "-0.3px" }}>
          {BRAND_NAME}
        </span>
      )}
    </span>
  );
}

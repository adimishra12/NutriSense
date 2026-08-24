"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import api from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import "../../styles/sidebar.css";
import "../../styles/dashboard.css";

// RDA reference values (adult daily)
const RDA = {
  protein_g: 50,
  iron_mg: 18,
  calcium_mg: 1000,
  vitamin_d_mcg: 15,
  vitamin_b12_mcg: 2.4,
  folate_mcg: 400,
  vitamin_a_mcg: 900,
};

const NUTRIENT_LABELS = [
  { key: "avg_protein_g", rda: RDA.protein_g, label: "Protein G" },
  { key: "avg_iron_mg", rda: RDA.iron_mg, label: "Iron Mg" },
  { key: "avg_calcium_mg", rda: RDA.calcium_mg, label: "Calcium Mg" },
  { key: "avg_vitamin_d_mcg", rda: RDA.vitamin_d_mcg, label: "Vitamin D Mcg" },
  { key: "avg_vitamin_b12_mcg", rda: RDA.vitamin_b12_mcg, label: "Vitamin B12 Mcg" },
  { key: "avg_folate_mcg", rda: RDA.folate_mcg, label: "Folate Mcg" },
  { key: "avg_vitamin_a_mcg", rda: RDA.vitamin_a_mcg, label: "Vitamin A Mcg" },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [summary, setSummary] = useState(null);
  const [latestAssessment, setLatestAssessment] = useState(null);

  // Route guard
  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    if (user && !user.has_completed_onboarding) {
      router.push("/onboarding");
    }
  }, [token, user, isLoading, router]);

  // Fetch diary summary and latest assessment
  useEffect(() => {
    if (!token) return;

    api
      .get("/diary/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));

    api
      .get("/assessment/latest")
      .then((res) => setLatestAssessment(res.data))
      .catch(() => setLatestAssessment(null));
  }, [token]);

  if (isLoading || !token || !user) {
    return (
      <div className="page-with-sidebar dash-loading">
        <p>Loading…</p>
      </div>
    );
  }

  const daysLogged = summary?.days_logged ?? 0;

  return (
    <>
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-content">
          <div className="page-header">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Your nutrition snapshot from logged meals.
            </p>
          </div>

          {/* ── Top cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {/* Diary status */}
            <div className="premium-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--color-brand-primary)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                </div>
                <h2 style={{ fontSize: '18px', margin: 0 }}>Diary Status</h2>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--color-slate-medium)', marginBottom: '24px' }}>
                <strong style={{ fontSize: '32px', color: 'var(--color-slate-dark)', display: 'block', marginBottom: '4px' }}>{daysLogged}</strong>
                days logged {daysLogged < 4 && <span style={{ color: 'var(--color-warning)' }}>— need 4 to assess</span>}
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary"
                  onClick={() => router.push("/diary")}
                  style={{ flex: '1 1 120px' }}
                >
                  Log Meal
                </button>
                <button
                  className="btn-primary"
                  disabled={daysLogged < 4}
                  onClick={() => router.push("/assessment")}
                  style={{ flex: '1 1 120px', opacity: daysLogged < 4 ? 0.5 : 1 }}
                >
                  Assess
                </button>
              </div>
            </div>

            {/* Wellness score */}
            <div className="premium-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(4, 120, 87, 0.1)', borderRadius: '12px', color: 'var(--color-brand-dark)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <h2 style={{ fontSize: '18px', margin: 0 }}>Latest Wellness Score</h2>
              </div>
              {latestAssessment ? (
                <div>
                  <span style={{ fontSize: '36px', fontWeight: '700', color: 'var(--color-brand-dark)', display: 'block', marginBottom: '4px' }}>
                    {latestAssessment.overall_score}%
                  </span>
                  <p style={{ fontSize: '14px', color: 'var(--color-slate-medium)' }}>Based on {latestAssessment.diary_days_used} days</p>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '20px', border: 'none', background: 'var(--color-cream-darker)' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-slate-light)', display: 'block' }}>—</span>
                  <p style={{ fontSize: '14px', margin: 0 }}>No assessment yet</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Latest Deficiency Risks ── */}
          <div className="premium-card">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>Average Intake vs RDA</h2>

            {!latestAssessment ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-slate-light)', marginBottom: '16px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-slate-dark)', marginBottom: '8px' }}>No assessment data available</h3>
                <p style={{ fontSize: '14px', color: 'var(--color-slate-medium)', maxWidth: '400px', margin: '0 auto' }}>
                  Complete your qualifying food diary to unlock your nutritional assessment and see your nutrient intake breakdown.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {latestAssessment.risks.map((risk) => {
                  const pct = Math.min(risk.percentage, 100);
                  
                  let barColor = "var(--color-success)";
                  if (risk.risk_level.toLowerCase() === "high") barColor = "var(--color-danger)";
                  else if (risk.risk_level.toLowerCase() === "moderate") barColor = "var(--color-warning)";

                  const displayNames = {
                    iron: "Iron", calcium: "Calcium", vitamin_d: "Vitamin D",
                    vitamin_b12: "Vitamin B12", folate: "Folate", vitamin_a: "Vitamin A",
                    vitamin_c: "Vitamin C", magnesium: "Magnesium", zinc: "Zinc", protein: "Protein",
                  };
                  
                  const label = displayNames[risk.nutrient] || risk.nutrient;

                  return (
                    <div key={risk.nutrient} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '90px', fontSize: '14px', fontWeight: '500', color: 'var(--color-slate-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                      <div style={{ flex: 1, height: '10px', background: 'var(--color-cream-darker)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div
                          style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '100px', transition: 'width 1s ease-out' }}
                        />
                      </div>
                      <span style={{ width: '40px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--color-slate-medium)' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
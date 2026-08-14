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
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Your nutrition snapshot from logged meals.
          </p>

          {/* ── Top cards ── */}
          <div className="dash-top-row">
            {/* Diary status */}
            <div className="dash-card">
              <h2 className="dash-card-title">Diary status</h2>
              <p className="dash-card-metric">
                <strong>{daysLogged}</strong> days logged
                {daysLogged < 7 && " — need 7 to assess"}
              </p>
              <div className="dash-card-actions">
                <button
                  className="dash-btn outline"
                  onClick={() => router.push("/diary")}
                >
                  Log a meal
                </button>
                <button 
                  className="dash-btn filled" 
                  disabled={daysLogged < 7}
                  onClick={() => router.push("/assessment")}
                >
                  Run assessment
                </button>
              </div>
            </div>

            {/* Wellness score */}
            <div className="dash-card">
              <h2 className="dash-card-title">Latest wellness score</h2>
              {latestAssessment ? (
                <div className="dash-wellness-placeholder">
                  <span className="dash-wellness-dash" style={{ color: "#4f46e5", fontWeight: "bold" }}>
                    {latestAssessment.overall_score}%
                  </span>
                  <p>Based on {latestAssessment.diary_days_used} days</p>
                </div>
              ) : (
                <div className="dash-wellness-placeholder">
                  <span className="dash-wellness-dash">—</span>
                  <p>No assessment yet</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RDA bars ── */}
          <div className="dash-card dash-rda-card">
            <h2 className="dash-card-title">Average intake vs RDA</h2>

            <div className="dash-rda-list">
              {NUTRIENT_LABELS.map((n) => {
                const value = summary ? summary[n.key] : 0;
                const pct = Math.min(
                  Math.round((value / n.rda) * 100),
                  100
                );

                return (
                  <div className="dash-rda-row" key={n.key}>
                    <span className="dash-rda-label">{n.label}</span>
                    <div className="dash-rda-track">
                      <div
                        className="dash-rda-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="dash-rda-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
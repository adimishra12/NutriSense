"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import api from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import "../../styles/sidebar.css";
import "../../styles/assessment.css";

/* ── Nutrient display names ─────────────────────────── */
const NUTRIENT_DISPLAY = {
  iron: "Iron",
  calcium: "Calcium",
  vitamin_d: "Vitamin D",
  vitamin_b12: "Vitamin B12",
  folate: "Folate",
  vitamin_a: "Vitamin A",
  vitamin_c: "Vitamin C",
  magnesium: "Magnesium",
  zinc: "Zinc",
  protein: "Protein",
};

export default function AssessmentPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [running, setRunning] = useState(false);

  // Recommendation state
  const [recommendationsMap, setRecommendationsMap] = useState({});
  const [loadingRecs, setLoadingRecs] = useState(false);

  // ── Route guard ──────────────────────────────────────
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

  // ── Load latest assessment on mount ──────────────────
  useEffect(() => {
    if (!token) return;
    setLoadingAssessment(true);
    api
      .get("/assessment/latest")
      .then((res) => {
        setAssessment(res.data);
        const highRiskNutrients = res.data.risks.filter((r) => r.percentage > 45).map((r) => r.nutrient);
        if (highRiskNutrients.length > 0) {
          setLoadingRecs(true);
          Promise.all(
            highRiskNutrients.map((n) => api.get(`/assessment/recommendations?nutrient=${n}`))
          )
            .then((responses) => {
              const newMap = {};
              responses.forEach((resp, i) => {
                newMap[highRiskNutrients[i]] = resp.data.foods;
              });
              setRecommendationsMap(newMap);
            })
            .catch(() => setRecommendationsMap({}))
            .finally(() => setLoadingRecs(false));
        }
      })
      .catch(() => {
        setAssessment(null);
      })
      .finally(() => setLoadingAssessment(false));
  }, [token]);

  // ── Run assessment ───────────────────────────────────
  const handleRunAssessment = async () => {
    setRunning(true);
    try {
      const res = await api.post("/assessment/run");
      setAssessment(res.data);
      toast.success("Assessment completed successfully!");
      const highRiskNutrients = res.data.risks.filter((r) => r.percentage > 45).map((r) => r.nutrient);
      if (highRiskNutrients.length > 0) {
        setLoadingRecs(true);
        Promise.all(
          highRiskNutrients.map((n) => api.get(`/assessment/recommendations?nutrient=${n}`))
        )
          .then((responses) => {
            const newMap = {};
            responses.forEach((resp, i) => {
              newMap[highRiskNutrients[i]] = resp.data.foods;
            });
            setRecommendationsMap(newMap);
          })
          .catch(() => setRecommendationsMap({}))
          .finally(() => setLoadingRecs(false));
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        "Failed to run assessment. Please try again.";
      toast.error(detail, { duration: 6000 });
    } finally {
      setRunning(false);
    }
  };

  // ── Loading / guard states ───────────────────────────
  if (isLoading || !token || !user) {
    return (
      <div className="page-with-sidebar assess-loading">
        <div className="assess-spinner" />
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-content">
          {/* ── Header bar ── */}
          <div className="assess-header">
            <span className="assess-model-info">
              {assessment ? `${assessment.diary_days_used} complete diary days used · minimum 4 consecutive required` : "4 consecutive complete diary days required"}
            </span>
            <button
              className="assess-run-btn"
              onClick={handleRunAssessment}
              disabled={running}
            >
              {running ? "Running…" : "Run assessment"}
            </button>
          </div>

          {/* ── Main content ── */}
          {loadingAssessment ? (
            <div className="assess-loading">
              <div className="assess-spinner" />
            </div>
          ) : !assessment ? (
            /* ── Empty state ── */
            <div className="assess-empty">
              <div className="assess-empty-icon">🔬</div>
              <h2>No assessment yet</h2>
              <p>
                Log at least 4 consecutive complete days of meals (Breakfast, Lunch,
                Snack, Dinner) then click &ldquo;Run assessment&rdquo; to see
                your deficiency risk analysis.
              </p>
              <button
                className="assess-run-btn"
                onClick={handleRunAssessment}
                disabled={running}
              >
                {running ? "Running…" : "Run assessment"}
              </button>
            </div>
          ) : (
            /* ── Results layout ── */
            <div className="assess-body">
              {/* ── Left: Deficiency risks ── */}
              <div className="assess-risks-card">
                <h2 className="assess-risks-heading">Deficiency risks</h2>
                <p className="assess-wellness">
                  Wellness score: <strong>{assessment.overall_score}%</strong>
                </p>

                <div className="assess-def-list">
                  {assessment.risks.map((risk) => (
                    <div
                      key={risk.nutrient}
                      className={`assess-def-card ${risk.percentage <= 45 ? "low-risk-disabled" : ""}`}
                    >
                      {/* Top row */}
                      <div className="assess-def-top">
                        <span className="assess-def-name">
                          {NUTRIENT_DISPLAY[risk.nutrient] || risk.nutrient}
                        </span>

                        {/* Progress bar */}
                        <div className="assess-bar-track">
                          <div
                            className={`assess-bar-fill ${risk.risk_level.toLowerCase()}`}
                            style={{ width: `${Math.min(risk.percentage, 100)}%` }}
                          />
                        </div>

                        {/* Percentage */}
                        <span className="assess-def-pct">
                          {risk.percentage}%
                        </span>

                        {/* Badge */}
                        <span
                          className={`assess-badge ${risk.risk_level.toLowerCase()}`}
                        >
                          {risk.risk_level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: Recommendation panel ── */}
              <div style={{ position: "sticky", top: "40px", display: "flex", flexDirection: "column", gap: "16px", width: "320px", minWidth: "280px" }}>
                <div className="assess-rec-panel" style={{ position: "static", width: "100%", minWidth: "auto", margin: 0 }}>
                  <h3 className="assess-rec-heading">
                    Recommended foods
                  </h3>

                  {loadingRecs ? (
                    <div className="assess-loading">
                      <div className="assess-spinner" />
                    </div>
                  ) : Object.keys(recommendationsMap).length === 0 ? (
                    <p style={{ color: "#6b7280", fontSize: 14 }}>
                      No high-risk nutrients detected.
                    </p>
                  ) : (
                    <div className="assess-rec-list" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      {assessment.risks.filter((r) => r.percentage > 45).map((risk) => (
                        <div key={risk.nutrient}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12, borderBottom: "1px solid #e5e7eb", paddingBottom: 8 }}>
                            {NUTRIENT_DISPLAY[risk.nutrient] || risk.nutrient}
                          </h4>
                          {recommendationsMap[risk.nutrient]?.length === 0 ? (
                            <p style={{ color: "#6b7280", fontSize: 13 }}>No foods found.</p>
                          ) : (
                            recommendationsMap[risk.nutrient]?.map((food) => (
                              <div key={food.id} className="assess-rec-row">
                                <span className="assess-rec-name">{food.name}</span>
                                <span className="assess-rec-nutrients">
                                  {NUTRIENT_DISPLAY[risk.nutrient] || risk.nutrient} {food.nutrient_value}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* ── Generate Meal Plan Button ── */}
                <button 
                  className="assess-run-btn" 
                  style={{ width: "100%", padding: "14px", boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)" }}
                  onClick={() => router.push("/meal-plan")}
                >
                  Generate 7 days meal plan
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

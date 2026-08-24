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
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 className="page-title">Assessment</h1>
              <p className="page-subtitle" style={{ margin: 0 }}>
                {assessment ? `${assessment.diary_days_used} complete diary days used · minimum 4 consecutive required` : "4 consecutive complete diary days required"}
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={handleRunAssessment}
              disabled={running}
            >
              {running ? "Running…" : "Run Assessment"}
            </button>
          </div>

          {loadingAssessment ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--color-slate-medium)' }}>
              Loading...
            </div>
          ) : !assessment ? (
            <div className="empty-state" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-brand-primary)', marginBottom: '16px' }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-slate-dark)', marginBottom: '12px' }}>No assessment yet</h2>
              <p style={{ fontSize: '15px', color: 'var(--color-slate-medium)', marginBottom: '24px', lineHeight: 1.6 }}>
                Log at least 4 consecutive complete days of meals (Breakfast, Lunch,
                Snack, Dinner) then click "Run Assessment" to see your deficiency risk analysis.
              </p>
              <button
                className="btn-primary"
                onClick={handleRunAssessment}
                disabled={running}
              >
                {running ? "Running…" : "Run Assessment"}
              </button>
            </div>
          ) : (
            <div className="assessment-main-layout">
              {/* ── Left: Deficiency risks ── */}
              <div className="premium-card" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                  <h2 style={{ fontSize: '20px', margin: 0 }}>Deficiency Risks</h2>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '100px', color: 'var(--color-brand-dark)', fontWeight: '600', fontSize: '14px' }}>
                    Wellness Score: {assessment.overall_score}%
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {assessment.risks.map((risk) => {
                    const pct = Math.min(risk.percentage, 100);
                    const isLowRisk = pct <= 45;
                    
                    let barColor = "var(--color-success)";
                    let badgeBg = "rgba(16, 185, 129, 0.1)";
                    let badgeColor = "var(--color-success)";
                    
                    if (risk.risk_level.toLowerCase() === "high") {
                      barColor = "var(--color-danger)";
                      badgeBg = "rgba(239, 68, 68, 0.1)";
                      badgeColor = "var(--color-danger)";
                    } else if (risk.risk_level.toLowerCase() === "moderate") {
                      barColor = "var(--color-warning)";
                      badgeBg = "rgba(245, 158, 11, 0.1)";
                      badgeColor = "var(--color-warning)";
                    }

                    return (
                      <div
                        key={risk.nutrient}
                        className="risk-row"
                        style={{ padding: '16px', background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', opacity: isLowRisk ? 0.6 : 1 }}
                      >
                        <span className="risk-label">
                          {NUTRIENT_DISPLAY[risk.nutrient] || risk.nutrient}
                        </span>

                        <div style={{ flex: 1, height: '10px', background: 'var(--color-cream-darker)', borderRadius: '100px', overflow: 'hidden' }}>
                          <div
                            style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '100px', transition: 'width 1s ease-out' }}
                          />
                        </div>

                        <span style={{ width: '48px', textAlign: 'right', fontSize: '15px', fontWeight: '600', color: 'var(--color-slate-dark)' }}>
                          {pct}%
                        </span>

                        <span style={{ width: '80px', textAlign: 'center', padding: '4px 8px', borderRadius: '100px', fontSize: '12px', fontWeight: '600', background: badgeBg, color: badgeColor, textTransform: 'uppercase' }}>
                          {risk.risk_level}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Right: Recommendation panel ── */}
              <div className="assessment-side-panel">
                <div className="premium-card">
                  <h3 style={{ fontSize: '18px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                    Recommended Foods
                  </h3>

                  {loadingRecs ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-slate-medium)' }}>
                      Loading recommendations...
                    </div>
                  ) : Object.keys(recommendationsMap).length === 0 ? (
                    <div className="empty-state" style={{ padding: '20px', border: 'none', background: 'var(--color-cream-darker)' }}>
                      <p style={{ fontSize: '14px', margin: 0 }}>No high-risk nutrients detected.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      {assessment.risks.filter((r) => r.percentage > 45).map((risk) => (
                        <div key={risk.nutrient}>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-slate-dark)', marginBottom: '12px' }}>
                            {NUTRIENT_DISPLAY[risk.nutrient] || risk.nutrient}
                          </h4>
                          {recommendationsMap[risk.nutrient]?.length === 0 ? (
                            <p style={{ color: "var(--color-slate-light)", fontSize: '13px' }}>No foods found.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {recommendationsMap[risk.nutrient]?.map((food) => (
                                <div key={food.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-cream-darker)', borderRadius: '8px', fontSize: '13px' }}>
                                  <span style={{ fontWeight: '500', color: 'var(--color-slate-dark)' }}>{food.name}</span>
                                  <span style={{ color: 'var(--color-brand-dark)', fontWeight: '600' }}>
                                    {food.nutrient_value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button 
                  className="btn-primary" 
                  style={{ width: "100%", padding: "16px", fontSize: '16px' }}
                  onClick={() => router.push("/meal-plan")}
                >
                  Generate 7-Day Meal Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

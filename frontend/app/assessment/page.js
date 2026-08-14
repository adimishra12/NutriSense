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
  const [selectedNutrient, setSelectedNutrient] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
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
        // Auto-select the first (highest risk) nutrient
        if (res.data.risks && res.data.risks.length > 0) {
          setSelectedNutrient(res.data.risks[0].nutrient);
        }
      })
      .catch(() => {
        setAssessment(null);
      })
      .finally(() => setLoadingAssessment(false));
  }, [token]);

  // ── Fetch recommendations when selected nutrient changes ──
  const fetchRecommendations = useCallback(
    (nutrient) => {
      if (!token || !nutrient) return;
      setLoadingRecs(true);
      api
        .get(`/assessment/recommendations?nutrient=${nutrient}`)
        .then((res) => setRecommendations(res.data.foods || []))
        .catch(() => setRecommendations([]))
        .finally(() => setLoadingRecs(false));
    },
    [token]
  );

  useEffect(() => {
    if (selectedNutrient) {
      fetchRecommendations(selectedNutrient);
    }
  }, [selectedNutrient, fetchRecommendations]);

  // ── Run assessment ───────────────────────────────────
  const handleRunAssessment = async () => {
    setRunning(true);
    try {
      const res = await api.post("/assessment/run");
      setAssessment(res.data);
      toast.success("Assessment completed successfully!");
      // Auto-select first nutrient
      if (res.data.risks && res.data.risks.length > 0) {
        setSelectedNutrient(res.data.risks[0].nutrient);
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
              Random Forest model · 7 complete diary days required
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
                Log 7 consecutive complete days of meals (Breakfast, Lunch,
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
                      className={`assess-def-card ${
                        selectedNutrient === risk.nutrient ? "selected" : ""
                      }`}
                      onClick={() => setSelectedNutrient(risk.nutrient)}
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

                      {/* Explanation pill */}
                      <span className="assess-def-label">{risk.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: Recommendation panel ── */}
              <div className="assess-rec-panel">
                <h3 className="assess-rec-heading">
                  {NUTRIENT_DISPLAY[selectedNutrient] || selectedNutrient}
                </h3>

                {loadingRecs ? (
                  <div className="assess-loading">
                    <div className="assess-spinner" />
                  </div>
                ) : recommendations.length === 0 ? (
                  <p style={{ color: "#6b7280", fontSize: 14 }}>
                    No food recommendations available.
                  </p>
                ) : (
                  <div className="assess-rec-list">
                    {recommendations.map((food) => (
                      <div key={food.id} className="assess-rec-row">
                        <span className="assess-rec-name">{food.name}</span>
                        <span className="assess-rec-nutrients">
                          Fe {food.iron_mg} · Ca {food.calcium_mg}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

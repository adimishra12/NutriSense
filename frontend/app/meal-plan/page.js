"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

import api from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import "../../styles/sidebar.css";
import "../../styles/meal-plan.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MealPlan() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [planData, setPlanData] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

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

  const fetchPlan = async () => {
    try {
      setLoadingPlan(true);
      const res = await api.get("/meal-plan/latest");
      setPlanData(res.data);
    } catch (error) {
      setPlanData(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPlan();
    }
  }, [token]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/meal-plan/generate");
      setPlanData(res.data);
      toast.success("Meal plan generated successfully!");
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (detail || "Failed to generate plan.");
      toast.error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading || !token || !user || loadingPlan) {
    return (
      <div className="page-with-sidebar meal-plan-loading">
        <p>Loading meal plan…</p>
      </div>
    );
  }

  // Handle empty state (no assessment or no plan)
  if (!planData) {
    return (
      <>
        <Sidebar />
        <main className="page-with-sidebar">
          <div className="page-content">
            <h1 className="meal-plan-title">7-day meal plan</h1>
            <p className="meal-plan-subtitle">
              Rule-based plan targeting your top deficiencies.
            </p>
            
            <div className="meal-plan-empty">
              <h2>No meal plan found</h2>
              <p>Complete your nutrition assessment to generate your personalized 7-day meal plan.</p>
              {generating ? (
                <button className="btn-primary" disabled>Generating...</button>
              ) : (
                <button className="btn-primary" onClick={handleGenerate}>
                  Generate Plan Now
                </button>
              )}
            </div>
          </div>
        </main>
      </>
    );
  }

  const selectedDayName = DAYS[selectedDayIndex];
  const dayPlan = planData.plan.find(d => d.day === selectedDayName);

  return (
    <>
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-content">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 className="page-title">7-Day Meal Plan</h1>
              <p className="page-subtitle" style={{ margin: 0 }}>
                Rule-based plan targeting your top deficiencies.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', padding: '8px 12px', background: 'var(--color-cream-darker)', borderRadius: '12px', fontSize: '13px', fontWeight: '500', color: 'var(--color-slate-medium)' }}>
                <span><span style={{ color: 'var(--color-slate-dark)', fontWeight: '600' }}>Focus:</span> {planData.focus_nutrients.replace(/_/g, " ")}</span>
                <span style={{ color: 'var(--color-slate-light)' }}>|</span>
                <span><span style={{ color: 'var(--color-slate-dark)', fontWeight: '600' }}>Diet:</span> {planData.diet_filter}</span>
              </div>
            </div>
            <button 
              className="btn-secondary" 
              onClick={handleGenerate} 
              disabled={generating}
            >
              {generating ? "Regenerating..." : "Regenerate Plan"}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '24px', scrollbarWidth: 'none' }}>
            {DAYS.map((day, index) => (
              <button
                key={day}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '100px', 
                  border: '1px solid', 
                  borderColor: index === selectedDayIndex ? 'var(--color-brand-primary)' : 'var(--color-border)', 
                  background: index === selectedDayIndex ? 'var(--color-brand-primary)' : 'var(--color-white)', 
                  color: index === selectedDayIndex ? 'var(--color-white)' : 'var(--color-slate-dark)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setSelectedDayIndex(index)}
              >
                {day}
              </button>
            ))}
          </div>

          {dayPlan && (
            <div className="premium-card">
              <h2 style={{ fontSize: '20px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>{dayPlan.day}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {["breakfast", "lunch", "snack", "dinner"].map(mealType => {
                  const mealData = dayPlan.meals[mealType];
                  if (!mealData) return null;
                  
                  const foodNames = mealData.foods.map(f => `${f.name} (100g)`).join(" + ");
                  const dataTypes = [...new Set(mealData.foods.map(f => f.data_type))].join("/");
                  const foodList = mealData.foods.map(f => `${f.name} (100g)`).join(", ");
                  
                  return (
                    <div key={mealType} style={{ padding: '16px', background: 'var(--color-cream-darker)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ fontSize: '14px', textTransform: 'capitalize', fontWeight: '700', color: 'var(--color-brand-dark)', marginBottom: '8px' }}>
                        {mealType}
                      </h3>
                      <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-slate-dark)', marginBottom: '8px', lineHeight: 1.4 }}>
                        {foodNames}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--color-slate-medium)', lineHeight: 1.5, margin: 0 }}>
                        <strong style={{ color: 'var(--color-slate-dark)' }}>Targets:</strong> {mealData.targets.join(", ").replace(/_/g, " ")} <br/>
                        <span style={{ color: 'var(--color-slate-light)', fontSize: '12px' }}>{dataTypes} items: {foodList}.</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

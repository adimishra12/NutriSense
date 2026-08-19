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
          <div className="meal-plan-header">
            <div>
              <h1 className="meal-plan-title">7-day meal plan</h1>
              <p className="meal-plan-subtitle">
                Rule-based plan targeting your top deficiencies.
              </p>
              <p className="meal-plan-focus">
                Focus: {planData.focus_nutrients.replace(/_/g, " ")} &middot; Diet: {planData.diet_filter}
              </p>
            </div>
            <button 
              className="btn-regenerate" 
              onClick={handleGenerate} 
              disabled={generating}
            >
              {generating ? "Regenerating..." : "Regenerate plan"}
            </button>
          </div>

          <div className="day-tabs">
            {DAYS.map((day, index) => (
              <button
                key={day}
                className={`day-tab ${index === selectedDayIndex ? "active" : ""}`}
                onClick={() => setSelectedDayIndex(index)}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>

          {dayPlan && (
            <div className="meal-plan-content">
              <h2 className="day-title">{dayPlan.day}</h2>
              <div className="meals-list">
                {["breakfast", "lunch", "snack", "dinner"].map(mealType => {
                  const mealData = dayPlan.meals[mealType];
                  if (!mealData) return null;
                  
                  const foodNames = mealData.foods.map(f => `${f.name} (100g)`).join(" + ");
                  const dataTypes = [...new Set(mealData.foods.map(f => f.data_type))].join("/");
                  const foodList = mealData.foods.map(f => `${f.name} (100g)`).join(", ");
                  
                  return (
                    <div className="meal-item" key={mealType}>
                      <h3 className="meal-type">{mealType}</h3>
                      <p className="meal-foods">{foodNames}</p>
                      <p className="meal-meta">
                        Targets {mealData.targets.join(", ").replace(/_/g, " ")}. {dataTypes} items: {foodList}.
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

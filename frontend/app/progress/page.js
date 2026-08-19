"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import api from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import "../../styles/sidebar.css";
import "../../styles/progress.css";

export default function ProgressPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

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

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get("/assessment/history");
      setHistoryData(res.data);
    } catch (error) {
      console.error(error);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  if (isLoading || !token || !user || loadingHistory) {
    return (
      <div className="page-with-sidebar progress-loading">
        <p>Loading progress history…</p>
      </div>
    );
  }

  // Handle empty state (no assessment history)
  if (!historyData || historyData.length === 0) {
    return (
      <>
        <Sidebar />
        <main className="page-with-sidebar">
          <div className="page-content">
            <div className="progress-header">
              <h1 className="progress-title">Progress</h1>
              <p className="progress-subtitle">
                Track your nutrition improvement over time.
              </p>
            </div>
            
            <div className="progress-empty">
              <h2>No assessment history yet</h2>
              <p>Complete your first nutrition assessment to start tracking your progress.</p>
              <Link href="/assessment" className="btn-primary">
                Run assessment
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-content">
          <div className="progress-header">
            <h1 className="progress-title">Progress</h1>
            <p className="progress-subtitle">
              Track your nutrition improvement over time.
            </p>
          </div>

          <div className="progress-tracker-section">
            <h2 className="tracker-title">Average risk (lower is better)</h2>
            <div className="tracker-chart">
              {historyData.map((item) => (
                <div key={item.id} className="tracker-bar-container">
                  <div className="tracker-bar-wrap" title={`Average risk: ${item.average_risk}%`}>
                    <div 
                      className="tracker-bar" 
                      style={{ height: `${item.average_risk}%` }}
                    ></div>
                  </div>
                  <span className="tracker-label">W{item.week}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="progress-history-section">
            <h2 className="history-title">History</h2>
            <div className="history-list">
              {historyData.slice().reverse().map((item) => {
                const risksText = item.top_risks
                  .map(r => `<span>${r.nutrient.replace(/_/g, " ")}</span> ${r.percentage}%`)
                  .join(" &middot; ");

                return (
                  <div key={item.id} className="history-card">
                    <div className="history-card-header">
                      W{item.week} &middot; score {item.wellness_score}%
                    </div>
                    <div 
                      className="history-card-details"
                      dangerouslySetInnerHTML={{ __html: risksText }}
                    ></div>
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

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
            <div className="page-header">
              <h1 className="page-title">Progress</h1>
              <p className="page-subtitle">
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
          <div className="page-header">
            <h1 className="page-title">Progress</h1>
            <p className="page-subtitle">
              Track your nutrition improvement over time.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            <div className="premium-card">
              <h2 style={{ fontSize: '18px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>Average risk (lower is better)</h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '240px', padding: '16px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {historyData.map((item) => (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '40px' }}>
                    <div style={{ height: '180px', width: '24px', background: 'var(--color-cream-darker)', borderRadius: '100px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }} title={`Average risk: ${item.average_risk}%`}>
                      <div 
                        style={{ width: '100%', background: 'var(--color-brand-primary)', height: `${item.average_risk}%`, borderRadius: '100px', transition: 'height 1s ease-out' }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-slate-medium)' }}>W{item.week}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card">
              <h2 style={{ fontSize: '18px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>History</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {historyData.slice().reverse().map((item) => {
                  const risksText = item.top_risks
                    .map(r => `<strong style="color:var(--color-slate-dark);font-weight:600;">${r.nutrient.replace(/_/g, " ")}</strong> ${r.percentage}%`)
                    .join(" <span style='color:var(--color-slate-light);margin:0 4px;'>|</span> ");

                  return (
                    <div key={item.id} style={{ padding: '16px', background: 'var(--color-cream-darker)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-brand-dark)', marginBottom: '8px' }}>
                        W{item.week} <span style={{ color: 'var(--color-slate-light)', margin: '0 8px', fontWeight: '400' }}>|</span> Score {item.wellness_score}%
                      </div>
                      <div 
                        style={{ fontSize: '14px', color: 'var(--color-slate-medium)', lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: risksText }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

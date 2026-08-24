"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import api from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import "../../styles/lab-results.css";

export default function LabResults() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    hemoglobin_g_dl: "",
    serum_vitamin_d: "",
    ferritin: "",
    vitamin_b12: "",
    calcium: ""
  });

  // Route guard and fetch data
  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    if (user && !user.has_completed_onboarding) {
      router.push("/onboarding");
      return;
    }

    const fetchLabResults = async () => {
      try {
        const response = await api.get("/lab-results/");
        if (response.data) {
          setForm({
            hemoglobin_g_dl: response.data.hemoglobin_g_dl ?? "",
            serum_vitamin_d: response.data.serum_vitamin_d ?? "",
            ferritin: response.data.ferritin ?? "",
            vitamin_b12: response.data.vitamin_b12 ?? "",
            calcium: response.data.calcium ?? ""
          });
        }
      } catch (error) {
        // 404 is expected if user hasn't saved labs yet, no need to show error
        if (error.response?.status !== 404) {
          toast.error("Failed to load existing lab results");
        }
      } finally {
        setLoadingData(false);
      }
    };

    fetchLabResults();
  }, [token, user, isLoading, router]);

  const handleChange = (e) => {
    // Only allow numbers and decimal points
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setForm((prev) => ({ ...prev, [e.target.name]: val }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Convert empty strings to null, strings to floats
    const payload = {
      hemoglobin_g_dl: form.hemoglobin_g_dl !== "" ? parseFloat(form.hemoglobin_g_dl) : null,
      serum_vitamin_d: form.serum_vitamin_d !== "" ? parseFloat(form.serum_vitamin_d) : null,
      ferritin: form.ferritin !== "" ? parseFloat(form.ferritin) : null,
      vitamin_b12: form.vitamin_b12 !== "" ? parseFloat(form.vitamin_b12) : null,
      calcium: form.calcium !== "" ? parseFloat(form.calcium) : null,
    };

    try {
      await api.post("/lab-results/", payload);
      toast.success("Lab results saved successfully!");
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errMsg = Array.isArray(detail)
        ? detail.map((e) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(", ")
        : detail || "Failed to save lab results.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loadingData || !token) {
    return (
      <div className="page-with-sidebar dash-loading">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      
      <main className="page-with-sidebar">
        <div className="page-content">
          <div className="page-header">
            <h1 className="page-title">Lab Results</h1>
            <p className="page-subtitle">
              Enter your recent blood work to personalize your nutritional assessment.
            </p>
          </div>
          
          <div className="premium-card">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Hemoglobin (g/dL)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="hemoglobin_g_dl"
                  value={form.hemoglobin_g_dl}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Serum Vitamin D</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="serum_vitamin_d"
                  value={form.serum_vitamin_d}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Ferritin</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="ferritin"
                  value={form.ferritin}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Vitamin B12</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="vitamin_b12"
                  value={form.vitamin_b12}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div className="form-group" style={{ flex: 0.5, marginBottom: 0 }}>
                <label>Calcium</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="calcium"
                  value={form.calcium}
                  onChange={handleChange}
                />
              </div>
              <div style={{ flex: 0.5 }}></div>
            </div>

            <button
              className="btn-primary w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save Labs"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

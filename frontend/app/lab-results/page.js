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
        <div className="page-content lr-custom-content">
          <h1 className="lr-page-title">Lab results</h1>
          <p className="lr-page-subtitle">
            Optional — improves iron & vitamin D confidence after ML prediction.
          </p>
          
          <div className="lr-card">
            <div className="lr-row">
              <div className="lr-field">
                <label>Hemoglobin (g/dL)</label>
                <input
                  type="number"
                  step="any"
                  name="hemoglobin_g_dl"
                  placeholder=""
                  value={form.hemoglobin_g_dl}
                  onChange={handleChange}
                />
              </div>
              <div className="lr-field">
                <label>Serum Vitamin D</label>
                <input
                  type="number"
                  step="any"
                  name="serum_vitamin_d"
                  placeholder=""
                  value={form.serum_vitamin_d}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="lr-row">
              <div className="lr-field">
                <label>Ferritin</label>
                <input
                  type="number"
                  step="any"
                  name="ferritin"
                  placeholder=""
                  value={form.ferritin}
                  onChange={handleChange}
                />
              </div>
              <div className="lr-field">
                <label>Vitamin B12</label>
                <input
                  type="number"
                  step="any"
                  name="vitamin_b12"
                  placeholder=""
                  value={form.vitamin_b12}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="lr-row">
              <div className="lr-field" style={{ flex: 0.5, paddingRight: '12px' }}>
                <label>Calcium</label>
                <input
                  type="number"
                  step="any"
                  name="calcium"
                  placeholder=""
                  value={form.calcium}
                  onChange={handleChange}
                />
              </div>
              {/* Empty div to preserve the 2 column layout for calcium */}
              <div style={{ flex: 0.5, paddingLeft: '12px' }}></div>
            </div>

          <button
            className="lr-submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save labs"}
          </button>
        </div>
      </div>
    </main>
    </>
  );
}

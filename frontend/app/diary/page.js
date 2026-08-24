"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import api from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import "../../styles/sidebar.css";
import "../../styles/diary.css";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Diary() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [date, setDate] = useState(todayStr());
  const [mealType, setMealType] = useState("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portion, setPortion] = useState("100");
  const [entries, setEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  // Fetch entries when date changes
  useEffect(() => {
    if (!token) return;
    api
      .get(`/diary/entries?date=${date}`)
      .then((res) => setEntries(res.data))
      .catch(() => setEntries([]));
  }, [token, date]);

  // Debounced food search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      api
        .get(`/foods/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => {
          setSearchResults(res.data);
          setShowDropdown(res.data.length > 0);
        })
        .catch(() => {
          setSearchResults([]);
          setShowDropdown(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectFood = (food) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    if (!selectedFood) {
      toast.error("Please search and select a food item.");
      return;
    }
    if (!portion || parseFloat(portion) <= 0) {
      toast.error("Please enter a valid portion.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/diary/entries", {
        entry_date: date,
        meal_type: mealType,
        food_name: selectedFood.name,
        portion_grams: parseFloat(portion),
        food_id: selectedFood.id,
      });

      toast.success("Meal logged!");

      // Reset form
      setSearchQuery("");
      setSelectedFood(null);
      setPortion("100");

      // Refresh entries
      const res = await api.get(`/diary/entries?date=${date}`);
      setEntries(res.data);
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (detail || "Failed to log meal.");
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entryId) => {
    const entryToDelete = entries.find((e) => e.id === entryId);
    if (!entryToDelete) return;

    try {
      await api.delete(`/diary/entries/${entryId}`);
      toast.success(`${entryToDelete.food_name} removed!`);
      setEntries(entries.filter((e) => e.id !== entryId));
    } catch (error) {
      toast.error("Failed to delete entry.");
    }
  };

  if (isLoading || !token || !user) {
    return (
      <div className="page-with-sidebar diary-loading">
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
            <h1 className="page-title">Food Diary</h1>
            <p className="page-subtitle">
              Search foods and log portions — nutrients computed automatically.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {/* ── Log meal form ── */}
            <div className="premium-card">
              <h2 style={{ fontSize: '20px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>Log Meal</h2>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Meal Type</label>
                <select
                  className="form-control"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="snack">Snack</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>

              <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
                <label>Search Food</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Apple, Dal, Rice..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedFood(null);
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                />

                {showDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', marginTop: '8px', zIndex: 50, boxShadow: 'var(--shadow-lg)', maxHeight: '300px', overflowY: 'auto' }}>
                    {searchResults.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}
                        onClick={() => selectFood(food)}
                      >
                        <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--color-slate-dark)' }}>{food.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--color-slate-light)' }}>
                          {food.source === "ifct" ? "IFCT 2017" : "USDA"} • 100g
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Portion (grams)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  step="1"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                />
              </div>

              <button
                className="btn-primary w-full"
                onClick={handleSubmit}
                disabled={submitting || !selectedFood}
                style={{ marginTop: '16px' }}
              >
                {submitting ? "Adding…" : "Add to diary"}
              </button>
            </div>

            {/* ── Entries panel ── */}
            <div className="premium-card">
              <h2 style={{ fontSize: '20px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>Entries on {date}</h2>

              {entries.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-slate-light)', marginBottom: '16px' }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-slate-dark)', marginBottom: '8px' }}>No meals logged</h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-slate-medium)' }}>
                    Start by searching and adding your breakfast.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {["breakfast", "lunch", "snack", "dinner", "other"].map((mealGroup) => {
                    const mealEntries = entries.filter(e => {
                      const type = String(e.meal_type).toLowerCase().trim();
                      if (mealGroup === "other") {
                        return !["breakfast", "lunch", "snack", "dinner"].includes(type);
                      }
                      return type === mealGroup;
                    });
                    
                    if (mealEntries.length === 0) return null;

                    return (
                      <div key={mealGroup}>
                        <h3 style={{ fontSize: '14px', textTransform: 'capitalize', fontWeight: '600', color: 'var(--color-slate-medium)', marginBottom: '12px' }}>{mealGroup === "other" ? "Other Meals" : mealGroup}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {mealEntries.map((entry) => (
                            <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--color-cream-darker)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                              <div>
                                <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--color-slate-dark)', display: 'block', marginBottom: '4px' }}>
                                  {entry.food_name}
                                </span>
                                <div style={{ fontSize: '13px', color: 'var(--color-slate-light)', display: 'flex', gap: '12px' }}>
                                  <span>{entry.portion_grams}g</span>
                                  <span>{entry.calories} kcal</span>
                                  <span>{entry.protein_g}g protein</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-slate-light)', cursor: 'pointer', padding: '8px' }}
                                title="Delete entry"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: "32px", fontSize: "13px", color: "var(--color-slate-light)", textAlign: "center" }}>
            Nutrition data: IFCT 2017 / USDA FoodData Central
          </div>
        </div>
      </main>
    </>
  );
}

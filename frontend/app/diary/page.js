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
          <h1 className="page-title">Food diary</h1>
          <p className="page-subtitle">
            Search foods and log portions — nutrients computed automatically.
          </p>

          <div className="diary-grid">
            {/* ── Log meal form ── */}
            <div className="diary-card">
              <h2 className="diary-card-title">Log meal</h2>

              {/* Date */}
              <div className="diary-field">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Meal type */}
              <div className="diary-field">
                <label>Meal</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              {/* Food search */}
              <div className="diary-field diary-search-wrapper" ref={dropdownRef}>
                <label>Search food</label>
                <input
                  type="text"
                  placeholder="Type to search — dal, palak, chawal, paneer..."
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
                  <div className="diary-dropdown">
                    {searchResults.map((food) => (
                      <button
                        key={food.id}
                        className="diary-dropdown-item"
                        onClick={() => selectFood(food)}
                        type="button"
                      >
                        <span className="diary-food-name">{food.name}</span>
                        <span className="diary-food-meta">
                          {food.source === "ifct" ? "IFCT 2017 (India)" : "USDA FoodData Central"} • Standard 100g serving
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Portion */}
              <div className="diary-field">
                <label>Portion (grams)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button
                className="diary-submit"
                onClick={handleSubmit}
                disabled={submitting || !selectedFood}
              >
                {submitting ? "Adding…" : "Add to diary"}
              </button>
            </div>

            {/* ── Entries panel ── */}
            <div className="diary-card">
              <h2 className="diary-card-title">Entries on {date}</h2>

              {entries.length === 0 ? (
                <p className="diary-empty">No meals logged this day.</p>
              ) : (
                <div className="diary-entries">
                  {entries.map((entry) => (
                    <div className="diary-entry" key={entry.id}>
                      <div className="diary-entry-header">
                        <span className="diary-entry-food">
                          {entry.food_name}
                        </span>
                        <div className="diary-entry-actions">
                          <span className="diary-entry-meal">
                            {entry.meal_type}
                          </span>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="diary-entry-delete"
                            title="Delete entry"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="diary-entry-details">
                        <span>{entry.portion_grams}g</span>
                        <span>{entry.calories} cal</span>
                        <span>{entry.protein_g}g protein</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: "24px", fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
            Nutrition data: IFCT 2017 (Indian Food Composition Tables) / USDA FoodData Central
          </div>
        </div>
      </main>
    </>
  );
}

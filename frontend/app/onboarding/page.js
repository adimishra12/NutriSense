"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import api from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/onboarding.css";

const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "dairy-free", label: "Dairy-free" },
  { value: "nut-allergy", label: "Nut allergy" },
];

export default function Onboarding() {
  const router = useRouter();
  const { user, token, isLoading, updateUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "",
    health_goal: "",
    dietary_preference: [],
  });

  // Route guard
  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    if (user && user.has_completed_onboarding) {
      router.push("/dashboard");
    }
  }, [token, user, isLoading, router]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleDiet = (value) => {
    setForm((prev) => ({
      ...prev,
      dietary_preference: prev.dietary_preference.includes(value)
        ? prev.dietary_preference.filter((v) => v !== value)
        : [...prev.dietary_preference, value],
    }));
  };

  const isValid =
    form.age &&
    form.gender &&
    form.height_cm &&
    form.weight_kg &&
    form.activity_level &&
    form.health_goal;

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/health-profile/", {
        age_years: parseInt(form.age),
        gender: form.gender === "male" ? 0 : 1,
        height_cm: parseFloat(form.height_cm),
        weight_kg: parseFloat(form.weight_kg),
        activity_level: form.activity_level,
        diet_restrictions:
          form.dietary_preference.length > 0
            ? form.dietary_preference
            : ["none"],
        conditions: "none",
        health_goal: form.health_goal,
      });
      updateUser({ has_completed_onboarding: true });
      toast.success("Profile saved! Welcome to NutriSense 🎉");
      router.push("/dashboard");
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errMsg = Array.isArray(detail)
        ? detail.map((e) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(", ")
        : detail || "Failed to save health profile.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !token) {
    return (
      <div className="ob-page ob-loading">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="ob-page">
      <div className="ob-container">
        {/* ── Header ── */}
        <p className="ob-brand">NutriSense</p>
        <h1 className="ob-title">Your health profile</h1>
        <p className="ob-subtitle">
          We use this to personalize RDA targets and meal filters.
        </p>

        {/* ── Age & Sex ── */}
        <div className="ob-row">
          <div className="ob-field">
            <label>Age</label>
            <input
              type="number"
              name="age"
              placeholder="25"
              value={form.age}
              onChange={handleChange}
              min="1"
              max="120"
            />
          </div>
          <div className="ob-field">
            <label>Sex</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* ── Height & Weight ── */}
        <div className="ob-row">
          <div className="ob-field">
            <label>Height (cm)</label>
            <input
              type="number"
              name="height_cm"
              placeholder="165"
              value={form.height_cm}
              onChange={handleChange}
              min="50"
              max="300"
              step="0.1"
            />
          </div>
          <div className="ob-field">
            <label>Weight (kg)</label>
            <input
              type="number"
              name="weight_kg"
              placeholder="60"
              value={form.weight_kg}
              onChange={handleChange}
              min="10"
              max="500"
              step="0.1"
            />
          </div>
        </div>

        {/* ── Activity level ── */}
        <div className="ob-field">
          <label>Activity level</label>
          <select
            name="activity_level"
            value={form.activity_level}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="sedentary">Sedentary</option>
            <option value="lightly_active">Lightly active</option>
            <option value="moderately_active">Moderately active</option>
            <option value="very_active">Very active</option>
          </select>
        </div>

        {/* ── Health goal ── */}
        <div className="ob-field">
          <label>Health goal</label>
          <input
            type="text"
            name="health_goal"
            placeholder="e.g. lose weight, build muscle, eat healthier"
            value={form.health_goal}
            onChange={handleChange}
          />
        </div>

        {/* ── Dietary restrictions (pill multi-select) ── */}
        <div className="ob-field">
          <label>Dietary restrictions</label>
          <div className="ob-pills">
            {DIETARY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`ob-pill ${
                  form.dietary_preference.includes(opt.value) ? "selected" : ""
                }`}
                onClick={() => toggleDiet(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Submit ── */}
        <button
          className="ob-submit"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
        >
          {submitting ? "Saving…" : "Save & go to dashboard"}
        </button>
      </div>
    </div>
  );
}

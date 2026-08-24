"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import api from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import "../../styles/sidebar.css";
import "../../styles/profile.css";

const DIETARY_OPTIONS = [
  { value: "Vegetarian", label: "Vegetarian" },
  { value: "Vegan", label: "Vegan" },
  { value: "Gluten-free", label: "Gluten-free" },
  { value: "Dairy-free", label: "Dairy-free" },
  { value: "Nut allergy", label: "Nut allergy" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isLoading, updateUser } = useAuth();

  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Account state
  const [accountForm, setAccountForm] = useState({
    full_name: "",
    email: "",
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });
  const [savingAccount, setSavingAccount] = useState(false);
  
  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Health Profile state
  const [healthForm, setHealthForm] = useState({
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "",
    health_goal: "",
    dietary_preference: [],
  });
  const [savingHealth, setSavingHealth] = useState(false);

  // Route guard & Load initial data
  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Load data
    const loadData = async () => {
      try {
        const [accRes, hpRes] = await Promise.all([
          api.get("/auth/profile"),
          api.get("/health-profile/")
        ]);
        
        setAccountForm(prev => ({
          ...prev,
          full_name: accRes.data.full_name,
          email: accRes.data.email
        }));
        
        const hp = hpRes.data;
        const dietaryList = hp.diet_restrictions ? hp.diet_restrictions.split(",").filter(r => r && r !== "none") : [];
        
        setHealthForm({
          age: hp.age_years.toString(),
          gender: hp.gender === 0 ? "male" : "female",
          height_cm: hp.height_cm.toString(),
          weight_kg: hp.weight_kg.toString(),
          activity_level: hp.activity_level,
          health_goal: hp.health_goal,
          dietary_preference: dietaryList,
        });
      } catch (err) {
        toast.error("Failed to load profile data.");
      } finally {
        setLoadingProfile(false);
      }
    };
    
    loadData();
  }, [token, isLoading, router]);

  const handleAccountChange = (e) => {
    setAccountForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleHealthChange = (e) => {
    setHealthForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleDiet = (value) => {
    setHealthForm((prev) => ({
      ...prev,
      dietary_preference: prev.dietary_preference.includes(value)
        ? prev.dietary_preference.filter((v) => v !== value)
        : [...prev.dietary_preference, value],
    }));
  };

  const handleSaveAccount = async () => {
    if (!accountForm.full_name || !accountForm.email) {
      toast.error("Name and email are required.");
      return;
    }
    
    setSavingAccount(true);
    try {
      // 1. Update basic info
      const res = await api.put("/auth/profile", {
        full_name: accountForm.full_name,
        email: accountForm.email
      });
      updateUser(res.data.user);
      
      // 2. Update password if requested
      if (accountForm.new_password) {
        if (accountForm.new_password !== accountForm.confirm_new_password) {
          toast.error("New passwords do not match.");
          setSavingAccount(false);
          return;
        }
        if (!accountForm.current_password) {
          toast.error("Current password is required to set a new password.");
          setSavingAccount(false);
          return;
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,}$/;

        if (!passwordRegex.test(accountForm.new_password)) {
            toast.error(
                "Password must contain uppercase, lowercase, number, special character and be at least 8 characters long."
            );
            setSavingAccount(false);
            return;
        }
        
        await api.put("/auth/profile/password", {
          current_password: accountForm.current_password,
          new_password: accountForm.new_password
        });
        
        // clear password fields
        setAccountForm(prev => ({
          ...prev,
          current_password: "",
          new_password: "",
          confirm_new_password: ""
        }));
      }
      
      toast.success("Account updated successfully.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update account.");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveHealth = async () => {
    if (
      !healthForm.age ||
      !healthForm.gender ||
      !healthForm.height_cm ||
      !healthForm.weight_kg ||
      !healthForm.activity_level ||
      !healthForm.health_goal
    ) {
      toast.error("Please fill in all health profile fields.");
      return;
    }
    
    setSavingHealth(true);
    try {
      await api.put("/health-profile/", {
        age_years: parseInt(healthForm.age),
        gender: healthForm.gender === "male" ? 0 : 1,
        height_cm: parseFloat(healthForm.height_cm),
        weight_kg: parseFloat(healthForm.weight_kg),
        activity_level: healthForm.activity_level,
        diet_restrictions:
          healthForm.dietary_preference.length > 0
            ? healthForm.dietary_preference
            : ["none"],
        conditions: "none",
        health_goal: healthForm.health_goal,
      });
      toast.success("Health profile saved.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save health profile.");
    } finally {
      setSavingHealth(false);
    }
  };

  if (isLoading || !token || loadingProfile) {
    return (
      <div className="page-with-sidebar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: "#6b7280" }}>Loading profile…</p>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-content">
          <div className="page-header">
            <h1 className="page-title">Profile</h1>
            <p className="page-subtitle">
              Account on the left, health profile on the right.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
            
            {/* ── Account Settings Card ── */}
            <div className="premium-card">
              <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--color-slate-dark)' }}>Account Settings</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-slate-medium)', marginBottom: '24px', lineHeight: 1.5 }}>
                You can update name or email anytime. Current password is only needed to set a new password.
              </p>
              
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="full_name"
                  value={accountForm.full_name}
                  onChange={handleAccountChange}
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={accountForm.email}
                  onChange={handleAccountChange}
                />
              </div>
              
              <div className="form-group">
                <label>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? "text" : "password"}
                    className="form-control"
                    name="current_password"
                    placeholder="Only needed to set a new password"
                    value={accountForm.current_password}
                    onChange={handleAccountChange}
                    style={{ paddingRight: '44px' }}
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '15px', cursor: 'pointer', color: 'var(--color-slate-light)' }} onClick={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? "text" : "password"}
                    className="form-control"
                    name="new_password"
                    placeholder="Leave blank to keep current"
                    value={accountForm.new_password}
                    onChange={handleAccountChange}
                    style={{ paddingRight: '44px' }}
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '15px', cursor: 'pointer', color: 'var(--color-slate-light)' }} onClick={() => setShowNew(!showNew)}>
                    {showNew ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="form-control"
                    name="confirm_new_password"
                    value={accountForm.confirm_new_password}
                    onChange={handleAccountChange}
                    style={{ paddingRight: '44px' }}
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '15px', cursor: 'pointer', color: 'var(--color-slate-light)' }} onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
              
              <button 
                className="btn-primary w-full" 
                onClick={handleSaveAccount}
                disabled={savingAccount}
                style={{ marginTop: '8px' }}
              >
                {savingAccount ? "Saving..." : "Save Account"}
              </button>
            </div>
            
            {/* ── Health Profile Card ── */}
            <div className="premium-card">
              <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--color-slate-dark)' }}>Health Profile</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-slate-medium)', marginBottom: '24px', lineHeight: 1.5 }}>
                Used for personalized nutrition targets and meal filters.
              </p>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Age</label>
                  <input
                    type="number"
                    className="form-control"
                    name="age"
                    value={healthForm.age}
                    onChange={handleHealthChange}
                    min="1"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Sex</label>
                  <select className="form-control" name="gender" value={healthForm.gender} onChange={handleHealthChange}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  className="form-control"
                  name="height_cm"
                  value={healthForm.height_cm}
                  onChange={handleHealthChange}
                />
              </div>
              
              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  className="form-control"
                  name="weight_kg"
                  value={healthForm.weight_kg}
                  onChange={handleHealthChange}
                />
              </div>
              
              <div className="form-group">
                <label>Activity Level</label>
                <select className="form-control" name="activity_level" value={healthForm.activity_level} onChange={handleHealthChange}>
                  <option value="">Select</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="lightly_active">Lightly active</option>
                  <option value="moderately_active">Moderately active</option>
                  <option value="very_active">Very active</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Health Goal</label>
                <input
                  type="text"
                  className="form-control"
                  name="health_goal"
                  value={healthForm.health_goal}
                  onChange={handleHealthChange}
                />
              </div>
              
              <div className="form-group">
                <label>Dietary Restrictions</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {DIETARY_OPTIONS.map((opt) => {
                    const isSelected = healthForm.dietary_preference.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        style={{
                          padding: '8px 14px',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--color-green-primary)' : 'var(--color-border)',
                          borderRadius: '100px',
                          background: isSelected ? 'var(--color-green-primary)' : 'var(--color-white)',
                          color: isSelected ? 'var(--color-white)' : 'var(--color-slate-medium)',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => toggleDiet(opt.value)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <button 
                className="btn-primary w-full"
                onClick={handleSaveHealth}
                disabled={savingHealth}
                style={{ marginTop: '8px' }}
              >
                {savingHealth ? "Saving..." : "Save Health Profile"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

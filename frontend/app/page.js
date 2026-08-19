"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import "../styles/landing.css";

export default function Home() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle transparent to solid navbar transition on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/signup");
    }
  };

  const navStyle = {
    background: isScrolled ? "rgba(6, 78, 59, 0.95)" : "transparent",
    backdropFilter: isScrolled ? "blur(10px)" : "none",
    borderBottom: isScrolled ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
    transition: "all 0.3s ease"
  };

  return (
    <div className="landing-page">
      {/* ── NAVBAR ── */}
      <nav className="landing-nav" style={navStyle}>
        <div className="container nav-content">
          <div className="nav-logo">NutriSense</div>
          <div className="nav-links">
            <Link href="#features" className="nav-link">Features</Link>
            <Link href="#how-it-works" className="nav-link">How it Works</Link>
            {token ? (
              <Link href="/dashboard" className="nav-btn">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="nav-link">Log in</Link>
                <Link href="/signup" className="nav-btn">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="hero-section">
        <img src="/images/hero-bg.png" alt="Healthy Food" className="hero-bg" />
        <div className="hero-overlay"></div>
        
        <div className="container hero-content">
          <div className="hero-text">
            <span className="eyebrow">NUTRISENSE</span>
            <h1 className="hero-title">AI-Based Nutritional Assessment System</h1>
            <p className="hero-subtitle">Understand your nutrition. Detect potential deficiencies. Build healthier habits.</p>
            <p className="hero-desc">Track your meals, analyze your nutritional intake, combine dietary and laboratory information, and receive personalized nutrition guidance.</p>
            
            <div className="hero-actions">
              <button onClick={handleGetStarted} className="btn-primary-large">
                Get Started
              </button>
              <Link href="#features" className="btn-secondary-large">
                Explore Features
              </Link>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="glass-card">
              <div className="glass-card-title">
                Nutrition Overview
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              
              <div className="glass-card-item">
                <div className="gci-header">
                  <span>Protein</span>
                  <span>78%</span>
                </div>
                <div className="gci-bar-bg">
                  <div className="gci-bar-fill" style={{ width: "78%" }}></div>
                </div>
              </div>

              <div className="glass-card-item">
                <div className="gci-header">
                  <span>Iron</span>
                  <span>62%</span>
                </div>
                <div className="gci-bar-bg">
                  <div className="gci-bar-fill" style={{ width: "62%", backgroundColor: "#f59e0b" }}></div>
                </div>
              </div>

              <div className="glass-card-item">
                <div className="gci-header">
                  <span>Vitamin D</span>
                  <span>45%</span>
                </div>
                <div className="gci-bar-bg">
                  <div className="gci-bar-fill" style={{ width: "45%", backgroundColor: "#ef4444" }}></div>
                </div>
              </div>
              
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "24px", textAlign: "center" }}>
                *Illustrative representation only
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section className="about-section">
        <div className="container about-grid">
          <div className="about-content">
            <h2>Nutrition that understands you.</h2>
            <p>NutriSense is an AI-based nutritional assessment system designed to help users understand their dietary intake and identify potential nutritional deficiency risks.</p>
            <p>The system combines food-diary data, nutritional composition data, user health information and available laboratory results to provide personalized nutritional insights.</p>
          </div>
          <div className="about-image-wrapper">
            <img src="/images/about-food.jpg" alt="Healthy balanced meal" className="about-image" />
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Everything you need to understand your nutrition</h2>
          </div>
          
          <div className="features-grid">
            {/* Card 1 */}
            <div className="feature-card">
              <div className="fc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              </div>
              <h3>Smart Food Diary</h3>
              <p>Search foods, select portions and automatically calculate nutritional intake.</p>
            </div>

            {/* Card 2 */}
            <div className="feature-card">
              <div className="fc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              </div>
              <h3>AI Nutritional Assessment</h3>
              <p>Analyze your dietary intake and identify potential nutritional deficiency risks.</p>
            </div>

            {/* Card 3 */}
            <div className="feature-card">
              <div className="fc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H4v4l3 3v5c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-5l3-3V3h-5"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
              </div>
              <h3>Lab Results Integration</h3>
              <p>Combine dietary information with available laboratory results for more personalized insights.</p>
            </div>

            {/* Card 4 */}
            <div className="feature-card">
              <div className="fc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              </div>
              <h3>Nutrition Dashboard</h3>
              <p>Compare your average nutrient intake against personalized RDA targets.</p>
            </div>

            {/* Card 5 */}
            <div className="feature-card">
              <div className="fc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <h3>Personalized Meal Plan</h3>
              <p>Get a 7-day meal plan focused on the nutrients identified as deficient.</p>
            </div>

            {/* Card 6 */}
            <div className="feature-card">
              <div className="fc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3>Progress Tracking</h3>
              <p>Track assessment results over time and understand whether your nutritional risks are improving.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="steps-section">
        <div className="container">
          <div className="section-header">
            <h2>From your meals to meaningful insights</h2>
          </div>
          
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">STEP 01</div>
              <h3>Build your profile</h3>
              <p>Tell NutriSense about your health profile, activity level and dietary preferences.</p>
            </div>
            <div className="step-card">
              <div className="step-number">STEP 02</div>
              <h3>Track your meals</h3>
              <p>Log your breakfast, lunch, snacks and dinner using the integrated food database.</p>
            </div>
            <div className="step-card">
              <div className="step-number">STEP 03</div>
              <h3>Understand your nutrition</h3>
              <p>Your qualifying dietary history and available laboratory results are analyzed to identify nutritional risks.</p>
            </div>
            <div className="step-card">
              <div className="step-number">STEP 04</div>
              <h3>Improve your nutrition</h3>
              <p>Use personalized recommendations, meal plans and progress tracking to work toward better nutrition.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATA SOURCES ── */}
      <section className="data-sources">
        <div className="container">
          <h4>Built on nutritional composition data</h4>
          <div className="ds-logos">
            <div className="ds-item">IFCT 2017</div>
            <div className="ds-item">USDA FoodData Central</div>
          </div>
          <p className="ds-text">
            NutriSense uses nutritional composition data from established food databases to calculate nutrient intake from logged foods.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <h2>Start understanding your nutrition today.</h2>
          <p>Track your meals, discover nutritional gaps and take the next step toward healthier eating.</p>
          <button onClick={handleGetStarted} className="btn-primary-large" style={{ background: "#fff", color: "#064e3b" }}>
            Get Started →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div>
              <div className="footer-logo">NutriSense</div>
              <div className="footer-desc">AI-Based Nutritional Assessment System</div>
            </div>
            <div className="footer-links">
              <Link href="#">Home</Link>
              <Link href="#features">Features</Link>
              <Link href="#how-it-works">About</Link>
              <a href="#" onClick={handleGetStarted}>Get Started</a>
            </div>
          </div>
          <div className="footer-disclaimer">
            NutriSense provides nutritional insights for informational purposes and is not a substitute for professional medical advice.
          </div>
        </div>
      </footer>
    </div>
  );
}
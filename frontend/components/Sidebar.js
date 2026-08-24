"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import "../styles/sidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Food diary", href: "/diary" },
  { label: "Lab results", href: "/lab-results" },
  { label: "Assessment", href: "/assessment" },
  { label: "Meal plan", href: "/meal-plan" },
  { label: "Progress", href: "/progress" },
  { label: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ── Mobile Header (Hamburger) ── */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
        <span className="mobile-brand">NutriSense</span>
      </div>

      {/* ── Overlay for mobile ── */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* ── Brand ── */}
        <div className="sidebar-brand">
          <h1>NutriSense</h1>
          {user && (
            <p className="sidebar-username">
              {user.email || user.first_name}
            </p>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              className={`sidebar-link ${
                pathname === item.href ? "active" : ""
              }`}
              onClick={() => {
                router.push(item.href);
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* ── Sign out ── */}
        <div className="sidebar-footer">
          <button className="sidebar-signout" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

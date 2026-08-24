import { FaLeaf, FaCheckCircle } from "react-icons/fa";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-split-layout">
      {/* Left Panel */}
      <div className="auth-brand-side">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <FaLeaf size={32} color="#10b981" />
          <h1 style={{ margin: 0, fontSize: '36px', letterSpacing: '-1px' }}>NutriSense</h1>
        </div>

        <h2 style={{ fontSize: '28px', marginBottom: '16px', fontWeight: '600' }}>
          AI-Based Nutritional Assessment
        </h2>

        <p style={{ marginBottom: '48px', lineHeight: '1.6' }}>
          Your intelligent nutrition companion for detecting deficiencies
          and creating personalized meal plans.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaCheckCircle size={20} color="#10b981" />
            <span style={{ fontSize: '16px', fontWeight: '500' }}>AI Deficiency Detection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaCheckCircle size={20} color="#10b981" />
            <span style={{ fontSize: '16px', fontWeight: '500' }}>Personalized Meal Planning</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaCheckCircle size={20} color="#10b981" />
            <span style={{ fontSize: '16px', fontWeight: '500' }}>Nutrition Insights</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="page-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px' }}>{title}</h2>
            <p style={{ color: 'var(--color-slate-medium)' }}>{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
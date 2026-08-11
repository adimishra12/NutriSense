import "./../styles/auth.css";
import { FaLeaf, FaCheckCircle } from "react-icons/fa";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-container">

      {/* Left Panel */}
      <div className="left-panel">

        <div className="brand">
          <FaLeaf className="brand-icon" />
          <h1>NutriSense</h1>
        </div>

        <h2>AI-Based Nutritional Assessment</h2>

        <p>
          Your intelligent nutrition companion for detecting deficiencies
          and creating personalized meal plans.
        </p>

        <div className="feature">
          <FaCheckCircle />
          <span>AI Deficiency Detection</span>
        </div>

        <div className="feature">
          <FaCheckCircle />
          <span>Personalized Meal Planning</span>
        </div>

        <div className="feature">
          <FaCheckCircle />
          <span>Nutrition Insights</span>
        </div>

      </div>

      {/* Right Panel */}
      <div className="right-panel">

        <div className="auth-card">

          <h2>{title}</h2>

          <p>{subtitle}</p>

          {children}

        </div>

      </div>

    </div>
  );
}
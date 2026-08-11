"use client";

import { useState } from "react";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

export default function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  name,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="input-group">
      <label>{label}</label>

      <div className="input-box">
        <FaLock className="input-icon" />

        <input
          className="password-input"
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          name={name}
          value={value || ""}
          onChange={onChange}
          autoComplete="new-password"
        />

        <span
          className="eye-btn"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>
    </div>
  );
}
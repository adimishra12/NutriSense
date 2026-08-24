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
    <div className="form-group">
      <label>{label}</label>

      <div style={{ position: 'relative' }}>
        <FaLock style={{ position: 'absolute', top: '15px', left: '16px', color: 'var(--color-slate-light)' }} />

        <input
          className="form-control"
          style={{ paddingLeft: '44px', paddingRight: '44px' }}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          name={name}
          value={value || ""}
          onChange={onChange}
          autoComplete="new-password"
        />

        <span
          style={{ position: 'absolute', top: '15px', right: '16px', color: 'var(--color-slate-light)', cursor: 'pointer' }}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>
    </div>
  );
}
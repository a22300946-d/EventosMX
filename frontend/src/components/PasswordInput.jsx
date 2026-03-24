import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./PasswordInput.css";

function PasswordInput({ 
  value, 
  onChange, 
  placeholder = "Contraseña",
  name,           // ← NUEVO
  className = "", // ← NUEVO
  required = false // ← NUEVO
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-container">
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        className={`password-input ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />

      <span
        className="password-toggle"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </span>
    </div>
  );
}

export default PasswordInput;
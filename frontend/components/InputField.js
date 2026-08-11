import { FaEnvelope, FaUser } from "react-icons/fa";

export default function InputField({
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  name,
}) {
  return (
    <div className="input-group">
      <label>{label}</label>

      <div className="input-box">
        {icon === "email" && <FaEnvelope className="input-icon" />}
        {icon === "user" && <FaUser className="input-icon" />}

        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
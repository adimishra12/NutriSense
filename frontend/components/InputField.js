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
    <div className="form-group">
      <label>{label}</label>

      <div style={{ position: 'relative' }}>
        {icon === "email" && <FaEnvelope style={{ position: 'absolute', top: '15px', left: '16px', color: 'var(--color-slate-light)' }} />}
        {icon === "user" && <FaUser style={{ position: 'absolute', top: '15px', left: '16px', color: 'var(--color-slate-light)' }} />}

        <input
          className="form-control"
          style={{ paddingLeft: icon ? '44px' : '16px' }}
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
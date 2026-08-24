export default function PasswordStrength({ password }) {

    const checks = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    return (

        <div style={{ background: 'var(--color-cream-darker)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-slate-medium)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{checks.length ? "🟢" : "⚪"} At least 8 characters</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{checks.upper ? "🟢" : "⚪"} One uppercase letter</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{checks.lower ? "🟢" : "⚪"} One lowercase letter</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{checks.number ? "🟢" : "⚪"} One number</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{checks.special ? "🟢" : "⚪"} One special character</li>
            </ul>
        </div>

    );
}
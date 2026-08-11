export default function PasswordStrength({ password }) {

    const checks = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    return (

        <div className="strength-box">

            <ul>

                <li>{checks.length ? "🟢" : "⚪"} At least 8 characters</li>

                <li>{checks.upper ? "🟢" : "⚪"} One uppercase letter</li>

                <li>{checks.lower ? "🟢" : "⚪"} One lowercase letter</li>

                <li>{checks.number ? "🟢" : "⚪"} One number</li>

                <li>{checks.special ? "🟢" : "⚪"} One special character</li>

            </ul>

        </div>

    );
}
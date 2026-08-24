export default function Button({
    text,
    disabled = false,
}) {

    return (

        <button
            type="submit"
            disabled={disabled}
            className="btn-primary w-full"
            style={{ marginTop: '16px', opacity: disabled ? 0.6 : 1 }}
        >
            {text}
        </button>

    );

}
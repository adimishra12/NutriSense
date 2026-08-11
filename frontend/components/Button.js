export default function Button({
    text,
    disabled = false,
}) {

    return (

        <button
            type="submit"
            disabled={disabled}
            className="primary-btn"
        >

            {text}

        </button>

    );

}
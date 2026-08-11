import Link from "next/link";

export default function Home() {
  return (
    <main className="home-container">

      <div className="card">

        <h1>🌿 NutriSense</h1>

        <h2>AI-Based Nutritional Assessment System</h2>

        <p>
          Helping users detect nutritional deficiencies
          through Artificial Intelligence.
        </p>

        <Link href="/login">
          <button className="btn">Login</button>
        </Link>

        <Link href="/signup">
          <button className="btn signup">
            Sign Up
          </button>
        </Link>

      </div>

    </main>
  );
}
"use client";
import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../utils/axios";
import AuthLayout from "../../components/AuthLayout";
import InputField from "../../components/InputField";
import PasswordInput from "../../components/PasswordInput";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
       toast.error("Please enter both email and password.");
        return;
    }

    try {

        const response = await api.post("/auth/login", {
            email,
            password,
        });

        const { access_token, user } = response.data;

        // Store token and user in AuthContext
        login(access_token, user);

        toast.success(response.data.message);

        // Redirect based on onboarding status
        if (user.has_completed_onboarding) {
            router.push("/dashboard");
        } else {
            router.push("/onboarding");
        }

    } catch (error) {

       toast.error(
    error.response?.data?.detail ||
    "Login failed."
);

    }
};

    return (

        <AuthLayout
            title="Welcome Back 👋"
            subtitle="Login to continue your health journey"
        >

            <form onSubmit={handleLogin}>

                <InputField
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon="email"
                />

                <PasswordInput
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0', fontSize: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" />
                        <span style={{ color: 'var(--color-slate-medium)' }}>Remember Me</span>
                    </label>

                    <Link href="#" style={{ color: 'var(--color-green-primary)', fontWeight: '500' }}>
                        Forgot Password?
                    </Link>
                </div>

                <Button
                    text="Login"
                />
            </form>

            <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--color-slate-medium)' }}>
                Don't have an account?{' '}
                <Link href="/signup" style={{ color: 'var(--color-green-primary)', fontWeight: '600' }}>
                    Sign Up
                </Link>
            </div>

        </AuthLayout>

    );
}
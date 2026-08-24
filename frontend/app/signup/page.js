"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import api from "../../utils/axios";

import AuthLayout from "../../components/AuthLayout";
import InputField from "../../components/InputField";
import PasswordInput from "../../components/PasswordInput";
import PasswordStrength from "../../components/PasswordStrength";
import Button from "../../components/Button";

export default function Signup() {
    const router = useRouter();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const passwordValid =
        form.password.length >= 8 &&
        /[A-Z]/.test(form.password) &&
        /[a-z]/.test(form.password) &&
        /\d/.test(form.password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(form.password);

    const handleSignup = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,}$/;

        if (!passwordRegex.test(form.password)) {
            toast.error(
                "Password must contain uppercase, lowercase, number, special character and be at least 8 characters long."
            );
            return;
        }

        try {
            await api.post("/auth/signup", {
                first_name: form.firstName,
                last_name: form.lastName,
                email: form.email,
                password: form.password,
            });

            toast.success("Account created successfully!");

            router.push("/login");
        } catch (error) {
            toast.error(
                error.response?.data?.detail || "Signup failed."
            );
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Start your healthy journey today"
        >
            <form onSubmit={handleSignup}>

                <div style={{ display: 'flex', gap: '16px' }}>

                    <div style={{ flex: 1 }}>
                        <InputField
                            label="First Name"
                            type="text"
                            placeholder="First Name"
                            icon="user"
                            value={form.firstName}
                            onChange={handleChange}
                            name="firstName"
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <InputField
                            label="Last Name"
                            type="text"
                            placeholder="Last Name"
                            icon="user"
                            value={form.lastName}
                            onChange={handleChange}
                            name="lastName"
                        />
                    </div>

                </div>

                <InputField
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    icon="email"
                    value={form.email}
                    onChange={handleChange}
                    name="email"
                />

                <PasswordInput
                    label="Password"
                    placeholder="Create Password"
                    value={form.password}
                    onChange={handleChange}
                    name="password"
                />

                <PasswordStrength password={form.password} />

                <PasswordInput
                    label="Confirm Password"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    name="confirmPassword"
                />

                <Button
                    text="Create Account"
                    disabled={!passwordValid}
                />

            </form>

            <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--color-slate-medium)' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--color-green-primary)', fontWeight: '600' }}>Login</Link>
            </div>

        </AuthLayout>
    );
}
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "NutriSense — AI Nutritional Assessment",
  description: "AI-Based Nutritional Assessment System for Deficiency Detection and Personalized Meal Planning",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>
          <Toaster
            position="top-right"
            reverseOrder={false}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

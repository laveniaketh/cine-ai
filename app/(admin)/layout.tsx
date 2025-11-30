import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Schibsted_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
//
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const schibstedGrotesk = Schibsted_Grotesk({
    variable: "--font-schibsted-grotesk",
    subsets: ["latin"],
});

const martianMono = Martian_Mono({
    variable: "--font-martian-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "CineAI",
    description: "CineAI: Smart AI-Powered Cinema Ticketing & Management System",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${schibstedGrotesk.variable} ${martianMono.variable} min-h-screen antialiased`}
        >
        {children}
        </body>
        </html>
    );
}

import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Figtree, Schibsted_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";
import LightRays from "@/components/LightRays";


const figtree = Figtree({
    variable: "--font-figtree",
    subsets: ["latin"],
});

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
          className={`${schibstedGrotesk.variable} ${martianMono.variable} ${figtree.variable} min-h-screen antialiased`}
      >
      <div className="absolute inset-0 top-0 z-[-1] min-h-screen">
          <LightRays
              raysOrigin="top-center"
              raysColor="#FFFF"
              raysSpeed={1}
              lightSpread={1.2}
              rayLength={1}
              followMouse={true}
              mouseInfluence={0.02}
              noiseAmount={0.2}
              fadeDistance={1.5}
          />

      </div>
      <main className="relative flex flex-col min-h-screen ">
          {children}

      </main>


      </body>
    </html>
  );
}

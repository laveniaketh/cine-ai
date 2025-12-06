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
        className={`${schibstedGrotesk.variable} ${martianMono.variable} ${figtree.variable} min-h-screen  antialiased`}
      >
        {/* <div className="pattern" /> */}
        <div className="absolute inset-0 top-0 z-[-1]">
          <LightRays
            raysOrigin="top-right"
            raysColor="#ffff"
            raysSpeed={0.3}
            lightSpread={0.8}
            rayLength={1.2}
            followMouse={true}
            mouseInfluence={0.02}
            noiseAmount={0.1}
            distortion={0.01}

          />
        </div>
        <div className="absolute inset-0 top-0 z-[-1]">
          <LightRays
            raysOrigin="top-left"
            raysColor="#ffff"
            raysSpeed={0.3}
            lightSpread={0.8}
            rayLength={1.2}
            followMouse={true}
            mouseInfluence={0.02}
            noiseAmount={0.1}
            distortion={0.01}


          />
        </div>

        <main className="min-h-screen w-full ">
          {children}

        </main>

      </body>
    </html>
  );
}

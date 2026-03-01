"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";

const ROUTE_AUDIO: Record<string, string> = {
    "/kiosk": process.env.NEXT_PUBLIC_AUDIO_KIOSK_WELCOME!,
    "/kiosk/movie-selection": process.env.NEXT_PUBLIC_AUDIO_MOVIE_SELECTION!,
    "/kiosk/seat-selection": process.env.NEXT_PUBLIC_AUDIO_SEAT_SELECTION!,
    "/kiosk/payment-confirmation": process.env.NEXT_PUBLIC_AUDIO_PAYMENT_CONFIRMATION!,
    "/kiosk/payment-sucessful": process.env.NEXT_PUBLIC_AUDIO_PAYMENT_SUCCESSFUL!,
};

// ─── Subtitle text shown while each audio clip plays ─────────────────────────
const ROUTE_MESSAGES: Record<string, string> = {
    "/kiosk":
        "Welcome to CineAI, your intelligent movie ticketing kiosk. We showcase carefully curated films for all. Please tap 'Buy Ticket' to begin your cinema experience.",
    "/kiosk/movie-selection":
        "Please select a movie from our curated collection. Browse through the available films by swiping through the preview images. Click the poster of the selected movie below bottom right to proceed with your selection.",
    "/kiosk/seat-selection":
        "Select your preferred seats for the movie. See through the seat legend to determine available, reserved, and sold seats. You can select up to 20 seats for your booking. Click on the seats you want, then press Next.",
    "/kiosk/payment-confirmation":
        "Please review your payment details carefully. Check your movie title, timeslot, selected seats, and total amount. If everything is correct, click Confirm to proceed. Otherwise, click Back to modify your selection.",
    "/kiosk/payment-sucessful":
        "Booking successful! Your tickets have been reserved. Please proceed to the cashier counter to complete your payment and collect your physical tickets. Thank you for choosing CineAI!",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function VoiceAssistant() {
    const pathname = usePathname();

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showSubtitle, setShowSubtitle] = useState(false);
    const [subtitleText, setSubtitleText] = useState("");

    // ─── Refs ─────────────────────────────────────────────────────────────────
    const currentAudio = useRef<HTMLAudioElement | null>(null);
    const repeatRef = useRef<NodeJS.Timeout | null>(null);
    const subtitleTimer = useRef<NodeJS.Timeout | null>(null);
    const lastRouteRef = useRef("");

    // Stable refs — always hold the latest value inside async callbacks
    const isMutedRef = useRef(false);
    const pathnameRef = useRef(pathname);

    // Holds the route that was blocked by the browser's autoplay policy.
    // When the user taps anywhere on the page, we retry playing this route.
    const pendingRouteRef = useRef<string | null>(null);

    const isOnKiosk = pathname?.startsWith("/kiosk");

    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
    useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

    // ── Show / hide subtitle bubble ────────────────────────────────────────────
    const showMessage = useCallback((text: string) => {
        setSubtitleText(text);
        setShowSubtitle(true);
        if (subtitleTimer.current) clearTimeout(subtitleTimer.current);
    }, []);

    const hideMessage = useCallback(() => {
        if (subtitleTimer.current) clearTimeout(subtitleTimer.current);
        setShowSubtitle(false);
    }, []);

    // ── Stop nav audio ─────────────────────────────────────────────────────────
    const stopNavAudio = useCallback(() => {
        if (repeatRef.current) { clearTimeout(repeatRef.current); repeatRef.current = null; }
        if (currentAudio.current) {
            // Flag as intentionally stopped BEFORE clearing src.
            // Without this, setting src="" triggers onerror on the old element,
            // producing a false "Audio file failed to load" error on navigation.
            (currentAudio.current as any)._stoppedIntentionally = true;
            currentAudio.current.pause();
            currentAudio.current.src = "";
            currentAudio.current = null;
        }
        setIsSpeaking(false);
        hideMessage();
    }, [hideMessage]);

    // ── Play nav audio from Cloudinary MP3 ────────────────────────────────────
    const playNavAudio = useCallback((route: string) => {
        if (isMutedRef.current) return;

        const src = ROUTE_AUDIO[route];
        if (!src || src === "undefined") {
            console.warn(`[CineAI] No audio URL set for route: ${route}`);
            return;
        }

        // Stop whatever is currently playing before starting the new clip
        stopNavAudio();

        const audio = new Audio(src);
        currentAudio.current = audio;

        audio.onended = () => {
            setIsSpeaking(false);
            hideMessage();
            currentAudio.current = null;
            pendingRouteRef.current = null;

            // Replay after 60s if still on the same route and not muted
            repeatRef.current = setTimeout(() => {
                if (!isMutedRef.current && pathnameRef.current === route) {
                    playNavAudio(route);
                }
            }, 15000);
        };

        audio.onerror = () => {
            // Ignore errors caused by intentional stops (navigation, mute, or
            // a new clip replacing this one). Only log genuine load failures.
            if ((audio as any)._stoppedIntentionally) return;
            console.error(`[CineAI] Audio file failed to load: ${src}`);
            setIsSpeaking(false);
            hideMessage();
            currentAudio.current = null;
            pendingRouteRef.current = null;
        };

        // ── Autoplay policy handling ───────────────────────────────────────────
        // Browsers block auto-play on page load / route change if the user
        // hasn't interacted with the new page yet.
        // Strategy: attempt play() — if blocked, store the route in
        // pendingRouteRef and retry it the moment the user taps anywhere.
        audio
            .play()
            .then(() => {
                // Play started successfully — show UI
                setIsSpeaking(true);
                showMessage(ROUTE_MESSAGES[route] || "");
                pendingRouteRef.current = null; // clear any pending retry
            })
            .catch(() => {
                // Blocked by autoplay policy — queue for retry on next user tap
                currentAudio.current = null;
                pendingRouteRef.current = route;
                // No console.error here — this is expected browser behaviour
            });

    }, [showMessage, hideMessage, stopNavAudio]);

    // ── Retry blocked audio on first user interaction with the page ───────────
    // Attaches a one-shot click/touchstart listener to the document.
    // As soon as the user taps or clicks anything, the pending audio plays.
    useEffect(() => {
        const retry = () => {
            const route = pendingRouteRef.current;
            if (route && !isMutedRef.current) {
                pendingRouteRef.current = null;
                playNavAudio(route);
            }
        };

        document.addEventListener("click", retry, { once: true, capture: true });
        document.addEventListener("touchstart", retry, { once: true, capture: true });

        return () => {
            document.removeEventListener("click", retry, { capture: true });
            document.removeEventListener("touchstart", retry, { capture: true });
        };
    }, [playNavAudio]);

    // ── Trigger audio on route change ─────────────────────────────────────────
    useEffect(() => {
        if (!isOnKiosk) return;
        if (pathname === lastRouteRef.current) return;
        lastRouteRef.current = pathname || "";

        stopNavAudio();

        if (!isMutedRef.current && ROUTE_AUDIO[pathname || ""]) {
            // Small delay so the page transition settles before audio starts
            const t = setTimeout(() => playNavAudio(pathname || ""), 400);
            return () => clearTimeout(t);
        }
    }, [pathname, isOnKiosk, stopNavAudio, playNavAudio]);

    // ── Toggle mute / unmute ───────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        if (isMuted) {
            setIsMuted(false);
            isMutedRef.current = false;
            pendingRouteRef.current = null;
            setTimeout(() => playNavAudio(pathnameRef.current || ""), 300);
        } else {
            setIsMuted(true);
            isMutedRef.current = true;
            pendingRouteRef.current = null;
            stopNavAudio();
        }
    }, [isMuted, stopNavAudio, playNavAudio]);

    // ── Cleanup on unmount ─────────────────────────────────────────────────────
    useEffect(() => {
        return () => { stopNavAudio(); };
    }, [stopNavAudio]);

    // ── Don't render outside kiosk routes ─────────────────────────────────────
    if (!isOnKiosk) return null;

    return (
        <>

            <div
                className={`
                    fixed top-4 right-20 z-40 max-w-lg 
                    transition-all duration-500 ease-out
                    ${showSubtitle
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    }
                `}
            >
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/10 text-white text-sm leading-relaxed px-4 py-3 rounded-2xl rounded-tr-sm shadow-2xl">
                    <div className="flex items-start gap-2">

                        {/* Animated voice bars — pulse while audio is playing */}
                        <div className="flex-shrink-0 mt-1 flex gap-0.5 items-end h-4">
                            {[0, 150, 300].map((delay) => (
                                <div
                                    key={delay}
                                    className="w-0.5 rounded-full bg-yellow-300"
                                    style={{
                                        animation: isSpeaking
                                            ? `voiceBar 0.8s ease-in-out infinite alternate ${delay}ms`
                                            : "none",
                                        height: isSpeaking ? "100%" : "30%",
                                        transition: "height 0.3s",
                                    }}
                                />
                            ))}
                        </div>

                        <p className="text-white/90 font-light">{subtitleText}</p>
                    </div>
                </div>

            </div>

            {/* ── Mute / Unmute button ──────────────────────────────────────── */}
            <div className="fixed top-4 right-4 z-50">
                <button
                    onClick={toggleMute}
                    title={isMuted ? "Unmute voice guide" : "Mute voice guide"}
                    className="
                        h-12 w-12 rounded-full shadow-lg
                        flex items-center justify-center
                        transition-all duration-200 hover:scale-110 active:scale-95
                        bg-black/60 backdrop-blur border border-white/20 hover:bg-black/80
                    "
                >
                    {isMuted ? (
                        <VolumeX className="h-5 w- text-red-400" />
                    ) : (
                        <Volume2
                            className={`h-4 w-4 transition-colors ${isSpeaking ? "text-yellow-400" : "text-white/60"
                                }`}
                        />
                    )}
                </button>
            </div>

            <style>{`
                @keyframes voiceBar {
                    from { transform: scaleY(0.3); }
                    to   { transform: scaleY(1); }
                }
            `}</style>
        </>
    );
}
// components/kiosk/VoiceNavigation.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

const ROUTE_MESSAGES: Record<string, string> = {
    "/kiosk": "Welcome to CineAI, your intelligent movie ticketing kiosk. We showcase carefully curated films for all. Please tap 'Buy Ticket' to begin your cinema experience.",
    "/kiosk/movie-selection": "Please select a movie from our curated collection. Browse through the available films by swiping through the preview images. Click the poster of the selected movie below bottom right to proceed with your selection.",
    "/kiosk/seat-selection": "Select your preferred seats for the movie. See through the seat legend to determine available, reserved, and sold seats. You can select up to 20 seats for your booking. Click on the seats you want, then press Next.",
    "/kiosk/payment-confirmation": "Please review your payment details carefully. Check your movie title, timeslot, selected seats, and total amount. If everything is correct, click Confirm to proceed. Otherwise, click Back to modify your selection.",
    "/kiosk/payment-sucessful": "Booking successful! Your tickets have been reserved. Please proceed to the cashier counter to complete your payment and collect your physical tickets. Thank you for choosing CineAI!"
};

export default function VoiceNavigation() {
    const pathname = usePathname();
    const [isMuted, setIsMuted] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const lastRouteRef = useRef("");
    const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
    const repeatTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isStoppingRef = useRef(false);

    useEffect(() => {
        // Only proceed if we're on a kiosk route
        if (!pathname?.startsWith("/kiosk")) {
            return;
        }

        // Check if route has actually changed
        if (pathname === lastRouteRef.current) {
            return;
        }

        const hasRouteChanged = lastRouteRef.current !== "";
        lastRouteRef.current = pathname;

        // Immediately stop any active call when route changes
        const stopCurrentCall = async () => {
            if (isActive || isStoppingRef.current) {
                isStoppingRef.current = true;

                // Clear any pending auto-stop timer
                if (autoStopTimerRef.current) {
                    clearTimeout(autoStopTimerRef.current);
                    autoStopTimerRef.current = null;
                }

                // Clear any pending repeat timer
                if (repeatTimerRef.current) {
                    clearTimeout(repeatTimerRef.current);
                    repeatTimerRef.current = null;
                }

                try {
                    await vapi.stop();
                } catch (error) {
                    console.error("Error stopping previous call:", error);
                }

                setIsActive(false);
                isStoppingRef.current = false;
            }
        };

        // Start new navigation immediately after stopping
        const handleRouteChange = async () => {
            // Stop current call if active
            await stopCurrentCall();

            // Only start new navigation if not muted
            if (!isMuted) {
                const message = ROUTE_MESSAGES[pathname];
                if (message) {
                    // Start immediately without delay
                    await startVoiceNavigation(message);
                }
            }
        };

        handleRouteChange();

        // Cleanup function
        return () => {
            if (autoStopTimerRef.current) {
                clearTimeout(autoStopTimerRef.current);
            }
            if (repeatTimerRef.current) {
                clearTimeout(repeatTimerRef.current);
            }
        };
    }, [pathname, isMuted]);

    const startVoiceNavigation = async (message: string) => {
        // Prevent starting if already stopping
        if (isStoppingRef.current) {
            return;
        }

        try {
            setIsActive(true);

            await vapi.start({
                model: {
                    provider: "openai",
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are a helpful cinema kiosk voice assistant. Speak clearly and concisely to guide users through the ticket booking process. Keep your responses brief and direct."
                        },
                        {
                            role: "assistant",
                            content: message
                        }
                    ]
                },
                voice: {
                    provider: "11labs",
                    voiceId: "21m00Tcm4TlvDq8ikWAM"
                },
                name: "CineAI Navigation Assistant",
                firstMessage: message,
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    language: "en"
                },
                recordingEnabled: false,
                endCallFunctionEnabled: false,
                clientMessages: ["transcript", "hang"],
                serverMessages: ["end-of-call-report", "hang"]
            });

            // Auto-stop after message is delivered (15 seconds for longer messages)
            autoStopTimerRef.current = setTimeout(async () => {
                try {
                    await vapi.stop();
                    setIsActive(false);
                } catch (error) {
                    console.error("Error auto-stopping navigation:", error);
                }
                autoStopTimerRef.current = null;
            }, 15000);

            // Set up repeat timer to repeat the message after 1 minute
            repeatTimerRef.current = setTimeout(async () => {
                if (!isMuted && pathname === lastRouteRef.current) {
                    // Repeat the message
                    await startVoiceNavigation(message);
                }
            }, 60000); // 60 seconds = 1 minute

        } catch (error) {
            console.error("Voice navigation error:", error);
            setIsActive(false);
        }
    };

    const toggleMute = async () => {
        if (!isMuted) {
            // Muting - stop current narration immediately
            if (autoStopTimerRef.current) {
                clearTimeout(autoStopTimerRef.current);
                autoStopTimerRef.current = null;
            }

            try {
                await vapi.stop();
            } catch (error) {
                console.error("Error stopping on mute:", error);
            }
            setIsActive(false);
        } else {
            // Unmuting - restart narration for current route
            const message = ROUTE_MESSAGES[pathname || ""];
            if (message) {
                await startVoiceNavigation(message);
            }
        }
        setIsMuted(!isMuted);
    };

    // Only show on kiosk routes
    if (!pathname?.startsWith("/kiosk")) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-40">
            <Button
                onClick={toggleMute}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-white/90 hover:bg-white border-2 transition-all hover:scale-110"
                title={isMuted ? "Unmute Navigation Voice" : "Mute Navigation Voice"}
            >
                {isMuted ? (
                    <VolumeX className="h-6 w-6 text-red-500" />
                ) : (
                    <Volume2 className={`h-6 w-6 ${isActive ? 'text-green-500 animate-pulse' : 'text-green-500'}`} />
                )}
            </Button>

            {/* Status indicator */}
            {isActive && !isMuted && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-white bg-black/70 px-2 py-1 rounded whitespace-nowrap">
                    Speaking...
                </div>
            )}
        </div>
    );
}
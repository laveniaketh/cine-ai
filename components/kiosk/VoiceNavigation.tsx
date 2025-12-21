// components/kiosk/VoiceNavigation.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

// Create a separate Vapi instance for navigation to avoid conflicts
const navigationVapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

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
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const lastRouteRef = useRef("");
    const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
    const repeatTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isProcessingRef = useRef(false);
    const previousMutedStateRef = useRef(false);
    const startDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for VoiceChatbot state changes
    useEffect(() => {
        const handleChatbotStateChange = (event: CustomEvent) => {
            const { isOpen } = event.detail;
            setIsChatbotOpen(isOpen);

            if (isOpen) {
                // Chatbot opened - save current muted state and stop navigation
                previousMutedStateRef.current = isMuted;
                stopNavigationImmediately();
            } else {
                // Chatbot closed - restart navigation if it wasn't manually muted before
                if (!previousMutedStateRef.current) {
                    const message = ROUTE_MESSAGES[pathname || ""];
                    if (message) {
                        // Clear any existing timers
                        if (startDelayTimerRef.current) {
                            clearTimeout(startDelayTimerRef.current);
                        }

                        // Give it a moment for the chatbot to fully close
                        startDelayTimerRef.current = setTimeout(async () => {
                            await startVoiceNavigation(message);
                        }, 800);
                    }
                }
            }
        };

        window.addEventListener('voiceChatbotStateChange', handleChatbotStateChange as EventListener);

        return () => {
            window.removeEventListener('voiceChatbotStateChange', handleChatbotStateChange as EventListener);
            if (startDelayTimerRef.current) {
                clearTimeout(startDelayTimerRef.current);
            }
        };
    }, [pathname, isMuted]);

    useEffect(() => {
        // Only proceed if we're on a kiosk route
        if (!pathname?.startsWith("/kiosk")) {
            return;
        }

        // Check if route has actually changed
        if (pathname === lastRouteRef.current) {
            return;
        }

        lastRouteRef.current = pathname;

        const handleRouteChange = async () => {
            // Clear any pending start delays
            if (startDelayTimerRef.current) {
                clearTimeout(startDelayTimerRef.current);
                startDelayTimerRef.current = null;
            }

            // Stop current call if active
            await stopNavigationImmediately();

            // Only start new navigation if not muted AND chatbot is not open
            if (!isMuted && !isChatbotOpen) {
                const message = ROUTE_MESSAGES[pathname];
                if (message) {
                    // Shorter delay for route changes
                    startDelayTimerRef.current = setTimeout(async () => {
                        await startVoiceNavigation(message);
                    }, 500);
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
            if (startDelayTimerRef.current) {
                clearTimeout(startDelayTimerRef.current);
            }
        };
    }, [pathname, isMuted, isChatbotOpen]);

    const stopNavigationImmediately = async () => {
        // Prevent multiple simultaneous stops
        if (isProcessingRef.current) {
            return;
        }

        isProcessingRef.current = true;

        // Clear all timers
        if (autoStopTimerRef.current) {
            clearTimeout(autoStopTimerRef.current);
            autoStopTimerRef.current = null;
        }

        if (repeatTimerRef.current) {
            clearTimeout(repeatTimerRef.current);
            repeatTimerRef.current = null;
        }

        if (startDelayTimerRef.current) {
            clearTimeout(startDelayTimerRef.current);
            startDelayTimerRef.current = null;
        }

        // Stop the call
        try {
            await navigationVapi.stop();
        } catch (error) {
            // Silently handle errors if call wasn't active
            if (error && typeof error === 'object' && 'message' in error) {
                const errorMessage = (error as Error).message;
                if (!errorMessage.includes('No active call')) {
                    console.error("Error stopping navigation:", error);
                }
            }
        }

        setIsActive(false);
        isProcessingRef.current = false;
    };

    const startVoiceNavigation = async (message: string) => {
        // Prevent starting if conditions aren't met
        if (isProcessingRef.current || isChatbotOpen || isMuted) {
            return;
        }

        isProcessingRef.current = true;

        try {
            // Ensure any previous call is fully stopped
            try {
                await navigationVapi.stop();
            } catch (error) {
                // Ignore errors if no call was active
            }

            // Small delay to ensure clean state
            await new Promise(resolve => setTimeout(resolve, 200));

            setIsActive(true);

            await navigationVapi.start({
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

            // Auto-stop after message is delivered (20 seconds to ensure full message plays)
            autoStopTimerRef.current = setTimeout(async () => {
                if (!isMuted && !isChatbotOpen) {
                    try {
                        await navigationVapi.stop();
                        setIsActive(false);
                    } catch (error) {
                        console.error("Error auto-stopping navigation:", error);
                    }
                }
                autoStopTimerRef.current = null;
            }, 20000);

            // Set up repeat timer to repeat the message after 1 minute
            repeatTimerRef.current = setTimeout(async () => {
                if (!isMuted && !isChatbotOpen && pathname === lastRouteRef.current) {
                    // Repeat the message
                    isProcessingRef.current = false; // Reset before starting again
                    await startVoiceNavigation(message);
                }
            }, 60000); // 60 seconds = 1 minute

        } catch (error) {
            console.error("Voice navigation error:", error);
            setIsActive(false);
        } finally {
            isProcessingRef.current = false;
        }
    };

    const toggleMute = async () => {
        if (isMuted) {
            // Currently muted, so unmute and restart
            setIsMuted(false);

            // Wait a brief moment for state to update
            await new Promise(resolve => setTimeout(resolve, 100));

            // Restart navigation if chatbot is not open
            if (!isChatbotOpen) {
                const message = ROUTE_MESSAGES[pathname || ""];
                if (message) {
                    // Clear any existing timers
                    if (startDelayTimerRef.current) {
                        clearTimeout(startDelayTimerRef.current);
                    }

                    startDelayTimerRef.current = setTimeout(async () => {
                        await startVoiceNavigation(message);
                    }, 400);
                }
            }
        } else {
            // Currently unmuted, so mute and stop
            await stopNavigationImmediately();
            setIsMuted(true);
        }
    };

    // Only show on kiosk routes
    if (!pathname?.startsWith("/kiosk")) {
        return null;
    }

    // Determine if navigation is effectively muted (either manually or by chatbot)
    const isEffectivelyMuted = isMuted || isChatbotOpen;

    return (
        <div className="fixed top-4 right-4 z-40">
            <Button
                onClick={toggleMute}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-white/90 hover:bg-white border-2 transition-all hover:scale-110"
                title={isEffectivelyMuted ? "Unmute Navigation Voice" : "Mute Navigation Voice"}
                disabled={isChatbotOpen} // Disable button when chatbot is open
            >
                {isEffectivelyMuted ? (
                    <VolumeX className="h-6 w-6 text-red-500" />
                ) : (
                    <Volume2 className={`h-6 w-6 ${isActive ? 'text-green-500 animate-pulse' : 'text-green-500'}`} />
                )}
            </Button>

            {/* Status indicator */}
            {isActive && !isEffectivelyMuted && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-white bg-black/70 px-2 py-1 rounded whitespace-nowrap">
                    Speaking...
                </div>
            )}

            {/* Chatbot active indicator */}
            {isChatbotOpen && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-white bg-blue-600/90 px-2 py-1 rounded whitespace-nowrap">
                    Chatbot Active
                </div>
            )}
        </div>
    );
}
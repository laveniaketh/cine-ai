"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { vapi } from "@/lib/vapi.sdk";
import { MessageCircle, Mic, MicOff, X } from "lucide-react";

interface AgentProps {
    movieData?: any;
}

export default function Agent({ movieData }: AgentProps) {
    const pathname = usePathname();
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isNavigationActive, setIsNavigationActive] = useState(true);
    const [isChatbotActive, setIsChatbotActive] = useState(false);
    const [conversationState, setConversationState] = useState<string>("");
    const [lastStep, setLastStep] = useState<string>("");

    // Map routes to navigation steps
    const getStepFromPath = (path: string): string | null => {
        if (path.includes("/kiosk/movie-selection")) return "movie-selection";
        if (path.includes("/kiosk/seat-selection")) return "seat-selection";
        if (path.includes("/kiosk/payment-confirmation")) return "payment-confirmation";
        if (path.includes("/kiosk/payment-sucessful")) return "payment-successful";
        if (path === "/kiosk") return "welcome";
        return null;
    };

    // Navigation messages for each step
    const navigationMessages: Record<string, string> = {
        "welcome": "Welcome to CineAI! Please select Buy Ticket to start booking your movie.",
        "movie-selection": "Please select a movie from the available options on screen.",
        "seat-selection": "Great choice! Now please choose your preferred seats from the seating chart.",
        "payment-confirmation": "Perfect! Here is your total payment. Please review and confirm your booking.",
        "payment-successful": "Thank you for your booking! Your tickets have been confirmed. Enjoy your movie!"
    };

    // Start navigation assistant
    const startNavigationAssistant = useCallback(async (step: string) => {
        if (!isNavigationActive || !step || step === lastStep) return;

        try {
            // Stop any existing call
            try {
                vapi.stop();
            } catch (e) {
                // Ignore if no call is active
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            const message = navigationMessages[step];
            if (!message) return;

            // Start a new call with navigation instructions
            await vapi.start({
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    language: "en"
                },
                model: {
                    provider: "openai",
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: `You are a cinema kiosk navigation assistant. Your role is to provide brief, clear instructions only. 
              Say: "${message}"
              After delivering this message, do not engage in conversation. If the user speaks, say: "For questions, please use the chatbot button on your screen."`
                        }
                    ],
                    temperature: 0.7
                },
                voice: {
                    provider: "11labs",
                    voiceId: "21m00Tcm4TlvDq8ikWAM"
                },
                firstMessage: message,
                endCallFunctionEnabled: false
            });

            setLastStep(step);

            // Auto-stop after message delivery
            setTimeout(() => {
                try {
                    vapi.stop();
                } catch (e) {
                    // Ignore
                }
            }, 6000);

        } catch (error) {
            console.error("Navigation assistant error:", error);
        }
    }, [isNavigationActive, lastStep]);

    // Start chatbot assistant with Gemini integration
    const startChatbot = async () => {
        try {
            setIsChatbotActive(true);

            await vapi.start({
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    language: "en"
                },
                model: {
                    provider: "openai",
                    model: "gpt-4",
                    functions: [
                        {
                            name: "get_cinema_info",
                            description: "Get information about movies, showtimes, prices, and cinema details",
                            parameters: {
                                type: "object",
                                properties: {
                                    query: {
                                        type: "string",
                                        description: "The user's question"
                                    }
                                },
                                required: ["query"]
                            }
                        }
                    ],
                    messages: [
                        {
                            role: "system",
                            content: `You are a helpful CineAI cinema assistant. You can answer questions about:
              - Available movies and their details
              - Showtimes and schedules
              - Ticket prices (Standard: ₱200 per seat)
              - Seat availability
              - How to use the kiosk
              - General cinema information
              
              When users ask questions, use the get_cinema_info function to retrieve accurate information.
              Be friendly, concise, and helpful. Keep responses under 30 seconds of speech.
              For pricing, always mention that standard seats are ₱200 each.`
                        }
                    ],
                    temperature: 0.8
                },
                voice: {
                    provider: "11labs",
                    voiceId: "21m00Tcm4TlvDq8ikWAM"
                },
                firstMessage: "Hi! I'm your CineAI assistant. How can I help you today?",
                endCallFunctionEnabled: false
            });

        } catch (error) {
            console.error("Chatbot error:", error);
            setIsChatbotActive(false);
        }
    };

    const stopChatbot = () => {
        try {
            vapi.stop();
        } catch (e) {
            // Ignore
        }
        setIsChatbotActive(false);
        setIsChatbotOpen(false);
        setConversationState("");
    };

    // Listen for function calls from Vapi
    useEffect(() => {
        const handleFunctionCall = async (functionCall: any) => {
            if (functionCall.function.name === "get_cinema_info") {
                const query = functionCall.function.arguments.query;

                try {
                    // Call our API to get Gemini response
                    const response = await fetch("/api/vapi/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            query,
                            movieData
                        })
                    });

                    const data = await response.json();

                    // Send result back to Vapi
                    vapi.send({
                        type: "function-result",
                        functionCallId: functionCall.id,
                        result: data.response || "I'm having trouble getting that information right now."
                    });
                } catch (error) {
                    console.error("Function call error:", error);
                    vapi.send({
                        type: "function-result",
                        functionCallId: functionCall.id,
                        result: "I'm having trouble accessing that information right now. Please try asking again."
                    });
                }
            }
        };

        vapi.on("call-start", () => {
            console.log("Call started");
        });

        vapi.on("call-end", () => {
            console.log("Call ended");
            setIsChatbotActive(false);
        });

        vapi.on("function-call", handleFunctionCall);

        vapi.on("message", (message: any) => {
            if (message.type === "transcript" && message.role === "user") {
                setConversationState(message.transcript);
            }
        });

        vapi.on("error", (error: any) => {
            console.error("Vapi error:", error);
        });

        return () => {
            vapi.removeAllListeners();
        };
    }, [movieData]);

    // Trigger navigation assistant on route change
    useEffect(() => {
        const currentStep = getStepFromPath(pathname);
        if (currentStep && isNavigationActive) {
            // Small delay to ensure page has rendered
            const timer = setTimeout(() => {
                startNavigationAssistant(currentStep);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [pathname, isNavigationActive, startNavigationAssistant]);

    // Don't show on non-kiosk pages
    if (!pathname.includes("/kiosk")) {
        return null;
    }

    return (
        <>
            {/* Chatbot Toggle Button */}
            <button
                onClick={() => {
                    if (isChatbotOpen) {
                        stopChatbot();
                    } else {
                        setIsChatbotOpen(true);
                        startChatbot();
                    }
                }}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full p-5 shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse-slow"
                aria-label="Toggle voice assistant"
            >
                {isChatbotActive ? (
                    <MicOff className="w-7 h-7" />
                ) : (
                    <MessageCircle className="w-7 h-7" />
                )}
            </button>

            {/* Chatbot Interface */}
            {isChatbotOpen && (
                <div className="fixed bottom-28 right-6 z-50 bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-700 w-96 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Mic className="w-6 h-6" />
                            <div>
                                <span className="font-bold text-lg">CineAI Assistant</span>
                                <p className="text-xs text-red-100">Voice-powered help</p>
                            </div>
                        </div>
                        <button
                            onClick={stopChatbot}
                            className="hover:bg-red-800 rounded-full p-2 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 h-80 overflow-y-auto bg-neutral-800">
                        {isChatbotActive ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="relative mb-4">
                                    <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                                    <Mic className="w-16 h-16 text-red-500 relative z-10" />
                                </div>
                                <p className="mt-4 text-white font-semibold text-lg text-center">
                                    Listening...
                                </p>
                                <p className="text-sm text-gray-400 text-center mt-2">
                                    Ask me anything about movies, times, or prices
                                </p>
                                {conversationState && (
                                    <div className="mt-4 bg-neutral-700 rounded-lg p-3 max-w-full">
                                        <p className="text-sm text-gray-300 italic">
                                            "{conversationState}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <MessageCircle className="w-16 h-16 text-red-500 mb-4" />
                                <p className="text-white font-semibold text-xl mb-2">
                                    Voice Assistant Ready
                                </p>
                                <p className="text-gray-400 text-sm leading-relaxed px-4">
                                    Ask me about:
                                </p>
                                <ul className="text-gray-300 text-sm mt-3 space-y-1 text-left">
                                    <li>• Movie information</li>
                                    <li>• Showtimes and schedules</li>
                                    <li>• Ticket prices</li>
                                    <li>• How to use the kiosk</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-neutral-900 border-t border-neutral-700">
                        <button
                            onClick={isChatbotActive ? stopChatbot : startChatbot}
                            className={`w-full py-3 rounded-xl font-semibold transition-all text-lg ${isChatbotActive
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-neutral-700 hover:bg-neutral-600 text-white"
                                }`}
                        >
                            {isChatbotActive ? "End Conversation" : "Start Talking"}
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation Assistant Status Indicator */}
            {isNavigationActive && (
                <div className="fixed top-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-full shadow-xl text-sm flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Voice Guide Active</span>
                </div>
            )}
        </>
    );
}
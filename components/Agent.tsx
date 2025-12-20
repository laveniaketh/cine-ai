"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { vapi } from "@/lib/vapi.sdk";
import { MessageCircle, Mic, MicOff, X, Volume2, AlertCircle } from "lucide-react";

interface AgentProps {
    movieData?: any;
}

export default function Agent({ movieData }: AgentProps) {
    const pathname = usePathname();
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isNavigationActive, setIsNavigationActive] = useState(true);
    const [isChatbotActive, setIsChatbotActive] = useState(false);
    const [conversationState, setConversationState] = useState<string>("");
    const [isNavigationSpeaking, setIsNavigationSpeaking] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    const lastStepRef = useRef<string>("");
    const navigationCallIdRef = useRef<string | null>(null);
    const isMountedRef = useRef(true);
    const isStartingCallRef = useRef(false);

    // Add debug log
    const addDebugLog = (message: string) => {
        console.log(`[DEBUG] ${message}`);
        setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    // Check Vapi configuration on mount
    useEffect(() => {
        const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
        if (!token) {
            setErrorMessage("⚠️ VAPI TOKEN IS MISSING! Check your .env.local file.");
            addDebugLog("ERROR: No Vapi token found");
        } else {
            addDebugLog(`Vapi token found: ${token.substring(0, 10)}...`);
        }
    }, []);

    const getStepFromPath = (path: string): string | null => {
        if (path.includes("/kiosk/movie-selection")) return "movie-selection";
        if (path.includes("/kiosk/seat-selection")) return "seat-selection";
        if (path.includes("/kiosk/payment-confirmation")) return "payment-confirmation";
        if (path.includes("/kiosk/payment-sucessful")) return "payment-successful";
        if (path === "/kiosk") return "welcome";
        return null;
    };

    const navigationMessages: Record<string, string> = {
        "welcome": "Welcome to CineAI! Please tap Buy Ticket to start booking your movie.",
        "movie-selection": "Please select a movie. Swipe left or right to browse, then tap the poster to select.",
        "seat-selection": "Great choice! Now please choose your preferred seats from the seating chart.",
        "payment-confirmation": "Perfect! Here is your total payment. Please review and tap confirm to complete your booking.",
        "payment-successful": "Thank you for your booking! Your tickets have been confirmed. Enjoy your movie!"
    };

    const startNavigationAssistant = useCallback(async (step: string) => {
        if (isStartingCallRef.current) {
            addDebugLog(`Skipping - call already starting`);
            return;
        }

        if (!isNavigationActive || !step) {
            addDebugLog(`Skipping - navigation inactive or no step`);
            return;
        }

        // FIXED: Check if this is the same step AND we haven't changed routes
        if (lastStepRef.current === step && navigationCallIdRef.current === step) {
            addDebugLog(`Skipping - same step already played`);
            return;
        }

        isStartingCallRef.current = true;
        addDebugLog(`Starting navigation for step: ${step}`);

        try {
            // Stop any existing call
            if (navigationCallIdRef.current && navigationCallIdRef.current !== step) {
                addDebugLog("Stopping previous call");
                try {
                    await vapi.stop();
                    await new Promise(resolve => setTimeout(resolve, 50));
                } catch (e) {
                    addDebugLog("No previous call to stop");
                }
            }

            const message = navigationMessages[step];
            if (!message) {
                addDebugLog("ERROR: No message for step");
                isStartingCallRef.current = false;
                return;
            }

            lastStepRef.current = step;
            setIsNavigationSpeaking(true);
            setErrorMessage("");

            addDebugLog(`Calling vapi.start()...`);

            // Simplified configuration for testing
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
                            content: `Say: "${message}"`
                        }
                    ]
                },
                voice: {
                    provider: "11labs",
                    voiceId: "21m00Tcm4TlvDq8ikWAM"
                },
                firstMessage: message
            });

            navigationCallIdRef.current = step;
            addDebugLog("✅ Navigation started successfully");

        } catch (error: any) {
            const errorDetails = {
                message: error?.message,
                code: error?.code,
                status: error?.status,
                full: JSON.stringify(error, null, 2)
            };

            addDebugLog(`❌ ERROR: ${JSON.stringify(errorDetails)}`);
            console.error("Full error object:", error);

            setErrorMessage(`Navigation failed: ${error?.message || "Unknown error"}`);
            setIsNavigationSpeaking(false);
            navigationCallIdRef.current = null;
        } finally {
            isStartingCallRef.current = false;
        }
    }, [isNavigationActive]);

    const startChatbot = async () => {
        if (isStartingCallRef.current) {
            addDebugLog("Chatbot - call already starting");
            return;
        }

        isStartingCallRef.current = true;
        addDebugLog("Starting chatbot");

        try {
            // Stop navigation if active
            if (isNavigationSpeaking) {
                addDebugLog("Stopping navigation for chatbot");
                try {
                    await vapi.stop();
                } catch (e) {
                    addDebugLog("No navigation to stop");
                }
                setIsNavigationSpeaking(false);
                navigationCallIdRef.current = null;
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            setIsChatbotActive(true);
            setErrorMessage("");

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
                            description: "Get cinema information",
                            parameters: {
                                type: "object",
                                properties: {
                                    query: { type: "string" }
                                },
                                required: ["query"]
                            }
                        }
                    ],
                    messages: [
                        {
                            role: "system",
                            content: "You are CineAI's assistant. Answer questions about movies, prices, and showtimes."
                        }
                    ]
                },
                voice: {
                    provider: "11labs",
                    voiceId: "21m00Tcm4TlvDq8ikWAM"
                },
                firstMessage: "Hi! How can I help you today?"
            });

            addDebugLog("✅ Chatbot started");

        } catch (error: any) {
            addDebugLog(`❌ Chatbot error: ${error?.message}`);
            console.error("Chatbot error:", error);
            setErrorMessage(`Chatbot failed: ${error?.message || "Unknown error"}`);
            setIsChatbotActive(false);
        } finally {
            isStartingCallRef.current = false;
        }
    };

    const stopChatbot = () => {
        addDebugLog("Stopping chatbot");
        try {
            vapi.stop();
        } catch (e) {
            addDebugLog("No call to stop");
        }
        setIsChatbotActive(false);
        setIsChatbotOpen(false);
        setConversationState("");
        isStartingCallRef.current = false;
    };

    // Listen for Vapi events
    useEffect(() => {
        isMountedRef.current = true;

        const handleFunctionCall = async (functionCall: any) => {
            addDebugLog(`Function call: ${functionCall.function.name}`);
            if (functionCall.function.name === "get_cinema_info") {
                const query = functionCall.function.arguments.query;
                try {
                    const response = await fetch("/api/vapi/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ query, movieData })
                    });
                    const data = await response.json();
                    vapi.send({
                        type: "function-result",
                        functionCallId: functionCall.id,
                        result: data.response || "Error"
                    });
                    addDebugLog("Function result sent");
                } catch (error) {
                    addDebugLog(`Function call error: ${error}`);
                }
            }
        };

        const handleCallEnd = () => {
            addDebugLog("📞 Call ended");
            if (isMountedRef.current) {
                setIsChatbotActive(false);
                setIsNavigationSpeaking(false);
                navigationCallIdRef.current = null;
                isStartingCallRef.current = false;
            }
        };

        const handleError = (error: any) => {
            const errorStr = JSON.stringify(error);
            addDebugLog(`❌ Vapi error event: ${errorStr}`);
            console.error("Vapi error event:", error);

            if (isMountedRef.current) {
                setErrorMessage(`Voice error: ${error?.message || errorStr || "Unknown"}`);
                setIsNavigationSpeaking(false);
                setIsChatbotActive(false);
                navigationCallIdRef.current = null;
                isStartingCallRef.current = false;
            }
        };

        vapi.on("call-start", () => addDebugLog("📞 Call started"));
        vapi.on("call-end", handleCallEnd);
        vapi.on("speech-end", () => addDebugLog("🔇 Speech ended"));
        vapi.on("function-call", handleFunctionCall);
        vapi.on("error", handleError);
        vapi.on("message", (message: any) => {
            if (message.type === "transcript" && message.role === "user") {
                setConversationState(message.transcript);
            }
        });

        return () => {
            isMountedRef.current = false;
            vapi.removeAllListeners();
        };
    }, [movieData]);

    // Trigger navigation on route change
    useEffect(() => {
        const currentStep = getStepFromPath(pathname);
        addDebugLog(`Route changed: ${pathname} -> step: ${currentStep}`);

        // Reset last step when route actually changes (force new message)
        if (currentStep && currentStep !== lastStepRef.current) {
            addDebugLog(`New step detected, resetting state`);
            lastStepRef.current = ""; // Clear to allow new message
            navigationCallIdRef.current = null;
            setIsNavigationSpeaking(false);
        }

        if (currentStep && isNavigationActive && !isChatbotActive && !isStartingCallRef.current) {
            startNavigationAssistant(currentStep);
        }
    }, [pathname, isNavigationActive, isChatbotActive, startNavigationAssistant]);

    if (!pathname.includes("/kiosk")) {
        return null;
    }

    return (
        <>
            {/* Debug Console */}
            <div className="fixed top-20 left-6 z-[70] bg-black/90 text-green-400 p-3 rounded-lg text-xs font-mono max-w-md">
                <div className="flex items-center gap-2 mb-2 text-white">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-bold">Debug Console</span>
                </div>
                {debugInfo.map((log, i) => (
                    <div key={i} className="py-0.5">{log}</div>
                ))}
            </div>

            {/* Error Display */}
            {errorMessage && (
                <div className="fixed top-20 right-6 z-[60] bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-md">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-bold mb-1">Error Details:</p>
                            <p className="text-sm">{errorMessage}</p>
                        </div>
                        <button onClick={() => setErrorMessage("")} className="text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Chatbot Button */}
            <button
                onClick={() => {
                    if (isChatbotOpen) {
                        stopChatbot();
                    } else {
                        setIsChatbotOpen(true);
                        startChatbot();
                    }
                }}
                className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full p-6 shadow-2xl transition-all duration-300 hover:scale-110"
                disabled={isStartingCallRef.current}
            >
                {isChatbotActive ? <MicOff className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
            </button>

            {/* Chatbot Interface */}
            {isChatbotOpen && (
                <div className="fixed bottom-32 right-8 z-50 bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-700 w-96 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Mic className="w-6 h-6" />
                            <div>
                                <span className="font-bold text-lg">CineAI Assistant</span>
                                <p className="text-xs text-red-100">Voice-powered help</p>
                            </div>
                        </div>
                        <button onClick={stopChatbot} className="hover:bg-red-800 rounded-full p-2">
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
                                <p className="mt-4 text-white font-semibold text-lg">Listening...</p>
                                {conversationState && (
                                    <div className="mt-4 bg-neutral-700 rounded-lg p-3">
                                        <p className="text-sm text-gray-300 italic">"{conversationState}"</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <MessageCircle className="w-16 h-16 text-red-500 mb-4" />
                                <p className="text-white font-semibold text-xl mb-2">Voice Assistant Ready</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-neutral-900 border-t border-neutral-700">
                        <button
                            onClick={isChatbotActive ? stopChatbot : startChatbot}
                            disabled={isStartingCallRef.current}
                            className="w-full py-3 rounded-xl font-semibold text-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                        >
                            {isStartingCallRef.current ? "Starting..." : isChatbotActive ? "End" : "Start"}
                        </button>
                    </div>
                </div>
            )}

            {/* Status Indicator */}
            {isNavigationActive && (
                <div className="fixed top-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-full shadow-xl text-sm flex items-center gap-3">
                    {isNavigationSpeaking ? (
                        <>
                            <Volume2 className="w-4 h-4 animate-pulse" />
                            <span>Speaking...</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full"></div>
                            <span>Ready</span>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
// components/kiosk/VoiceChatbot.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";
import { MessageCircle, Mic, MicOff, X, Loader2 } from "lucide-react";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Movie {
    _id: string;
    movieTitle: string;
    director: string;
    releasedYear: number;
    duration: number;
    summary: string;
    timeslot: string;
    slug: string;
    poster?: string;
    preview?: string;
}

interface MovieWithSeats extends Movie {
    availableSeats: number;
    totalSeats: number;
    reservedSeats: string[];
}

interface ReservedSeat {
    seatNumber: string;
    paymentStatus: string;
}

interface Message {
    id: number;
    role: "user" | "assistant";
    text: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTo12Hour = (time: string): string => {
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr.padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
};

const getCurrentDayAndWeek = () => {
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
        currentDayOfWeek: days[now.getDay()],
        currentWeekNumber: `Week ${Math.ceil(now.getDate() / 7)}`,
    };
};

export default function VoiceChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [moviesWithSeats, setMoviesWithSeats] = useState<MovieWithSeats[]>([]);

    const msgIdRef = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent("voiceChatbotStateChange", { detail: { isOpen } })
        );
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [messages]);

    useEffect(() => {
        if (messages.length === 0 || !isOpen) return;
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            setMessages([]);
            if (isListening) stopListening();
        }, 5 * 60 * 1000);
        return () => {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [messages, isOpen]);

    // ── Fetch movie + seat data 
    const fetchAllData = useCallback(async () => {
        const isInitial = moviesWithSeats.length === 0;
        if (isInitial) setIsLoadingData(true);
        try {
            const res = await fetch("/api/movies");
            const data = await res.json();
            if (!data.movies?.length) return;

            const { currentDayOfWeek, currentWeekNumber } = getCurrentDayAndWeek();
            const totalSeats = 94;

            const enriched = await Promise.all(
                data.movies.map(async (movie: Movie) => {
                    try {
                        const sr = await fetch(
                            `/api/tickets/seats?movie_id=${movie._id}&dayOfWeek=${currentDayOfWeek}&weekNumber=${currentWeekNumber}`
                        );
                        const sd = await sr.json();
                        const reserved = (sd.reservedSeats || [])
                            .filter((s: ReservedSeat) => s.paymentStatus === "paid" || s.paymentStatus === "pending")
                            .map((s: ReservedSeat) => s.seatNumber);
                        return { ...movie, availableSeats: totalSeats - reserved.length, totalSeats, reservedSeats: reserved };
                    } catch {
                        return { ...movie, availableSeats: totalSeats, totalSeats, reservedSeats: [] };
                    }
                })
            );
            setMoviesWithSeats(enriched);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            if (isInitial) setIsLoadingData(false);
        }
    }, [moviesWithSeats.length]);

    // Fetch on open + refresh every 60s
    useEffect(() => {
        if (!isOpen) return;
        fetchAllData();
        const iv = setInterval(fetchAllData, 60000);
        return () => clearInterval(iv);
    }, [isOpen]);

    // Build system prompt
    const buildSystemPrompt = useCallback(() => {
        const { currentDayOfWeek, currentWeekNumber } = getCurrentDayAndWeek();
        const moviesInfo = moviesWithSeats.map(m => {
            return `**${m.movieTitle}**
- Year: ${m.releasedYear}
- Duration: ${m.duration} minutes
- Director: ${m.director}
- Showtime: ${formatTo12Hour(m.timeslot)}
- Available Seats: ${m.availableSeats} out of ${m.totalSeats}
- Summary: ${m.summary}`;
        }).join("\n\n");

        return `You are CineAI Assistant, a helpful voice chatbot for a movie theater kiosk.

IMPORTANT INFORMATION:
- Ticket Price: 200 pesos per ticket (fixed for all movies)
- Current Day: ${currentDayOfWeek} (${currentWeekNumber})
- No outside food/drinks allowed inside the theater
- No filming or photography inside the theater

AVAILABLE MOVIES (${moviesWithSeats.length} showing today):
${moviesInfo}

TRANSCRIPT CORRECTION:
You receive speech-to-text transcripts which may contain mishears. Silently correct obvious errors using context:
- "sine AI" / "sinai" / "cinema AI" / "sign AI" → CineAI
- "time slot" / "time's lot" / "time slut" → timeslot
- "show time" / "show-time" → showtime
- "peso" / "pesos" / "peto" / "pay so" → pesos
- "seat" / "sit" / "feet" → seat
- "cashier" / "cash ear" / "cash here" → cashier
- "booking" / "looking" / "cooking" → booking
- Any movie title that sounds phonetically close → correct to the actual title from the list above
Never mention or point out transcript errors to the user. Just respond naturally using the corrected interpretation.

GUIDELINES:
1. Be friendly, warm, and conversational — not robotic
2. Keep responses brief (2–3 sentences max)
3. Always use 12-hour time format
4. Mention seat availability when discussing specific movies
5. After kiosk booking → proceed to cashier to pay and collect tickets
6. No snacks sold; outside food not allowed
7. Do NOT greet or speak first — wait for the user to ask something
8. Only end the conversation when the user clearly indicates they are done
9. If a question is unclear due to audio quality, make your best interpretation and answer — do not ask the user to repeat themselves`;
    }, [moviesWithSeats]);

    useEffect(() => {
        const onCallStart = () => {
            setIsConnecting(false);
            setIsListening(true);
        };

        const onCallEnd = () => {
            setIsListening(false);
            setIsConnecting(false);
        };

        const onMessage = (msg: any) => {
            if (msg.type !== "transcript") return;
            const text: string = msg.transcript || "";
            if (!text.trim()) return;

            if (msg.transcriptType === "partial" && msg.role === "user") {
                // Show live partial transcript as a temporary "typing" bubble
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    // If the last message is already a partial from user, replace it
                    if (last && last.role === "user" && last.id === -1) {
                        return [...prev.slice(0, -1), { id: -1, role: "user", text }];
                    }
                    return [...prev, { id: -1, role: "user", text }];
                });
            }

            if (msg.transcriptType === "final") {
                setMessages(prev => {
                    // Remove any pending partial bubble first
                    const withoutPartial = prev.filter(m => m.id !== -1);
                    return [
                        ...withoutPartial,
                        { id: ++msgIdRef.current, role: msg.role === "user" ? "user" : "assistant", text },
                    ];
                });
            }
        };

        const onError = (err: any) => {
            // Stringify so empty objects {} are readable in the console
            const detail = err && typeof err === "object"
                ? JSON.stringify(err, Object.getOwnPropertyNames(err))
                : String(err);
            console.error("Vapi error:", detail || "(no detail returned)");
            setIsListening(false);
            setIsConnecting(false);
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("error", onError);

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("error", onError);
        };
    }, []);

    const startListening = async () => {
        if (isListening || isConnecting) return;
        if (moviesWithSeats.length === 0) await fetchAllData();

        try {
            setIsConnecting(true);
            await vapi.start({
                model: {
                    provider: "openai",
                    model: "gpt-4",
                    messages: [{ role: "system", content: buildSystemPrompt() }],
                },
                voice: { provider: "11labs", voiceId: "21m00Tcm4TlvDq8ikWAM" },
                name: "CineAI Chatbot",
                // No firstMessage — assistant waits silently for the user to speak first
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2-general", // nova-2-general is tuned for conversational speech
                    language: "en-US",
                },
                recordingEnabled: false,
                endCallFunctionEnabled: false,
                clientMessages: ["transcript", "hang", "speech-update"],
                serverMessages: ["end-of-call-report", "hang", "speech-update"],
            });
        } catch (err) {
            console.error("Error starting chatbot:", err);
            setIsConnecting(false);
            setIsListening(false);
        }
    };


    const stopListening = async () => {
        try {
            await vapi.stop();
        } catch (err) {
            console.error("Error stopping chatbot:", err);
        }
        setIsListening(false);
        setIsConnecting(false);
    };

    const closeChat = async () => {
        if (isListening) await stopListening();
        setIsOpen(false);
    };

    const toggleMic = () => {
        if (isListening) stopListening();
        else startListening();
    };


    return (
        <>

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    title="Open CineAI Chatbot"
                    className="
                        fixed top-6 left-6 z-50
                        h-12 w-12 rounded-full
                        bg-black/60 backdrop-blur-md border border-white/20
                        flex items-center justify-center
                        shadow-lg hover:bg-black/80
                        transition-all duration-200 hover:scale-110 active:scale-95
                    "
                >
                    <MessageCircle className="h-5 w-5 text-white/80" />
                </button>
            )}


            {isOpen && (
                <div className="
                    fixed top-6 left-6 z-50
                    w-96 flex flex-col
                    pointer-events-auto
                    max-h-[calc(100vh-48px)]
                "
                >

                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            {/* Status dot */}
                            <span className={`
                                h-2 w-2 rounded-full
                                ${isListening
                                    ? "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]"
                                    : isConnecting
                                        ? "bg-amber-400 animate-pulse"
                                        : "bg-white/30"
                                }
                            `} />
                            <span className="text-white/70 text-xs font-medium tracking-wide">
                                {isListening ? "Listening" : isConnecting ? "Connecting..." : "CineAI Chatbot"}
                            </span>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={closeChat}
                            className="
                                h-7 w-7 rounded-full
                                bg-white/10 hover:bg-white/20
                                flex items-center justify-center
                                transition-colors duration-150
                            "
                        >
                            <X className="h-3.5 w-3.5 text-white/60" />
                        </button>
                    </div>

                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto min-h-0 relative max-h-[480px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <div className="flex flex-col-reverse gap-2 px-1 py-2">

                            {/* Empty state */}
                            {messages.length === 0 && (
                                <div className="flex flex-col items-start gap-1 py-2">
                                    {isLoadingData ? (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl rounded-tl-sm bg-white/10 backdrop-blur-sm border border-white/10">
                                            <Loader2 className="h-3.5 w-3.5 text-white/50 animate-spin" />
                                            <span className="text-white/50 text-xs">Loading the chatbot response...</span>
                                        </div>
                                    ) : (
                                        <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-white/10 backdrop-blur-sm border border-white/10 max-w-[85%]">
                                            <p className="text-white/60 text-xs leading-relaxed">
                                                Tap the mic and ask anything about movies, showtimes, or seats.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Messages — rendered in reverse (newest first in DOM) */}
                            {[...messages].reverse().map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${msg.id === -1 ? "opacity-50" : "opacity-100"} transition-opacity duration-150`}
                                >
                                    <div className={`
                                        max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed
                                        ${msg.role === "user"
                                            ? "rounded-tr-sm bg-emerald-500/80 backdrop-blur-sm text-white border border-emerald-400/30"
                                            : "rounded-tl-sm bg-white/10 backdrop-blur-sm text-white/85 border border-white/10"
                                        }
                                        ${msg.id === -1 ? "italic" : ""}
                                    `}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-start mt-3 px-1 relative">
                        <button
                            onClick={toggleMic}
                            disabled={isConnecting && !isListening}
                            title={isListening ? "Stop mic" : "Start mic"}
                            className={`
                                relative h-11 w-11 rounded-full
                                flex items-center justify-center
                                shadow-lg transition-all duration-200
                                hover:scale-110 active:scale-95
                                disabled:opacity-40 disabled:cursor-not-allowed
                                ${isListening
                                    ? "bg-red-500 border border-red-400/50"
                                    : isConnecting
                                        ? "bg-amber-500 border border-amber-400/50"
                                        : "bg-black/60 backdrop-blur-md border border-white/20 hover:bg-black/80"
                                }
                            `}
                        >
                            {isConnecting && !isListening ? (
                                <Loader2 className="h-4 w-4 text-white animate-spin" />
                            ) : isListening ? (
                                <MicOff className="h-4 w-4 text-white" />
                            ) : (
                                <Mic className="h-4 w-4 text-white/80" />
                            )}

                            {/* Pulse ring when mic is live */}
                            {isListening && (
                                <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                            )}
                        </button>

                        {/* Live voice bars shown next to mic when listening */}
                        {isListening && (
                            <div className="flex gap-0.5 items-end h-4 ml-3">
                                {[0, 150, 300, 150, 0].map((delay, i) => (
                                    <div
                                        key={i}
                                        className="w-0.5 rounded-full bg-emerald-400"
                                        style={{
                                            animation: `voiceBar 0.7s ease-in-out infinite alternate ${delay}ms`,
                                            height: "100%",
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
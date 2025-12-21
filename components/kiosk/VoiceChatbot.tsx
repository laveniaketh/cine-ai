// components/kiosk/VoiceChatbot.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { MessageCircle, Mic, MicOff, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

interface Movie {
    _id: string;
    movieTitle: string;
    director: string;
    releasedYear: number;
    duration: number;
    summary: string;
    timeslot?: string;
    month?: string;
    week?: string;
    poster?: string;
    preview?: string;
}

interface ReservedSeat {
    seatNumber: string;
    paymentStatus: string;
}

interface VoiceChatbotProps {
    movieId?: string;
    dayOfWeek?: string;
    weekNumber?: string;
}

export default function VoiceChatbot({ movieId, dayOfWeek, weekNumber }: VoiceChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcript, setTranscript] = useState<string[]>([]);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [reservedSeats, setReservedSeats] = useState<ReservedSeat[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [transcript]);

    useEffect(() => {
        if (isOpen && movies.length === 0) {
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        vapi.on("call-start", () => {
            setIsConnecting(false);
            setIsListening(true);
        });

        vapi.on("call-end", () => {
            setIsListening(false);
            setIsConnecting(false);
        });

        vapi.on("speech-start", () => {
            console.log("Assistant started speaking");
        });

        vapi.on("speech-end", () => {
            console.log("Assistant finished speaking");
        });

        vapi.on("message", (message: any) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                const role = message.role === "user" ? "You" : "Assistant";
                const text = message.transcript || "";
                setTranscript(prev => [...prev, `${role}: ${text}`]);
            }
        });

        vapi.on("error", (error: any) => {
            console.error("Vapi error:", error);
            setIsListening(false);
            setIsConnecting(false);
        });

        return () => {
            if (isListening) {
                vapi.stop();
            }
        };
    }, []);

    const fetchData = async () => {
        setIsLoadingData(true);
        try {
            const moviesResponse = await fetch('/api/movies');
            const moviesData = await moviesResponse.json();

            if (moviesData.movies) {
                setMovies(moviesData.movies);
            }

            if (movieId) {
                let url = `/api/reservedSeats?movie_id=${movieId}`;
                if (dayOfWeek) url += `&dayOfWeek=${dayOfWeek}`;
                if (weekNumber) url += `&weekNumber=${weekNumber}`;

                const seatsResponse = await fetch(url);
                const seatsData = await seatsResponse.json();

                if (seatsData.reservedSeats) {
                    setReservedSeats(seatsData.reservedSeats);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const buildSystemPrompt = () => {
        const moviesList = movies.map(m => {
            const timeslots = m.timeslot || "10:00 AM, 1:00 PM, 4:00 PM, 7:00 PM, 10:00 PM";
            return `- ${m.movieTitle} (${m.releasedYear}, ${m.duration} minutes, Director: ${m.director}): ${m.summary}. Available timeslots: ${timeslots}`;
        }).join('\n');

        const totalSeats = 96;
        const reservedCount = reservedSeats.filter(s => s.paymentStatus === 'completed' || s.paymentStatus === 'pending').length;
        const availableCount = totalSeats - reservedCount;

        const reservedSeatNumbers = reservedSeats
            .filter(s => s.paymentStatus === 'completed' || s.paymentStatus === 'pending')
            .map(s => s.seatNumber)
            .join(', ');

        return `You are CineAI Assistant, a helpful voice chatbot for a movie theater kiosk. You help customers with information about movies, showtimes, pricing, and seat availability.

IMPORTANT INFORMATION:
- Ticket Price: 200 pesos per ticket (fixed price for all movies and showtimes)
- Available Time Slots: Check individual movie timeslots below

AVAILABLE MOVIES (${movies.length} movies showing):
${moviesList || "Loading movies..."}

SEAT AVAILABILITY:
- Total seats: ${totalSeats} (8 rows A-H, 12 seats per row)
- Reserved/Sold seats: ${reservedCount}
- Available seats: ${availableCount} seats available
${reservedSeatNumbers ? `- Currently reserved seats: ${reservedSeatNumbers}` : ''}

GUIDELINES:
1. Be friendly, concise, and helpful
2. Provide movie recommendations based on genre preferences or year
3. Answer questions about showtimes, pricing, and seat availability
4. Guide users through the booking process
5. Keep responses brief and conversational (2-3 sentences max)
6. If asked about booking, inform them they can select their movie and seats on the kiosk screen
7. Always mention the price is 200 pesos per ticket when discussing pricing
8. When discussing seat availability, mention the number of available seats
9. If asked about specific seats, check against the reserved list

Example interactions:
- "What movies are showing?" → List 2-3 popular movies briefly
- "What time is [movie] showing?" → Provide the timeslots for that movie
- "How much are tickets?" → "Tickets are 200 pesos each for all movies and showtimes"
- "Are seats available?" → "Yes, we have ${availableCount} seats available out of ${totalSeats}"
- "Tell me about [movie]" → Give brief summary and director`;
    };

    const startListening = async () => {
        if (isListening || isConnecting) return;

        if (movies.length === 0) {
            await fetchData();
        }

        try {
            setIsConnecting(true);
            setTranscript([]);

            await vapi.start({
                model: {
                    provider: "openai",
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: buildSystemPrompt()
                        }
                    ]
                },
                voice: {
                    provider: "11labs",
                    voiceId: "21m00Tcm4TlvDq8ikWAM"
                },
                name: "CineAI Chatbot Assistant",
                firstMessage: "Hi! I'm your CineAI assistant. How can I help you today? You can ask me about our movies, showtimes, pricing, or seat availability.",
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    language: "en"
                },
                recordingEnabled: false,
                endCallFunctionEnabled: true,
                clientMessages: ["transcript", "hang", "speech-update"],
                serverMessages: ["end-of-call-report", "hang", "speech-update"]
            });

        } catch (error) {
            console.error("Error starting chatbot:", error);
            setIsConnecting(false);
            setIsListening(false);
        }
    };

    const stopListening = async () => {
        try {
            await vapi.stop();
            setIsListening(false);
            setIsConnecting(false);
        } catch (error) {
            console.error("Error stopping chatbot:", error);
        }
    };

    const closeChat = async () => {
        if (isListening) {
            await stopListening();
        }
        setIsOpen(false);
        setTranscript([]);
    };

    return (
        <>
            {/* Floating Chatbot Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    size="lg"
                    className="fixed top-6 left-6 z-50 h-14 w-14 rounded-full"
                    variant="default"
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <Card className="fixed top-6 left-6 z-50 w-96 h-[580px] flex flex-col shadow-xl py-6 gap-2 bg-neutral-800 border-neutral-700" >
                    {/* Header */}
                    <CardHeader className="text-primary-foreground ">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-neutral-600 flex items-center justify-center">
                                    <MessageCircle className="h-5 w-5 text-neutral-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white">CineAI Assistant</CardTitle>
                                    <CardDescription className="text-xs text-primary-foreground/80">
                                        {isLoadingData ? (
                                            "Loading data..."
                                        ) : isListening ? (
                                            <Badge variant="secondary" className="px-2 py-0">Listening</Badge>
                                        ) : isConnecting ? (
                                            <Badge variant="secondary" className="px-2 py-0">Connecting</Badge>
                                        ) : (
                                            <Badge variant="default" className="px-2 py-0">Online</Badge>
                                        )}
                                    </CardDescription>
                                </div>
                            </div>
                            <Button
                                onClick={closeChat}
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-white "
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    {/* Transcript Area with ScrollArea */}
                    <CardContent className="flex-1 p-4 min-h-0">
                        <ScrollArea ref={scrollAreaRef} className="h-full w-full rounded-md border bg-neutral-800/30">
                            <div className="p-4">
                                {isLoadingData ? (
                                    <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
                                        <Loader2 className="h-12 w-12 mb-3 animate-spin text-primary" />
                                        <p className="text-sm">Loading movie information...</p>
                                    </div>
                                ) : transcript.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground">
                                        <MessageCircle className="h-12 w-12 mb-3 text-muted-foreground/50" />
                                        <p className="text-sm font-medium mb-1">Ready to assist you</p>
                                        <p className="text-xs mb-3">Click &quot;Start Listening&quot; to begin</p>
                                        {/* {movies.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                {movies.length} movies loaded
                                            </Badge>
                                        )} */}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {transcript.map((text, index) => {
                                            const isUser = text.startsWith("You:");
                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] px-4 py-2 rounded-lg ${isUser
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-secondary text-secondary-foreground"
                                                            }`}
                                                    >
                                                        <p className="text-sm leading-relaxed">
                                                            {text.replace(/^(You|Assistant):\s*/, "")}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={transcriptEndRef} />
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>

                    {/* Controls */}
                    <CardFooter className="flex flex-col gap-2 pt-3">
                        {!isListening && !isConnecting ? (
                            <Button
                                onClick={startListening}
                                disabled={isLoadingData}
                                className="w-full"
                                size="lg"
                            >
                                <Mic className="h-4 w-4 mr-2" />
                                Start Listening
                            </Button>
                        ) : (
                            <Button
                                onClick={stopListening}
                                disabled={isConnecting}
                                variant="destructive"
                                className="w-full"
                                size="lg"
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <MicOff className="h-4 w-4 mr-2" />
                                        Stop Listening
                                    </>
                                )}
                            </Button>
                        )}

                        {isListening && (
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <div className="flex gap-1">
                                    <div className="w-1 h-3 bg-primary rounded animate-pulse" style={{ animationDelay: "0ms" }} />
                                    <div className="w-1 h-3 bg-primary rounded animate-pulse" style={{ animationDelay: "150ms" }} />
                                    <div className="w-1 h-3 bg-primary rounded animate-pulse" style={{ animationDelay: "300ms" }} />
                                </div>
                                <span>Microphone active</span>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            )}
        </>
    );
}
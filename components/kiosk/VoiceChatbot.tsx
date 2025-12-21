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

export default function VoiceChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcript, setTranscript] = useState<string[]>([]);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [moviesWithSeats, setMoviesWithSeats] = useState<MovieWithSeats[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const transcriptTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [transcript]);

    // Auto-clear transcript after 5 minutes of inactivity
    useEffect(() => {
        // Clear any existing timer
        if (transcriptTimerRef.current) {
            clearTimeout(transcriptTimerRef.current);
        }

        // Only set timer if there's a transcript and chat is open
        if (transcript.length > 0 && isOpen) {
            transcriptTimerRef.current = setTimeout(() => {
                console.log("Auto-clearing transcript after 5 minutes of inactivity");
                setTranscript([]);
                // Stop listening if currently active
                if (isListening) {
                    stopListening();
                }
            }, 5 * 60 * 1000); // 5 minutes in milliseconds
        }

        // Cleanup function
        return () => {
            if (transcriptTimerRef.current) {
                clearTimeout(transcriptTimerRef.current);
            }
        };
    }, [transcript, isOpen, isListening]);

    useEffect(() => {
        if (isOpen && movies.length === 0) {
            fetchAllData();
        }
    }, [isOpen]);

    // Auto-refresh data every 1 minute when chat is open
    useEffect(() => {
        if (!isOpen) return;

        // Fetch data immediately when opened
        fetchAllData();

        // Set up interval to refresh every 60 seconds (1 minute)
        const intervalId = setInterval(() => {
            console.log("Auto-refreshing movie and seat data...");
            fetchAllData();
        }, 60000); // 60000ms = 1 minute

        // Cleanup interval on unmount or when chat closes
        return () => {
            clearInterval(intervalId);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleCallStart = () => {
            setIsConnecting(false);
            setIsListening(true);
        };

        const handleCallEnd = () => {
            setIsListening(false);
            setIsConnecting(false);
        };

        const handleMessage = (message: any) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                const role = message.role === "user" ? "You" : "Assistant";
                const text = message.transcript || "";
                setTranscript(prev => [...prev, `${role}: ${text}`]);
            }
        };

        const handleError = (error: any) => {
            console.error("Vapi error:", error);
            setIsListening(false);
            setIsConnecting(false);
        };

        // Add event listeners
        vapi.on("call-start", handleCallStart);
        vapi.on("call-end", handleCallEnd);
        vapi.on("message", handleMessage);
        vapi.on("error", handleError);

        // Cleanup function to remove event listeners
        return () => {
            vapi.off("call-start", handleCallStart);
            vapi.off("call-end", handleCallEnd);
            vapi.off("message", handleMessage);
            vapi.off("error", handleError);
        };
    }, []);

    // Helper function to convert 24-hour time to 12-hour format
    const formatTo12Hour = (time: string): string => {
        const [hourStr, minuteStr] = time.split(":");
        let hour = parseInt(hourStr, 10);
        const minute = minuteStr.padStart(2, "0");
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${ampm}`;
    };

    // Helper function to get current day and week
    const getCurrentDayAndWeek = () => {
        const now = new Date();
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const currentDayOfWeek = days[now.getDay()];
        const dayOfMonth = now.getDate();
        const currentWeekNumber = `Week ${Math.ceil(dayOfMonth / 7)}`;
        return { currentDayOfWeek, currentWeekNumber };
    };

    // Fetch all movies and their seat availability
    const fetchAllData = async () => {
        // Don't show loading spinner on subsequent fetches (auto-refresh)
        const isInitialLoad = moviesWithSeats.length === 0;
        if (isInitialLoad) {
            setIsLoadingData(true);
        }

        try {
            // Fetch movies
            const moviesResponse = await fetch('/api/movies');
            const moviesData = await moviesResponse.json();

            if (moviesData.movies && moviesData.movies.length > 0) {
                setMovies(moviesData.movies);

                // Fetch seat availability for each movie
                const { currentDayOfWeek, currentWeekNumber } = getCurrentDayAndWeek();
                const totalSeats = 94;

                const moviesWithSeatData = await Promise.all(
                    moviesData.movies.map(async (movie: Movie) => {
                        try {
                            const seatsResponse = await fetch(
                                `/api/tickets/seats?movie_id=${movie._id}&dayOfWeek=${currentDayOfWeek}&weekNumber=${currentWeekNumber}`
                            );
                            const seatsData = await seatsResponse.json();

                            const reservedSeatsList = (seatsData.reservedSeats || [])
                                .filter((seat: ReservedSeat) =>
                                    seat.paymentStatus === 'paid' || seat.paymentStatus === 'pending'
                                )
                                .map((seat: ReservedSeat) => seat.seatNumber);

                            const availableSeats = totalSeats - reservedSeatsList.length;

                            return {
                                ...movie,
                                availableSeats,
                                totalSeats,
                                reservedSeats: reservedSeatsList
                            };
                        } catch (error) {
                            console.error(`Error fetching seats for ${movie.movieTitle}:`, error);
                            return {
                                ...movie,
                                availableSeats: totalSeats,
                                totalSeats,
                                reservedSeats: []
                            };
                        }
                    })
                );

                setMoviesWithSeats(moviesWithSeatData);

                // Log when data is refreshed (except initial load)
                if (!isInitialLoad) {
                    console.log(`Data refreshed at ${new Date().toLocaleTimeString()}: ${moviesWithSeatData.length} movies updated`);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            if (isInitialLoad) {
                setIsLoadingData(false);
            }
        }
    };

    const buildSystemPrompt = () => {
        const { currentDayOfWeek, currentWeekNumber } = getCurrentDayAndWeek();

        const moviesInfo = moviesWithSeats.map(movie => {
            const timeslot12hr = formatTo12Hour(movie.timeslot);
            const seatInfo = `Available Seats: ${movie.availableSeats} out of ${movie.totalSeats}`;

            return `**${movie.movieTitle}**
- Year: ${movie.releasedYear}
- Duration: ${movie.duration} minutes
- Director: ${movie.director}
- Showtime: ${timeslot12hr}
- ${seatInfo}
- Summary: ${movie.summary}`;
        }).join('\n\n');

        return `You are CineAI Assistant, a helpful voice chatbot for a movie theater kiosk. You help customers with information about movies, showtimes, pricing, and seat availability.

IMPORTANT INFORMATION:
- Ticket Price: 200 pesos per ticket (fixed price for all movies and showtimes)
- Current Day: ${currentDayOfWeek}
- Current Week: ${currentWeekNumber}
- Cinema Policy: Outside food and drinks are not allowed inside the theater
- Cinema Policy: Customer are prohibited from filming or taking photos inside the theater

AVAILABLE MOVIES AND SEAT AVAILABILITY (${moviesWithSeats.length} movies showing today):

${moviesInfo}

GUIDELINES FOR RESPONDING:
1. Be friendly, warm, and conversational - speak naturally like a helpful person
2. Keep responses brief (2-3 sentences maximum) to maintain natural conversation flow
3. Always format showtimes in 12-hour format (e.g., "2:30 PM")
4. When mentioning seat availability, be specific: "[X] seats available out of [Total]"
5. All information is already provided above - no need to search or call functions
6. If asked about a movie, mention its showtime and seat availability together
7. Always ask if they need help with anything else before ending the conversation
8. Never say goodbye unless the user clearly indicates they're done
9. If the user asks something outside your scope, politely inform them you can only assist with movie and theater-related questions
10. When they want to buy ticket, tell them to proceed to their screen to complete the booking process
11. When ask where do they pay the ticket after booking in the kiosk, tell them to proceed to the facility's cashier counter to make the payment and collect their tickets
12. When asked about snacks or food, inform them about the no food policy and we don't sell snacks in the theater


RESPONSE EXAMPLES:
User: "What movies are showing?"
You: "We have [X] great films today! [List 2-3 with showtimes]. Which one interests you?"

User: "Tell me about [Movie Name]"
You: "[Movie] is a [duration]-minute film by [director] showing at [time]. [Brief 1-sentence plot]. We have [X] seats available. Would you like to know more?"

User: "What time is [Movie] showing?"
You: "[Movie] is showing at [time], and we currently have [X] seats available out of [total]."

User: "Are seats available for [Movie]?"
You: "Yes! For [Movie] at [time], we have [X] seats available out of [total]. Would you like to proceed with booking?"

User: "How much are tickets?"
You: "Tickets are 200 pesos each for all movies and showtimes. Is there a specific movie you'd like to watch?"

User: "Can I bring snacks?"
You: "I'm sorry, but outside food and drinks aren't allowed in the theater. However, we have concessions available! Can I help you choose a movie?"

IMPORTANT REMINDERS:
- Always be conversational and natural - avoid sounding robotic
- Keep responses short and engaging
- Include seat availability when discussing specific movies
- Use 12-hour time format (AM/PM)
- Ask follow-up questions to keep the conversation going
- Only end with goodbye if the user clearly indicates they're finished`;
    };

    const startListening = async () => {
        if (isListening || isConnecting) return;

        // Ensure data is loaded
        if (moviesWithSeats.length === 0) {
            await fetchAllData();
        }

        // Wait a bit to ensure data is fully loaded
        if (moviesWithSeats.length === 0) {
            console.error("Failed to load movie data");
            return;
        }

        try {
            setIsConnecting(true);
            // DO NOT clear transcript here - preserve existing conversation

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
                firstMessage: transcript.length === 0
                    ? "Hi! Welcome to CineAI. I am an AI chatbot here to assist you with movie information, showtimes,ticket booking, and more about our theater. How can I help you today?"
                    : "I'm back and ready to help! What else would you like to know?",
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    language: "en"
                },
                recordingEnabled: false,
                endCallFunctionEnabled: false,
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
            // Transcript is preserved - no clearing here
        } catch (error) {
            console.error("Error stopping chatbot:", error);
        }
    };

    const closeChat = async () => {
        if (isListening) {
            await stopListening();
        }
        setIsOpen(false);
        // Keep transcript intact even when closing chat window
        // If you want to clear on close, uncomment the line below:
        // setTranscript([]);
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
                <Card className="fixed top-6 left-6 z-50 w-96 h-[580px] flex flex-col shadow-xl py-6 gap-2 bg-neutral-800 border-neutral-700">
                    {/* Header */}
                    <CardHeader className="text-primary-foreground">
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
                            <div className="flex items-center gap-2">

                                <Button
                                    onClick={closeChat}
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-white"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Transcript Area */}
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
                                        {moviesWithSeats.length > 0 && (
                                            <div className="flex flex-col items-center gap-1">
                                                <p className="text-xs text-muted-foreground/60 mt-1">
                                                    Auto-refreshing every minute
                                                </p>
                                            </div>
                                        )}
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
                                disabled={isLoadingData || moviesWithSeats.length === 0}
                                className="w-full"
                                size="lg"
                            >
                                <Mic className="h-4 w-4 mr-2" />
                                {transcript.length > 0 ? "Resume Listening" : moviesWithSeats.length === 0 ? "Loading..." : "Start Listening"}
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
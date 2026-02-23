// components/kiosk/VoiceAssistant.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { Mic, MicOff, Loader2, Volume2, VolumeX } from "lucide-react";

// ─── Vapi (chat only) ─────────────────────────────────────────────────────────
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

// ─── Route nav messages ───────────────────────────────────────────────────────
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

const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!;

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = "idle" | "nav" | "chat";

interface Movie {
    _id: string;
    movieTitle: string;
    director: string;
    releasedYear: number;
    duration: number;
    summary: string;
    timeslot: string;
    slug: string;
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Fetch single TTS audio clip from ElevenLabs ─────────────────────────────
async function fetchTTSAudio(
    text: string,
    retries = 3
): Promise<AudioBuffer | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
                {
                    method: "POST",
                    headers: {
                        "xi-api-key": ELEVENLABS_API_KEY,
                        "Content-Type": "application/json",
                        Accept: "audio/mpeg",
                    },
                    body: JSON.stringify({
                        text,
                        model_id: "eleven_monolingual_v1",
                        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
                    }),
                }
            );

            if (res.status === 429) {
                // Rate limited — wait longer before retrying
                const wait = attempt * 2000;
                console.warn(`ElevenLabs rate limited. Retrying in ${wait}ms...`);
                await sleep(wait);
                continue;
            }

            if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);

            const arrayBuffer = await res.arrayBuffer();
            const audioCtx = new AudioContext();
            const decoded = await audioCtx.decodeAudioData(arrayBuffer);
            audioCtx.close();
            return decoded;
        } catch (err) {
            if (attempt === retries) {
                console.error("TTS fetch failed after retries:", err);
                return null;
            }
            await sleep(1000);
        }
    }
    return null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VoiceAssistant() {
    const pathname = usePathname();

    const [mode, setMode] = useState<Mode>("idle");
    const [navMuted, setNavMuted] = useState(false);
    const [chatConnecting, setChatConnecting] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [showSubtitle, setShowSubtitle] = useState(false);
    const [subtitleText, setSubtitleText] = useState("");

    const [moviesWithSeats, setMoviesWithSeats] = useState<MovieWithSeats[]>([]);
    const [dataReady, setDataReady] = useState(false);

    // Pre-cached AudioBuffers keyed by route
    const audioBuffers = useRef<Record<string, AudioBuffer>>({});
    const currentSource = useRef<AudioBufferSourceNode | null>(null);
    const audioCtx = useRef<AudioContext | null>(null);
    const repeatRef = useRef<NodeJS.Timeout | null>(null);
    const subtitleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastRouteRef = useRef("");

    // Stable refs
    const modeRef = useRef<Mode>("idle");
    const navMutedRef = useRef(false);
    const pathnameRef = useRef(pathname);

    const isOnKiosk = pathname?.startsWith("/kiosk");

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { navMutedRef.current = navMuted; }, [navMuted]);
    useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

    // ── Pre-load all nav audio SEQUENTIALLY on mount ───────────────────────────
    // Sequential (not Promise.all) to avoid 429 rate limit from ElevenLabs
    useEffect(() => {
        if (!isOnKiosk) return;

        const preload = async () => {
            const routes = Object.keys(ROUTE_MESSAGES);
            for (const route of routes) {
                const buf = await fetchTTSAudio(ROUTE_MESSAGES[route]);
                if (buf) audioBuffers.current[route] = buf;
                // 500ms gap between each request to stay under rate limits
                await sleep(500);
            }
            setAudioReady(true);
        };

        preload();
    }, [isOnKiosk]);

    // ── Get or create AudioContext ─────────────────────────────────────────────
    const getAudioCtx = useCallback((): AudioContext => {
        if (!audioCtx.current || audioCtx.current.state === "closed") {
            audioCtx.current = new AudioContext();
        }
        if (audioCtx.current.state === "suspended") {
            audioCtx.current.resume();
        }
        return audioCtx.current;
    }, []);

    // ── Show subtitle ──────────────────────────────────────────────────────────
    const showMessage = useCallback((text: string, duration = 20000) => {
        setSubtitleText(text);
        setShowSubtitle(true);
        if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
        subtitleTimerRef.current = setTimeout(() => setShowSubtitle(false), duration);
    }, []);

    // ── Stop nav audio ─────────────────────────────────────────────────────────
    const stopNavAudio = useCallback(() => {
        if (repeatRef.current) { clearTimeout(repeatRef.current); repeatRef.current = null; }
        if (currentSource.current) {
            try { currentSource.current.stop(); } catch { }
            currentSource.current = null;
        }
    }, []);

    // ── Play nav audio instantly from pre-loaded buffer ────────────────────────
    const playNavAudio = useCallback(
        (route: string) => {
            if (navMutedRef.current || modeRef.current === "chat") return;

            const buffer = audioBuffers.current[route];
            if (!buffer) return;

            stopNavAudio();

            const ctx = getAudioCtx();
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);

            setMode("nav");
            modeRef.current = "nav";
            showMessage(ROUTE_MESSAGES[route], buffer.duration * 1000 + 500);

            source.onended = () => {
                if (modeRef.current === "nav") {
                    setMode("idle");
                    modeRef.current = "idle";
                }
                currentSource.current = null;

                // Repeat after 60s if still on same route
                repeatRef.current = setTimeout(() => {
                    if (
                        !navMutedRef.current &&
                        modeRef.current !== "chat" &&
                        pathnameRef.current === route
                    ) {
                        playNavAudio(route);
                    }
                }, 60000);
            };

            source.start();
            currentSource.current = source;
        },
        [getAudioCtx, showMessage, stopNavAudio]
    );

    // ── Route change → play nav ────────────────────────────────────────────────
    useEffect(() => {
        if (!isOnKiosk) return;
        if (pathname === lastRouteRef.current) return;
        lastRouteRef.current = pathname || "";

        stopNavAudio();
        if (modeRef.current === "chat") return;

        if (!navMutedRef.current && ROUTE_MESSAGES[pathname || ""]) {
            const t = setTimeout(() => playNavAudio(pathname || ""), 400);
            return () => clearTimeout(t);
        }
    }, [pathname, isOnKiosk, stopNavAudio, playNavAudio]);

    // ── Fetch movie data ───────────────────────────────────────────────────────
    const fetchAllData = useCallback(async () => {
        try {
            const res = await fetch("/api/movies");
            const data = await res.json();
            if (!data.movies?.length) return;

            const { currentDayOfWeek, currentWeekNumber } = getCurrentDayAndWeek();
            const totalSeats = 94;

            const enriched = await Promise.all(
                data.movies.map(async (movie: Movie) => {
                    try {
                        const seatRes = await fetch(
                            `/api/tickets/seats?movie_id=${movie._id}&dayOfWeek=${currentDayOfWeek}&weekNumber=${currentWeekNumber}`
                        );
                        const seatData = await seatRes.json();
                        const reserved = (seatData.reservedSeats || [])
                            .filter((s: ReservedSeat) => s.paymentStatus === "paid" || s.paymentStatus === "pending")
                            .map((s: ReservedSeat) => s.seatNumber);
                        return { ...movie, availableSeats: totalSeats - reserved.length, totalSeats, reservedSeats: reserved };
                    } catch {
                        return { ...movie, availableSeats: totalSeats, totalSeats, reservedSeats: [] };
                    }
                })
            );

            setMoviesWithSeats(enriched);
            setDataReady(true);
        } catch (err) {
            console.error("Error fetching movie data:", err);
        }
    }, []);

    useEffect(() => {
        if (!isOnKiosk) return;
        fetchAllData();
        const iv = setInterval(fetchAllData, 60000);
        return () => clearInterval(iv);
    }, [isOnKiosk, fetchAllData]);

    // ── Build chat system prompt ───────────────────────────────────────────────
    const buildSystemPrompt = useCallback((movies: MovieWithSeats[]) => {
        const { currentDayOfWeek, currentWeekNumber } = getCurrentDayAndWeek();
        const moviesInfo = movies
            .map(
                (m) =>
                    `**${m.movieTitle}**\n- Year: ${m.releasedYear}\n- Duration: ${m.duration} min\n- Director: ${m.director}\n- Showtime: ${formatTo12Hour(m.timeslot)}\n- Available Seats: ${m.availableSeats}/${m.totalSeats}\n- Summary: ${m.summary}`
            )
            .join("\n\n");

        return `You are CineAI Assistant, a helpful voice chatbot for a movie theater kiosk.

FACTS:
- Ticket Price: 200 pesos per ticket (all movies)
- Current Day: ${currentDayOfWeek} (${currentWeekNumber})
- No outside food/drinks; no filming inside theater

MOVIES NOW SHOWING (${movies.length}):
${moviesInfo}

RULES:
1. Friendly, conversational, natural — not robotic
2. Brief responses (2–3 sentences max)
3. 12-hour time format always
4. Include seat availability when discussing a movie
5. After kiosk booking → proceed to cashier to pay & collect tickets
6. No snacks/food available; outside food not allowed
7. Do NOT greet or speak first — wait for the user to ask something
8. End naturally only when the user is clearly done`;
    }, []);

    // ── Vapi event listeners (chat only) ──────────────────────────────────────
    useEffect(() => {
        const onCallStart = () => setChatConnecting(false);
        const onCallEnd = () => {
            setChatConnecting(false);
            setMode((prev) => (prev === "chat" ? "idle" : prev));
        };
        const onMessage = (msg: any) => {
            if (
                msg.type === "transcript" &&
                msg.transcriptType === "final" &&
                msg.role === "assistant"
            ) {
                const text: string = msg.transcript || "";
                if (text.trim()) showMessage(text, 7000);
            }
        };
        const onError = (err: any) => {
            console.error("Vapi error:", err);
            setMode("idle");
            setChatConnecting(false);
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
    }, [showMessage]);

    // ── Toggle mic ─────────────────────────────────────────────────────────────
    const toggleMic = useCallback(async () => {
        if (mode === "chat") {
            try { await vapi.stop(); } catch { }
            setMode("idle");
            setChatConnecting(false);
            setShowSubtitle(false);

            if (!navMutedRef.current) {
                setTimeout(() => playNavAudio(pathnameRef.current || ""), 600);
            }
        } else {
            stopNavAudio();
            setMode("idle");
            setShowSubtitle(false);

            if (!dataReady) await fetchAllData();

            try {
                setChatConnecting(true);
                setMode("chat");

                await vapi.start({
                    model: {
                        provider: "openai",
                        model: "gpt-4",
                        messages: [{ role: "system", content: buildSystemPrompt(moviesWithSeats) }],
                    },
                    voice: { provider: "11labs", voiceId: ELEVENLABS_VOICE_ID },
                    name: "CineAI Chatbot",
                    // No firstMessage — assistant stays silent, user speaks first
                    transcriber: { provider: "deepgram", model: "nova-2", language: "en" },
                    recordingEnabled: false,
                    endCallFunctionEnabled: false,
                    clientMessages: ["transcript", "hang", "speech-update"],
                    serverMessages: ["end-of-call-report", "hang", "speech-update"],
                });
            } catch (err) {
                console.error("Chat start error:", err);
                setMode("idle");
                setChatConnecting(false);
            }
        }
    }, [mode, dataReady, moviesWithSeats, fetchAllData, buildSystemPrompt, stopNavAudio, playNavAudio]);

    // ── Toggle nav mute ────────────────────────────────────────────────────────
    const toggleNavMute = useCallback(() => {
        if (navMuted) {
            setNavMuted(false);
            navMutedRef.current = false;
            if (mode !== "chat") {
                setTimeout(() => playNavAudio(pathnameRef.current || ""), 300);
            }
        } else {
            stopNavAudio();
            setNavMuted(true);
            navMutedRef.current = true;
            if (mode === "nav") {
                setMode("idle");
                modeRef.current = "idle";
            }
        }
    }, [navMuted, mode, stopNavAudio, playNavAudio]);

    // ── Cleanup ────────────────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            stopNavAudio();
            try { vapi.stop(); } catch { }
            audioCtx.current?.close();
        };
    }, [stopNavAudio]);

    // ─── Render ────────────────────────────────────────────────────────────────
    if (!isOnKiosk) return null;

    const isChatMode = mode === "chat";
    const isNavSpeaking = mode === "nav";
    const isAnimated = isNavSpeaking || isChatMode;

    return (
        <>
            {/* ── Subtitle bubble ───────────────────────────────────────────── */}
            <div
                className={`
          fixed top-4 right-20 z-40 max-w-xs
          transition-all duration-500 ease-out
          ${showSubtitle ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}
        `}
            >
                <div className="relative bg-black/80 backdrop-blur-md text-white text-sm leading-relaxed px-4 py-3 rounded-2xl rounded-tr-sm shadow-2xl border border-white/10">
                    <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-1 flex gap-0.5 items-end h-4">
                            {[0, 150, 300].map((delay) => (
                                <div
                                    key={delay}
                                    className="w-0.5 rounded-full bg-emerald-400"
                                    style={{
                                        animation: isAnimated
                                            ? `voiceBar 0.8s ease-in-out infinite alternate ${delay}ms`
                                            : "none",
                                        height: isAnimated ? "100%" : "30%",
                                        transition: "height 0.3s",
                                    }}
                                />
                            ))}
                        </div>
                        <p className="text-white/90 font-light">{subtitleText}</p>
                    </div>
                </div>
                <div
                    className="absolute top-0 right-0 w-3 h-3 bg-black/80"
                    style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
                />
            </div>

            {/* ── Controls ──────────────────────────────────────────────────── */}
            <div className="fixed top-4 right-4 z-50 flex flex-col items-center gap-2">

                {/* Mic button */}
                <button
                    onClick={toggleMic}
                    disabled={chatConnecting && !isChatMode}
                    title={isChatMode ? "Stop mic" : "Ask CineAI a question"}
                    className={`
            relative h-12 w-12 rounded-full shadow-xl
            flex items-center justify-center
            transition-all duration-300 hover:scale-110 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            ${isChatMode
                            ? "bg-red-500 shadow-red-500/40 ring-2 ring-red-400/50"
                            : chatConnecting
                                ? "bg-amber-500 shadow-amber-500/40"
                                : "bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-400"
                        }
          `}
                >
                    {chatConnecting && !isChatMode ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : isChatMode ? (
                        <MicOff className="h-5 w-5 text-white" />
                    ) : (
                        <Mic className="h-5 w-5 text-white" />
                    )}
                    {isChatMode && (
                        <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                    )}
                </button>

                {/* Nav mute button */}
                <button
                    onClick={toggleNavMute}
                    disabled={isChatMode}
                    title={navMuted ? "Unmute voice guide" : "Mute voice guide"}
                    className={`
            h-8 w-8 rounded-full shadow-md
            flex items-center justify-center
            transition-all duration-200 hover:scale-110 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20
          `}
                >
                    {navMuted ? (
                        <VolumeX className="h-4 w-4 text-red-400" />
                    ) : (
                        <Volume2
                            className={`h-4 w-4 transition-colors ${isNavSpeaking
                                    ? "text-emerald-400"
                                    : audioReady
                                        ? "text-white/60"
                                        : "text-white/30"
                                }`}
                        />
                    )}
                </button>

                {/* Tiny spinner while audio pre-loads */}
                {!audioReady && !navMuted && (
                    <div title="Preloading voice guide...">
                        <Loader2 className="h-3 w-3 text-white/30 animate-spin" />
                    </div>
                )}
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
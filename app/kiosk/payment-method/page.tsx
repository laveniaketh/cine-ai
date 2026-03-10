"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMovieSelectionStore } from "@/lib/store/movie-selection";

const PaymentMethodPage = () => {
    const router = useRouter();
    const selectedMovie = useMovieSelectionStore((state) => state.selectedMovie);
    const selectedSeats = useMovieSelectionStore((state) => state.selectedSeats);
    const [isLoading, setIsLoading] = useState<"cash" | "e-wallet" | null>(null);
    const [error, setError] = useState<string | null>(null);

    const paymentAmount = useMemo(() => selectedSeats.length * 200, [selectedSeats]);

    const getScheduleContext = () => {
        const now = new Date();
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const currentDayOfWeek = days[now.getDay()];
        const dayOfMonth = now.getDate();
        const currentWeekNumber = `Week ${Math.ceil(dayOfMonth / 7)}`;

        return { currentDayOfWeek, currentWeekNumber };
    };

    const createCashTicket = async () => {
        if (!selectedMovie || selectedSeats.length === 0) {
            throw new Error("Missing movie or seat selection.");
        }

        const { currentDayOfWeek, currentWeekNumber } = getScheduleContext();

        const response = await fetch("/api/tickets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                movieTitle: selectedMovie.movieTitle,
                seatsSelected: selectedSeats,
                paymentAmount,
                paymentStatus: "pending",
                paymentMethod: "cash",
                platform: "kiosk",
                dayOfWeek: currentDayOfWeek,
                weekNumber: currentWeekNumber,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to create cash ticket.");
        }

        router.push("/kiosk/payment-sucessful");
    };

    const createEWalletCheckout = async () => {
        if (!selectedMovie || selectedSeats.length === 0) {
            throw new Error("Missing movie or seat selection.");
        }

        const { currentDayOfWeek, currentWeekNumber } = getScheduleContext();

        const response = await fetch("/api/payments/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                movieTitle: selectedMovie.movieTitle,
                seatsSelected: selectedSeats,
                paymentAmount,
                paymentMethod: "e-wallet",
                platform: "kiosk",
                dayOfWeek: currentDayOfWeek,
                weekNumber: currentWeekNumber,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to start e-wallet checkout.");
        }

        if (!data.checkoutUrl) {
            throw new Error("Checkout URL is missing from PayMongo response.");
        }

        window.location.href = data.checkoutUrl;
    };

    const handleSelectMethod = async (method: "cash" | "e-wallet") => {
        setIsLoading(method);
        setError(null);

        try {
            if (method === "cash") {
                await createCashTicket();
            } else {
                await createEWalletCheckout();
            }
        } catch (err) {
            console.error("Payment method error:", err);
            setError(err instanceof Error ? err.message : "Failed to process payment method.");
            setIsLoading(null);
        }
    };

    if (!selectedMovie || selectedSeats.length === 0) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-white">
                <p className="text-2xl">No movie or seats selected.</p>
                <Link href="/kiosk/movie-selection">
                    <Button className="text-lg">Go to Movie Selection</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col relative items-center justify-center">
            <h1 className="text-6xl text-gray-900 dark:text-white">
                <span className="text-gradient">Payment</span> Method
            </h1>

            <div className="rounded-lg shadow-lg shadow-[#2D2D2F] bg-neutral-800 mt-4 mx-auto h-[700px] max-w-7xl w-full">
                <div className="flex h-full flex-col items-center justify-center gap-10 p-4">
                    <div className="flex w-full flex-col items-center justify-center gap-10 p-8 md:flex-row">
                        <button
                            type="button"
                            onClick={() => handleSelectMethod("cash")}
                            disabled={Boolean(isLoading)}
                            className="flex aspect-square w-full max-w-[380px] flex-col items-center justify-between gap-3 rounded-2xl border border-yellow-100 bg-linear-to-br from-yellow-300 via-yellow-100 to-white p-6 shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-yellow-200/70 disabled:opacity-60"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <Image
                                    src="/counter.png"
                                    alt="Cash"
                                    width={250}
                                    height={250}
                                    quality={100}
                                    loading="eager"
                                />
                                <p className="mt-2 text-center text-xl font-semibold text-neutral-900">Cash at Counter</p>
                                <p className="text-neutral-700">{isLoading === "cash" ? "Processing..." : "Reserve now, pay at cashier"}</p>
                            </div>
                        </button>


                        <button
                            type="button"
                            onClick={() => handleSelectMethod("e-wallet")}
                            disabled={Boolean(isLoading)}
                            className="flex aspect-square w-full max-w-[380px] flex-col items-center justify-between gap-3 rounded-2xl border border-yellow-100 bg-linear-to-br from-yellow-300 via-yellow-100 to-white p-6 shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-yellow-200/70 disabled:opacity-60"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <Image
                                    src="/online-payment.png"
                                    alt="E-Wallet"
                                    width={250}
                                    height={250}
                                    quality={100}
                                    loading="eager"
                                />
                                <p className="mt-2 text-center text-xl font-semibold text-neutral-900">E-Wallet</p>
                                <p className="text-neutral-700">{isLoading === "e-wallet" ? "Redirecting to checkout..." : "Pay online with supported wallets"}</p>
                            </div>
                        </button>


                    </div>
                    <div className="mt-6 flex items-center gap-4">
                        <Link href="/kiosk/payment-confirmation">
                            <Button variant="default"
                                className="text-2xl px-8 py-2 h-auto rounded-xl">Back</Button>
                        </Link>
                    </div>







                </div>

            </div>

            {error && (
                <div className="fixed top-4 right-4 z-50 max-w-md rounded-lg bg-red-500/90 px-6 py-4 text-white shadow-lg">
                    <p className="font-semibold">Payment Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

        </div >
    );
};

export default PaymentMethodPage;

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useMovieSelectionStore } from "@/lib/store/movie-selection";
import { LoaderOne } from "@/components/ui/loader";

interface MovieDetails {
    movietitle: string;
    timeslot: string;
    posterPath: string;
    slug: string;
}

const PaymentConfirmation = () => {
    const router = useRouter();
    const selectedMovie = useMovieSelectionStore((state) => state.selectedMovie);
    const selectedSeats = useMovieSelectionStore((state) => state.selectedSeats);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirmPurchase = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Validate that we have required data
            if (!selectedMovie || !selectedSeats || selectedSeats.length === 0) {
                throw new Error('Missing movie or seat selection');
            }

            const seatPrice = 200;
            const paymentAmount = selectedSeats.length * seatPrice;

            // Calculate current day of week and week number
            const now = new Date();
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const currentDayOfWeek = days[now.getDay()];
            const dayOfMonth = now.getDate();
            const currentWeekNumber = `Week ${Math.ceil(dayOfMonth / 7)}`;

            // Prepare the request body
            const requestBody = {
                movieTitle: selectedMovie.movieTitle,
                seatsSelected: selectedSeats,
                paymentAmount: paymentAmount,
                paymentStatus: 'pending',
                platform: 'kiosk',
                dayOfWeek: currentDayOfWeek,
                weekNumber: currentWeekNumber,
            };

            // Send POST request
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            // Handle error responses
            if (!response.ok) {
                throw new Error(data.message || 'Failed to process your purchase. Please try again.');
            }


            router.push('/kiosk/payment-sucessful');
        } catch (err) {
            console.error('Purchase error:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');

            // Auto-dismiss error after 5 seconds
            setTimeout(() => {
                setError(null);
            }, 5000);
        } finally {
            setIsLoading(false);
            setIsDialogOpen(false);
        }
    };

    if (!selectedMovie || selectedSeats.length === 0) {
        return (
            <div className="flex flex-col relative items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <p className="text-red-500 text-2xl">No movie or seats selected.</p>
                    <Link href="/kiosk/movie-selection">
                        <Button className="text-xl px-6 py-3">
                            Go to Movie Selection
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const movieDetails: MovieDetails = {
        movietitle: selectedMovie.movieTitle,
        timeslot: selectedMovie.timeslot,
        posterPath: selectedMovie.poster,
        slug: selectedMovie.slug,
    };

    const seatPrice = 200;
    const total = selectedSeats.length * seatPrice;

    // Helper function to format 24-hour time to 12-hour format
    const formatTo12Hour = (time: string): string => {
        const [hourStr, minuteStr] = time.split(":");
        let hour = parseInt(hourStr, 10);
        const minute = minuteStr.padStart(2, "0");
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${ampm}`;
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center">
                <LoaderOne />
            </div>
        );
    }

    return (
        <div className="flex flex-col relative items-center justify-center">
            <h1 className="text-6xl  text-gray-900 dark:text-white">
                <span className="text-gradient">Payment</span> Details
            </h1>

            <div className="rounded-lg shadow-lg shadow-[#2D2D2F] bg-neutral-800 mt-4 mx-auto h-[700px] max-w-7xl w-full">
                <div className="flex flex-row justify-evenly items-center h-full p-5">
                    {/* Movie Poster Section */}
                    <div className="w-[450px] h-[600px] rounded-lg bg-[#171718] shadow-[#2D2D2F] shadow-md">
                        <div className="flex flex-row items-center justify-center h-full p-5">
                            {/* Yellow Film Strips */}
                            <div className="flex flex-col gap-2 mr-4">
                                {[...Array(17)].map((_, index) => (
                                    <div
                                        key={`left-${index}`}
                                        className="w-6.5 h-6.5 bg-yellow-400 rounded-sm"
                                    ></div>
                                ))}
                            </div>
                            {/* Poster Image */}
                            <div className="relative w-full h-full">
                                <Image
                                    src={movieDetails.posterPath}
                                    alt="Movie Poster"
                                    fill
                                    className="object-cover rounded-md"
                                />
                            </div>
                            {/* Yellow Film Strips */}
                            <div className="flex flex-col gap-2 ml-4">
                                {[...Array(17)].map((_, index) => (
                                    <div
                                        key={`right-${index}`}
                                        className="w-6.5 h-6.5 bg-yellow-400 rounded-sm"
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Payment Details Section */}
                    <div className="flex flex-col justify-between text-white w-[550px] h-[600px] p-8 border-2 border-neutral-700 rounded-lg bg-neutral-900/80  shadow-md">
                        <div className="flex flex-col gap-4">
                            <h2 className="text-5xl font-bold">{movieDetails.movietitle}</h2>
                            <p className="text-2xl">Timeslot: {formatTo12Hour(movieDetails.timeslot)}</p>
                            <p className="text-2xl">Seat(s): {selectedSeats.join(", ")}</p>
                        </div>

                        <div className="flex flex-col gap-6">
                            <h2 className="text-4xl font-bold">Payment</h2>
                            <div className="flex flex-row justify-between">
                                <p className="text-2xl">{selectedSeats.join(", ")}</p>
                                <p className="text-2xl">x {selectedSeats.length}</p>
                            </div>
                            <div className="w-full border-t-2 rounded-full border-gray-300 border" />
                            <div className="flex flex-row justify-between">
                                <h2 className="text-3xl font-bold">Total</h2>
                                <h2 className="text-3xl font-bold">₱ {total}</h2>
                            </div>
                        </div>

                        <div className="flex flex-row items-end justify-between">
                            <Link href="/kiosk/seat-selection">
                                <Button
                                    variant="default"
                                    className="text-2xl px-8 py-2 h-auto rounded-xl"
                                    disabled={isLoading}
                                >
                                    Back
                                </Button>
                            </Link>
                            <Button
                                variant="default"
                                className="text-2xl px-8 py-2 h-auto rounded-xl"
                                onClick={() => setIsDialogOpen(true)}
                                disabled={isLoading}
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="fixed top-4 right-4 bg-red-500/90 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <p className="font-semibold text-lg mb-1">Purchase Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-white">Confirm Purchase</DialogTitle>
                        <DialogDescription className="text-lg text-gray-300 ">
                            Are you sure you want to purchase {selectedSeats.length} ticket{selectedSeats.length > 1 ? 's' : ''} for {movieDetails.movietitle}?

                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-row justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isLoading}
                            className="text-lg px-6 py-2 text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmPurchase}
                            disabled={isLoading}
                            className="text-lg px-6 py-2"
                        >
                            {isLoading ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Processing...
                                </>
                            ) : (
                                'Confirm'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PaymentConfirmation;
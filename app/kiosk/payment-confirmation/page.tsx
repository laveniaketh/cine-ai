"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useMovieSelectionStore } from "@/lib/store/movie-selection";

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
    const clearSelection = useMovieSelectionStore((state) => state.clearSelection);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirmPurchase = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const seatPrice = 200;
            const paymentAmount = selectedSeats.length * seatPrice;

            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    movieTitle: selectedMovie.movieTitle,
                    seatsSelected: selectedSeats,
                    paymentAmount: paymentAmount,
                    paymentStatus: 'pending',
                    platform: 'kiosk',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to purchase ticket');
            }

            // Success - clear selection and navigate to success page
            clearSelection();
            router.push('/kiosk/payment-sucessful');
        } catch (err) {
            console.error('Purchase error:', err);
            setError(err instanceof Error ? err.message : 'Failed to purchase ticket');
        } finally {
            setIsLoading(false);
            setIsDialogOpen(false);
        }
    };

    if (!selectedMovie || selectedSeats.length === 0) {
        return (
            <div className="flex flex-col relative items-center justify-center min-h-screen">
                <p className="text-red-500 text-2xl">No movie or seats selected. Please go back to movie selection.</p>
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
                                <Button variant="default" className="text-2xl px-8 py-2 h-auto rounded-xl">Back</Button>
                            </Link>
                            <Button
                                variant="default"
                                className="text-2xl px-8 py-2 h-auto rounded-xl"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    <p className="font-semibold">Purchase Failed</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Confirm Purchase</DialogTitle>
                        <DialogDescription className="text-lg">
                            Are you sure you want to purchase {selectedSeats.length} ticket{selectedSeats.length > 1 ? 's' : ''} for "{movieDetails.movietitle}"?
                            <br />
                            <br />
                            <strong>Total: ₱{total}</strong>
                            <br />
                            Seats: {selectedSeats.join(", ")}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isLoading}
                            className="text-lg px-6 py-2"
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
                                'Confirm Purchase'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PaymentConfirmation;

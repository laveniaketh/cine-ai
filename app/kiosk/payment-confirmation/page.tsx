"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MovieDetails {
    movietitle: string;
    timeslot: string;
    posterPath: string;
}

const PaymentConfirmation = () => {
    // Mock data - in real implementation, this would come from state/props
    const movieDetails: MovieDetails = {
        movietitle: "Movie Title",
        timeslot: "7:00 PM",
        posterPath: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
    };

    const selectedSeats: string[] = ["A1", "A2"];
    const seatPrice = 200;
    const total = selectedSeats.length * seatPrice;

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
                            <p className="text-2xl">Timeslot: {movieDetails.timeslot}</p>
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
                            <Link href="/kiosk/payment-sucessful">
                                <Button variant="default" className="text-2xl px-8 py-2 h-auto rounded-xl">Confirm</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentConfirmation;

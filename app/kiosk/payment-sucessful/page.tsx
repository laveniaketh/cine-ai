"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMovieSelectionStore } from "@/lib/store/movie-selection";
import Countdown from "@/components/kiosk/Countdown";


const PaymentSuccessful = () => {
    const clearSelection = useMovieSelectionStore((state) => state.clearSelection);

    return (
        <div className="flex flex-col relative items-center mx-auto my-auto justify-center mt-50">
            <div className="flex flex-row items-center justify-center h-full px-20 py-1">
                <Image
                    src="/ticket.svg"
                    alt="Ticket Banner"
                    width={400}
                    height={400}
                    className="w-full max-w-md h-auto object-contain mx-auto drop-shadow-md"
                />
                <h1 className="text-5xl font-black leading-none tracking-tight text-gray-900 md:text-7xl lg:text-9xl text-start dark:text-white">
                    <span className="text-gradient">Booked</span> Successfully
                </h1>
            </div>
            <div className="mt-20 text-center flex flex-col items-center justify-center h-full gap-4">
                <Countdown />
                <Link href="/kiosk" onClick={clearSelection}>
                    <Button className="text-2xl px-12 py-4 h-auto rounded-4xl">Back to Home</Button>
                </Link>
            </div>
        </div>
    );
};

export default PaymentSuccessful;

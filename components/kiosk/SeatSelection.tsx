"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMovieSelectionStore } from "@/lib/store/movie-selection";


interface MovieDetails {
    id: string;
    movietitle: string;
    timeslot: string;
}

interface SeatSelectionProps {
    movieDetails: MovieDetails;
}

const SeatSelection: React.FC<SeatSelectionProps> = ({
    movieDetails
}) => {
    const selectedSeatsFromStore = useMovieSelectionStore((state) => state.selectedSeats);
    const setSelectedSeats = useMovieSelectionStore((state) => state.setSelectedSeats);

    const rows = "ABCDEFGH".split("");
    const seatsPerRow = [8, 10, 12, 12, 12, 12, 14, 14]; // Seats per row: A-H

    // Mock sold seats data
    const soldSeats = ["A1", "A2", "B5", "C3", "D7", "E4"];
    const [selectedSeats, setSelectedSeatsLocal] = useState<string[]>(selectedSeatsFromStore);

    // Sync local state with store
    useEffect(() => {
        setSelectedSeatsLocal(selectedSeatsFromStore);
    }, [selectedSeatsFromStore]);

    // Sync store with local state changes
    useEffect(() => {
        setSelectedSeats(selectedSeats);
    }, [selectedSeats, setSelectedSeats]);

    const toggleSeat = (seat: string) => {
        if (soldSeats.includes(seat)) return; // Prevent clicking on sold seats

        setSelectedSeatsLocal((prev) => {
            if (prev.includes(seat)) {
                return prev.filter((s) => s !== seat);
            } else {
                if (prev.length >= 20) return prev; // Limit to 20 seats
                return [...prev, seat];
            }
        });
    };

    const getSeatImage = (seat: string) => {
        if (soldSeats.includes(seat)) return "/reserved-seat.png";
        if (selectedSeats.includes(seat)) return "/selected-seat.png";
        return "/avail-seat.png";
    };

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
        <div className="flex flex-col gap-2">
            <div className="rounded-lg shadow-lg border-neutral-700 bg-neutral-800 mt-4 mx-auto p-12">
                <div className="flex flex-col items-center justify-evenly h-full ">
                    <div className="flex flex-col items-center justify-evenly h-full gap-2">
                        {/* Seat Selection Section */}
                        <div className="text-white text-lg font-semibold flex justify-center items-center gap-5 mb-2">
                            <Image src="/selected-seat.png" alt="" width={40} height={40} className="w-10 h-10" />
                            <p>Selected</p>
                            <Image src="/avail-seat.png" alt="" width={40} height={40} className="w-10 h-10" />
                            <p>Available</p>
                            <Image src="/reserved-seat.png" alt="" width={40} height={40} className="w-10 h-10" />
                            <p>Booked</p>
                        </div>
                        <div className="w-150 h-8 bg-[#171718] rounded-lg text-white text-lg font-bold flex items-center justify-center mb-4">
                            Screen
                        </div>
                        <div className="flex flex-col gap-y-2">
                            {rows.map((row, rowIndex) => (
                                <div key={row} className="flex justify-center gap-x-3">
                                    {Array.from({ length: seatsPerRow[rowIndex] }, (_, i) => {
                                        const seat = `${row}${i + 1}`;
                                        return (
                                            <Image
                                                key={seat}
                                                src={getSeatImage(seat)}
                                                alt={`Seat ${seat}`}
                                                width={48}
                                                height={48}
                                                className={`w-12 h-12 cursor-pointer ${soldSeats.includes(seat) ? "opacity-50" : ""
                                                    }`}
                                                onClick={() => toggleSeat(seat)}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>


                </div>

            </div >
            {/* Movie Details */}
            <div className="text-white text-lg  mt-4 flex gap-9 justify-start">
                <div className="flex flex-col ">
                    <p>Movie: {movieDetails.movietitle}</p>
                    <p>Timeslot: {formatTo12Hour(movieDetails.timeslot)}</p>
                </div>
                <div className="flex flex-col ">
                    <p className="text-white  ">
                        Selected Seats:
                    </p>
                    <div className="flex flex-wrap ">
                        {selectedSeats.length > 0 ? (
                            selectedSeats.map((seat) => (
                                <Badge key={seat} variant="outline">
                                    {seat}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-neutral-700">no seats selected</p>
                        )}
                    </div>
                </div>




            </div>
            <div className="flex gap-2 justify-between">
                <Link href="/kiosk/movie-selection">
                    <Button className="text-2xl px-8 py-2 h-auto rounded-xl">Back</Button>
                </Link>
                {selectedSeats.length === 0 ? (
                    <Button disabled={true} className="text-2xl px-8 py-2 h-auto rounded-xl">Next</Button>
                ) : (
                    <Link href="/kiosk/payment-confirmation">
                        <Button className="text-2xl px-8 py-2 h-auto rounded-xl">Next</Button>
                    </Link>
                )}
            </div>
        </div>



    );
};

export default SeatSelection;
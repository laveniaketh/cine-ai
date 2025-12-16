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

    // State for sold/reserved seats fetched from backend
    const [soldSeats, setSoldSeats] = useState<string[]>([]);
    const [reservedSeats, setReservedSeats] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeatsLocal] = useState<string[]>(selectedSeatsFromStore);

    // Fetch reserved seats from backend
    useEffect(() => {
        const fetchReservedSeats = async () => {
            if (!movieDetails.id) return;

            try {
                setLoading(true);
                // Calculate current day of week and week number
                const now = new Date();
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const currentDayOfWeek = days[now.getDay()];
                const dayOfMonth = now.getDate();
                const currentWeekNumber = `Week ${Math.ceil(dayOfMonth / 7)}`;

                const response = await fetch(
                    `/api/tickets/seats?movie_id=${movieDetails.id}&dayOfWeek=${currentDayOfWeek}&weekNumber=${currentWeekNumber}`
                );
                const data = await response.json();

                // Filter seats that are pending (reserved)
                const reservedSeatsList = (data.reservedSeats || [])
                    .filter((seat: { seatNumber: string; paymentStatus: string }) =>
                        seat.paymentStatus === 'pending'
                    )
                    .map((seat: { seatNumber: string }) => seat.seatNumber);

                // Filter seats that are paid or sold
                const soldSeatsList = (data.reservedSeats || [])
                    .filter((seat: { seatNumber: string; paymentStatus: string }) =>
                        seat.paymentStatus === 'paid' || seat.paymentStatus === 'sold'
                    )
                    .map((seat: { seatNumber: string }) => seat.seatNumber);

                setReservedSeats(reservedSeatsList);
                setSoldSeats(soldSeatsList);
            } catch (error) {
                console.error('Error fetching reserved seats:', error);
                setSoldSeats([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReservedSeats();
    }, [movieDetails.id]);

    // Sync local state with store
    useEffect(() => {
        setSelectedSeatsLocal(selectedSeatsFromStore);
    }, [selectedSeatsFromStore]);

    // Sync store with local state changes
    useEffect(() => {
        setSelectedSeats(selectedSeats);
    }, [selectedSeats, setSelectedSeats]);

    const toggleSeat = (seat: string) => {
        if (soldSeats.includes(seat) || reservedSeats.includes(seat)) return; // Prevent clicking on sold or reserved seats

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
        if (soldSeats.includes(seat)) return "/paid-seat.png";
        if (reservedSeats.includes(seat)) return "/reserved-seat.png";
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

    if (loading) {
        return (
            <div className="flex flex-col gap-2">
                <div className="rounded-lg shadow-lg border-neutral-700 bg-neutral-800 mt-4 mx-auto p-12">
                    <div className="flex items-center justify-center h-full text-white">
                        Loading seat information...
                    </div>
                </div>
            </div>
        );
    }

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
                            <p>Reserved</p>
                            <Image src="/paid-seat.png" alt="" width={40} height={40} className="w-10 h-10" />
                            <p>Sold</p>
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
                                                className={`w-12 h-12 cursor-pointer ${(soldSeats.includes(seat) || reservedSeats.includes(seat)) ? "cursor-not-allowed" : ""
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
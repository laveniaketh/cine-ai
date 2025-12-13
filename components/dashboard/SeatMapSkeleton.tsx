"use client";
import React, { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const SeatMapSkeleton = () => {
    const [movies, setMovies] = useState<any[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<any>(null);
    const [reservedSeats, setReservedSeats] = useState<Array<{ seatNumber: string; paymentStatus: string }>>([]);
    const [loading, setLoading] = useState(true);

    // Fetch movies on component mount
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await fetch('/api/movies');
                const data = await response.json();
                const moviesArray = Array.isArray(data) ? data : (data.movies || []);
                setMovies(moviesArray);
                // Set first movie as default
                if (moviesArray.length > 0) {
                    setSelectedMovie(moviesArray[0]);
                }
            } catch (error) {
                console.error('Error fetching movies:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    // Fetch reserved seats when selected movie changes
    useEffect(() => {
        if (!selectedMovie?._id) return;

        const fetchReservedSeats = async () => {
            try {
                const response = await fetch(`/api/tickets/seats?movie_id=${selectedMovie._id}`);
                const data = await response.json();
                setReservedSeats(data.reservedSeats || []);
            } catch (error) {
                console.error('Error fetching reserved seats:', error);
                setReservedSeats([]);
            }
        };

        fetchReservedSeats();
    }, [selectedMovie]);

    // Seat layout configuration - number of seats per row
    const seatLayout = [
        8,   // Row A: 8 seats
        10,  // Row B: 10 seats
        12,  // Row C: 12 seats
        12,  // Row D: 12 seats
        12,  // Row E: 12 seats
        12,  // Row F: 12 seats
        14,  // Row G: 14 seats
        14   // Row H: 14 seats
    ];

    const getSeatColor = (status: number) => {
        switch (status) {
            case 0: return "bg-[#fcd14f]"; // Available
            case 1: return "bg-[#cacac1]"; // Pending
            case 2: return "bg-[#666666]"; // Booked    
            default: return "bg-orange-200";
        }
    };

    const getSeatStatus = (rowIndex: number, seatIndex: number) => {
        const rowLetter = String.fromCharCode(65 + rowIndex); // A, B, C, etc.
        const seatNumber = seatIndex + 1;
        const seatId = `${rowLetter}${seatNumber}`;

        // Check if seat is reserved and get payment status
        const reservedSeat = reservedSeats.find(seat => seat.seatNumber === seatId);

        if (reservedSeat) {
            // If payment is paid, return 2 (Booked)
            if (reservedSeat.paymentStatus === 'paid') {
                return 2;
            }
            // If payment is pending, return 1 (Pending)
            if (reservedSeat.paymentStatus === 'pending') {
                return 1;
            }
        }

        return 0; // Available
    };

    if (loading) {
        return (
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="text-white text-sm">Loading...</div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center ">
            {/* Movie Selector */}
            <div className="absolute top-2 left-2 z-10" >
                <Select

                    value={selectedMovie?._id}
                    onValueChange={(value) => {
                        const movie = movies.find(m => m._id === value);
                        setSelectedMovie(movie);
                    }}

                >
                    <SelectTrigger className="w-[120px] h-6 text-xs dark:bg-neutral-800 border-neutral-700 text-white">
                        <SelectValue placeholder="Select Movie" />
                    </SelectTrigger>
                    <SelectContent>
                        {movies.map((movie) => (
                            <SelectItem key={movie._id} value={movie._id}>
                                {movie.movieTitle}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div >

            <div className="flex flex-col items-center w-full mt-6">
                {/* Screen */}
                <div className="flex flex-col items-center">
                    <div className="w-50 h-1 bg-neutral-900 rounded-full flex items-center justify-center m-2">

                    </div>
                    <span className="text-xs text-white font-medium mb-2">Screen</span>
                </div>
                {/* Seat Layout */}
                <div className="flex flex-col items-center space-y-2">
                    {seatLayout.map((seatsInRow, rowIndex) => (
                        <div key={rowIndex} className="flex items-center space-x-2">
                            {/* Row Label */}
                            <div className="w-4 flex justify-center">
                                <span className="text-xs text-white font-medium">
                                    {String.fromCharCode(65 + rowIndex)}
                                </span>
                            </div>

                            {/* Seats in this row */}
                            <div className="flex space-x-2">
                                {Array.from({ length: seatsInRow }).map((_, seatIndex) => {
                                    const seatStatus = getSeatStatus(rowIndex, seatIndex);
                                    const seatId = `${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`;

                                    return (
                                        <div
                                            key={seatIndex}
                                            title={seatId}
                                            className={`w-4 h-4 rounded-xs transition-colors cursor-pointer hover:opacity-80 ${getSeatColor(seatStatus)}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center space-x-4 mt-4 text-xs">
                    <div className="flex items-center space-x-1 ">
                        <div className="w-3 h-3 bg-[#fcd14f] rounded-xs"></div>
                        <span className="text-white">Available</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-[#cacac1] rounded-xs"></div>
                        <span className="text-white">Pending</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-[#666761] rounded-xs"></div>
                        <span className="text-white">Booked</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeatMapSkeleton;

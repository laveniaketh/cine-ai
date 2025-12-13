"use client";
import React, { useState, useEffect } from "react";

const SeatsAvailabilitySkeleton = () => {
    const [seatData, setSeatData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeatAvailability = async () => {
            try {
                const response = await fetch('/api/analytics/seats-availability');
                const data = await response.json();
                setSeatData(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching seat availability:', error);
                setLoading(false);
            }
        };

        fetchSeatAvailability();
    }, []);

    if (loading || !seatData) {
        return (
            <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center">
                <div className="text-white text-sm">Loading seat availability...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl px-8 ">
            <div className="flex flex-col w-full space-y-2 align-middle justify-center">
                {seatData.movies.map((movie: any, index: number) => (
                    <div
                        key={movie.movieId}
                        className="bg-neutral-800 rounded-lg px-4 py-2 flex flex-row items-center justify-between border border-neutral-700"
                    >
                        <div className="text-white font-semibold text-sm ">
                            <h3>{movie.movieTitle}</h3>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-[#fcd14f] text-lg font-bold">
                                {movie.availableSeats}
                            </div>
                            <div className="text-gray-400 text-xs">
                                seats available
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SeatsAvailabilitySkeleton;

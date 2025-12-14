"use client";
import React from 'react';
import SeatSelection from '@/components/kiosk/SeatSelection';

const SeatSelectionPage = () => {
    // Mock data
    const movieDetails = {
        movietitle: "Wicked",
        timeslot: "7:00 PM"
    };

    const initialSelectedSeats: string[] = [];

    return (
        <div className=" flex flex-col relative items-center justify-center ">
            <h1 className="text-6xl  text-gray-900 dark:text-white text-center">
                <span className="text-gradient">Select</span> Your Seat
            </h1>

            <SeatSelection
                movieDetails={movieDetails}
                initialSelectedSeats={initialSelectedSeats}
            />

        </div>
    );
};

export default SeatSelectionPage;

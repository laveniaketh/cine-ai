"use client";
import SeatSelection from '@/components/kiosk/SeatSelection';
import { LoaderOne } from '@/components/ui/loader';
import { useMovieSelectionStore } from '@/lib/store/movie-selection';
import { Suspense } from 'react';

const SeatSelectionPage = () => {
    const selectedMovie = useMovieSelectionStore((state) => state.selectedMovie);

    if (!selectedMovie) {
        return (
            <div className="flex flex-col relative items-center justify-center min-h-screen">
                <p className="text-red-500 text-2xl">No movie selected. Please go back to movie selection.</p>
            </div>
        );
    }
    const movieDetails = {
        id: selectedMovie._id,
        movietitle: selectedMovie.movieTitle,
        timeslot: selectedMovie.timeslot,
    };

    return (
        <div className=" flex flex-col relative items-center justify-center ">
            <h1 className="text-6xl  text-gray-900 dark:text-white text-center">
                <span className="text-gradient">Select</span> Your Seat
            </h1>
            <Suspense fallback={<LoaderOne />}>
                <SeatSelection
                    movieDetails={movieDetails}
                />

            </Suspense>



        </div>
    );
};

export default SeatSelectionPage;

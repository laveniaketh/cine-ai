"use client";

import Agent from "@/components/Agent";
import { useMovieSelectionStore } from "@/lib/store/movie-selection";

const KioskLayout = ({ children }: { children: React.ReactNode }) => {
    const selectedMovie = useMovieSelectionStore((state) => state.selectedMovie);
    const selectedSeats = useMovieSelectionStore((state) => state.selectedSeats);

    const movieData = {
        selectedMovie: selectedMovie ? {
            id: selectedMovie._id,
            title: selectedMovie.movieTitle,
            timeslot: selectedMovie.timeslot,
            poster: selectedMovie.poster,
            director: selectedMovie.director,
            releasedYear: selectedMovie.releasedYear,
            summary: selectedMovie.summary,
        } : null,
        selectedSeats,
        totalSeats: selectedSeats?.length || 0,
        totalPrice: (selectedSeats?.length || 0) * 200,
    };

    return (
        <div className="relative min-h-screen">
            {children}
            <Agent movieData={movieData} />
        </div>
    );
};

export default KioskLayout;
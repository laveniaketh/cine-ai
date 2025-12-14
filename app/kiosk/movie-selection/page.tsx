"use client";

import { useState } from "react";
import MovieSelection from "@/components/kiosk/MovieSelection";
import PosterCarousel from "@/components/kiosk/PosterCarousel";
import { Swiper as SwiperType } from "swiper";

interface Movie {
    id: number;
    movietitle: string;
    previewPath: string;
    releasedYear: number;
    director: string;
    summary: string;
    timeslot: string;
}

// Mock movies data - same as MovieSelection
const mockMovies: Movie[] = [
    {
        id: 1,
        movietitle: "The Shawshank Redemption",
        previewPath: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&h=1080&fit=crop",
        releasedYear: 1994,
        director: "Frank Darabont",
        summary: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        timeslot: "7:00 PM - 9:30 PM",
    },
    {
        id: 2,
        movietitle: "The Godfather",
        previewPath: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1920&h=1080&fit=crop",
        releasedYear: 1972,
        director: "Francis Ford Coppola",
        summary: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
        timeslot: "8:00 PM - 10:45 PM",
    },
    {
        id: 3,
        movietitle: "Pulp Fiction",
        previewPath: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=1080&fit=crop",
        releasedYear: 1994,
        director: "Quentin Tarantino",
        summary: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
        timeslot: "9:00 PM - 11:30 PM",
    },
];

const SelectMovie = () => {
    const [movieSwiper, setMovieSwiper] = useState<SwiperType | null>(null);
    const [posterSwiper, setPosterSwiper] = useState<SwiperType | null>(null);



    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden">
            <MovieSelection
                movies={mockMovies}
                setSwiperInstance={setMovieSwiper}
                swiperInstance={posterSwiper}
            />
            <div className="absolute bottom-0 right-4">
                <PosterCarousel
                    movies={mockMovies}
                    setSwiperInstance={setPosterSwiper}
                    swiperInstance={movieSwiper}
                // onMovieSelect={handleMovieSelect}
                />
            </div>
        </div>
    );
};

export default SelectMovie;

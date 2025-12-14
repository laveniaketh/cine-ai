"use client";

import { useState, useEffect } from "react";
import MovieSelection from "@/components/kiosk/MovieSelection";
import PosterCarousel from "@/components/kiosk/PosterCarousel";
import { Swiper as SwiperType } from "swiper";

interface Movie {
    id: number;
    movietitle: string;
    previewPath: string;
    posterPath: string;
    slug: string;
    releasedYear: number;
    director: string;
    summary: string;
    timeslot: string;
}

const SelectMovie = () => {
    const [movieSwiper, setMovieSwiper] = useState<SwiperType | null>(null);
    const [posterSwiper, setPosterSwiper] = useState<SwiperType | null>(null);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/movies");

                if (!response.ok) {
                    throw new Error("Failed to fetch movies");
                }

                const data = await response.json();

                // Transform the data to match the Movie interface
                const transformedMovies: Movie[] = data.movies.map((movie: any) => ({
                    id: movie._id,
                    movietitle: movie.movieTitle,
                    previewPath: movie.preview,
                    posterPath: movie.poster,
                    slug: movie.slug,
                    releasedYear: movie.releasedYear,
                    director: movie.director,
                    summary: movie.summary,
                    timeslot: movie.timeslot,
                }));

                setMovies(transformedMovies);
                setError(null);
            } catch (err) {
                console.error("Error fetching movies:", err);
                setError(err instanceof Error ? err.message : "Failed to load movies");
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center bg-[#171718]">
                <p className="text-white text-2xl">Loading movies...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center bg-[#171718]">
                <p className="text-red-500 text-2xl">Error: {error}</p>
            </div>
        );
    }

    if (movies.length === 0) {
        return (
            <div className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center bg-[#171718]">
                <p className="text-white text-2xl">No movies available</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden">
            <MovieSelection
                movies={movies}
                setSwiperInstance={setMovieSwiper}
                swiperInstance={posterSwiper}
            />
            <div className="absolute bottom-0 right-4">
                <PosterCarousel
                    movies={movies}
                    setSwiperInstance={setPosterSwiper}
                    swiperInstance={movieSwiper}
                />
            </div>
        </div>
    );
};

export default SelectMovie;

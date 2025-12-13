"use client";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import Image from "next/image";

const NowShowingSkeleton = () => {
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await fetch('/api/movies');
                const data = await response.json();
                console.log('Fetched movies data:', data);
                // Get only the first 3 movies for the bento grid
                const moviesArray = Array.isArray(data) ? data : (data.movies || []);
                console.log('Movies array:', moviesArray);
                setMovies(moviesArray.slice(0, 3));
            } catch (error) {
                console.error('Error fetching movies:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    const first = {
        initial: {
            x: 20,
            rotate: -5,
        },
        hover: {
            x: 0,
            rotate: 0,
        },
    };
    const second = {
        initial: {
            x: -20,
            rotate: 5,
        },
        hover: {
            x: 0,
            rotate: 0,
        },
    };

    if (loading) {
        return (
            <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-3 p-3">
                <div className="h-full w-1/3 rounded-2xl bg-neutral-700 animate-pulse" />
                <div className="h-full w-1/3 rounded-2xl bg-neutral-700 animate-pulse" />
                <div className="h-full w-1/3 rounded-2xl bg-neutral-700 animate-pulse" />
            </div>
        );
    }

    return (
        <motion.div
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-3 p-3"
        >
            {movies.length > 0 ? (
                movies.map((movie, index) => {
                    const variants = index === 0 ? first : index === 2 ? second : {};
                    // Use correct field names from database schema
                    const imageSrc = movie.preview || movie.poster || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop";
                    const imageAlt = movie.movieTitle || "Movie preview";

                    return (
                        <motion.div
                            key={movie._id}
                            variants={variants}
                            className="h-full w-1/3 rounded-2xl bg-white dark:bg-black dark:border-white/[0.1] border border-neutral-200 relative overflow-hidden"
                        >
                            <Image
                                src={imageSrc}
                                alt={imageAlt}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                <p className="text-sm text-white font-semibold">
                                    {movie.movieTitle || "Untitled"}
                                </p>
                            </div>
                        </motion.div>
                    );
                })
            ) : (
                // Fallback if no movies found
                <>
                    <motion.div
                        variants={first}
                        className="h-full w-1/3 rounded-2xl bg-white dark:bg-black dark:border-white/[0.1] border border-neutral-200 relative overflow-hidden"
                    >
                        <Image
                            src="https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop"
                            alt="No movies"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-sm text-white font-semibold">
                                No Movies
                            </p>
                        </div>
                    </motion.div>
                    <motion.div className="h-full relative z-20 w-1/3 rounded-2xl bg-white dark:bg-black dark:border-white/[0.1] border border-neutral-200 relative overflow-hidden">
                        <Image
                            src="https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop"
                            alt="No movies"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-sm text-white font-semibold">
                                No Movies
                            </p>
                        </div>
                    </motion.div>
                    <motion.div
                        variants={second}
                        className="h-full w-1/3 rounded-2xl bg-white dark:bg-black dark:border-white/[0.1] border border-neutral-200 relative overflow-hidden"
                    >
                        <Image
                            src="https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop"
                            alt="No movies"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-sm text-white font-semibold">
                                No Movies
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
};

export default NowShowingSkeleton;

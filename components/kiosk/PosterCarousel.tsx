"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { EffectCoverflow, Controller } from "swiper/modules";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMovieSelectionStore } from "@/lib/store/movie-selection";

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

interface PosterCarouselProps {
    movies?: Movie[];
    setSwiperInstance?: (swiper: SwiperType) => void;
    swiperInstance?: SwiperType | null;
    onMovieSelect?: (movie: Movie) => void;
}

const PosterCarousel: React.FC<PosterCarouselProps> = ({
    movies = [],
    setSwiperInstance,
    swiperInstance,
    onMovieSelect
}) => {
    const router = useRouter();
    const setSelectedMovie = useMovieSelectionStore((state) => state.setSelectedMovie);
    const clearSelection = useMovieSelectionStore((state) => state.clearSelection);



    const handleSwiperInit = (swiper: SwiperType) => {
        if (setSwiperInstance) {
            setSwiperInstance(swiper);
        }
    };

    const handleMovieClick = (movie: Movie, e: React.MouseEvent) => {
        // Prevent default to avoid any conflicts
        e.preventDefault();

        // Transform movie data to match store interface
        const storeMovie = {
            _id: movie.id.toString(),
            movieTitle: movie.movietitle,
            previewPath: movie.previewPath,
            poster: movie.posterPath,
            slug: movie.slug,
            releasedYear: movie.releasedYear,
            director: movie.director,
            summary: movie.summary,
            timeslot: movie.timeslot,
        };

        setSelectedMovie(storeMovie);

        if (onMovieSelect) {
            onMovieSelect(movie);
        }

        // Navigate programmatically
        router.push('/kiosk/seat-selection');
    };



    return (
        <div className="w-120 px-6 py-10 mx-auto">

            <Swiper
                effect={"coverflow"}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={"auto"}
                coverflowEffect={{
                    rotate: 0,
                    stretch: 0,
                    depth: 150,
                    modifier: 2.8,
                }}
                onSwiper={handleSwiperInit}
                controller={{ control: swiperInstance }}
                modules={[EffectCoverflow, Controller]}
                className="h-72"
                // KEY FIX: Allow click events to pass through
                allowTouchMove={true}
                // Prevent swiper from blocking clicks
                touchStartPreventDefault={false}
            >
                {movies.map((movie) => (
                    <SwiperSlide
                        key={movie.id}
                        className="w-48! h-72! flex justify-center items-center"
                    >
                        {/* Replace Link with div + onClick */}
                        <div
                            onClick={(e) => handleMovieClick(movie, e)}
                            className="cursor-pointer"
                        >
                            <Image
                                src={movie.posterPath}
                                alt={movie.movietitle}
                                width={192}
                                height={288}
                                className="w-48 h-72 rounded-md object-cover border-4 border-white shadow-md shadow-[#2D2D2F]"
                                // Prevent image drag interfering with clicks
                                draggable={false}
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default PosterCarousel;
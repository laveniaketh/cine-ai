"use client";

import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/effect-fade";
import { EffectFade, Controller } from "swiper/modules";
import Image from "next/image";

interface Movie {
    id: number;
    movietitle: string;
    previewPath: string;
    releasedYear: number;
    director: string;
    summary: string;
    timeslot: string;
}

interface MovieSelectionProps {
    movies?: Movie[];
    setSwiperInstance?: (swiper: SwiperType) => void;
    swiperInstance?: SwiperType | null;
}

const MovieSelection: React.FC<MovieSelectionProps> = ({
    movies = [],
    setSwiperInstance,
    swiperInstance
}) => {
    const [localSwiper, setLocalSwiper] = useState<SwiperType | null>(null);

    const handleSwiperInit = (swiper: SwiperType) => {
        setLocalSwiper(swiper);
        if (setSwiperInstance) {
            setSwiperInstance(swiper);
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-r from-[#1E1E2F] to-[#2A2A3D]">
            <Swiper
                effect={"fade"}
                onSwiper={handleSwiperInit}
                controller={{ control: swiperInstance }}
                modules={[EffectFade, Controller]}
                className="w-full h-full bg-[#171718]"
            >
                {movies.map((movie) => (
                    <SwiperSlide
                        key={movie.id}
                        className="relative flex justify-center items-center"
                    >
                        {/* Background Image */}
                        <div className="w-full h-full relative">
                            <Image
                                src={movie.previewPath}
                                alt={movie.movietitle}
                                fill
                                className="object-cover transition-all duration-200 ease-in-out"
                                priority
                            />
                        </div>

                        {/* Dark Fading Gradient */}
                        <div className="absolute bottom-0 left-0 right-0 h-120 bg-gradient-to-t from-[#171718] via-[#171718]/90" />

                        {/* Movie Details */}
                        <div className="absolute bottom-20 left-0 right-0 pl-20 text-white w-220">
                            <h2 className="text-7xl font-bold">{movie.movietitle}</h2>
                            <p className="text-lg font-light mb-4 mt-1">
                                {movie.releasedYear} • Directed by {movie.director}
                            </p>
                            <p className="text-md font-light mb-2">{movie.summary}</p>
                            <p className="text-xl font-semibold mb-2">
                                ₱200.00 • {movie.timeslot}
                            </p>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default MovieSelection;

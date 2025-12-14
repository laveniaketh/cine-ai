"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { EffectCoverflow, Controller } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";

interface Movie {
    id: number;
    movietitle: string;
    previewPath: string;
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
    const handleSwiperInit = (swiper: SwiperType) => {
        if (setSwiperInstance) {
            setSwiperInstance(swiper);
        }
    };

    const handleSlideClick = (movie: Movie) => {
        if (onMovieSelect) {
            onMovieSelect(movie);
        }
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
            >
                {movies.map((movie) => (
                    <SwiperSlide
                        key={movie.id}
                        className="w-48! h-72! flex justify-center items-center"
                    >
                        {/* <Link href={`/kiosk/seat-selection/${movie.id}`} className="cursor-pointer"> */}
                        <Link href="/kiosk/seat-selection" className="cursor-pointer">
                            <Image
                                src={movie.previewPath}
                                alt={movie.movietitle}
                                width={192}
                                height={288}
                                className="w-48 h-72 rounded-md object-cover border-4 border-white shadow-md shadow-[#2D2D2F]"
                            />
                        </Link>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default PosterCarousel;
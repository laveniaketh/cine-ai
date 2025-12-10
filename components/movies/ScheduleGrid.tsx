"use client"

import React from 'react'
import Image from 'next/image'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { EditMovie } from './EditMovie'
import { IMovie } from "@/database/movie.model"

interface ScheduleGridProps {
    days: string[]
    timeSlots: string[]
    movies: IMovie[]
    selectedMonth: string
    selectedWeek: string
    selectedMovie: IMovie | null
    moviePoster: string | null
    moviePreview: string | null
    onMovieClick: (movie: IMovie) => void
    onPosterUpload: (e: React.ChangeEvent<HTMLInputElement>, file?: File) => void
    onPreviewUpload: (e: React.ChangeEvent<HTMLInputElement>, file?: File) => void
    onDelete: () => void
    onMovieUpdated?: () => void
    monthlyRanges: Array<{ id: string; label: string; value: string }>
    weeklyDateRanges: Array<{ id: string; label: string; value: string }>
}

export const ScheduleGrid = ({
    days,
    timeSlots,
    movies,
    selectedMonth,
    selectedWeek,
    selectedMovie,
    moviePoster,
    moviePreview,
    onMovieClick,
    onPosterUpload,
    onPreviewUpload,
    onDelete,
    onMovieUpdated,
    monthlyRanges,
    weeklyDateRanges
}: ScheduleGridProps) => {
    // Helper function to calculate grid position
    const getGridPosition = (startTime: string, duration: number) => {
        const [hours, minutes] = startTime.split(":").map(Number)
        const startMinutes = hours * 60 + minutes
        const baseStartMinutes = 12 * 60 // 12:00 PM

        const columnStart = Math.floor((startMinutes - baseStartMinutes) / 60) + 2
        const span = Math.ceil(duration / 60)

        return { columnStart, span }
    }

    // Helper function to convert 24-hour to 12-hour format
    const convertTo12Hour = (time24: string): string => {
        if (!time24 || !time24.includes(':')) return time24

        const [hoursStr, minutesStr] = time24.split(':')
        const hours24 = parseInt(hoursStr)
        const minutes = parseInt(minutesStr)

        if (isNaN(hours24) || isNaN(minutes)) return time24

        const period = hours24 >= 12 ? 'PM' : 'AM'
        let hours12 = hours24 % 12
        if (hours12 === 0) hours12 = 12

        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
    }

    // Get schedule for specific day (all movies repeat Mon-Fri)
    const getScheduleForDay = (day: string) => {
        return movies.filter(movie =>
            movie.month === selectedMonth &&
            movie.week === selectedWeek
        ).map(movie => {
            // Timeslot is stored in 24-hour format (HH:MM) in database
            const [hours, minutes] = movie.timeslot.split(':').map(Number)

            const startMinutes = hours * 60 + minutes
            const endMinutes = startMinutes + movie.duration
            const endHour = Math.floor(endMinutes / 60)
            const endMin = endMinutes % 60

            return {
                ...movie,
                startTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
                endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
                timeslot: convertTo12Hour(movie.timeslot) // Convert to 12-hour format for display
            }
        })
    }

    return (
        <div className="bg-neutral-800 rounded-lg border border-neutral-600 overflow-x-auto">
            <div className="min-w-[1200px]">
                {/* Header Row - Time Slots */}
                <div className="grid grid-cols-[120px_repeat(8,1fr)] border-b border-neutral-600">
                    <div className="p-2 text-white font-semibold border-r border-neutral-600">Day</div>
                    {timeSlots.map((time) => (
                        <div key={time} className="p-4 text-center text-white font-semibold border-r border-neutral-600">
                            {time}
                        </div>
                    ))}
                </div>

                {/* Day Rows */}
                {days.map((day) => (
                    <div key={day} className="border-b border-neutral-600 last:border-b-0">
                        <div className="grid grid-cols-[120px_repeat(8,1fr)] min-h-[120px]">
                            {/* Day Label */}
                            <div className="p-4 text-white font-semibold border-r border-neutral-600 flex items-center">
                                {day.toUpperCase()}
                            </div>

                            {/* Time Grid */}
                            <div className="col-span-8 relative grid grid-cols-8">
                                {/* Grid lines */}
                                {timeSlots.slice(0, -1).map((_, index) => (
                                    <div
                                        key={index}
                                        className=" h-full"
                                    />
                                ))}

                                {/* Movie Schedules */}
                                {getScheduleForDay(day).map((movie, index) => {
                                    const { columnStart, span } = getGridPosition(movie.startTime, movie.duration)
                                    return (
                                        <Dialog key={`${movie.id}-${index}`}>
                                            <DialogTrigger asChild>
                                                <div
                                                    className="absolute bg-neutral-900 border border-neutral-700 rounded-lg p-2 hover:bg-neutral-700 transition-colors cursor-pointer"
                                                    style={{
                                                        left: `${(columnStart - 2) * 12.5}%`,
                                                        width: `${span * 12.5}%`,
                                                        top: '8px',
                                                        bottom: '8px',
                                                    }}
                                                    onClick={() => onMovieClick(movie)}
                                                >
                                                    <div className="flex items-center gap-2 h-full">
                                                        {/* Movie Poster */}
                                                        <div className="relative w-16 h-full rounded overflow-hidden shrink-0">
                                                            <Image
                                                                src={movie.poster}
                                                                alt={movie.movieTitle}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>

                                                        {/* Movie Info */}
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                                <span className="text-xs text-gray-400">
                                                                    {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                                                                </span>
                                                            </div>
                                                            <h3 className="text-white font-semibold text-sm truncate">
                                                                {movie.movieTitle}
                                                            </h3>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {movie.timeslot}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogTrigger>
                                            <EditMovie
                                                selectedMovie={selectedMovie}
                                                moviePoster={moviePoster}
                                                moviePreview={moviePreview}
                                                onPosterUpload={onPosterUpload}
                                                onPreviewUpload={onPreviewUpload}
                                                onDelete={onDelete}
                                                onMovieUpdated={onMovieUpdated}
                                                monthlyRanges={monthlyRanges}
                                                weeklyDateRanges={weeklyDateRanges}
                                                timeSlots={timeSlots}
                                            />
                                        </Dialog>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

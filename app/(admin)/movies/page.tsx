"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from 'lucide-react'
import { AddMovie } from '@/components/movies/AddMovie'
import { ScheduleGrid } from '@/components/movies/ScheduleGrid'
import { IMovie } from "@/database/movie.model"


export const timeSlots = [
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
];

export const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Monthly date ranges
export const monthlyRanges = [
    { id: "january", label: "January", value: "january" },
    { id: "february", label: "February", value: "february" },
    { id: "march", label: "March", value: "march" },
    { id: "april", label: "April", value: "april" },
    { id: "may", label: "May", value: "may" },
    { id: "june", label: "June", value: "june" },
    { id: "july", label: "July", value: "july" },
    { id: "august", label: "August", value: "august" },
    { id: "september", label: "September", value: "september" },
    { id: "october", label: "October", value: "october" },
    { id: "november", label: "November", value: "november" },
    { id: "december", label: "December", value: "december" },
];

// Weekly date ranges
export const weeklyDateRanges = [
    { id: "week1", label: "Week 1", value: "week-1" },
    { id: "week2", label: "Week 2", value: "week-2" },
    { id: "week3", label: "Week 3", value: "week-3" },
    { id: "week4", label: "Week 4", value: "week-4" },
];

const MovieScheduling = () => {
    const [movies, setMovies] = useState<IMovie[]>([])
    const [loading, setLoading] = useState(true)

    // Use function initializer to calculate current month/week only once on client
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const currentMonthIndex = new Date().getMonth() // 0-11
        return monthlyRanges[currentMonthIndex].value
    })

    const [selectedWeek, setSelectedWeek] = useState(() => {
        const currentDay = new Date().getDate()
        const currentWeekNumber = Math.ceil(currentDay / 7) // 1-4 (or 5)
        return weeklyDateRanges[Math.min(currentWeekNumber - 1, 3)].value
    })

    const currentMonthLabel = monthlyRanges.find(m => m.value === selectedMonth)?.label || monthlyRanges[0].label
    const currentWeekLabel = weeklyDateRanges.find(w => w.value === selectedWeek)?.label || weeklyDateRanges[0].label

    // Dialog form states
    const [moviePoster, setMoviePoster] = useState<string | null>(null)
    const [moviePreview, setMoviePreview] = useState<string | null>(null)
    const [selectedMovie, setSelectedMovie] = useState<IMovie | null>(null)

    // Fetch movies from API
    const fetchMovies = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/movies')
            const data = await response.json()
            if (data.movies) {
                setMovies(data.movies)
            }
        } catch (error) {
            console.error('Failed to fetch movies:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMovies()
    }, [])

    const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>, file?: File) => {
        const uploadFile = file || e.target.files?.[0]
        if (uploadFile) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setMoviePoster(reader.result as string)
            }
            reader.readAsDataURL(uploadFile)
        }
    }

    const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>, file?: File) => {
        const uploadFile = file || e.target.files?.[0]
        if (uploadFile) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setMoviePreview(reader.result as string)
            }
            reader.readAsDataURL(uploadFile)
        }
    }

    const handleMovieClick = (movie: IMovie) => {
        setSelectedMovie(movie)
        setMoviePoster(movie.poster)
        setMoviePreview(movie.preview)
    }

    const handleDeleteMovie = async () => {
        if (!selectedMovie) return

        const confirmed = window.confirm(`Are you sure you want to delete "${selectedMovie.movieTitle}"?`)
        if (!confirmed) return

        try {
            const response = await fetch(`/api/movies/${selectedMovie.slug}`, {
                method: 'DELETE'
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete movie')
            }

            // Refresh movies list after successful deletion
            await fetchMovies()
            setSelectedMovie(null)
            setMoviePoster(null)
            setMoviePreview(null)
        } catch (error) {
            console.error('Delete failed:', error)
            alert(error instanceof Error ? error.message : 'Failed to delete movie')
        }
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Movie Scheduling</h1>
                    <p className="text-gray-400">{currentMonthLabel} - {currentWeekLabel}</p>
                </div>

                <div className="flex gap-3">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-48 bg-neutral-800 border-neutral-700 text-white">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                            {monthlyRanges.map((month) => (
                                <SelectItem key={month.id} value={month.value} className="text-white hover:bg-neutral-700">
                                    {month.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                        <SelectTrigger className="w-48 bg-neutral-800 border-neutral-700 text-white">
                            <SelectValue placeholder="Select week" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                            {weeklyDateRanges.map((week) => (
                                <SelectItem key={week.id} value={week.value} className="text-white hover:bg-neutral-700">
                                    {week.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <AddMovie
                        monthlyRanges={monthlyRanges}
                        weeklyDateRanges={weeklyDateRanges}
                        timeSlots={timeSlots}
                        onMovieAdded={fetchMovies}
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-neutral-800 rounded-lg border border-neutral-600 overflow-hidden">
                    <div className="min-w-[1200px]">
                        {/* Header Row Skeleton */}
                        <div className="grid grid-cols-[120px_repeat(8,1fr)] border-b border-neutral-600">
                            <div className="p-2 border-r border-neutral-600">
                                <div className="h-6 bg-neutral-700 rounded animate-pulse"></div>
                            </div>
                            {timeSlots.map((_, index) => (
                                <div key={index} className="p-4 border-r border-neutral-600">
                                    <div className="h-6 bg-neutral-700 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>

                        {/* Day Rows Skeleton */}
                        {days.map((_, dayIndex) => (
                            <div key={dayIndex} className="border-b border-neutral-600 last:border-b-0">
                                <div className="grid grid-cols-[120px_repeat(8,1fr)] min-h-[120px]">
                                    <div className="p-4 border-r border-neutral-600 flex items-center">
                                        <div className="h-6 w-16 bg-neutral-700 rounded animate-pulse"></div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <ScheduleGrid
                    days={days}
                    timeSlots={timeSlots}
                    movies={movies}
                    selectedMonth={selectedMonth}
                    selectedWeek={selectedWeek}
                    selectedMovie={selectedMovie}
                    moviePoster={moviePoster}
                    moviePreview={moviePreview}
                    onMovieClick={handleMovieClick}
                    onPosterUpload={handlePosterUpload}
                    onPreviewUpload={handlePreviewUpload}
                    onDelete={handleDeleteMovie}
                    onMovieUpdated={fetchMovies}
                    monthlyRanges={monthlyRanges}
                    weeklyDateRanges={weeklyDateRanges}
                />
            )}
        </div>
    )
}

export default MovieScheduling

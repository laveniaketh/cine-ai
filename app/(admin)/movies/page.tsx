"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from 'lucide-react'

// add movie diaolog 
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload } from 'lucide-react'

// Mock movie schedule data
const movieSchedules = [
    {
        id: 1,
        title: "Oppenheimer",
        poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
        duration: 180, // in minutes
        schedules: [
            { day: "Mon", startTime: "12:00", endTime: "15:00" },
            { day: "Wed", startTime: "13:00", endTime: "16:00" },
        ]
    },
    {
        id: 2,
        title: "Angels & Demons",
        poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
        duration: 138,
        schedules: [
            { day: "Mon", startTime: "14:00", endTime: "16:18" },
            { day: "Thu", startTime: "14:00", endTime: "16:18" },
        ]
    },
    {
        id: 3,
        title: "The Menu",
        poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
        duration: 107,
        schedules: [
            { day: "Tue", startTime: "12:47", endTime: "14:34" },
            { day: "Thu", startTime: "16:00", endTime: "17:47" },
        ]
    },
]

const timeSlots = [
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"
]

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]

// Monthly date ranges
const monthlyRanges = [
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
]

// Weekly date ranges
const weeklyDateRanges = [
    { id: "week1", label: "Week 1", value: "week-1" },
    { id: "week2", label: "Week 2", value: "week-2" },
    { id: "week3", label: "Week 3", value: "week-3" },
    { id: "week4", label: "Week 4", value: "week-4" },
]

const MovieScheduling = () => {
    // Get current month and week
    const currentDate = new Date()
    const currentMonthIndex = currentDate.getMonth() // 0-11
    const currentDay = currentDate.getDate()
    const currentWeekNumber = Math.ceil(currentDay / 7) // 1-4 (or 5)

    const [selectedMonth, setSelectedMonth] = useState(monthlyRanges[currentMonthIndex].value)
    const [selectedWeek, setSelectedWeek] = useState(weeklyDateRanges[Math.min(currentWeekNumber - 1, 3)].value)
    const currentMonthLabel = monthlyRanges.find(m => m.value === selectedMonth)?.label || monthlyRanges[0].label
    const currentWeekLabel = weeklyDateRanges.find(w => w.value === selectedWeek)?.label || weeklyDateRanges[0].label

    // Dialog form states
    const [moviePoster, setMoviePoster] = useState<string | null>(null)
    const [moviePreview, setMoviePreview] = useState<string | null>(null)
    const [selectedMovie, setSelectedMovie] = useState<any>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setMoviePoster(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setMoviePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleMovieClick = (movie: any) => {
        setSelectedMovie(movie)
        setMoviePoster(movie.poster)
        setMoviePreview(null) // Would need to store preview in movie data
        setIsEditDialogOpen(true)
    }

    const handleDeleteMovie = () => {
        // Handle movie deletion logic here
        console.log('Delete movie:', selectedMovie)
        setIsEditDialogOpen(false)
    }

    // Helper function to calculate grid position
    const getGridPosition = (startTime: string, duration: number) => {
        const [hours, minutes] = startTime.split(":").map(Number)
        const startMinutes = hours * 60 + minutes
        const baseStartMinutes = 12 * 60 // 12:00 PM

        const columnStart = Math.floor((startMinutes - baseStartMinutes) / 60) + 2
        const span = Math.ceil(duration / 60)

        return { columnStart, span }
    }

    // Get schedule for specific day
    const getScheduleForDay = (day: string) => {
        const daySchedules: any[] = []
        movieSchedules.forEach(movie => {
            movie.schedules.forEach(schedule => {
                if (schedule.day === day) {
                    daySchedules.push({
                        ...movie,
                        startTime: schedule.startTime,
                        endTime: schedule.endTime
                    })
                }
            })
        })
        return daySchedules
    }

    return (
        <div className="p-6 space-y-6">
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
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="default">Add Movie</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[50vw] overflow-y-auto bg-neutral-900 border-neutral-700">
                            <DialogHeader>
                                <DialogTitle className="text-white">Add New Movie</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                    Fill in the movie details to add it to the schedule.
                                </DialogDescription>
                            </DialogHeader>
                            <form>
                                <div className="space-y-6">
                                    {/* Movie Preview Upload - Top */}
                                    <div className="space-y-2">
                                        <Label className="text-white">Movie Preview</Label>
                                        <div
                                            className="border-2 border-dashed border-neutral-700 rounded-lg h-[240px] flex flex-col items-center justify-center cursor-pointer hover:border-neutral-600 transition-colors bg-neutral-800 relative overflow-hidden"
                                            onClick={() => document.getElementById('preview-upload')?.click()}
                                        >
                                            {moviePreview ? (
                                                <video
                                                    src={moviePreview}
                                                    className="w-full h-full object-contain"
                                                    controls
                                                />
                                            ) : (
                                                <>
                                                    <Upload className="w-10 h-10 text-gray-500 mb-2" />
                                                    <p className="text-sm text-gray-500">Click to upload a preview of the movie</p>
                                                </>
                                            )}
                                            <Input
                                                id="preview-upload"
                                                type="file"
                                                accept="video/*"
                                                className="hidden"
                                                onChange={handlePreviewUpload}
                                            />
                                        </div>
                                    </div>

                                    {/* Bottom Row: Movie Poster, Movie Details, Movie Description */}
                                    <div className="grid grid-cols-[200px_1fr_1fr] gap-6">
                                        {/* Movie Poster Upload */}
                                        <div className="space-y-2">
                                            <Label className="text-white">Movie Poster</Label>
                                            <div
                                                className="border-2 border-dashed border-neutral-700 rounded-lg aspect-[2/3] flex flex-col items-center justify-center cursor-pointer hover:border-neutral-600 transition-colors bg-neutral-800 relative overflow-hidden"
                                                onClick={() => document.getElementById('poster-upload')?.click()}
                                            >
                                                {moviePoster ? (
                                                    <Image
                                                        src={moviePoster}
                                                        alt="Movie poster"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                                                        <p className="text-sm text-gray-500 text-center px-4">Click to upload movie poster</p>
                                                    </>
                                                )}
                                                <Input
                                                    id="poster-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handlePosterUpload}
                                                />
                                            </div>
                                        </div>

                                        {/* Movie Details */}
                                        <div className="space-y-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="movie-title" className="text-white">Movie Title</Label>
                                                <Input
                                                    id="movie-title"
                                                    // placeholder="Movie Title"
                                                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="date-released" className="text-white">Date Released (e.g 2003)</Label>
                                                <Input
                                                    id="date-released"
                                                    // placeholder="2003"
                                                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="directed-by" className="text-white">Directed By</Label>
                                                <Input
                                                    id="directed-by"
                                                    // placeholder="Directed By"
                                                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="month" className="text-white">Month</Label>
                                                    <Select>
                                                        <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
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
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="week" className="text-white">Week</Label>
                                                    <Select>
                                                        <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
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
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="timeslot" className="text-white">Timeslot</Label>
                                                <Select>
                                                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                                        <SelectValue placeholder="Timeslot" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-800 border-neutral-700">
                                                        {timeSlots.map((time) => (
                                                            <SelectItem key={time} value={time} className="text-white hover:bg-neutral-700">
                                                                {time}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>


                                        {/* Movie Description */}
                                        <div className="space-y-2">
                                            <Label className="text-white">Movie Description</Label>
                                            <Textarea
                                                placeholder="Brief summary of the movie"
                                                className="h-[calc(100%-2rem)] bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="mt-6">
                                    <DialogClose asChild>
                                        <Button variant="outline" className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" className="bg-white text-black hover:bg-gray-200">
                                        Add Movie
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Schedule Grid */}
            <div className="bg-neutral-800 rounded-lg border border-neutral-600 overflow-x-auto">
                <div className="min-w-[1200px]">
                    {/* Header Row - Time Slots */}
                    <div className="grid grid-cols-[120px_repeat(8,1fr)] border-b border-neutral-600">
                        <div className="p-4 text-white font-semibold border-r border-neutral-600">Day</div>
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
                                            <div
                                                key={`${movie.id}-${index}`}
                                                className="absolute bg-neutral-900 border border-neutral-700 rounded-lg p-2 hover:bg-neutral-700 transition-colors cursor-pointer"
                                                style={{
                                                    left: `${(columnStart - 2) * 12.5}%`,
                                                    width: `${span * 12.5}%`,
                                                    top: '8px',
                                                    bottom: '8px',
                                                }}
                                                onClick={() => handleMovieClick(movie)}
                                            >
                                                <div className="flex items-center gap-2 h-full">
                                                    {/* Movie Poster */}
                                                    <div className="relative w-16 h-full rounded overflow-hidden shrink-0">
                                                        <Image
                                                            src={movie.poster}
                                                            alt={movie.title}
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
                                                            {movie.title}
                                                        </h3>
                                                        <p className="text-xs text-gray-400 truncate">
                                                            {movie.startTime} - {movie.endTime}
                                                        </p>

                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Movie Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-[50vw] overflow-y-auto bg-neutral-900 border-neutral-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit Movie</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Update the movie details or delete the movie from the schedule.
                        </DialogDescription>
                    </DialogHeader>
                    <form>
                        <div className="space-y-6">
                            {/* Movie Preview Upload - Top */}
                            <div className="space-y-2">
                                <Label className="text-white">Movie Preview</Label>
                                <div
                                    className="border-2 border-dashed border-neutral-700 rounded-lg h-[240px] flex flex-col items-center justify-center cursor-pointer hover:border-neutral-600 transition-colors bg-neutral-800 relative overflow-hidden"
                                    onClick={() => document.getElementById('edit-preview-upload')?.click()}
                                >
                                    {moviePreview ? (
                                        <video
                                            src={moviePreview}
                                            className="w-full h-full object-contain"
                                            controls
                                        />
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-gray-500 mb-2" />
                                            <p className="text-sm text-gray-500">Click to upload a preview of the movie</p>
                                        </>
                                    )}
                                    <Input
                                        id="edit-preview-upload"
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={handlePreviewUpload}
                                    />
                                </div>
                            </div>

                            {/* Bottom Row: Movie Poster, Movie Details, Movie Description */}
                            <div className="grid grid-cols-[200px_1fr_1fr] gap-6">
                                {/* Movie Poster Upload */}
                                <div className="space-y-2">
                                    <Label className="text-white">Movie Poster</Label>
                                    <div
                                        className="border-2 border-dashed border-neutral-700 rounded-lg aspect-[2/3] flex flex-col items-center justify-center cursor-pointer hover:border-neutral-600 transition-colors bg-neutral-800 relative overflow-hidden"
                                        onClick={() => document.getElementById('edit-poster-upload')?.click()}
                                    >
                                        {moviePoster ? (
                                            <Image
                                                src={moviePoster}
                                                alt="Movie poster"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-500 mb-2" />
                                                <p className="text-sm text-gray-500 text-center px-4">Click to upload movie poster</p>
                                            </>
                                        )}
                                        <Input
                                            id="edit-poster-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePosterUpload}
                                        />
                                    </div>
                                </div>

                                {/* Movie Details */}
                                <div className="space-y-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-movie-title" className="text-white">Movie Title</Label>
                                        <Input
                                            id="edit-movie-title"
                                            defaultValue={selectedMovie?.title}
                                            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-date-released" className="text-white">Date Released (e.g 2003)</Label>
                                        <Input
                                            id="edit-date-released"
                                            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-directed-by" className="text-white">Directed By</Label>
                                        <Input
                                            id="edit-directed-by"
                                            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-month" className="text-white">Month</Label>
                                            <Select>
                                                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
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
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-week" className="text-white">Week</Label>
                                            <Select>
                                                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
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
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-timeslot" className="text-white">Timeslot</Label>
                                        <Select>
                                            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                                <SelectValue placeholder="Timeslot" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-800 border-neutral-700">
                                                {timeSlots.map((time) => (
                                                    <SelectItem key={time} value={time} className="text-white hover:bg-neutral-700">
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Movie Description */}
                                <div className="space-y-2">
                                    <Label className="text-white">Movie Description</Label>
                                    <Textarea
                                        placeholder="Brief summary of the movie"
                                        className="h-[calc(100%-2rem)] bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6 flex justify-between">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteMovie}
                                className="mr-auto"
                            >
                                Delete Movie
                            </Button>
                            <div className="flex gap-2">
                                <DialogClose asChild>
                                    <Button variant="outline" className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" className="bg-white text-black hover:bg-gray-200">
                                    Save Changes
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    )
}

export default MovieScheduling

"use client"

import React, { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload } from 'lucide-react'

interface EditMovieProps {
    selectedMovie: any
    moviePoster: string | null
    moviePreview: string | null
    onPosterUpload: (e: React.ChangeEvent<HTMLInputElement>, file: File) => void
    onPreviewUpload: (e: React.ChangeEvent<HTMLInputElement>, file: File) => void
    onDelete: () => void
    onMovieUpdated?: () => void
    monthlyRanges: Array<{ id: string; label: string; value: string }>
    weeklyDateRanges: Array<{ id: string; label: string; value: string }>
    timeSlots: string[]
}

export const EditMovie = ({
    selectedMovie,
    moviePoster,
    moviePreview,
    onPosterUpload,
    onPreviewUpload,
    onDelete,
    onMovieUpdated,
    monthlyRanges,
    weeklyDateRanges,
    timeSlots
}: EditMovieProps) => {
    // Convert 24-hour format (HH:MM) to 12-hour format (HH:MM AM/PM)
    const convertTo12Hour = (time24: string): string => {
        if (!time24 || !time24.includes(':')) return ''

        // If already in 12-hour format (contains AM/PM), return as is
        if (time24.includes('AM') || time24.includes('PM')) {
            return time24
        }

        const [hoursStr, minutesStr] = time24.split(':')
        const hours24 = parseInt(hoursStr)
        const minutes = parseInt(minutesStr)

        if (isNaN(hours24) || isNaN(minutes)) return ''

        const period = hours24 >= 12 ? 'PM' : 'AM'
        let hours12 = hours24 % 12
        if (hours12 === 0) hours12 = 12

        // Don't pad hours, only pad minutes to match timeSlots format (e.g., "2:00 PM" not "02:00 PM")
        return `${hours12}:${minutesStr.padStart(2, '0')} ${period}`
    }

    // Get the 12-hour format timeslot for the select component
    const timeslot12hr = useMemo(() => {
        return selectedMovie?.timeslot ? convertTo12Hour(selectedMovie.timeslot) : ''
    }, [selectedMovie?.timeslot])

    // State for tracking form changes
    const [hasChanges, setHasChanges] = useState(false)
    const [formValues, setFormValues] = useState({
        movieTitle: '',
        releasedYear: '',
        director: '',
        duration: '',
        month: '',
        week: '',
        timeslot: '',
        summary: ''
    })

    // Initialize form values when selectedMovie changes
    useEffect(() => {
        if (selectedMovie) {
            console.log('🔍 Debug - DB timeslot:', selectedMovie.timeslot)
            console.log('🔍 Debug - Converted:', timeslot12hr)
            console.log('🔍 Debug - Available slots:', timeSlots)

            setFormValues({
                movieTitle: selectedMovie.movieTitle || '',
                releasedYear: selectedMovie.releasedYear?.toString() || '',
                director: selectedMovie.director || '',
                duration: selectedMovie.duration?.toString() || '',
                month: selectedMovie.month || '',
                week: selectedMovie.week || '',
                timeslot: timeslot12hr,
                summary: selectedMovie.summary || ''
            })
            setHasChanges(false)
        }
    }, [selectedMovie, timeslot12hr, timeSlots])

    // Check if form has changes (including image uploads)
    useEffect(() => {
        if (!selectedMovie) return

        const hasImageChanges =
            (moviePoster && moviePoster !== selectedMovie.poster) ||
            (moviePreview && moviePreview !== selectedMovie.preview)

        const hasFieldChanges =
            formValues.movieTitle !== (selectedMovie.movieTitle || '') ||
            formValues.releasedYear !== (selectedMovie.releasedYear?.toString() || '') ||
            formValues.director !== (selectedMovie.director || '') ||
            formValues.duration !== (selectedMovie.duration?.toString() || '') ||
            formValues.month !== (selectedMovie.month || '') ||
            formValues.week !== (selectedMovie.week || '') ||
            formValues.timeslot !== timeslot12hr ||
            formValues.summary !== (selectedMovie.summary || '')

        setHasChanges(hasImageChanges || hasFieldChanges)
    }, [formValues, selectedMovie, moviePoster, moviePreview, timeslot12hr])

    const handleFieldChange = (field: string, value: string) => {
        setFormValues(prev => ({ ...prev, [field]: value }))
    }

    // State for file uploads and submission
    const [posterFile, setPosterFile] = useState<File | null>(null)
    const [previewFile, setPreviewFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Handle poster upload with file storage
    const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPosterFile(file)
            onPosterUpload(e, file)
        }
    }

    // Handle preview upload with file storage
    const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPreviewFile(file)
            onPreviewUpload(e, file)
        }
    }

    // Convert 12-hour format to 24-hour format for database
    const convertTo24Hour = (time12: string): string => {
        if (!time12 || !time12.includes(':')) return time12

        // If already in 24-hour format (no AM/PM), return as is
        if (!time12.includes('AM') && !time12.includes('PM')) {
            return time12
        }

        const [time, period] = time12.split(' ')
        const [hoursStr, minutesStr] = time.split(':')
        let hours = parseInt(hoursStr)

        if (period === 'PM' && hours !== 12) {
            hours += 12
        } else if (period === 'AM' && hours === 12) {
            hours = 0
        }

        return `${hours.toString().padStart(2, '0')}:${minutesStr}`
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMovie || !hasChanges) return

        setError(null)
        setLoading(true)

        try {
            const formData = new FormData()

            // Add text fields
            formData.append('movieTitle', formValues.movieTitle)
            formData.append('director', formValues.director)
            formData.append('releasedYear', formValues.releasedYear)
            formData.append('duration', formValues.duration)
            formData.append('summary', formValues.summary)
            formData.append('month', formValues.month)
            formData.append('week', formValues.week)
            formData.append('timeslot', convertTo24Hour(formValues.timeslot))

            // Add files if they were uploaded
            if (posterFile) {
                formData.append('poster', posterFile)
            }
            if (previewFile) {
                formData.append('preview', previewFile)
            }

            // Send PUT request
            const response = await fetch(`/api/movies/${selectedMovie.slug}`, {
                method: 'PUT',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update movie')
            }

            // Refresh the movie list
            if (onMovieUpdated) {
                onMovieUpdated()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update movie')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <DialogContent className="max-w-[50vw] overflow-y-auto bg-neutral-900 border-neutral-700">
                <DialogHeader>
                    <DialogTitle className="text-white">Edit Movie</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Update the movie details or delete the movie from the schedule.
                    </DialogDescription>
                </DialogHeader>
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Top Row: Movie Preview and Movie Description */}
                        <div className="flex gap-6">
                            {/* Movie Preview Upload */}
                            <div className="space-y-2 flex-1">
                                <Label className="text-white">Movie Preview</Label>
                                <div
                                    className="border-2 border-dashed border-neutral-700 rounded-lg h-[240px] flex flex-col items-center justify-center cursor-pointer hover:border-neutral-600 transition-colors bg-neutral-800 relative overflow-hidden"
                                    onClick={() => document.getElementById('edit-preview-upload')?.click()}
                                >
                                    {(moviePreview || selectedMovie?.preview) ? (
                                        <Image
                                            src={moviePreview || selectedMovie?.preview}
                                            alt="Movie preview"
                                            fill
                                            className="object-cover"
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
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePreviewUpload}
                                    />
                                </div>
                            </div>

                            {/* Movie Description */}
                            <div className="space-y-2 flex-1">
                                <Label className="text-white">Movie Description</Label>
                                <Textarea
                                    placeholder="Brief summary of the movie"
                                    value={formValues.summary}
                                    onChange={(e) => handleFieldChange('summary', e.target.value)}
                                    className="h-[240px] bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500 resize-none"
                                />
                            </div>
                        </div>

                        {/* Bottom Row: Movie Poster, Movie Details, and Schedule */}
                        <div className="grid grid-cols-[200px_1fr_1fr] gap-6">
                            {/* Movie Poster Upload */}
                            <div className="space-y-2">
                                <Label className="text-white">Movie Poster</Label>
                                <div
                                    className="border-2 border-dashed border-neutral-700 rounded-lg aspect-[2/3] flex flex-col items-center justify-center cursor-pointer hover:border-neutral-600 transition-colors bg-neutral-800 relative overflow-hidden"
                                    onClick={() => document.getElementById('edit-poster-upload')?.click()}
                                >
                                    {(moviePoster || selectedMovie?.poster) ? (
                                        <Image
                                            src={moviePoster || selectedMovie?.poster}
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
                                        value={formValues.movieTitle}
                                        onChange={(e) => handleFieldChange('movieTitle', e.target.value)}
                                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-date-released" className="text-white">Date Released (e.g 2003)</Label>
                                    <Input
                                        id="edit-date-released"
                                        type="number"
                                        value={formValues.releasedYear}
                                        onChange={(e) => handleFieldChange('releasedYear', e.target.value)}
                                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-directed-by" className="text-white">Directed By</Label>
                                    <Input
                                        id="edit-directed-by"
                                        value={formValues.director}
                                        onChange={(e) => handleFieldChange('director', e.target.value)}
                                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-duration" className="text-white">Duration (minutes)</Label>
                                    <Input
                                        id="edit-duration"
                                        type="number"
                                        value={formValues.duration}
                                        onChange={(e) => handleFieldChange('duration', e.target.value)}
                                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                    />
                                </div>
                            </div>

                            {/* Schedule Details */}
                            <div className="space-y-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-month" className="text-white">Month</Label>
                                    <Select value={formValues.month} onValueChange={(value) => handleFieldChange('month', value)}>
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
                                    <Select value={formValues.week} onValueChange={(value) => handleFieldChange('week', value)}>
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
                                <div className="space-y-2">
                                    <Label htmlFor="edit-timeslot" className="text-white">Timeslot</Label>
                                    <Select value={formValues.timeslot || undefined} onValueChange={(value) => handleFieldChange('timeslot', value)}>
                                        <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                            <SelectValue placeholder="Select timeslot" />
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
                        </div>
                    </div>

                    <DialogFooter className="mt-6 flex justify-between">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onDelete}
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
                            <Button
                                type="submit"
                                className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!hasChanges || loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </>
    )
}

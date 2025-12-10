"use client"

import React, { useState } from 'react'
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
    DialogTrigger,
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

interface AddMovieProps {
    monthlyRanges: Array<{ id: string; label: string; value: string }>
    weeklyDateRanges: Array<{ id: string; label: string; value: string }>
    timeSlots: string[]
    onMovieAdded?: () => void
}

export const AddMovie = ({ monthlyRanges, weeklyDateRanges, timeSlots, onMovieAdded }: AddMovieProps) => {
    const [moviePoster, setMoviePoster] = useState<string | null>(null)
    const [moviePreview, setMoviePreview] = useState<string | null>(null)
    const [posterFile, setPosterFile] = useState<File | null>(null)
    const [previewFile, setPreviewFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [open, setOpen] = useState(false)

    // Form field states
    const [movieTitle, setMovieTitle] = useState('')
    const [releasedYear, setReleasedYear] = useState('')
    const [director, setDirector] = useState('')
    const [duration, setDuration] = useState('')
    const [month, setMonth] = useState('')
    const [week, setWeek] = useState('')
    const [timeslot, setTimeslot] = useState('')
    const [summary, setSummary] = useState('')

    const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPosterFile(file)
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
            setPreviewFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setMoviePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // Validate required fields
            if (!movieTitle || !director || !releasedYear || !duration || !summary || !month || !week || !timeslot) {
                throw new Error('Please fill in all required fields')
            }

            if (!posterFile || !previewFile) {
                throw new Error('Please upload both poster and preview images')
            }

            // Create FormData
            const formData = new FormData()
            formData.append('movieTitle', movieTitle)
            formData.append('director', director)
            formData.append('releasedYear', releasedYear)
            formData.append('duration', duration)
            formData.append('summary', summary)
            formData.append('month', month)
            formData.append('week', week)
            formData.append('timeslot', timeslot)
            formData.append('poster', posterFile)
            formData.append('preview', previewFile)

            // Send POST request
            const response = await fetch('/api/movies', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add movie')
            }

            // Reset form on success
            setMovieTitle('')
            setDirector('')
            setReleasedYear('')
            setDuration('')
            setSummary('')
            setMonth('')
            setWeek('')
            setTimeslot('')
            setMoviePoster(null)
            setMoviePreview(null)
            setPosterFile(null)
            setPreviewFile(null)
            setOpen(false)

            // Refresh the movie list
            if (onMovieAdded) {
                onMovieAdded()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add movie')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                                    onClick={() => document.getElementById('preview-upload')?.click()}
                                >
                                    {moviePreview ? (
                                        <Image
                                            src={moviePreview}
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
                                        id="preview-upload"
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
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    className="h-[240px] bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500 resize-none"
                                    required
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
                                        value={movieTitle}
                                        onChange={(e) => setMovieTitle(e.target.value)}
                                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date-released" className="text-white">Date Released (e.g 2003)</Label>
                                    <Input
                                        id="date-released"
                                        type="number"
                                        value={releasedYear}
                                        onChange={(e) => setReleasedYear(e.target.value)}
                                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="directed-by" className="text-white">Directed By</Label>
                                    <Input
                                        id="directed-by"
                                        value={director}
                                        onChange={(e) => setDirector(e.target.value)}
                                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Schedule Details */}
                            <div className="space-y-2">
                                <div className="space-y-2">
                                    <Label htmlFor="month" className="text-white">Month</Label>
                                    <Select value={month} onValueChange={setMonth}>
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
                                    <Select value={week} onValueChange={setWeek}>
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
                                    <Label htmlFor="timeslot" className="text-white">Timeslot</Label>
                                    <Select value={timeslot} onValueChange={setTimeslot}>
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
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            className="bg-white text-black hover:bg-gray-200"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Movie'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

import { Schema, model, models, Document } from "mongoose";

// TypeScript interface for Movie document
export interface IMovie extends Document {
  movieTitle: string;
  slug: string;
  director: string;
  releasedYear: number;
  duration: number;
  summary: string;
  poster: string;
  preview: string;
  timeslot: string;
  month: string;
  week: string;
  createdAt: Date;
  updatedAt: Date;
}

const MovieSchema = new Schema<IMovie>(
  {
    movieTitle: {
      type: String,
      required: [true, "Movie title is required"],
      trim: true,
      maxlength: [150, "Movie title cannot exceed 150 characters"],
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
    },
    director: {
      type: String,
      required: [true, "Director is required"],
      trim: true,
      maxlength: [100, "Director name cannot exceed 100 characters"],
    },
    releasedYear: {
      type: Number,
      required: [true, "Released year is required"],
      min: [1888, "Year must be 1888 or later"],
      max: [
        new Date().getFullYear() + 5,
        "Year cannot be more than 5 years in the future",
      ],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
      max: [600, "Duration cannot exceed 600 minutes"],
    },
    summary: {
      type: String,
      required: [true, "Summary is required"],
      trim: true,
      maxlength: [2000, "Summary cannot exceed 2000 characters"],
    },
    poster: {
      type: String,
      required: [true, "Poster URL is required"],
      trim: true,
    },
    preview: {
      type: String,
      required: [true, "Preview URL is required"],
      trim: true,
    },
    timeslot: {
      type: String,
      required: [true, "Timeslot is required"],
      trim: true,
    },
    month: {
      type: String,
      required: [true, "Month is required"],
      trim: true,
      lowercase: true,
    },
    week: {
      type: String,
      required: [true, "Week is required"],
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Pre-save hook for slug generation and data normalization
MovieSchema.pre("save", function (next) {
  const movie = this as IMovie;

  // Generate slug only if movieTitle changed or document is new
  if (movie.isModified("movieTitle") || movie.isNew) {
    movie.slug = generateSlug(movie.movieTitle);
  }

  // Normalize timeslot format (HH:MM)
  if (movie.isModified("timeslot")) {
    movie.timeslot = normalizeTime(movie.timeslot);
  }

  // next();
});

// Helper function to generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

// Helper function to normalize time format
function normalizeTime(timeString: string): string {
  // Handle various time formats and convert to HH:MM (24-hour format)
  const timeRegex = /^(\d{1,2}):(\d{2})(\s*(AM|PM))?$/i;
  const match = timeString.trim().match(timeRegex);

  if (!match) {
    throw new Error("Invalid time format. Use HH:MM or HH:MM AM/PM");
  }

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[4]?.toUpperCase();

  if (period) {
    // Convert 12-hour to 24-hour format
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  }

  if (
    hours < 0 ||
    hours > 23 ||
    parseInt(minutes) < 0 ||
    parseInt(minutes) > 59
  ) {
    throw new Error("Invalid time values");
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Create unique index on slug for better performance
MovieSchema.index({ slug: 1 }, { unique: true });

// Create compound index for common queries
MovieSchema.index({ month: 1, week: 1, timeslot: 1 });

const Movie = models.Movie || model<IMovie>("Movie", MovieSchema);

export default Movie;

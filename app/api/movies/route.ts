import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import connectDB from "@/lib/mongodb";
import Movie from "@/database/movie.model";
import { v2 as cloudinary } from "cloudinary";
import { sanitizeString, validateImageUpload } from "@/lib/sanitize";

// Cached function to fetch movies
const getCachedMovies = unstable_cache(
  async () => {
    await connectDB();
    const movies = await Movie.find().sort({ createdAt: -1 });
    return movies;
  },
  ["movies-list"], // Cache key
  {
    revalidate: 300, // Revalidate every 5 minutes (300 seconds)
    tags: ["movies"], // Tag for on-demand revalidation
  },
);

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    let movie: any = {};

    // Extract and sanitize text fields
    movie.movieTitle = sanitizeString(formData.get("movieTitle"));
    movie.director = sanitizeString(formData.get("director"));
    const releasedYearStr = sanitizeString(formData.get("releasedYear"));
    const durationStr = sanitizeString(formData.get("duration"));
    movie.releasedYear = releasedYearStr ? parseInt(releasedYearStr) : NaN;
    movie.duration = durationStr ? parseInt(durationStr) : NaN;
    movie.summary = sanitizeString(formData.get("summary"));
    movie.timeslot = sanitizeString(formData.get("timeslot"));
    movie.month = sanitizeString(formData.get("month"));
    movie.week = sanitizeString(formData.get("week"));

    // Validate required fields
    if (
      !movie.movieTitle ||
      !movie.director ||
      isNaN(movie.releasedYear) ||
      isNaN(movie.duration) ||
      !movie.summary
    ) {
      return NextResponse.json(
        { message: "Required fields are missing" },
        { status: 400 },
      );
    }

    // Handle poster upload with validation
    const posterFile = formData.get("poster") as File;
    if (!posterFile) {
      return NextResponse.json(
        { message: "Poster image is required" },
        { status: 400 },
      );
    }

    const posterValidation = await validateImageUpload(posterFile);
    if (!posterValidation.valid) {
      return NextResponse.json(
        { message: `Poster: ${posterValidation.error}` },
        { status: 400 },
      );
    }

    const posterBuffer = Buffer.from(await posterFile.arrayBuffer());
    const posterUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "movies/posters" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(posterBuffer);
    });

    movie.poster = (posterUpload as { secure_url: string }).secure_url;

    // Handle preview upload with validation
    const previewFile = formData.get("preview") as File;
    if (!previewFile) {
      return NextResponse.json(
        { message: "Preview image is required" },
        { status: 400 },
      );
    }

    const previewValidation = await validateImageUpload(previewFile);
    if (!previewValidation.valid) {
      return NextResponse.json(
        { message: `Preview: ${previewValidation.error}` },
        { status: 400 },
      );
    }

    const previewBuffer = Buffer.from(await previewFile.arrayBuffer());
    const previewUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "movies/previews" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(previewBuffer);
    });

    movie.preview = (previewUpload as { secure_url: string }).secure_url;

    const createdMovie = await Movie.create(movie);

    // Revalidate movies cache after creating a new movie
    revalidateTag("movies");

    return NextResponse.json(
      { message: "Movie created successfully", movie: createdMovie },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Movie creation failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // Use cached function to fetch movies
    const movies = await getCachedMovies();

    return NextResponse.json(
      { message: "Movies fetched successfully", movies },
      {
        status: 200,
        headers: {
          // Cache for 5 minutes on CDN, serve stale for up to 10 minutes while revalidating
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Movies fetch failed", error: e },
      { status: 500 },
    );
  }
}

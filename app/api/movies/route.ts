import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Movie from "@/database/movie.model";
import { v2 as cloudinary } from "cloudinary";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    let movie: any = {};

    // Extract text fields
    movie.movieTitle = formData.get("movieTitle") as string;
    movie.director = formData.get("director") as string;
    movie.releasedYear = parseInt(formData.get("releasedYear") as string);
    movie.duration = parseInt(formData.get("duration") as string);
    movie.summary = formData.get("summary") as string;
    movie.timeslot = formData.get("timeslot") as string;
    movie.month = formData.get("month") as string;
    movie.week = formData.get("week") as string;

    // Validate required fields
    if (
      !movie.movieTitle ||
      !movie.director ||
      !movie.releasedYear ||
      !movie.duration ||
      !movie.summary
    ) {
      return NextResponse.json(
        { message: "Required fields are missing" },
        { status: 400 }
      );
    }

    // Handle poster upload
    const posterFile = formData.get("poster") as File;
    if (!posterFile) {
      return NextResponse.json(
        { message: "Poster image is required" },
        { status: 400 }
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
          }
        )
        .end(posterBuffer);
    });

    movie.poster = (posterUpload as { secure_url: string }).secure_url;

    // Handle preview upload
    const previewFile = formData.get("preview") as File;
    if (!previewFile) {
      return NextResponse.json(
        { message: "Preview image is required" },
        { status: 400 }
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
          }
        )
        .end(previewBuffer);
    });

    movie.preview = (previewUpload as { secure_url: string }).secure_url;

    const createdMovie = await Movie.create(movie);

    return NextResponse.json(
      { message: "Movie created successfully", movie: createdMovie },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Movie creation failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const movies = await Movie.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Movies fetched successfully", movies },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Movies fetch failed", error: e },
      { status: 500 }
    );
  }
}

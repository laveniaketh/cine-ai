import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Movie from "@/database/movie.model";
import { v2 as cloudinary } from "cloudinary";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const formData = await req.formData();

    // Find existing movie
    const existingMovie = await Movie.findOne({ slug });
    if (!existingMovie) {
      return NextResponse.json(
        { message: "Movie not found heheh" },
        { status: 404 }
      );
    }

    let updateData: any = {};

    // Extract text fields
    const movieTitle = formData.get("movieTitle") as string;
    const director = formData.get("director") as string;
    const releasedYear = formData.get("releasedYear") as string;
    const duration = formData.get("duration") as string;
    const summary = formData.get("summary") as string;
    const timeslot = formData.get("timeslot") as string;
    const month = formData.get("month") as string;
    const week = formData.get("week") as string;

    // Update fields if provided
    if (movieTitle) updateData.movieTitle = movieTitle;
    if (director) updateData.director = director;
    if (releasedYear) updateData.releasedYear = parseInt(releasedYear);
    if (duration) updateData.duration = parseInt(duration);
    if (summary) updateData.summary = summary;
    if (timeslot) updateData.timeslot = timeslot;
    if (month) updateData.month = month;
    if (week) updateData.week = week;

    // Handle poster upload if new file provided
    const posterFile = formData.get("poster") as File;
    if (posterFile && posterFile.size > 0) {
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
      updateData.poster = (posterUpload as { secure_url: string }).secure_url;
    }

    // Handle preview upload if new file provided
    const previewFile = formData.get("preview") as File;
    if (previewFile && previewFile.size > 0) {
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
      updateData.preview = (previewUpload as { secure_url: string }).secure_url;
    }

    // Update movie
    const updatedMovie = await Movie.findOneAndUpdate({ slug }, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json(
      { message: "Movie updated successfully", movie: updatedMovie },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Movie update failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;

    // Find and delete movie
    const deletedMovie = await Movie.findOneAndDelete({ slug });

    if (!deletedMovie) {
      return NextResponse.json({ message: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Movie deleted successfully", movie: deletedMovie },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Movie deletion failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

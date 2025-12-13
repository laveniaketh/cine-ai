import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/database/ticket.model";
import ReservedSeat from "@/database/reservedSeat.model";
import Movie from "@/database/movie.model";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Calculate current day of week and week number
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDayOfWeek = days[now.getDay()];
    const dayOfMonth = now.getDate();
    const currentWeekNumber = `Week ${Math.ceil(dayOfMonth / 7)}`;

    // Total seats per movie (based on cinema layout: 8+10+12+12+12+12+14+14)
    const TOTAL_SEATS = 94;

    // Find all tickets for current day and week
    const tickets = await Ticket.find({
      dayOfWeek: currentDayOfWeek,
      weekNumber: currentWeekNumber,
    }).select("_id movie_id");

    // Get all movies
    const movies = await Movie.find({}).select("_id movieTitle");

    // Group tickets by movie
    const movieTicketsMap = new Map<string, any[]>();
    tickets.forEach((ticket) => {
      const movieId = ticket.movie_id.toString();
      if (!movieTicketsMap.has(movieId)) {
        movieTicketsMap.set(movieId, []);
      }
      movieTicketsMap.get(movieId)!.push(ticket._id);
    });

    // Calculate seat availability for each movie
    const movieAvailability = await Promise.all(
      movies.map(async (movie) => {
        const movieId = movie._id.toString();
        const ticketIds = movieTicketsMap.get(movieId) || [];

        // Count reserved seats for this movie
        const reservedSeatsCount =
          ticketIds.length > 0
            ? await ReservedSeat.countDocuments({
                ticket_id: { $in: ticketIds },
              })
            : 0;

        // Calculate available seats
        const availableSeats = TOTAL_SEATS - reservedSeatsCount;

        return {
          movieId: movie._id,
          movieTitle: movie.movieTitle,
          totalSeats: TOTAL_SEATS,
          reservedSeats: reservedSeatsCount,
          availableSeats: availableSeats,
        };
      })
    );

    return NextResponse.json({
      message: "Seat availability fetched successfully",
      currentDayOfWeek,
      currentWeekNumber,
      movies: movieAvailability,
    });
  } catch (e) {
    console.error("Error fetching seat availability:", e);
    return NextResponse.json(
      {
        message: "Failed to fetch seat availability",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

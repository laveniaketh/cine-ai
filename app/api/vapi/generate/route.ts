// app/api/vapi/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "@/lib/mongodb";
import Movie from "@/database/movie.model";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, context, includeMovieData = false } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Fetch movie data if requested
    let movieContext = "";
    if (includeMovieData) {
      try {
        await connectDB();
        const movies = await Movie.find({}).sort({ createdAt: -1 });

        if (movies.length > 0) {
          movieContext = `\n\nAVAILABLE MOVIES:\n${movies
            .map(
              (movie) =>
                `- "${movie.movieTitle}" (${movie.releasedYear}) directed by ${movie.director}. Duration: ${movie.duration} minutes. Timeslot: ${movie.timeslot}. Summary: ${movie.summary}`
            )
            .join("\n")}`;
        }
      } catch (error) {
        console.error("Failed to fetch movies:", error);
        movieContext = "\n\n(Movie data temporarily unavailable)";
      }
    }

    // Create context-aware prompt
    const systemContext = `You are CineAI's voice assistant for a cinema ticketing kiosk. 
You help customers with information about movies, ticket prices, and the booking process.

Key Information:
- Ticket price: 200 pesos per seat
- Maximum seats per booking: 20 seats
- Total cinema capacity: 94 seats
- Seat rows: A (8 seats), B (10 seats), C-F (12 seats each), G-H (14 seats each)

${movieContext}

${
  context
    ? `Additional Context: ${
        typeof context === "string" ? context : JSON.stringify(context)
      }`
    : ""
}

Important Guidelines:
- Be friendly, concise, and helpful
- Keep responses brief (2-3 sentences unless more detail is explicitly requested)
- Focus on cinema-related information
- If you don't know something, admit it honestly
- Don't make up information about movies not in the database`;

    const fullPrompt = `${systemContext}

User Query: ${prompt}

Provide a helpful, accurate, and concise response:`;

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json(
      {
        success: true,
        response: text,
        model: "gemini-pro",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Gemini API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate response",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Health check and information endpoint
    const isConfigured = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    return NextResponse.json(
      {
        success: true,
        message: "Vapi generate route is working!",
        configured: isConfigured,
        endpoints: {
          POST: {
            description: "Generate AI responses using Gemini",
            body: {
              prompt: "string (required) - The user's question or request",
              context:
                "string | object (optional) - Additional context for the AI",
              includeMovieData:
                "boolean (optional) - Include current movie database in context",
            },
            example: {
              prompt: "What movies are available?",
              includeMovieData: true,
            },
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process request",
      },
      { status: 500 }
    );
  }
}

// Optional: Test endpoint for development
export async function PUT(req: NextRequest) {
  try {
    // This endpoint can be used to test the Gemini integration
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured",
        },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(
      "Say 'Hello from Gemini AI!' if you're working correctly."
    );
    const response = await result.response;
    const text = response.text();

    return NextResponse.json(
      {
        success: true,
        message: "Gemini API is configured correctly",
        testResponse: text,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Gemini API test failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

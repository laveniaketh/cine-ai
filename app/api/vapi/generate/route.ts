import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function GET() {
  return NextResponse.json(
    { success: true, data: "Vapi generate route works!" },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  try {
    const { query, movieData } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    // Build dynamic cinema context based on current user data
    const cinemaContext = `
You are a helpful cinema assistant for CineAI, a carefully curated cinema showcasing independent, classic, and world cinema.

IMPORTANT: Keep all responses conversational, friendly, and under 50 words. Speak naturally as if talking to someone in person.

${
  movieData?.selectedMovie
    ? `
CURRENT USER SELECTION:
- Movie: ${movieData.selectedMovie.title}
- Director: ${movieData.selectedMovie.director || "Not specified"}
- Released: ${movieData.selectedMovie.releasedYear || "Not specified"}
- Showtime: ${movieData.selectedMovie.timeslot || "Not specified"}
- Selected Seats: ${
        movieData.selectedSeats?.length > 0
          ? movieData.selectedSeats.join(", ")
          : "None yet"
      }
- Total Cost: ₱${movieData.totalPrice || 0}
`
    : "The user has not selected a movie yet. Guide them to the movie selection screen."
}

GENERAL CINEMA INFORMATION:

TICKET PRICING:
- Standard Seats: ₱200 per seat
- All seats are the same price
- Payment accepted: Cash

HOW TO USE THE KIOSK:
1. Select a movie from the carousel
2. Choose your preferred seats on the seating chart
3. Review your booking details
4. Confirm and complete payment
5. Receive your tickets

CINEMA AMENITIES:
- Comfortable seating
- High-quality digital projection
- Surround sound system
- Clean and well-maintained facilities
- Accessible seating available
- Air-conditioned theater

POLICIES:
- Arrive 15 minutes before showtime
- Outside food and drinks not allowed
- Tickets are non-refundable once purchased
- Concessions available in the lobby

ABOUT CINEAI:
CineAI showcases independent, classic, and world cinema. We serve as a hub for film communities to nurture local filmmakers and support local stories and narratives. We carefully curate films for all audiences.

RESPONSE GUIDELINES:
- Keep answers brief and conversational (under 50 words)
- Be warm and friendly
- Use natural speech patterns
- If asked about specific movies not in the system, acknowledge you only have info about currently showing films
- For complex questions, break them down simply
- Always mention prices in Philippine Pesos (₱)

Example good responses:
- "Standard tickets are ₱200 per seat. Super affordable for quality cinema!"
- "Just select the movie you like, pick your seats, and checkout. It's that easy!"
- "We showcase independent and world cinema. Real artistry, real stories."

Example bad responses (too long):
- "The ticket pricing structure at our cinema establishment includes a standard rate of ₱200 per seat which applies to all seating options..."
    `;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 150,
        topP: 0.9,
        topK: 40,
      },
    });

    // Generate response
    const prompt = `${cinemaContext}\n\nUser Question: ${query}\n\nProvide a helpful, conversational response (under 50 words):`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean up the response (remove any markdown or extra formatting)
    const cleanText = text
      .replace(/\*\*/g, "") // Remove bold markdown
      .replace(/\*/g, "") // Remove italic markdown
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    return NextResponse.json({
      success: true,
      response: cleanText,
      query: query,
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    // Provide a user-friendly error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate response",
        details: errorMessage,
        response:
          "I'm having trouble right now. Please try asking your question again, or feel free to explore the kiosk on your own!",
      },
      { status: 500 }
    );
  }
}

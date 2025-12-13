import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Payment from "@/database/payment.model";
import Ticket from "@/database/ticket.model";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get current day of week and week number
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDayOfWeek = days[now.getDay()];
    const dayOfMonth = now.getDate();
    const currentWeekNumber = `Week ${Math.ceil(dayOfMonth / 7)}`;

    // Process daily data (current day of week for this week)
    const dailyData = await processDailyData(
      currentDayOfWeek,
      currentWeekNumber
    );

    // Process weekly data (current week number across different months)
    const weeklyData = await processWeeklyData(currentWeekNumber);

    // Generate AI predictions
    const aiPrediction = generateAIPrediction(dailyData, weeklyData);

    // Debug logging
    console.log("Current week number:", currentWeekNumber);
    console.log("Daily data:", dailyData);
    console.log("Weekly data:", weeklyData);
    console.log("AI Prediction:", aiPrediction);

    // Calculate totals
    const totalTickets = dailyData.reduce((sum, d) => sum + d.tickets, 0);
    const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);

    return NextResponse.json({
      message: "Sales analytics fetched successfully",
      daily: dailyData,
      weekly: weeklyData,
      aiPrediction,
      summary: {
        totalRevenue,
        totalTickets,
        averageDailyTickets:
          dailyData.length > 0
            ? Math.round(totalTickets / dailyData.length)
            : 0,
        averageDailyRevenue:
          dailyData.length > 0
            ? Math.round(totalRevenue / dailyData.length)
            : 0,
      },
    });
  } catch (e) {
    console.error("Error fetching sales analytics:", e);
    return NextResponse.json(
      {
        message: "Failed to fetch sales analytics",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function processDailyData(
  currentDayOfWeek: string,
  currentWeekNumber: string
) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Find all tickets for current week with their day of week
  const tickets = await Ticket.find({
    weekNumber: currentWeekNumber,
  }).populate("movie_id");

  // Group by day of week
  const dailyMap = new Map<string, { tickets: number; revenue: number }>();

  // Initialize all days
  days.forEach((day) => {
    dailyMap.set(day, { tickets: 0, revenue: 0 });
  });

  // Process each ticket
  for (const ticket of tickets) {
    const payment = await Payment.findOne({
      ticket_id: ticket._id,
      paymentStatus: "paid",
    });

    if (payment && ticket.dayOfWeek) {
      const current = dailyMap.get(ticket.dayOfWeek)!;
      dailyMap.set(ticket.dayOfWeek, {
        tickets: current.tickets + 1,
        revenue: current.revenue + payment.paymentAmount,
      });
    }
  }

  // Convert to array in day order
  return days.map((day) => ({
    label: day,
    tickets: dailyMap.get(day)!.tickets,
    revenue: dailyMap.get(day)!.revenue,
  }));
}

async function processWeeklyData(currentWeekNumber: string) {
  // Get tickets for all weeks in the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const weeklyData: Array<{ label: string; tickets: number; revenue: number }> =
    [];

  // Process each week (Week 1, Week 2, Week 3, Week 4)
  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const weekLabel = `Week ${weekNum}`;

    // Find tickets for this specific week in current month
    const tickets = await Ticket.find({
      weekNumber: weekLabel,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    let totalTickets = 0;
    let totalRevenue = 0;

    for (const ticket of tickets) {
      const payment = await Payment.findOne({
        ticket_id: ticket._id,
        paymentStatus: "paid",
      });

      if (payment) {
        totalTickets++;
        totalRevenue += payment.paymentAmount;
      }
    }

    weeklyData.push({
      label: weekLabel,
      tickets: totalTickets,
      revenue: totalRevenue,
    });
  }

  return weeklyData;
}

function generateAIPrediction(dailyData: any[], weeklyData: any[]) {
  // Enhanced AI prediction with multiple factors
  const weeklyTickets = weeklyData.map((w) => w.tickets);
  const weeklyRevenue = weeklyData.map((w) => w.revenue);

  // Handle edge cases
  if (weeklyTickets.every((t) => t === 0) || weeklyTickets.length === 0) {
    return {
      nextWeekTickets: 0,
      nextWeekRevenue: 0,
      growthRate: 0,
      performanceLevel: "no_data",
      insight:
        "Insufficient data for prediction. Start collecting ticket sales data.",
      confidence: 0,
      trendDirection: "stable",
    };
  }

  // Filter out zero weeks for better prediction on sparse data
  const nonZeroWeeks = weeklyTickets.filter((t) => t > 0);
  const nonZeroRevenue = weeklyRevenue.filter((r) => r > 0);

  // Calculate averages (use all data for context)
  const avgTickets =
    weeklyTickets.reduce((sum, val) => sum + val, 0) / weeklyTickets.length;
  const avgRevenue =
    weeklyRevenue.reduce((sum, val) => sum + val, 0) / weeklyRevenue.length;

  // Use average of non-zero weeks as baseline prediction
  const avgNonZeroTickets =
    nonZeroWeeks.length > 0
      ? nonZeroWeeks.reduce((sum, val) => sum + val, 0) / nonZeroWeeks.length
      : avgTickets;

  // Linear regression for trend analysis (using all data points)
  const n = weeklyTickets.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += weeklyTickets[i];
    sumXY += i * weeklyTickets[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict next week using linear regression
  const predictedTicketsLinear = Math.round(slope * n + intercept);

  // Calculate growth rate using most recent non-zero week
  const lastNonZeroWeek =
    nonZeroWeeks.length > 0
      ? nonZeroWeeks[nonZeroWeeks.length - 1]
      : avgTickets;
  const prevNonZeroWeek =
    nonZeroWeeks.length > 1
      ? nonZeroWeeks[nonZeroWeeks.length - 2]
      : lastNonZeroWeek;

  const growthRate =
    prevNonZeroWeek !== 0
      ? (lastNonZeroWeek - prevNonZeroWeek) / prevNonZeroWeek
      : 0;

  // Weighted prediction: 40% linear regression, 30% growth, 30% average
  const predictedTicketsGrowth = Math.round(
    lastNonZeroWeek * (1 + growthRate * 0.7)
  );
  const predictedTickets = Math.round(
    predictedTicketsLinear * 0.4 +
      predictedTicketsGrowth * 0.3 +
      avgNonZeroTickets * 0.3
  );

  // Revenue prediction with correlation analysis
  const avgTicketPrice = avgRevenue / (avgTickets || 1);
  const predictedRevenue = Math.round(predictedTickets * avgTicketPrice);

  // Calculate confidence score (0-100)
  const variance =
    weeklyTickets.reduce((sum, val) => sum + Math.pow(val - avgTickets, 2), 0) /
    n;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avgTickets !== 0 ? stdDev / avgTickets : 1;
  const confidence = Math.max(
    0,
    Math.min(100, Math.round((1 - coefficientOfVariation) * 100))
  );

  // Determine trend direction
  let trendDirection: "increasing" | "decreasing" | "stable";
  if (slope > 5) trendDirection = "increasing";
  else if (slope < -5) trendDirection = "decreasing";
  else trendDirection = "stable";

  // Performance analysis with daily data
  const dailyAvg =
    dailyData.reduce((sum, d) => sum + d.tickets, 0) / (dailyData.length || 1);

  let performanceLevel: string;
  let insight: string;

  if (dailyAvg >= 250) {
    performanceLevel = "strong";
    insight = `Excellent performance! ${Math.round(
      dailyAvg
    )} tickets/day average with ${trendDirection} trend.`;
  } else if (dailyAvg >= 150) {
    performanceLevel = "stable";
    insight = `Stable performance at ${Math.round(
      dailyAvg
    )} tickets/day with ${trendDirection} trend.`;
  } else if (dailyAvg >= 50) {
    performanceLevel = "moderate";
    insight = `Moderate performance at ${Math.round(
      dailyAvg
    )} tickets/day. Consider promotional campaigns.`;
  } else {
    performanceLevel = "below_target";
    insight = `Below target at ${Math.round(
      dailyAvg
    )} tickets/day. Urgent action needed.`;
  }

  // Add trend-specific insights
  if (trendDirection === "increasing") {
    insight += " Strong upward momentum detected.";
  } else if (trendDirection === "decreasing") {
    insight += " Downward trend requires attention.";
  }

  return {
    nextWeekTickets: Math.max(0, predictedTickets),
    nextWeekRevenue: Math.max(0, predictedRevenue),
    growthRate: Math.round(growthRate * 100),
    performanceLevel,
    insight,
    confidence,
    trendDirection,
    avgTicketPrice: Math.round(avgTicketPrice),
  };
}

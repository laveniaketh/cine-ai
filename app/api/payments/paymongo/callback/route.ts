import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Payment from "@/database/payment.model";
import {
  getPaymongoCheckoutSession,
  isPaymongoSessionSuccessful,
} from "@/lib/paymongo";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const checkoutSessionId = searchParams.get("checkout_session_id");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!checkoutSessionId) {
      return NextResponse.redirect(
        `${appUrl}/kiosk/payment-confirmation?payment=invalid`
      );
    }

    const session = await getPaymongoCheckoutSession(checkoutSessionId);
    const paymentIdFromMetadata = session.data.attributes.metadata?.payment_id;
    const isPaid = isPaymongoSessionSuccessful(session);

    let payment = null;

    if (paymentIdFromMetadata) {
      payment = await Payment.findById(paymentIdFromMetadata);
    }

    if (!payment) {
      payment = await Payment.findOne({ gatewayReference: checkoutSessionId });
    }

    if (payment) {
      payment.paymentStatus = isPaid ? "paid" : "cancelled";
      payment.gateway = "paymongo";
      payment.paymentMethod = "paymongo";
      payment.gatewayReference = checkoutSessionId;
      await payment.save();
    }

    return NextResponse.redirect(
      isPaid
        ? `${appUrl}/kiosk/payment-sucessful`
        : `${appUrl}/kiosk/payment-confirmation?payment=failed`
    );
  } catch {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/kiosk/payment-confirmation?payment=failed`
    );
  }
}

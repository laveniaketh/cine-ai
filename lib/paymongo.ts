type PaymongoCheckoutLineItem = {
  currency: "PHP";
  amount: number;
  name: string;
  quantity: number;
};

type CreateCheckoutSessionArgs = {
  amount: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

const PAYMONGO_BASE_URL = "https://api.paymongo.com/v1";

function getPaymongoSecretKey() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is not configured");
  }

  return secretKey;
}

function getAuthorizationHeader() {
  const secretKey = getPaymongoSecretKey();
  const encodedKey = Buffer.from(secretKey).toString("base64");

  return `Basic ${encodedKey}`;
}

async function paymongoRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${PAYMONGO_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: getAuthorizationHeader(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const responseData = await response.json();

  if (!response.ok) {
    const message =
      responseData?.errors?.[0]?.detail ||
      responseData?.errors?.[0]?.code ||
      "PayMongo request failed";

    throw new Error(message);
  }

  return responseData as T;
}

export async function createPaymongoCheckoutSession({
  amount,
  description,
  successUrl,
  cancelUrl,
  metadata,
}: CreateCheckoutSessionArgs) {
  const lineItems: PaymongoCheckoutLineItem[] = [
    {
      currency: "PHP",
      amount,
      name: description,
      quantity: 1,
    },
  ];

  return paymongoRequest<{
    data: {
      id: string;
      attributes: {
        checkout_url: string;
      };
    };
  }>("/checkout_sessions", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: lineItems,
          payment_method_types: ["card", "gcash", "paymaya"],
          description,
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          metadata: metadata ?? {},
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      },
    }),
  });
}

export async function getPaymongoCheckoutSession(checkoutSessionId: string) {
  return paymongoRequest<{
    data: {
      id: string;
      attributes: {
        status?: string;
        metadata?: Record<string, string>;
        payments?: Array<{ attributes?: { status?: string } }>;
        payment_intent?: { attributes?: { status?: string } };
      };
    };
  }>(`/checkout_sessions/${checkoutSessionId}`);
}

export function isPaymongoSessionSuccessful(session: {
  data: {
    attributes: {
      status?: string;
      payments?: Array<{ attributes?: { status?: string } }>;
      payment_intent?: { attributes?: { status?: string } };
    };
  };
}) {
  const sessionStatus = session.data.attributes.status?.toLowerCase();
  const paymentIntentStatus =
    session.data.attributes.payment_intent?.attributes?.status?.toLowerCase();
  const hasSuccessfulPayment = (session.data.attributes.payments ?? []).some(
    (payment) => {
      const status = payment.attributes?.status?.toLowerCase();
      return status === "paid" || status === "succeeded";
    }
  );

  return (
    sessionStatus === "paid" ||
    sessionStatus === "succeeded" ||
    paymentIntentStatus === "succeeded" ||
    hasSuccessfulPayment
  );
}

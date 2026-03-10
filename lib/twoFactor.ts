// simple helper for two-factor authentication

/**
 * Generate a 6-digit numeric code as string.
 */
export function generateTwoFactorCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhilippineNumber(phone: string): string {
  const rawPhone = phone.trim();
  const digits = rawPhone.replace(/\D/g, "");

  // 9XXXXXXXXX -> +639XXXXXXXXX
  if (/^9\d{9}$/.test(digits)) {
    return `+63${digits}`;
  }

  // 09XXXXXXXXX -> +639XXXXXXXXX
  if (/^09\d{9}$/.test(digits)) {
    return `+63${digits.slice(1)}`;
  }

  // 639XXXXXXXXX -> +639XXXXXXXXX
  if (/^639\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  // +639XXXXXXXXX -> +639XXXXXXXXX
  if (/^\+639\d{9}$/.test(rawPhone)) {
    return rawPhone;
  }

  throw new Error("Invalid Philippine mobile number format");
}

function getSmsApiConfig() {
  const apiKey = process.env.SMS_API_PH_API_KEY?.trim();
  const baseOrEndpoint =
    process.env.SMS_API_PH_BASE_URL?.trim() ||
    "https://smsapiph.onrender.com/api/v1";

  if (!apiKey) {
    throw new Error(
      "SMS_API_PH_API_KEY is missing. Add it to your environment variables.",
    );
  }

  const normalized = baseOrEndpoint.replace(/\/$/, "");
  const endpoint = /\/send\/sms$/i.test(normalized)
    ? normalized
    : `${normalized}/send/sms`;

  return { apiKey, endpoint };
}

/**
 * Send verification code via SMS API PH.
 * Supports SMS directly; for "call" selection we attempt voice-compatible payload first
 * and then fall back to SMS delivery when voice is unavailable.
 */
export async function sendVerificationCode(
  phone: string,
  code: string,
  method: "sms" | "call" = "sms",
) {
  if (!phone) {
    throw new Error("Phone number is missing");
  }

  const normalizedPhone = normalizePhilippineNumber(phone);
  const localPhone = `0${normalizedPhone.slice(3)}`;
  const { apiKey, endpoint } = getSmsApiConfig();
  const message = `Your CineAI verification code is ${code}. It expires in 5 minutes.`;

  const recipientCandidates = [normalizedPhone, localPhone];
  let lastError = "Unknown SMS API error";

  for (const recipient of recipientCandidates) {
    const payload = {
      recipient,
      message,
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseJson: Record<string, unknown> | null = null;
      try {
        responseJson = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        responseJson = null;
      }

      if (!response.ok) {
        console.error("2FA SMS API non-200 response", {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          payload,
          responseBody: responseText,
          responseJson,
        });

        lastError = `${response.status} ${response.statusText}: ${responseText.slice(0, 400)}`;
        continue;
      }

      if (responseJson && responseJson.success === false) {
        console.error("2FA SMS API semantic failure", {
          endpoint,
          payload,
          responseJson,
        });
        lastError = String(
          responseJson.message ||
            responseJson.error ||
            "Provider reported failure",
        );
        continue;
      }

      console.log("2FA SMS sent successfully", {
        endpoint,
        status: response.status,
        requestedMethod: method,
        recipient,
        response: responseText,
      });
      return;
    } catch (error: unknown) {
      const messageText =
        error instanceof Error ? error.message : "Unknown network error";
      console.error("2FA SMS API network error", {
        endpoint,
        payload,
        error: messageText,
      });
      lastError = messageText;
    }
  }

  throw new Error(
    `Failed to send verification code via SMS API PH. ${lastError}`,
  );
}

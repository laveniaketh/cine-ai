"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { resendTwoFactorCode, verifyTwoFactorCode } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const COOLDOWN_STORAGE_KEY = "cineai_2fa_resend_cooldown_until";

function getInitialCooldown() {
  if (typeof window === "undefined") return 0;

  const storedCooldownUntil = window.localStorage.getItem(COOLDOWN_STORAGE_KEY);
  if (!storedCooldownUntil) return 0;

  const cooldownUntil = Number(storedCooldownUntil);
  if (!Number.isFinite(cooldownUntil)) {
    window.localStorage.removeItem(COOLDOWN_STORAGE_KEY);
    return 0;
  }

  const remainingSeconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
  if (remainingSeconds > 0) return remainingSeconds;

  window.localStorage.removeItem(COOLDOWN_STORAGE_KEY);
  return 0;
}

interface TwoFactorCodeFormProps {
  maskedPhoneNumber: string;
  methodLabel: string;
}

const TwoFactorCodeForm = ({ maskedPhoneNumber, methodLabel }: TwoFactorCodeFormProps) => {
  const [state, action, pending] = useActionState(verifyTwoFactorCode, undefined);
  const [cooldown, setCooldown] = useState(getInitialCooldown);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [isResending, startResendTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          window.localStorage.removeItem(COOLDOWN_STORAGE_KEY);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendCode = () => {
    if (cooldown > 0 || isResending) return;

    setResendMsg(null);
    startResendTransition(async () => {
      const result = await resendTwoFactorCode();
      if (result?.message) {
        setResendMsg(result.message);
      }
    });
    const cooldownUntil = Date.now() + 30 * 1000;
    window.localStorage.setItem(COOLDOWN_STORAGE_KEY, String(cooldownUntil));
    setCooldown(30);
  };

  return (
    <Card className="text-white relative overflow-hidden w-full max-w-md border-neutral-700 bg-neutral-800 border-none gap-3 py-4">
      <form action={action}>
        <CardHeader className="text-center px-6 pb-1">
          <CardTitle className="text-xl">Enter Verification Code</CardTitle>
          <CardDescription>
            Please enter the 6 digit code sent to your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-0 pb-1">
          <FieldSet>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="code">6-digit code</FieldLabel>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  title="Enter exactly 6 digits"
                  placeholder="000000"
                  required
                  disabled={pending}
                />
              </Field>
              <label className="flex items-start gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  name="trustDevice"
                  value="true"
                  className="mt-1 h-4 w-4 rounded border-neutral-600 bg-neutral-800"
                  disabled={pending}
                />
                <span>Do not ask this device for a code for 15 days.</span>
              </label>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                  onClick={handleResendCode}
                  disabled={pending || isResending || cooldown > 0}
                >
                  {isResending
                    ? "Sending..."
                    : cooldown > 0
                    ? `Send new code (${cooldown}s)`
                    : "Send new code"}
                </Button>
                {resendMsg && (
                  <p className={`text-sm mt-2 ${resendMsg.toLowerCase().includes("failed") || resendMsg.toLowerCase().includes("expired") ? "text-red-500" : "text-green-400"}`}>
                    {resendMsg}
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Code sent via {methodLabel} to {maskedPhoneNumber}
              </p>

              {state?.errors?.code && (
                <p className="text-sm text-red-500">{state.errors.code[0]}</p>
              )}
              {state?.message && <p className="text-sm text-red-500">{state.message}</p>}
            </FieldGroup>
          </FieldSet>
        </CardContent>
        <CardFooter className="px-6 pt-1 pb-1">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TwoFactorCodeForm;

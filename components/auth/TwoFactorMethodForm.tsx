"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { sendTwoFactorCode } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TwoFactorMethodFormProps {
  maskedPhoneNumber: string;
}

const TwoFactorMethodForm = ({ maskedPhoneNumber }: TwoFactorMethodFormProps) => {
  const [state, action, pending] = useActionState(sendTwoFactorCode, undefined);
  const [method, setMethod] = useState<"sms" | "call">("sms");

  return (
    <Card className="text-white relative overflow-hidden w-full max-w-md border-neutral-700 bg-neutral-800 border-none">
      <form action={action}>
        <CardHeader className="text-center">
          <CardTitle className="text-xl mt-4">Two-Factor Verification</CardTitle>
          <CardDescription>
            To help keep your account safe, we want to make sure it&apos;s really you trying to sign in. Please choose how you would like to receive a verification code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mt-6">
            <input type="hidden" name="method" value={method} />

            <button
              type="button"
              onClick={() => setMethod("sms")}
              className={`w-full rounded-md border px-4 py-3 text-left transition ${
                method === "sms"
                  ? "border-white bg-neutral-700 text-white"
                  : "border-neutral-600 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
              disabled={pending}
            >
              <p className="font-medium">Receive via SMS</p>
              <p className="text-xs text-neutral-400">Text message to {maskedPhoneNumber}</p>
            </button>

            <button
              type="button"
              onClick={() => setMethod("call")}
              className={`w-full rounded-md border px-4 py-3 text-left transition ${
                method === "call"
                  ? "border-white bg-neutral-700 text-white"
                  : "border-neutral-600 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
              disabled={pending}
            >
              <p className="font-medium">Receive via Phone Call</p>
              <p className="text-xs text-neutral-400">Automated call to {maskedPhoneNumber}</p>
            </button>

            <p className="text-sm text-gray-500 mt-4">
              If you do not have access to the phone associated with {maskedPhoneNumber}, please contact your admin.
            </p>

            {state?.errors?.method && (
              <p className="text-sm text-red-500">{state.errors.method[0]}</p>
            )}
            {state?.message && <p className="text-sm text-red-500">{state.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2 mt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending code..." : "Send Verification Code"}
          </Button>
          <Button type="button" asChild variant="outline" className="w-full bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
            <Link href="/">Back to Login Page</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TwoFactorMethodForm;

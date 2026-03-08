import { redirect } from "next/navigation";
import { getPendingTwoFactorSession } from "@/lib/session";
import TwoFactorCodeForm from "@/components/auth/TwoFactorCodeForm";

function maskPhoneNumber(phone: string) {
  const lastFour = phone.slice(-4);
  return `xxx-xxx-${lastFour}`;
}

const VerifyTwoFactorCodePage = async () => {
  const pending = await getPendingTwoFactorSession();

  if (!pending?.phoneNumber || !pending.method) {
    redirect("/verify-2fa");
  }

  const methodLabel = pending.method === "call" ? "phone call" : "SMS";

  return (
    <div className="flex flex-col relative items-center space-y-8 mx-auto justify-center min-h-[70vh] w-full">
      <TwoFactorCodeForm
        maskedPhoneNumber={maskPhoneNumber(pending.phoneNumber)}
        methodLabel={methodLabel}
      />
    </div>
  );
};

export default VerifyTwoFactorCodePage;

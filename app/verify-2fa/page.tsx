import { redirect } from "next/navigation";
import { getPendingTwoFactorSession } from "@/lib/session";
import TwoFactorMethodForm from "@/components/auth/TwoFactorMethodForm";

function maskPhoneNumber(phone: string) {
  const lastFour = phone.slice(-4);
  return `xxx-xxx-${lastFour}`;
}

const VerifyTwoFactorPage = async () => {
  const pending = await getPendingTwoFactorSession();

  if (!pending?.phoneNumber) {
    redirect("/");
  }

  return (
    <div className="flex flex-col relative items-center space-y-8 mx-auto justify-center min-h-[70vh] w-full">
      <TwoFactorMethodForm maskedPhoneNumber={maskPhoneNumber(pending.phoneNumber)} />
    </div>
  );
};

export default VerifyTwoFactorPage;

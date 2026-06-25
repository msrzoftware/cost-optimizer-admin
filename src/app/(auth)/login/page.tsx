import { GuestRoute } from "@/components/auth/guest-route";
import { LoginPage } from "@/components/auth/login-page";

export default function LoginRoute() {
  return (
    <GuestRoute>
      <LoginPage />
    </GuestRoute>
  );
}

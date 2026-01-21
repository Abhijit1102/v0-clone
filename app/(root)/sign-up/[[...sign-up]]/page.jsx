import { SignUp } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
      <SignUp />
    </div>
  );
}

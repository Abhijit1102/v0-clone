import Link from "next/link";
import Image from "next/image";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
  return (
    <nav className="p-4 transparent fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-button-trasparent">
      <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
        <Link href={"/"} className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Vibe"
            width={32}
            height={32}
            className="hidden md:block dark:invert"
            />
        </Link>

        <SignedOut>
          <div className="flex gap-2">
            <SignInButton>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </SignInButton>

            <SignUpButton>
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton />
          </div>
        </SignedIn>
      </div>
    </nav>
  );
}

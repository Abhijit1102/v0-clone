import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs"
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button>Test</Button>
      <UserButton />
    </div>
  );
}

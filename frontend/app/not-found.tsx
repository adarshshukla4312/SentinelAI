import Link from "next/link";
import { Shield } from "lucide-react";
import { GlassButton } from "@/components/ui/liquid-glass";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#2997ff]/20 border border-[#2997ff]/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(41,151,255,0.3)]">
        <Shield className="w-8 h-8 text-[#2997ff]" />
      </div>
      <h1 className="text-5xl font-bold tracking-tight mb-4">404</h1>
      <p className="text-xl text-white/70 max-w-md mb-8">
        The checkpoint page you are looking for does not exist or has been relocated.
      </p>
      <Link href="/">
        <GlassButton className="!bg-[#2997ff]">
          Return to Command Center
        </GlassButton>
      </Link>
    </div>
  );
}

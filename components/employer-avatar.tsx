import Image from "next/image";

import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
} as const;

type EmployerAvatarProps = {
  name?: string | null;
  logoUrl?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function EmployerAvatar({ name, logoUrl, size = "md", className }: EmployerAvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase() || "E";

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-full border-2 border-[#e8f0f6] bg-[#eef5fb] font-semibold text-[#2f6fa4]",
        sizeClasses[size],
        className,
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name ? `${name} logo` : "Employer logo"}
          width={96}
          height={96}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">{initial}</div>
      )}
    </div>
  );
}

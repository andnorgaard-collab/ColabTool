import { getInitials } from "../lib/utils";
import type { Platform } from "../lib/types";
import { cn } from "../lib/utils";

interface AvatarProps {
  name: string;
  color: string;
  platform?: Platform;
  size?: "sm" | "md" | "lg";
  showPlatform?: boolean;
}

const platformIcons: Record<Platform, string> = {
  microsoft: "M",
  google: "G",
  other: "•",
};

const platformColors: Record<Platform, string> = {
  microsoft: "bg-blue-500",
  google: "bg-red-500",
  other: "bg-gray-500",
};

export function Avatar({ name, color, platform, size = "md", showPlatform = false }: AvatarProps) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" };
  return (
    <div className="relative inline-block flex-shrink-0">
      <div
        className={cn("rounded-full flex items-center justify-center font-semibold text-white", sizes[size])}
        style={{ backgroundColor: color }}
        title={name}
      >
        {getInitials(name)}
      </div>
      {showPlatform && platform && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white border border-white",
            platformColors[platform]
          )}
          style={{ fontSize: 7, lineHeight: 1 }}
          title={platform}
        >
          {platformIcons[platform]}
        </div>
      )}
    </div>
  );
}

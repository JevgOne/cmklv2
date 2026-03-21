import { cn } from "@/lib/utils";

export interface CardProps {
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Card({ hover, children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-card overflow-hidden transition-all duration-300",
        hover && "hover:-translate-y-1 hover:shadow-card-hover",
        className
      )}
    >
      {children}
    </div>
  );
}

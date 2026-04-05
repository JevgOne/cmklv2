interface LiveRegionProps {
  message: string;
  assertive?: boolean;
}

export function LiveRegion({ message, assertive = false }: LiveRegionProps) {
  return (
    <div
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      className="sr-only"
    >
      {message}
    </div>
  );
}

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-purple-100/10 via-blue-100/10 to-teal-100/10 dark:from-purple-900/10 dark:via-blue-900/10 dark:to-teal-900/10",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };

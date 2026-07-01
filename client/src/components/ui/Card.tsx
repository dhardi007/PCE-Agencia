import { cn } from '../../lib/utils';

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-card bg-[rgb(var(--card))] text-[rgb(var(--card-foreground))] shadow-card border border-border', className)}
      {...props}
    >
      {children}
    </div>
  );
}
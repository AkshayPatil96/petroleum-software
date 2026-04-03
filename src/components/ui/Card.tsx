import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
const Card = ({ children, className, ...props }: { children: ReactNode; className?: string; [key: string]: any }) => (
  <div className={cn("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)} {...props}>
    {children}
  </div>
);
export default Card;

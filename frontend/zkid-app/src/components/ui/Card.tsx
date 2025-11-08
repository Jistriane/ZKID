import { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={[
      'card relative overflow-hidden',
      'before:content-["""] before:absolute before:inset-0 before:bg-gradient-to-tr before:from-primary/10 before:to-transparent before:pointer-events-none',
      className,
    ].join(' ')}>
      {children}
    </div>
  )
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-2">{children}</div>
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg md:text-xl font-semibold">{children}</h3>
}

export function CardContent({ children }: { children: ReactNode }) {
  return <div className="text-slate-300">{children}</div>
}

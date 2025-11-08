import { ComponentProps, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed'
const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white shadow-glow hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]',
  secondary: 'bg-white/10 border border-white/15 text-white hover:bg-white/15',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-white hover:bg-white/5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button ref={ref} className={[base, sizes[size], variants[variant], className].join(' ')} {...props} />
    )
  }
)

Button.displayName = 'Button'

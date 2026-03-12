import { forwardRef } from 'react'
import type React from 'react'
import { cn } from './cn'

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'gold' }
>(function Button({ className, variant = 'primary', ...props }, ref) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/70 disabled:opacity-50 disabled:pointer-events-none'

  const variants: Record<string, string> = {
    primary: 'bg-[#1f5f3a] text-white hover:bg-[#1a5232] shadow-[0_0_0_1px_rgba(31,95,58,0.8)]',
    gold: 'bg-[#c9a227] text-black hover:bg-[#b89222] shadow-[0_0_0_1px_rgba(201,162,39,0.9)]',
    ghost: 'bg-white/5 text-white hover:bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]',
  }

  return <button ref={ref} className={cn(base, variants[variant], className)} {...props} />
})

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 shadow-[0_0_0_1px_rgba(255,255,255,0.15)] outline-none focus:ring-2 focus:ring-[#c9a227]/60',
        className,
      )}
      {...props}
    />
  )
})

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/4 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] backdrop-blur',
        className,
      )}
      {...props}
    />
  )
}

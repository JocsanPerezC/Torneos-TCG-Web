import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
const Card=forwardRef<HTMLDivElement,HTMLAttributes<HTMLDivElement>>(({className,...props},ref)=><div ref={ref} className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm',className)} {...props}/>)
const CardHeader=forwardRef<HTMLDivElement,HTMLAttributes<HTMLDivElement>>(({className,...props},ref)=><div ref={ref} className={cn('flex flex-col space-y-1.5 p-6',className)} {...props}/>)
const CardTitle=forwardRef<HTMLParagraphElement,HTMLAttributes<HTMLParagraphElement>>(({className,...props},ref)=><p ref={ref} className={cn('font-semibold leading-none tracking-tight',className)} {...props}/>)
const CardContent=forwardRef<HTMLDivElement,HTMLAttributes<HTMLDivElement>>(({className,...props},ref)=><div ref={ref} className={cn('p-6 pt-0',className)} {...props}/>)
Card.displayName='Card';CardHeader.displayName='CardHeader';CardTitle.displayName='CardTitle';CardContent.displayName='CardContent'
export { Card, CardHeader, CardTitle, CardContent }

import { cn } from "@/lib/utils"

interface GradientWheelProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  outerGradient?: string
  innerGradient?: string
  dotColor?: string
  className?: string
  animate?: boolean
}

export function GradientWheel({
  size = 'md',
  outerGradient = 'from-teal-400 via-teal-500 to-orange-400',
  innerGradient = 'from-teal-300 to-orange-300',
  dotColor = 'bg-white',
  className,
  animate = false,
  ...props
}: GradientWheelProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const innerSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }

  return (
    <div 
      className={cn(
        'rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow',
        sizeClasses[size],
        `bg-gradient-to-br ${outerGradient}`,
        animate && 'animate-spin bg-teal-400 shadow-none',
        className
      )}
      {...props}
    >
      <div className={cn(
        'rounded-full flex items-center justify-center',
        innerSizeClasses[size],
        `bg-gradient-to-br ${innerGradient}`
      )}>
        <div className={cn('rounded-full', dotSizeClasses[size], dotColor)}></div>
      </div>
    </div>
  )
}

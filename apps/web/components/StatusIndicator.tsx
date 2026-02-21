import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'pending'

interface StatusIndicatorProps {
  status: StatusType
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showPulse?: boolean
  className?: string
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    colors: 'text-green-500 dark:text-green-400',
    bgColors: 'bg-green-50 dark:bg-green-900/10',
    pulseColors: 'bg-green-500/20',
  },
  error: {
    icon: XCircle,
    colors: 'text-red-500 dark:text-red-400',
    bgColors: 'bg-red-50 dark:bg-red-900/10',
    pulseColors: 'bg-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    colors: 'text-yellow-500 dark:text-yellow-400',
    bgColors: 'bg-yellow-50 dark:bg-yellow-900/10',
    pulseColors: 'bg-yellow-500/20',
  },
  info: {
    icon: Info,
    colors: 'text-blue-500 dark:text-blue-400',
    bgColors: 'bg-blue-50 dark:bg-blue-900/10',
    pulseColors: 'bg-blue-500/20',
  },
  loading: {
    icon: Loader2,
    colors: 'text-blue-500 dark:text-blue-400',
    bgColors: 'bg-blue-50 dark:bg-blue-900/10',
    pulseColors: 'bg-blue-500/20',
  },
  pending: {
    icon: AlertTriangle,
    colors: 'text-gray-500 dark:text-gray-400',
    bgColors: 'bg-gray-50 dark:bg-gray-900/10',
    pulseColors: 'bg-gray-500/20',
  },
}

const sizeConfig = {
  sm: {
    icon: 'h-3 w-3',
    container: 'h-4 w-4',
    text: 'text-xs',
    padding: 'p-1',
  },
  md: {
    icon: 'h-4 w-4',
    container: 'h-5 w-5',
    text: 'text-sm',
    padding: 'p-1.5',
  },
  lg: {
    icon: 'h-5 w-5',
    container: 'h-6 w-6',
    text: 'text-base',
    padding: 'p-2',
  },
}

export function StatusIndicator({
  status,
  label,
  size = 'md',
  showPulse = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const sizeStyles = sizeConfig[size]
  const isAnimated = status === 'loading'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label || `${status} status`}
    >
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-full',
          config.bgColors,
          sizeStyles.padding,
          showPulse && 'animate-pulse'
        )}
      >
        <Icon
          className={cn(
            config.colors,
            sizeStyles.icon,
            isAnimated && 'animate-spin'
          )}
          aria-hidden="true"
        />
        {showPulse && (
          <span
            className={cn(
              'absolute inset-0 rounded-full',
              config.pulseColors,
              'animate-ping'
            )}
            aria-hidden="true"
          />
        )}
      </div>
      {label && (
        <span
          className={cn(
            'font-medium',
            config.colors,
            sizeStyles.text
          )}
        >
          {label}
        </span>
      )}
    </div>
  )
}

interface StatusBadgeProps {
  status: StatusType
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline' | 'subtle'
  className?: string
}

export function StatusBadge({
  status,
  children,
  size = 'md',
  variant = 'subtle',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const sizeStyles = sizeConfig[size]

  const variantStyles = {
    solid: {
      success: 'bg-green-500 text-white dark:bg-green-600',
      error: 'bg-red-500 text-white dark:bg-red-600',
      warning: 'bg-yellow-500 text-white dark:bg-yellow-600',
      info: 'bg-blue-500 text-white dark:bg-blue-600',
      loading: 'bg-blue-500 text-white dark:bg-blue-600',
      pending: 'bg-gray-500 text-white dark:bg-gray-600',
    },
    outline: {
      success: 'border border-green-500 text-green-500 dark:border-green-400 dark:text-green-400',
      error: 'border border-red-500 text-red-500 dark:border-red-400 dark:text-red-400',
      warning: 'border border-yellow-500 text-yellow-500 dark:border-yellow-400 dark:text-yellow-400',
      info: 'border border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400',
      loading: 'border border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400',
      pending: 'border border-gray-500 text-gray-500 dark:border-gray-400 dark:text-gray-400',
    },
    subtle: {
      success: config.bgColors + ' ' + config.colors,
      error: config.bgColors + ' ' + config.colors,
      warning: config.bgColors + ' ' + config.colors,
      info: config.bgColors + ' ' + config.colors,
      loading: config.bgColors + ' ' + config.colors,
      pending: config.bgColors + ' ' + config.colors,
    },
  }

  const isAnimated = status === 'loading'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
        variantStyles[variant][status],
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-sm',
        size === 'lg' && 'px-3 py-1.5 text-base',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={cn(
          sizeStyles.icon,
          isAnimated && 'animate-spin'
        )}
        aria-hidden="true"
      />
      {children}
    </span>
  )
}

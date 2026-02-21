import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useCallback } from 'react'

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface FeedbackProps {
  type: FeedbackType
  title?: string
  message: string
  dismissible?: boolean
  autoDismiss?: number
  onDismiss?: () => void
  className?: string
  icon?: React.ReactNode
}

const feedbackConfig = {
  success: {
    icon: CheckCircle2,
    colors: 'text-green-500 dark:text-green-400',
    bgColors: 'bg-green-50 dark:bg-green-900/10',
    borderColors: 'border-green-200 dark:border-green-800',
    titleColor: 'text-green-800 dark:text-green-200',
  },
  error: {
    icon: XCircle,
    colors: 'text-red-500 dark:text-red-400',
    bgColors: 'bg-red-50 dark:bg-red-900/10',
    borderColors: 'border-red-200 dark:border-red-800',
    titleColor: 'text-red-800 dark:text-red-200',
  },
  warning: {
    icon: AlertTriangle,
    colors: 'text-yellow-500 dark:text-yellow-400',
    bgColors: 'bg-yellow-50 dark:bg-yellow-900/10',
    borderColors: 'border-yellow-200 dark:border-yellow-800',
    titleColor: 'text-yellow-800 dark:text-yellow-200',
  },
  info: {
    icon: Info,
    colors: 'text-blue-500 dark:text-blue-400',
    bgColors: 'bg-blue-50 dark:bg-blue-900/10',
    borderColors: 'border-blue-200 dark:border-blue-800',
    titleColor: 'text-blue-800 dark:text-blue-200',
  },
  loading: {
    icon: Loader2,
    colors: 'text-blue-500 dark:text-blue-400',
    bgColors: 'bg-blue-50 dark:bg-blue-900/10',
    borderColors: 'border-blue-200 dark:border-blue-800',
    titleColor: 'text-blue-800 dark:text-blue-200',
  },
}

export function Feedback({
  type,
  title,
  message,
  dismissible = false,
  autoDismiss,
  onDismiss,
  className,
  icon,
}: FeedbackProps) {
  const [isVisible, setIsVisible] = useState(true)
  const config = feedbackConfig[type]
  const Icon = icon || config.icon
  const isAnimated = type === 'loading'

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    onDismiss?.()
  }, [onDismiss])

  useEffect(() => {
    if (autoDismiss && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoDismiss)

      return () => clearTimeout(timer)
    }
  }, [autoDismiss, isVisible, handleDismiss])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 transition-all duration-200',
        config.bgColors,
        config.borderColors,
        'animate-in fade-in slide-in-from-top-2',
        className
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {typeof Icon === 'function' ? (
            <Icon
              className={cn(
                'h-5 w-5',
                config.colors,
                isAnimated && 'animate-spin'
              )}
              aria-hidden="true"
            />
          ) : (
            <div className={cn(config.colors, isAnimated && 'animate-spin')}>
              {Icon}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h3
              className={cn(
                'mb-1 font-semibold',
                config.titleColor
              )}
            >
              {title}
            </h3>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 rounded-md p-1 transition-colors',
              'hover:bg-black/5 dark:hover:bg-white/5',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              config.colors.replace('text-', 'focus:ring-')
            )}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({
  size = 'md',
  text,
  className,
}: LoadingSpinnerProps) {
  const sizeConfig = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={text || 'Loading'}
    >
      <Loader2
        className={cn(
          'animate-spin text-blue-500 dark:text-blue-400',
          sizeConfig[size]
        )}
        aria-hidden="true"
      />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  )
}

interface PulseLoaderProps {
  className?: string
  color?: 'blue' | 'green' | 'red' | 'yellow'
}

export function PulseLoader({ className, color = 'blue' }: PulseLoaderProps) {
  const colorConfig = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  }

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full animate-pulse',
          colorConfig[color]
        )}
        style={{ animationDelay: '0ms' }}
        aria-hidden="true"
      />
      <span
        className={cn(
          'h-2 w-2 rounded-full animate-pulse',
          colorConfig[color]
        )}
        style={{ animationDelay: '150ms' }}
        aria-hidden="true"
      />
      <span
        className={cn(
          'h-2 w-2 rounded-full animate-pulse',
          colorConfig[color]
        )}
        style={{ animationDelay: '300ms' }}
        aria-hidden="true"
      />
    </div>
  )
}

interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
}

export function SuccessCheckmark({
  size = 'md',
  className,
  animated = true,
}: SuccessCheckmarkProps) {
  const sizeConfig = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center',
        className
      )}
      role="status"
      aria-label="Success"
    >
      <div
        className={cn(
          'rounded-full bg-green-500 p-1 text-white',
          sizeConfig[size],
          animated && 'animate-in zoom-in duration-300'
        )}
      >
        <CheckCircle2
          className={cn(
            'h-full w-full',
            animated && 'animate-in fade-in duration-300'
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

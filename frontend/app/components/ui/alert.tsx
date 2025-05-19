// frontend/app/components/ui/alert.tsx
import * as React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'destructive';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white text-neutral-900 border-neutral-200',
      success: 'bg-green-50 text-green-900 border-green-200',
      destructive: 'bg-red-50 text-red-900 border-red-200'
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={`relative w-full rounded-lg border p-4 ${variantClasses[variant]} ${className || ''}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Alert.displayName = "Alert"

export { Alert }
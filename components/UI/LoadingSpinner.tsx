interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'orange' | 'blue' | 'green' | 'gray';
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'orange', 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const colorClasses = {
    orange: 'border-orange-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    gray: 'border-gray-600'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div 
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {text && (
        <p className="text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );
}
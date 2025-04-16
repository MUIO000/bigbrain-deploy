const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  fullWidth = false,
  className = ''
}) => {
  // style variants
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:transform active:scale-95 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 active:transform active:scale-95 text-gray-800 focus:ring-blue-500',
    success: 'bg-green-600 hover:bg-green-700 active:bg-green-800 active:transform active:scale-95 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 active:transform active:scale-95 text-white focus:ring-red-500',
    outline: 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 active:transform active:scale-95 focus:ring-blue-500',
  };

  // style sizes
  const sizes = {
    small: 'py-1 px-3 text-sm',
    medium: 'py-2 px-4 text-base',
    large: 'py-3 px-6 text-lg',
  };

  // base classes
  const baseClasses = 'rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow active:shadow-inner';
  const widthClasses = fullWidth ? 'w-full' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed transform-none shadow-none' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
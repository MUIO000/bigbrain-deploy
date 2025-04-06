

const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  };

  const baseClasses = 'font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabledClasses}`}
    >
      {children}
    </button>
  );
};

export default Button;
const InputField = ({
  label,
  type = "text",
  placeholder = "",
  value = "",
  onChange,
  id,
  name,
  error = "",
  helperText = "",
  required = false,
  disabled = false,
  className = "",
}) => (
  <div className={`mb-4 ${className}`}>
    {label && (
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
        ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
        ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
        focus:outline-none focus:ring-2 transition-colors`}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    {helperText && !error && (
      <p className="mt-1 text-sm text-gray-500">{helperText}</p>
    )}
  </div>
);

export default InputField;

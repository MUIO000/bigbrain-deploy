import { useEffect } from 'react';

const SuccessPopup = ({ 
  message, 
  onClose, 
  show = true, 
  autoClose = true,
  autoCloseTime = 3000 
}) => {
  useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, autoCloseTime, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 inset-x-0 flex justify-center items-start z-50 px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full transform transition-all duration-300 translate-y-0 opacity-100">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-2 text-white font-medium">Success</span>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-green-100 focus:outline-none"
              aria-label="Close"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-white rounded-b-lg">
          <p className="text-gray-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;
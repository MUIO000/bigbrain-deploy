import { useState } from 'react';

const CopyToClipboard = ({ text, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center text-blue-600 hover:text-blue-800 focus:outline-none"
    >
      {children}
      {copied && (
        <span className="ml-2 text-xs text-green-600 animate-fade-in-out">
          Copied!
        </span>
      )}
    </button>
  );
};

export default CopyToClipboard;
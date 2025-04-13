import Button from './Button';
import CopyToClipboard from './CopyToClipboard';

const StartSessionPopup = ({ sessionId, onClose, show }) => {
  if (!show) return null;

  const playLink = `${window.location.origin}/play?session=${sessionId}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-800">
            Game Session Started
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">Session ID:</p>
          <div className="border rounded p-3 bg-gray-50 flex justify-between items-center">
            <span className="font-mono">{sessionId}</span>
            <CopyToClipboard text={sessionId}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </CopyToClipboard>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">Share link with players:</p>
          <div className="border rounded p-3 bg-gray-50 flex justify-between items-center">
            <span className="font-mono text-sm truncate">{playLink}</span>
            <CopyToClipboard text={playLink}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </CopyToClipboard>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="primary"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StartSessionPopup;
import { useState, useEffect, useRef } from 'react';

/**
 * VoiceMicButton — Reusable Emerald Green Voice-to-Text microphone button
 * using Web Speech API (en-IN) with pulsing animation and graceful fallback.
 */
export default function VoiceMicButton({
  onTranscript,
  onError,
  ariaLabel = 'Voice to text',
  className = '',
  compact = false,
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  function handleClick() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) {
        onError('Voice typing is not supported in this browser. Please type normally.');
      }
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      setListening(true);

      recognition.onresult = (event) => {
        const spoken = event.results?.[0]?.[0]?.transcript?.trim();
        if (spoken && onTranscript) {
          onTranscript(spoken);
        }
        setListening(false);
      };

      recognition.onerror = () => {
        setListening(false);
        if (onError) {
          onError('Could not hear clearly. Please tap Speak again or type.');
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch {
      setListening(false);
      if (onError) {
        onError('Microphone access unavailable. Please type instead.');
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      title="Speak to type"
      className={`min-h-[52px] rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer transition ${
        listening
          ? 'bg-red-600 border-red-600 text-white mic-pulse'
          : 'bg-[#ECFDF5] hover:bg-emerald-100 border-emerald-300 text-[#047857]'
      } ${compact ? 'min-w-[52px] px-3.5' : 'px-4'} ${className}`}
    >
      <span className="text-lg">🎙️</span>
      <span className={compact ? 'hidden sm:inline' : ''}>
        {listening ? 'Listening...' : 'Speak'}
      </span>
    </button>
  );
}

import { useState, useRef, useCallback, useEffect } from 'react';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface UseVoiceOptions {
  onTranscript: (text: string) => void;
  lang?: string;
}

export function useVoice({ onTranscript, lang = 'en-US' }: UseVoiceOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimText, setInterimText] = useState('');
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const voiceModeRef = useRef(false);
  const speakingRef = useRef(false);
  const shouldListenRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || typeof window.speechSynthesis === 'undefined') {
      setSupported(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim);

      if (finalText.trim()) {
        setInterimText('');
        setVoiceState('processing');
        const text = finalText.trim();
        // Small delay so UI shows processing state before callback fires
        setTimeout(() => onTranscriptRef.current(text), 200);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // benign — just reset
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceState('idle');
      } else {
        setVoiceState('idle');
      }
      setInterimText('');
    };

    recognition.onend = () => {
      setInterimText('');
      if (voiceState !== 'processing' && voiceState !== 'speaking') {
        setVoiceState('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      try { recognition.abort(); } catch { /* noop */ }
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    shouldListenRef.current = true;
    setVoiceState('listening');
    try {
      recognition.start();
    } catch {
      // already started
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    shouldListenRef.current = false;
    try { recognition.stop(); } catch { /* noop */ }
    setVoiceState('idle');
    setInterimText('');
  }, []);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (typeof window.speechSynthesis === 'undefined') {
      onDone?.();
      return;
    }

    // Strip job card formatting — speak only the conversational reply
    const cleanText = text
      .replace(/[\u2022\u25CF]/g, ', ')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      onDone?.();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Prefer a natural-sounding English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith('en') && /natural|enhanced|premium/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    speakingRef.current = true;
    setVoiceState('speaking');

    utterance.onend = () => {
      speakingRef.current = false;
      setVoiceState('idle');
      onDone?.();
    };

    utterance.onerror = () => {
      speakingRef.current = false;
      setVoiceState('idle');
      onDone?.();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window.speechSynthesis !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    speakingRef.current = false;
    setVoiceState('idle');
  }, []);

  // Warm up the voices list (Chrome loads voices asynchronously)
  useEffect(() => {
    if (typeof window.speechSynthesis !== 'undefined') {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return {
    voiceState,
    interimText,
    supported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}

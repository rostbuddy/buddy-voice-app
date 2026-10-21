const AUDIO_BASE = 'https://raw.githubusercontent.com/rostbuddy/Buddy-audio/main';

export const playVoiceClip = (clipName: string) => {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const cleanKey = clipName.replace('_', '-');
    const audio = new Audio(`${AUDIO_BASE}/${cleanKey}.mp3`);
    audio.play().catch((err) => console.log('Audio touch pending:', err));
  } catch (e) {
    console.error('Audio playback error:', e);
  }
};

const AUDIO_BASE = 'https://raw.githubusercontent.com/rostbuddy/Buddy-audio/main';

let currentAudio: HTMLAudioElement | null = null;
let lastPlayedKey = '';
let lastPlayedAt = 0;

export const playVoiceClip = (clipName: string) => {
  try {
    const now = Date.now();
    const cleanKey = clipName.replace('_', '-');

    // अगर वही ऑडियो 1.5 सेकंड के अंदर दोबारा ट्रिगर हुआ, तो रोक दो (No Duplicate/Chorus)
    if (lastPlayedKey === cleanKey && now - lastPlayedAt < 1500) {
      return;
    }

    // अगर कोई ऑडियो पहले से बज रहा है, तो उसे तुरंत चुप कराओ
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    lastPlayedKey = cleanKey;
    lastPlayedAt = now;

    currentAudio = new Audio(`${AUDIO_BASE}/${cleanKey}.mp3`);
    currentAudio.play().catch(() => {});
  } catch (e) {
    console.error('Audio playback error:', e);
  }
};

const CDN_URL = 'https://cdn.jsdelivr.net/gh/rostbuddy/Buddy-audio@main';

export const AUDIO_FILES: Record<string, string> = {
  'task-done': `${CDN_URL}/task-done.mp3`,
  'reminder-set': `${CDN_URL}/reminder-set.mp3`,
  'reminder-alarm': `${CDN_URL}/reminder-alarm.mp3`,
  'reminder-nudge': `${CDN_URL}/reminder-nudge.mp3`,
  'ledger-added': `${CDN_URL}/ledger-added.mp3`,
  'courier-transit': `${CDN_URL}/courier-transit.mp3`,
  'courier-delivered': `${CDN_URL}/courier-delivered.mp3`,
  'fact-fake': `${CDN_URL}/fact-fake.mp3`,
  'fact-genuine': `${CDN_URL}/fact-genuine.mp3`,
  'fact-neutral': `${CDN_URL}/fact-neutral.mp3`
};

export const playVoiceClip = (clipName: string) => {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const key = clipName.replace('_', '-');
    const url = AUDIO_FILES[key];
    if (!url) return;

    const audio = new Audio(url);
    audio.play().catch(e => {
      console.warn("Direct play failed, fallback:", e);
      const audioElem = document.createElement('audio');
      audioElem.src = url;
      audioElem.play().catch(err => console.error(err));
    });
  } catch (e) {
    console.error("Audio trigger error:", e);
  }
};

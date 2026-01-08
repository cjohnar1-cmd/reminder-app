let sequenceTimeout: number | null = null;
let playCount = 0;

// Plays the alarm 3 times with pauses, then calls onComplete
export const playAlarmSequence = (onComplete: () => void) => {
  const audio = document.getElementById('alarm-sound') as HTMLAudioElement;
  if (!audio) return;

  playCount = 0;

  // Internal function to play one iteration
  const playOnce = () => {
    // Safety check: if we've reached 3, stop and reset.
    if (playCount >= 3) {
      onComplete();
      return;
    }

    playCount++;
    audio.currentTime = 0;
    audio.volume = 1.0; // Force Max Volume
    
    // Play the sound
    audio.play().catch(e => console.error("Play failed", e));

    // When this specific 'ring' finishes...
    audio.onended = () => {
      if (playCount < 3) {
        // Wait 2 seconds (2000ms) before the next ring
        sequenceTimeout = window.setTimeout(() => {
          playOnce();
        }, 2000);
      } else {
        // If that was the 3rd ring, wait a brief moment then reset
        sequenceTimeout = window.setTimeout(() => {
          onComplete();
        }, 1000);
      }
    };
  };

  // Start the sequence
  playOnce();
};

export const stopAlarmSequence = () => {
  const audio = document.getElementById('alarm-sound') as HTMLAudioElement;
  
  // 1. Clear any pending next-ring timeouts
  if (sequenceTimeout) {
    clearTimeout(sequenceTimeout);
    sequenceTimeout = null;
  }

  // 2. Stop the audio immediately
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    // Remove the listener so it doesn't trigger logic if we stopped it manually
    audio.onended = null; 
  }

  playCount = 0;
};
// A tiny silent MP3 file in base64 to keep the audio channel open
const SILENT_MP3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAACCAAAAAAAAAAAAAAA//OEMAAAAAAAABiAAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA//OEmAAAAAAAABiAAAAAAAAAAAEAAAAAAAAAAP/zhJgAAAAAAAAYgAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA//OEmAAAAAAAABiAAAAAAAAAAAEAAAAAAAAAAP/zhJgAAAAAAAAYgAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA//OEmAAAAAAAABiAAAAAAAAAAAEAAAAAAAAAAP/zhJgAAAAAAAAYgAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA//OEmAAAAAAAABiAAAAAAAAAAAEAAAAAAAAAAP/zhJgAAAAAAAAYgAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA//OEmAAAAAAAABiAAAAAAAAAAAEAAAAAAAAAAP/zhJgAAAAAAAAYgAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA//OEmAAAAAAAABiAAAAAAAAAAAEAAAAAAAAAAP/zhJgAAAAAAAAYgAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA//OEmAAAAAAAABiAAAAAAAAAAAEAAAAAAAAAAP/zhJgAAAAAAAAYgAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA//OEmAAAAAAAABiAAAAAAAAAAAEAAAAAAAAAAP/zhJgAAAAAAAAYgAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA//OEmAAAAAAAABiAAAAAAAAAAAEAAAAAAAAAAP/zhJgAAAAAAAAYgAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA//OEmAAAAAAAABiAAAAAAAAAAAEAAAAAAAAAAP/zhJgAAAAAAAAYgAAAAAAAAAABAAAAAAAAAAD/84SYAAAAAAAAGIAAAAAAAAAAAQAAAAAAAAAA';

const ALARM_MP3 = 'https://www.soundjay.com/clock/sounds/alarm-clock-01.mp3';

let sequenceTimeout: number | null = null;
let playCount = 0;

// Helper to get the audio element
const getAudioElement = () => document.getElementById('alarm-sound') as HTMLAudioElement;

// 1. START TIMER: Play silent audio on loop to keep phone awake
export const startSilentKeepAlive = () => {
  const audio = getAudioElement();
  if (audio) {
    audio.src = SILENT_MP3;
    audio.loop = true;
    audio.volume = 1.0; // Volume must be > 0 for iOS to consider it "playing"
    audio.play().catch(e => console.log("Silent start failed (user interaction needed?):", e));
  }
};

// 2. STOP/RESET: Stop everything
export const stopAlarmSequence = () => {
  const audio = getAudioElement();
  
  // Clear timeout loop
  if (sequenceTimeout) {
    clearTimeout(sequenceTimeout);
    sequenceTimeout = null;
  }

  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;
    audio.onended = null;
    // Reset src to avoid locking resources, but keep element ready
    audio.src = SILENT_MP3; 
  }
  playCount = 0;
};

// 3. TIMER FINISHED: Switch from silent to real alarm
export const playAlarmSequence = (onComplete: () => void) => {
  const audio = getAudioElement();
  if (!audio) return;

  playCount = 0;
  audio.loop = false; // Disable loop for the alarm logic

  // Internal function to play one alarm ring
  const playOnce = () => {
    if (playCount >= 3) {
      onComplete();
      return;
    }

    playCount++;
    
    // Switch source to the loud alarm
    audio.src = ALARM_MP3;
    audio.load(); // Force reload of new source
    audio.currentTime = 0;
    audio.volume = 1.0;
    
    audio.play()
      .then(() => {
         console.log(`Alarm ring ${playCount}`);
      })
      .catch(e => {
         console.error("Alarm play failed", e);
         // If audio fails, force complete to at least reset UI
         onComplete();
      });

    // When this specific 'ring' finishes...
    audio.onended = () => {
      if (playCount < 3) {
        // Wait 2 seconds before next ring
        sequenceTimeout = window.setTimeout(() => {
          playOnce();
        }, 2000);
      } else {
        // After 3rd ring, wait 1s then reset
        sequenceTimeout = window.setTimeout(() => {
          onComplete();
        }, 1000);
      }
    };
  };

  playOnce();
};

// Deprecated but kept for compatibility if needed, though startSilentKeepAlive replaces it
export const prepareAudio = () => {
    // No-op now, handled by startSilentKeepAlive
};
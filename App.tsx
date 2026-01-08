import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerStatus } from './types';
import { Button } from './Button';
import { TimerDisplay } from './TimerDisplay';
import { TimeWheel } from './TimeWheel';
import { playAlarmSequence, stopAlarmSequence, startSilentKeepAlive } from './sound';
import { Play, Square, RotateCcw, Bell, Trash2, AlertTriangle, X, Check } from 'lucide-react';

// -- WEB WORKER CODE --
// We define this as a string and create a Blob to avoid file loading issues on some static hosts.
// This worker runs in the background and is not paused by the "screen off" state as easily as the main thread.
const WORKER_CODE = `
self.onmessage = function(e) {
  const { command, endTime } = e.data;

  if (command === 'START') {
    if (self.timerId) clearInterval(self.timerId);
    
    self.timerId = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((endTime - now) / 1000);
      
      // Send the seconds left back to the main thread
      self.postMessage({ type: 'TICK', secondsLeft: diff });

      if (diff <= 0) {
        clearInterval(self.timerId);
        self.postMessage({ type: 'COMPLETE' });
      }
    }, 250); // Check 4 times a second for accuracy
  } 
  else if (command === 'STOP') {
    if (self.timerId) {
      clearInterval(self.timerId);
      self.timerId = null;
    }
  }
};
`;

export default function App() {
  const [status, setStatus] = useState<TimerStatus>(TimerStatus.IDLE);
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [selectedHours, setSelectedHours] = useState(0);
  const [showHours, setShowHours] = useState(false); 
  
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Reference to the Worker
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker on Mount
  useEffect(() => {
    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    // Listen for messages from the worker
    workerRef.current.onmessage = (e) => {
      const { type, secondsLeft: workerSeconds } = e.data;
      
      if (type === 'TICK') {
        setSecondsLeft(workerSeconds > 0 ? workerSeconds : 0);
      } else if (type === 'COMPLETE') {
        completeTimer();
      }
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  // -- NOTIFICATIONS --
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const sendNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        // We try to use the system notification sound as a backup
        // if the main alarm is blocked by another app (like YouTube)
        new Notification("Reminder", {
          body: "Timer Finished! Check the stove.",
          requireInteraction: true,
          icon: "/favicon.ico",
          // @ts-ignore - 'silent' is a valid option on some browsers
          silent: false 
        });
      } catch (e) {
        console.error("Notification failed", e);
      }
    }
  };

  // -- TIMER LOGIC --

  const completeTimer = () => {
    setStatus(TimerStatus.COMPLETED);
    sendNotification();

    // Trigger Vibrate on Android (if supported)
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // Play the 3-ring sequence.
    playAlarmSequence(() => {
       stopAndReset();
    });
  };

  // -- HANDLERS --

  const startTimer = async () => {
    const totalMinutes = (selectedHours * 60) + selectedMinutes;
    if (totalMinutes <= 0) return;
    
    // 1. Request Permission
    requestNotificationPermission();

    // 2. Start Silent Keep-Alive Audio (To keep Audio Context awake)
    startSilentKeepAlive();

    const now = Date.now();
    const targetTime = now + (totalMinutes * 60 * 1000);
    
    setSecondsLeft(totalMinutes * 60);
    setStatus(TimerStatus.RUNNING);

    // 3. Start the Worker
    if (workerRef.current) {
        workerRef.current.postMessage({ command: 'START', endTime: targetTime });
    }
  };

  const handleCancelRequest = () => {
    if (status === TimerStatus.RUNNING) {
      setShowCancelConfirm(true);
    } else {
      stopAndReset();
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    stopAndReset();
  };

  const abortCancel = () => {
    setShowCancelConfirm(false);
  };

  const stopAndReset = () => {
    // Stop audio immediately
    stopAlarmSequence();
    
    // Stop Worker
    if (workerRef.current) {
        workerRef.current.postMessage({ command: 'STOP' });
    }
    
    setStatus(TimerStatus.IDLE);
    setSecondsLeft(0);
    setShowCancelConfirm(false);

    setSelectedMinutes(0);
    setSelectedHours(0);
  };

  const clearSelection = () => {
    if (status === TimerStatus.IDLE) {
      setSelectedMinutes(0);
      setSelectedHours(0);
    }
  };

  const toggleHours = () => {
    setShowHours(!showHours);
    if (showHours) {
        setSelectedHours(0);
    }
  };

  const isRunning = status === TimerStatus.RUNNING;
  const isRinging = status === TimerStatus.COMPLETED;
  const totalSelectedMinutes = (selectedHours * 60) + selectedMinutes;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-lg mx-auto shadow-2xl border-x-2 border-slate-900 relative">
      
      {/* CONFIRMATION MODAL */}
      {showCancelConfirm && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-4 border-amber-500 rounded-3xl p-6 w-full shadow-2xl flex flex-col gap-8">
            <div className="flex flex-col items-center gap-4 text-amber-500">
              <AlertTriangle size={80} strokeWidth={1.5} />
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-white">STOP TIMER?</h2>
                <p className="text-slate-300 text-xl font-medium leading-relaxed">
                  Do you really want to clear the timer?
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={abortCancel}
                className="bg-slate-700 hover:bg-slate-600 text-white p-6 rounded-2xl font-black text-xl flex flex-col items-center gap-2 border-b-4 border-black/20 active:scale-95 transition-all"
              >
                <X size={32} />
                NO
              </button>
              <button 
                onClick={confirmCancel}
                className="bg-red-600 hover:bg-red-500 text-white p-6 rounded-2xl font-black text-xl flex flex-col items-center gap-2 border-b-4 border-black/20 active:scale-95 transition-all"
              >
                <Check size={32} />
                YES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-center gap-3 py-6 bg-slate-900 shadow-md z-10 border-b border-slate-800 relative">
        <div className="relative">
            <div className="absolute inset-0 bg-amber-500 blur-lg opacity-20 rounded-full"></div>
            <Bell size={32} className="text-amber-500 relative z-10" fill="currentColor" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-100 uppercase">
          Reminder
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 gap-6">

        {/* --- IDLE STATE --- */}
        {!isRunning && !isRinging && (
          <div className="flex flex-col gap-6 animate-fade-in h-full">
            
            <div className="text-center space-y-2 py-4">
              <div className="flex items-baseline justify-center gap-2">
                {showHours && (
                    <>
                    <span className="text-6xl font-black text-white">{selectedHours}</span>
                    <span className="text-2xl text-slate-500 font-bold mr-4">hr</span>
                    </>
                )}
                <span className="text-6xl font-black text-white">{selectedMinutes}</span>
                <span className="text-2xl text-slate-500 font-bold">min</span>
              </div>
              
              <button 
                onClick={toggleHours}
                className={`
                   mt-4 px-6 py-2 rounded-full font-bold text-sm tracking-widest border-2 transition-all
                   ${showHours 
                     ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                     : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}
                `}
              >
                {showHours ? 'HIDE HOURS' : 'ADD HOURS'}
              </button>
            </div>

            <div className="flex gap-4">
                {showHours && (
                    <div className="flex-1 flex flex-col gap-2">
                        <TimeWheel 
                            range={12} 
                            value={selectedHours} 
                            onChange={setSelectedHours} 
                        />
                        <div className="text-center">
                          <span className="text-amber-400 font-black tracking-widest text-lg">HOURS</span>
                        </div>
                    </div>
                )}
                
                <div className="flex-1 flex flex-col gap-2">
                    <TimeWheel 
                        range={60} 
                        value={selectedMinutes} 
                        onChange={setSelectedMinutes} 
                    />
                    <div className="text-center">
                      <span className="text-amber-400 font-black tracking-widest text-lg">MINUTES</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-auto mb-4">
               <button 
                 onClick={clearSelection}
                 disabled={totalSelectedMinutes === 0}
                 className="col-span-1 bg-slate-800 disabled:opacity-30 rounded-2xl flex flex-col items-center justify-center text-slate-400 active:bg-slate-700 active:scale-95 transition-all border-b-4 border-black/20"
               >
                 <Trash2 size={32} />
                 <span className="text-sm font-bold mt-1">CLEAR</span>
               </button>

               <button 
                 onClick={startTimer}
                 disabled={totalSelectedMinutes === 0}
                 className={`
                    col-span-2 rounded-2xl p-6
                    flex flex-col items-center justify-center gap-2
                    font-black text-3xl tracking-wide shadow-lg
                    transition-all duration-200 border-b-4 border-black/20
                    ${totalSelectedMinutes > 0 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 active:scale-95' 
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                 `}
               >
                 <Play size={40} fill="currentColor" />
                 START
               </button>
            </div>
          </div>
        )}

        {/* --- RUNNING STATE --- */}
        {isRunning && (
          <div className="flex flex-col flex-1 items-center justify-between py-8 animate-fade-in">
            <div className="text-center space-y-2">
              <p className="text-slate-400 uppercase tracking-widest text-sm font-bold">Timer Running</p>
              <div className="inline-block bg-slate-800 px-4 py-1 rounded-full">
                 <p className="text-emerald-400 text-xs font-bold animate-pulse">Running in Background</p>
              </div>
            </div>

            <TimerDisplay 
              totalSeconds={secondsLeft} 
              isHighAlert={false} 
            />
            
            <Button 
              label="CANCEL TIMER" 
              onClick={handleCancelRequest} 
              colorClass="bg-slate-800 hover:bg-slate-700 text-slate-300 w-full border-slate-700" 
              icon={<RotateCcw size={32} />}
            />
          </div>
        )}

        {/* --- RINGING STATE --- */}
        {isRinging && (
          <div className="flex flex-col flex-1 items-center justify-center gap-8">
            <div className="text-center">
              <h2 className="text-5xl font-black text-red-500 mb-4">TIME IS UP!</h2>
              <p className="text-white text-2xl font-bold">Check the stove!</p>
            </div>
            
            <TimerDisplay 
              totalSeconds={0} 
              isHighAlert={true} 
            />

            <Button 
              label="STOP ALARM" 
              onClick={stopAndReset} 
              colorClass="bg-red-600 hover:bg-red-500 text-white w-full py-12 shadow-red-900/50" 
              icon={<Square size={64} fill="currentColor" />}
              fontSize="text-4xl"
              fullWidth
            />
            
            <p className="text-slate-500 text-sm font-medium">Auto-stopping after 3 rings...</p>
          </div>
        )}

      </main>
    </div>
  );
}
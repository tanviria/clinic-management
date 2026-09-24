'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Clock, Volume2, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';

export default function TVQueueDisplay() {
  const [queueData, setQueueData] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/queue');
      if (res.ok) {
        const data = await res.json();
        setQueueData(data.queueByDoctor || []);
        setLastRefreshed(new Date());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Poll every 5s for live TV display
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio chime simulated');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top TV Bar */}
      <header className="flex h-20 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-8 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-slate-950 font-black shadow-lg shadow-teal-500/20">
            <Activity className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              CarePoint Medical & Diagnostic Center
              <span className="text-xs bg-teal-500/20 text-teal-400 font-semibold px-2 py-0.5 rounded-full border border-teal-500/30">
                LIVE QUEUE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Please watch the screen for your Token Number & Chamber Room
            </p>
          </div>
        </div>

        {/* Live Clock & Controls */}
        <div className="flex items-center space-x-6">
          <button
            onClick={playChime}
            className="flex items-center rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
            title="Test Announcement Chime"
          >
            <Volume2 className="mr-1.5 h-4 w-4 text-teal-400" />
            Sound Chime
          </button>

          <div className="text-right">
            <div className="text-2xl font-mono font-bold tracking-wider text-teal-400">
              {currentTime}
            </div>
            <div className="text-[11px] text-slate-400">
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>

          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Main Queue Cards Grid */}
      <main className="flex-1 p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {queueData.map((item) => {
            const isServing = !!item.currentlyServing;
            return (
              <div
                key={item.doctor.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm transition-all"
              >
                {/* Doctor Room Header */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded-lg bg-teal-500/10 border border-teal-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400">
                      {item.doctor.chamberRoom || 'Chamber Room 1'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center">
                      <Clock className="mr-1 h-3.5 w-3.5 text-slate-500" />
                      {item.waitingCount} in line
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-bold text-white tracking-tight">
                    {item.doctor.name}
                  </h2>
                  <p className="text-xs text-slate-400">{item.doctor.specialization}</p>
                </div>

                {/* Now Serving Big Display */}
                <div className="my-6 rounded-xl border border-teal-500/20 bg-gradient-to-b from-teal-950/40 to-slate-900/80 p-6 text-center shadow-inner">
                  <div className="text-xs font-bold uppercase tracking-widest text-teal-400/90">
                    NOW SERVING
                  </div>
                  {isServing ? (
                    <div className="mt-2">
                      <div className="text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
                        {item.currentlyServing.tokenNumber}
                      </div>
                      <div className="mt-2 text-base font-semibold text-slate-200">
                        {item.currentlyServing.patient.name}
                      </div>
                      <div className="text-xs text-teal-300 font-medium">
                        Please Enter Chamber
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-slate-500 font-medium text-sm">
                      Consultation in preparation
                    </div>
                  )}
                </div>

                {/* Next In Line */}
                <div className="border-t border-slate-800/80 pt-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Up Next
                  </div>
                  {item.nextPatient ? (
                    <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-sm">
                      <span className="font-mono font-bold text-amber-400">
                        Token {item.nextPatient.tokenNumber}
                      </span>
                      <span className="text-slate-300 truncate max-w-[160px]">
                        {item.nextPatient.patient.name}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        Be Ready
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-1">No other patients waiting</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Ticker */}
      <footer className="h-12 border-t border-slate-800 bg-slate-900 px-8 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Sync Active</span>
          <span className="text-slate-600">&bull;</span>
          <span>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
        </div>
        <div>CarePoint Clinical Management Platform &bull; Powered by ClinicPro</div>
      </footer>
    </div>
  );
}

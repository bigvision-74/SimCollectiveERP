import { useState, useEffect, useRef } from "react";

export const useSessionTimer = (
  startTime: string | null,
  duration: number | string,
  onExpire?: () => void
) => {
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [label, setLabel] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (!startTime || !duration) return;

    const calculate = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const durationNum = Number(duration);

      const end = start + durationNum * 60 * 1000;
      
      const hasTimeRunOut = now >= end;

      if (hasTimeRunOut) {
        setDisplayTime("00:00:00");
        setIsUrgent(true);
        setIsExpired(true);

        if (!hasExpiredRef.current && onExpire) {
          hasExpiredRef.current = true;
          onExpire();
        }
        return;
      } 
      
      hasExpiredRef.current = false;
      setIsExpired(false);

      const isLongDuration = durationNum > 60;

      if (isLongDuration) {
        setLabel("Elapsed");
        const diff = Math.floor((now - start) / 1000);
        setDisplayTime(formatTime(diff));
        setIsUrgent(false);
      } else {
        setLabel("Time Remaining");
        const diff = Math.floor((end - now) / 1000);
        setDisplayTime(formatTime(diff));
        setIsUrgent(diff < 300); 
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration, onExpire]);

  return { displayTime, label, isUrgent, isExpired };
};

const formatTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h > 0 ? h + ":" : ""}${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
};
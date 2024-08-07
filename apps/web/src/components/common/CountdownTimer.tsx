import clsx from "clsx";
import { getTime } from "date-fns";
import { useEffect, useState } from "react";

type CountdownTimerProps = {
  initialTime: number;
  className?: string;
};

export const useCountdownTimer = (initialTime: number) => {
  const [countDownTime, setCountDownTIme] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  let intervalId: NodeJS.Timer;

  const getTimeDifference = (initialTime: number) => {
    const currentTime = getTime(new Date());

    const timeDiffrence = Math.abs(initialTime - currentTime);
    const days =
      Math.floor(timeDiffrence / (24 * 60 * 60 * 1000)) >= 10
        ? Math.floor(timeDiffrence / (24 * 60 * 60 * 1000))
        : `0${Math.floor(timeDiffrence / (24 * 60 * 60 * 1000))}`;

    const hours =
      Math.floor((timeDiffrence % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60)) >=
      10
        ? Math.floor((timeDiffrence % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60))
        : `0${Math.floor(
            (timeDiffrence % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60)
          )}`;
    const minutes =
      Math.floor((timeDiffrence % (60 * 60 * 1000)) / (1000 * 60)) >= 10
        ? Math.floor((timeDiffrence % (60 * 60 * 1000)) / (1000 * 60))
        : `0${Math.floor((timeDiffrence % (60 * 60 * 1000)) / (1000 * 60))}`;
    const seconds =
      Math.floor((timeDiffrence % (60 * 1000)) / 1000) >= 10
        ? Math.floor((timeDiffrence % (60 * 1000)) / 1000)
        : `0${Math.floor((timeDiffrence % (60 * 1000)) / 1000)}`;
    if (timeDiffrence < 0) {
      setCountDownTIme({
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      });
      clearInterval(intervalId);
    } else {
      setCountDownTIme({
        days: days.toString(),
        hours: hours.toString(),
        minutes: minutes.toString(),
        seconds: seconds.toString(),
      });
    }
  };

  useEffect(() => {
    if (Number.isInteger(initialTime)) {
      intervalId = setInterval(() => {
        getTimeDifference(initialTime);
      }, 1000);
    }
    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTime]);
  return { countDownTime };
};

export const CountdownTimer = ({
  initialTime,
  className,
}: CountdownTimerProps) => {
  const { countDownTime } = useCountdownTimer(initialTime);
  return (
    <div
      className={clsx(
        className,
        "flex h-full w-full flex-col items-center justify-center gap-8 sm:gap-16"
      )}
    >
      <div className="flex justify-center gap-3">
        <div className="relative flex flex-col items-center gap-1">
          <div className="flex items-center justify-between rounded-lg bg-primary/30 px-2 py-1 text-center">
            <span className="text-center font-semibold text-primary">
              {countDownTime?.days}
            </span>
          </div>
          <span className="text-center text-xs capitalize text-black/60">
            {+countDownTime?.days == 1 ? "Day" : "Days"}
          </span>
        </div>
        :
        <div className="relative flex flex-col items-center gap-1">
          <div className="flex items-center justify-between rounded-lg bg-primary/30 px-2 py-1 text-center">
            <span className="text-center font-semibold text-primary">
              {countDownTime?.hours}
            </span>
          </div>
          <span className="text-center text-xs font-medium text-black/60">
            {+countDownTime?.hours == 1 ? "Hour" : "Hours"}
          </span>
        </div>
        :
        <div className="relative flex flex-col items-center gap-1">
          <div className="flex items-center justify-between rounded-lg bg-primary/30 px-2 py-1 text-center">
            <span className="text-center font-semibold text-primary">
              {countDownTime?.minutes}
            </span>
          </div>
          <span className="text-center text-xs capitalize text-black/60">
            {+countDownTime?.minutes == 1 ? "Minute" : "Minutes"}
          </span>
        </div>
        :
        <div className="relative flex flex-col items-center gap-1">
          <div className="flex items-center justify-between rounded-lg bg-primary/30 px-2 py-1 text-center">
            <span className="text-center font-semibold text-primary">
              {countDownTime?.seconds}
            </span>
          </div>
          <span className="text-center text-xs capitalize text-black/60">
            {+countDownTime?.seconds == 1 ? "Second" : "Seconds"}
          </span>
        </div>
      </div>
    </div>
  );
};

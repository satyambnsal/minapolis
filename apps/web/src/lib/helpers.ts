import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function walletInstalled() {
  return typeof mina !== "undefined";
}

export const formatAddress = (address: string | undefined) =>
  address ? address.slice(0, 5) + "..." + address.slice(-5) : "None";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestampToReadableDate(timestamp: string): string {
  const date = new Date(timestamp);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  };

  return date.toLocaleDateString('en-US', options);
}

export function formatTimestampToReadableAge(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    const minutes = diffInMinutes % 60;
    return minutes === 0 ? `${diffInHours} hours` : `${diffInHours} hours ${minutes} minutes`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  const hours = diffInHours % 24;
  return hours === 0 ? `${diffInDays} days` : `${diffInDays} days ${hours} hours`;
}

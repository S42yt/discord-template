const regex = /(\d+)([dhms])/g;

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

export function parseDuration(time: string): number | null {
  let match;
  let duration = 0;
  while ((match = regex.exec(time.toLocaleLowerCase())) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case "d":
        duration += value * day;
        break;
      case "h":
        duration += value * hour;
        break;
      case "m":
        duration += value * minute;
        break;
      case "s":
        duration += value * second;
        break;
      default:
        return null;
    }
  }

  return duration > 0 ? duration : null;
}

export function formatDuration(duration: number): string {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "Day" : "Days"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "Hour" : "Hours"}`);
  if (minutes > 0)
    parts.push(`${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`);
  if (seconds > 0)
    parts.push(`${seconds} ${seconds === 1 ? "Second" : "Seconds"}`);

  return parts.join(", ");
}

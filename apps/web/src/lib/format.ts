export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

export function formatWatchTime(seconds: number): string {
  if (seconds < 60) return seconds > 0 ? '<1m' : '0m'
  const totalMinutes = Math.floor(seconds / 60)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  return `${minutes}m`
}

export function formatRating(value: number | undefined | null): string | null {
  if (value === undefined || value === null || value <= 0) return null
  return value.toFixed(1)
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

export function formatDate(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date)
}

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function formatRelative(timestamp: number, now = Date.now()): string {
  const diffSeconds = Math.round((timestamp - now) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(diffSeconds) >= size) {
      return relativeFormatter.format(Math.round(diffSeconds / size), unit)
    }
  }
  return 'just now'
}

export function episodeLabel(
  season: number | null | undefined,
  episode: number | null | undefined,
) {
  if (season === null || season === undefined || episode === null || episode === undefined) {
    return null
  }
  return `S${season} E${episode}`
}

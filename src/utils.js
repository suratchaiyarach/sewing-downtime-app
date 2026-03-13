export const today = () => new Date().toISOString().split('T')[0]

export const nowTime = () => new Date().toTimeString().slice(0, 5)

export const fmtDur = (m) => {
  if (m <= 0) return '0m'
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export const fmtElapsed = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/** Calculate duration in minutes from HH:MM start/end strings */
export const calcDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? diff : 0
}

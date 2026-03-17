export type DeadlineStatus = 'urgent' | 'soon' | 'none' | 'done' | 'wont_fix'

export function getDeadlineStatus(
  deadline: string | null,
  status: string
): DeadlineStatus {
  if (status === 'done') return 'done'
  if (status === 'wont_fix') return 'wont_fix'
  if (!deadline) return 'none'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  d.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'none'
  if (diffDays <= 1) return 'urgent'
  if (diffDays <= 7) return 'soon'
  return 'none'
}

export function getBorderClass(deadlineStatus: DeadlineStatus): string {
  switch (deadlineStatus) {
    case 'done':
      return 'border-l-green-500'
    case 'wont_fix':
      return 'border-l-gray-400'
    case 'urgent':
      return 'border-l-[#E24B4A]'
    case 'soon':
      return 'border-l-[#EF9F27]'
    default:
      return 'border-l-gray-300'
  }
}

export function getGradeBadgeClass(grade: string, status: string): string {
  if (status === 'done') return 'bg-green-100 text-green-800'
  if (status === 'wont_fix') return 'bg-gray-100 text-gray-400 line-through'

  const g = grade.toLowerCase().trim()

  if (['0', '1', '1*', 'ma', 'ma*'].includes(g)) {
    return 'bg-red-100 text-red-800'
  }

  if (g.includes('/')) {
    const parts = g.split('/')
    const num = parseFloat(parts[0])
    const den = parseFloat(parts[1])
    if (!isNaN(num) && !isNaN(den) && den > 0) {
      return num / den < 0.6 ? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800'
    }
  }

  if (g === '2') return 'bg-amber-100 text-amber-800'

  return 'bg-gray-100 text-gray-700'
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min tagasi`
  if (diffHours < 24) return `${diffHours} t tagasi`
  if (diffDays < 7) return `${diffDays} p tagasi`
  return formatDate(dateStr)
}

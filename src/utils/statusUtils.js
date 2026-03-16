export const STATUS_CONFIG = {
  done: {
    label: 'DONE',
    cls: 'bg-jira-green-light text-jira-green border border-green-300',
    hoverCls: 'hover:bg-green-200',
  },
  progress: {
    label: 'IN PROGRESS',
    cls: 'bg-jira-blue-light text-jira-blue-dark border border-blue-300',
    hoverCls: 'hover:bg-blue-200',
  },
  canceled: {
    label: 'CANCELED',
    cls: 'bg-jira-red-light text-jira-red border border-red-300',
    hoverCls: 'hover:bg-red-200',
  },
  none: {
    label: '',
    cls: 'bg-jira-bg text-jira-mid border border-jira-border',
    hoverCls: 'hover:bg-gray-200',
  },
}

export function nextStatus(current) {
  const order = ['none', 'progress', 'done', 'canceled']
  const idx = order.indexOf(current || 'none')
  return order[(idx + 1) % order.length]
}

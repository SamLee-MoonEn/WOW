export default function Button({ children, variant = 'secondary', size = 'md', onClick, type = 'button', className = '' }) {
  const base = 'inline-flex items-center gap-1.5 rounded font-medium transition-all cursor-pointer border-0 select-none'

  const variants = {
    primary:   'bg-white text-jira-blue hover:bg-blue-50',
    secondary: 'bg-white/15 text-white border border-white/30 hover:bg-white/25',
    danger:    'bg-[#de350b] text-white hover:bg-jira-red',
    outline:   'bg-white text-jira-mid border border-jira-border hover:bg-jira-bg hover:text-jira-dark',
    ghost:     'bg-transparent text-jira-muted hover:bg-jira-bg hover:text-jira-dark',
  }

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-[13px]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

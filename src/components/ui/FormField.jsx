export function FormField({ label, required, hint, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-jira-mid uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-[#de350b] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-jira-muted mt-1">{hint}</p>}
    </div>
  )
}

const inputBase = 'w-full px-2.5 py-2 border-2 border-jira-border rounded text-[13px] text-jira-dark bg-white transition-colors font-[inherit] focus:outline-none focus:border-jira-blue focus:bg-blue-50'

export function Input({ className = '', ...props }) {
  return <input className={`${inputBase} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${inputBase} min-h-[80px] resize-y ${className}`} {...props} />
}

export function Select({ children, className = '', ...props }) {
  return (
    <select className={`${inputBase} ${className}`} {...props}>
      {children}
    </select>
  )
}

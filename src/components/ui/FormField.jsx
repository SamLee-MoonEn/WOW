export function FormField({ label, required, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-jira-mid uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-[#de350b] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputBase = 'w-full px-2.5 py-2 border-2 border-jira-border rounded text-[13px] text-jira-dark bg-white transition-colors font-[inherit] focus:outline-none focus:border-jira-blue focus:bg-blue-50'

export function Input({ ...props }) {
  return <input className={inputBase} {...props} />
}

export function Textarea({ ...props }) {
  return <textarea className={`${inputBase} min-h-[80px] resize-y`} {...props} />
}

export function Select({ children, ...props }) {
  return (
    <select className={inputBase} {...props}>
      {children}
    </select>
  )
}

export default function MemberAvatar({ member, size = 'md' }) {
  const sizes = {
    sm:  { box: 'w-6 h-6',   text: 'text-sm' },
    md:  { box: 'w-8 h-8',   text: 'text-xl' },
    lg:  { box: 'w-10 h-10', text: 'text-3xl' },
    xl:  { box: 'w-14 h-14', text: 'text-4xl' },
  }
  const s = sizes[size] || sizes.md

  if (member.photoUrl) {
    return (
      <img
        src={member.photoUrl}
        alt={member.name}
        className={`${s.box} rounded-full object-cover flex-shrink-0 border border-jira-border`}
      />
    )
  }
  return <span className={`${s.text} flex-shrink-0`}>{member.emoji}</span>
}

export const tones = { teal: '#74e3cf', violet: '#baa7f3', amber: '#f1c27e', coral: '#f5a697' }

export function Lines({ x, y, lines, className = 'cd-label', anchor = 'middle', gap = 21 }) {
  return <text x={x} y={y} textAnchor={anchor} className={className}>{lines.map((line, i) => <tspan key={i} x={x} dy={i ? gap : 0}>{line}</tspan>)}</text>
}

export function SceneBase({ id, title, detail, children, ...props }) {
  return <svg className="aw-scene cd-scene" viewBox="0 0 640 430" role="img" aria-labelledby={`${id}-title ${id}-description`} {...props}>
    <title id={`${id}-title`}>{title}</title><desc id={`${id}-description`}>{detail}</desc>
    <defs>
      <pattern id={`${id}-grid`} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#d9eaf6" opacity=".1" /></pattern>
      {Object.entries(tones).map(([name, color]) => <marker key={name} id={`${id}-${name}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="m1 1 8 4-8 4" fill="none" stroke={color} strokeWidth="1.5" /></marker>)}
    </defs>
    <rect width="640" height="430" fill={`url(#${id}-grid)`} />
    {children}
  </svg>
}

export function Wire({ id, d, active, tone = 'teal', dash = false, phase = 0, both = false }) {
  return <g className="cd-wire" data-active={active ? 'true' : 'false'}>
    <path d={d} fill="none" stroke={tones[tone]} strokeWidth={active ? 2.6 : 1.2} opacity={active ? .95 : .18} strokeDasharray={dash ? '5 6' : undefined} markerEnd={`url(#${id}-${tone}-arrow)`} markerStart={both ? `url(#${id}-${tone}-arrow)` : undefined} />
    {active && <path d={d} fill="none" stroke="#eafff9" strokeWidth="3" pathLength="100" strokeDasharray="5 95" strokeDashoffset={-((phase * 29) % 100)} opacity=".8" />}
  </g>
}

export function Card({ x, y, width = 192, height = 66, title, lines = [], tone = 'teal', active, number, muted = false }) {
  return <g className="cd-card" opacity={muted ? .35 : 1} data-active={active ? 'true' : 'false'}>
    <rect x={x} y={y} width={width} height={height} rx="12" fill={active ? '#17333e' : '#101f31'} stroke={tones[tone]} strokeOpacity={active ? .95 : .3} strokeWidth={active ? 1.8 : 1} />
    {number && <text x={x + 13} y={y + 22} className="cd-number" fill={tones[tone]}>{number}</text>}
    <text x={x + width / 2} y={y + 26} textAnchor="middle" className="cd-card-title">{title}</text>
    {lines.length > 0 && <Lines x={x + width / 2} y={y + 49} lines={lines} className="cd-small" gap={19} />}
  </g>
}

export function Select({ label, value, onChange, children, ready }) {
  return <label className="cd-select"><span>{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)} disabled={!ready}>{children}</select></label>
}

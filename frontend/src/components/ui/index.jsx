export function Button({ children, onClick, variant = 'primary', disabled, className = '', type = 'button' }) {
  const base = 'px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[#00d4ff] text-[#0a0f1e] hover:opacity-85',
    secondary: 'bg-[#6366f1] text-white hover:opacity-85',
    danger: 'bg-[#ef4444] text-white hover:opacity-85',
    ghost: 'border border-[#2d3748] text-[#94a3b8] hover:border-[#00d4ff] hover:text-[#00d4ff]',
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
}

export function Input({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-[#94a3b8]">{label}</label>}
      <input className="input-field" {...props} />
      {error && <span className="text-xs text-[#ef4444]">{error}</span>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Badge({ children, color = '#94a3b8' }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color, background: `${color}22`, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

export function Spinner({ size = 24 }) {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full border-t-2 border-[#00d4ff]" style={{ width: size, height: size, borderColor: 'transparent', borderTopColor: '#00d4ff' }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#f1f5f9]">{title}</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Table({ columns, data, emptyMsg = 'No data' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2d3748]">
            {columns.map(c => <th key={c.key} className="text-left py-2 px-3 text-[#94a3b8] font-medium">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.length === 0
            ? <tr><td colSpan={columns.length} className="text-center py-8 text-[#94a3b8]">{emptyMsg}</td></tr>
            : data.map((row, i) => (
              <tr key={i} className="border-b border-[#2d3748]/50 hover:bg-[#1f2d3d]/50 transition-colors">
                {columns.map(c => <td key={c.key} className="py-2 px-3 text-[#f1f5f9]">{c.render ? c.render(row) : row[c.key]}</td>)}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

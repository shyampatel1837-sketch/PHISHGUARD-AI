import React from 'react'
import { Cpu, CheckCircle, AlertTriangle } from 'lucide-react'

/**
 * ModelStatusBadge — compact indicator of ML model connection state.
 * Used in the sidebar footer, dashboard, and model insights page.
 */
export default function ModelStatusBadge({ status, size = 'sm' }) {
  const configs = {
    not_connected: {
      icon: <Cpu size={12} />,
      label: 'Model Not Connected',
      className: 'badge badge-muted',
    },
    loaded: {
      icon: <CheckCircle size={12} />,
      label: 'Model Ready',
      className: 'badge badge-emerald',
    },
    error: {
      icon: <AlertTriangle size={12} />,
      label: 'Model Error',
      className: 'badge badge-rose',
    },
  }

  const cfg = configs[status] || configs.not_connected

  return (
    <span className={cfg.className}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

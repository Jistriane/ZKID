import { Button } from './ui/Button'

interface CredentialCardProps {
  id: string
  type: string
  issueDate: string
  expiryDate: string
  status: 'active' | 'pending' | 'revoked'
}

export function CredentialCard({ id, type, issueDate, expiryDate, status }: CredentialCardProps) {
  const statusClass = {
    active: 'badge-success',
    pending: 'badge-warning',
    revoked: 'badge-error',
  }[status]

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-lg md:text-xl mb-1">{type}</h3>
          <p className="text-sm text-slate-400 m-0">ID: {id.slice(0, 16)}…</p>
        </div>
        <span className={`badge ${statusClass}`}>{status}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-slate-400 m-0 mb-1">Issued on</p>
          <p className="font-semibold m-0">{issueDate}</p>
        </div>
        <div>
          <p className="text-slate-400 m-0 mb-1">Expires on</p>
          <p className="font-semibold m-0">{expiryDate}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" className="flex-1">View Details</Button>
        {status === 'active' && (
          <Button variant="danger" size="sm" className="flex-1">Revoke</Button>
        )}
      </div>
    </div>
  )
}

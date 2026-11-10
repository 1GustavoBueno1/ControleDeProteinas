import type { ReactNode } from 'react'
import type { Role } from '../types/usuario'
import { useAuth } from './useAuth'

interface Props {
  roles: Role[]
  children: ReactNode
  fallback?: ReactNode
}

// Só esconde interface: quem de fato barra a escrita são as Firestore Security Rules.
export function RequireRole({ roles, children, fallback = null }: Props) {
  const { estado } = useAuth()
  const permitido = estado.status === 'logado' && roles.includes(estado.usuario.role)
  return <>{permitido ? children : fallback}</>
}

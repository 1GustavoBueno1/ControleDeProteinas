export type Role = 'adm' | 'churras'

export interface Usuario {
  uid: string
  email: string
  role: Role
}

export function ehRole(valor: unknown): valor is Role {
  return valor === 'adm' || valor === 'churras'
}

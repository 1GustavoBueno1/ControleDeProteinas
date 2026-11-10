import { createContext } from 'react'
import type { Usuario } from '../types/usuario'

export type EstadoAuth =
  | { status: 'carregando' }
  | { status: 'deslogado' }
  | { status: 'semAcesso'; email: string; motivo: string }
  | { status: 'logado'; usuario: Usuario }

export interface AuthContextValue {
  estado: EstadoAuth
  // Rejeita com um Error cuja message já está em português, pronta para exibir.
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

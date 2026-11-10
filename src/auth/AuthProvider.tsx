import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { FirebaseError } from 'firebase/app'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { buscarRole } from '../services/usuariosService'
import { AuthContext, type EstadoAuth } from './AuthContext'

async function carregarEstado(user: User): Promise<EstadoAuth> {
  const email = user.email ?? ''
  try {
    const resultado = await buscarRole(user.uid)
    if (!resultado.ok) return { status: 'semAcesso', email, motivo: resultado.motivo }
    return { status: 'logado', usuario: { uid: user.uid, email, role: resultado.role } }
  } catch (erro) {
    console.error('Falha ao ler usuarios/{uid}:', erro)
    const codigo = erro instanceof FirebaseError ? erro.code : 'desconhecido'
    return {
      status: 'semAcesso',
      email,
      motivo: `Não foi possível ler sua permissão (${codigo}).`,
    }
  }
}

function mensagemDeErroLogin(erro: unknown): string {
  if (!(erro instanceof FirebaseError)) return 'Não foi possível entrar. Tente de novo.'
  switch (erro.code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha incorretos.'
    case 'auth/user-disabled':
      return 'Este usuário está desativado.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
    case 'auth/network-request-failed':
      return 'Sem conexão. Verifique a internet e tente de novo.'
    default:
      return 'Não foi possível entrar. Tente de novo.'
  }
}

async function entrar(email: string, senha: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email, senha)
  } catch (erro) {
    throw new Error(mensagemDeErroLogin(erro), { cause: erro })
  }
}

function sair(): Promise<void> {
  return signOut(auth)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAuth>({ status: 'carregando' })

  useEffect(() => {
    let ativo = true
    const cancelar = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setEstado({ status: 'deslogado' })
        return
      }
      setEstado({ status: 'carregando' })
      void carregarEstado(user).then((novoEstado) => {
        // Ignora a resposta se, enquanto a role carregava, o usuário saiu ou trocou de conta.
        if (ativo && auth.currentUser?.uid === user.uid) setEstado(novoEstado)
      })
    })
    return () => {
      ativo = false
      cancelar()
    }
  }, [])

  const valor = useMemo(() => ({ estado, entrar, sair }), [estado])

  return <AuthContext value={valor}>{children}</AuthContext>
}

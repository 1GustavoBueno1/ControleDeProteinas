import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function lerVariavel(nome: string): string {
  const valor: unknown = import.meta.env[nome]
  if (typeof valor !== 'string' || valor === '') {
    throw new Error(`Variável ${nome} ausente. Copie .env.example para .env e preencha.`)
  }
  return valor
}

const app = initializeApp({
  apiKey: lerVariavel('VITE_FIREBASE_API_KEY'),
  authDomain: lerVariavel('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: lerVariavel('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: lerVariavel('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: lerVariavel('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: lerVariavel('VITE_FIREBASE_APP_ID'),
})

export const auth = getAuth(app)
export const db = getFirestore(app)

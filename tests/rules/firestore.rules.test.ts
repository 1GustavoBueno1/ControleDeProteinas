import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import firebase from 'firebase/compat/app'
import 'firebase/compat/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

// UIDs fictícios: valem só dentro do emulador.
const ADM = 'uid-adm'
const CHURRAS = 'uid-churras'
const SEM_CADASTRO = 'uid-sem-cadastro'
const ROLE_DESCONHECIDA = 'uid-role-desconhecida'

const DIA = '2026-11-11'

const proteinaValida = { nome: 'Fraldinha', precoPorKgCentavos: 4590, ativo: true, criadoEm: new Date() }

const saidaValida = {
  proteinaId: 'fraldinha',
  nomeSnapshot: 'Fraldinha',
  precoPorKgCentavosSnapshot: 4590,
  saidaGramas: 5500,
  retornoGramas: null,
  criadoPor: CHURRAS,
}

let ambiente: RulesTestEnvironment

function como(uid: string) {
  return ambiente.authenticatedContext(uid).firestore()
}

function semLogin() {
  return ambiente.unauthenticatedContext().firestore()
}

beforeAll(async () => {
  ambiente = await initializeTestEnvironment({
    projectId: 'demo-controle-de-proteinas',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await ambiente.cleanup()
})

// Cada teste começa com os dois usuários, uma proteína e três movimentos:
// picanha sem retorno, linguica com retorno 1 kg e costela com retorno 0.
beforeEach(async () => {
  await ambiente.clearFirestore()
  await ambiente.withSecurityRulesDisabled(async (contexto) => {
    const db = contexto.firestore()
    await db.doc(`usuarios/${ADM}`).set({ email: 'adm@gmail.com', role: 'adm' })
    await db.doc(`usuarios/${CHURRAS}`).set({ email: 'churras@gmail.com', role: 'churras' })
    await db.doc(`usuarios/${ROLE_DESCONHECIDA}`).set({ email: 'x@gmail.com', role: 'gerente' })
    await db
      .doc('proteinas/picanha')
      .set({ nome: 'Picanha', precoPorKgCentavos: 8990, ativo: true, criadoEm: new Date() })
    await db.doc(`dias/${DIA}/movimentos/picanha`).set({
      proteinaId: 'picanha',
      nomeSnapshot: 'Picanha',
      precoPorKgCentavosSnapshot: 8990,
      saidaGramas: 5000,
      retornoGramas: null,
      criadoPor: CHURRAS,
    })
    await db.doc(`dias/${DIA}/movimentos/linguica`).set({
      proteinaId: 'linguica',
      nomeSnapshot: 'Linguiça',
      precoPorKgCentavosSnapshot: 2500,
      saidaGramas: 3000,
      retornoGramas: 1000,
      criadoPor: CHURRAS,
    })
    await db.doc(`dias/${DIA}/movimentos/costela`).set({
      proteinaId: 'costela',
      nomeSnapshot: 'Costela',
      precoPorKgCentavosSnapshot: 3250,
      saidaGramas: 4000,
      retornoGramas: 0,
      criadoPor: CHURRAS,
    })
    // Documento em um caminho de data inválida, para testar que nem update passa ali.
    await db.doc('dias/hoje/movimentos/picanha').set({
      proteinaId: 'picanha',
      nomeSnapshot: 'Picanha',
      precoPorKgCentavosSnapshot: 8990,
      saidaGramas: 5000,
      retornoGramas: null,
      criadoPor: CHURRAS,
    })
  })
})

describe('quem não tem acesso', () => {
  it('sem login não lê proteínas nem movimentos', async () => {
    await assertFails(semLogin().doc('proteinas/picanha').get())
    await assertFails(semLogin().collection(`dias/${DIA}/movimentos`).get())
  })

  it('logado sem documento em usuarios não lê nada', async () => {
    await assertFails(como(SEM_CADASTRO).doc('proteinas/picanha').get())
    await assertFails(como(SEM_CADASTRO).collection(`dias/${DIA}/movimentos`).get())
  })

  it('logado sem documento em usuarios não escreve', async () => {
    await assertFails(como(SEM_CADASTRO).doc('proteinas/fraldinha').set(proteinaValida))
  })

  it('role desconhecida não lê nem escreve', async () => {
    await assertFails(como(ROLE_DESCONHECIDA).doc('proteinas/picanha').get())
    await assertFails(como(ROLE_DESCONHECIDA).doc('proteinas/fraldinha').set(proteinaValida))
  })

  it('coleção fora do sistema é negada até para o churras', async () => {
    await assertFails(como(CHURRAS).doc('outra/coisa').get())
    await assertFails(como(CHURRAS).doc('outra/coisa').set({ a: 1 }))
  })
})

describe('usuarios', () => {
  it('cada um lê o próprio documento', async () => {
    await assertSucceeds(como(ADM).doc(`usuarios/${ADM}`).get())
    await assertSucceeds(como(CHURRAS).doc(`usuarios/${CHURRAS}`).get())
  })

  it('ninguém lê o documento de outro usuário', async () => {
    await assertFails(como(CHURRAS).doc(`usuarios/${ADM}`).get())
    await assertFails(como(ADM).doc(`usuarios/${CHURRAS}`).get())
  })

  it('ninguém escreve em usuarios, nem para virar churras', async () => {
    await assertFails(como(ADM).doc(`usuarios/${ADM}`).update({ role: 'churras' }))
    await assertFails(como(CHURRAS).doc(`usuarios/${CHURRAS}`).update({ email: 'outro@gmail.com' }))
    await assertFails(como(SEM_CADASTRO).doc(`usuarios/${SEM_CADASTRO}`).set({ email: 'a@b.c', role: 'churras' }))
  })
})

describe('proteinas', () => {
  it('adm e churras leem', async () => {
    await assertSucceeds(como(ADM).collection('proteinas').where('ativo', '==', true).get())
    await assertSucceeds(como(CHURRAS).collection('proteinas').where('ativo', '==', true).get())
  })

  it('adm não cria, não edita e não desativa', async () => {
    await assertFails(como(ADM).doc('proteinas/fraldinha').set(proteinaValida))
    await assertFails(como(ADM).doc('proteinas/picanha').update({ precoPorKgCentavos: 9990 }))
    await assertFails(como(ADM).doc('proteinas/picanha').update({ ativo: false }))
  })

  it('churras cria proteína válida', async () => {
    await assertSucceeds(como(CHURRAS).doc('proteinas/fraldinha').set(proteinaValida))
  })

  it('churras cria proteína com a data do servidor, como o app faz', async () => {
    await assertSucceeds(
      como(CHURRAS)
        .collection('proteinas')
        .add({
          nome: 'Fraldinha',
          precoPorKgCentavos: 4590,
          ativo: true,
          criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        }),
    )
  })

  it('churras não cria proteína sem criadoEm nem altera a data depois', async () => {
    await assertFails(
      como(CHURRAS).doc('proteinas/fraldinha').set({ nome: 'Fraldinha', precoPorKgCentavos: 4590, ativo: true }),
    )
    await assertFails(como(CHURRAS).doc('proteinas/picanha').update({ criadoEm: new Date('2020-01-01') }))
  })

  it('churras edita nome e preço e desativa', async () => {
    await assertSucceeds(
      como(CHURRAS).doc('proteinas/picanha').update({ nome: 'Picanha Angus', precoPorKgCentavos: 9990 }),
    )
    await assertSucceeds(como(CHURRAS).doc('proteinas/picanha').update({ ativo: false }))
  })

  it.each([
    ['nome vazio', { nome: '' }],
    ['nome que não é texto', { nome: 123 }],
    ['preço zero', { precoPorKgCentavos: 0 }],
    ['preço negativo', { precoPorKgCentavos: -100 }],
    ['preço com casas decimais', { precoPorKgCentavos: 45.9 }],
    ['preço em texto', { precoPorKgCentavos: '4590' }],
    ['ativo que não é booleano', { ativo: 'sim' }],
    ['campo extra', { fornecedor: 'Fulano' }],
  ])('churras não cria proteína com %s', async (_caso, errado) => {
    await assertFails(como(CHURRAS).doc('proteinas/fraldinha').set({ ...proteinaValida, ...errado }))
  })

  it('churras não edita para um valor inválido', async () => {
    await assertFails(como(CHURRAS).doc('proteinas/picanha').update({ precoPorKgCentavos: 0 }))
    await assertFails(como(CHURRAS).doc('proteinas/picanha').update({ nome: '' }))
  })

  it('ninguém apaga proteína', async () => {
    await assertFails(como(CHURRAS).doc('proteinas/picanha').delete())
    await assertFails(como(ADM).doc('proteinas/picanha').delete())
  })
})

describe('movimentos: leitura e criação', () => {
  const novo = () => `dias/${DIA}/movimentos/fraldinha`

  it('adm e churras leem os movimentos de um dia', async () => {
    await assertSucceeds(como(ADM).collection(`dias/${DIA}/movimentos`).get())
    await assertSucceeds(como(CHURRAS).collection(`dias/${DIA}/movimentos`).get())
  })

  it('churras lança uma saída válida', async () => {
    await assertSucceeds(como(CHURRAS).doc(novo()).set(saidaValida))
  })

  it('adm não lança saída', async () => {
    await assertFails(como(ADM).doc(novo()).set({ ...saidaValida, criadoPor: ADM }))
  })

  it.each([
    ['proteinaId diferente do ID do documento', { proteinaId: 'picanha' }],
    ['criadoPor de outro usuário', { criadoPor: ADM }],
    ['saída zero', { saidaGramas: 0 }],
    ['saída negativa', { saidaGramas: -500 }],
    ['saída com casas decimais', { saidaGramas: 5500.5 }],
    ['retorno já preenchido', { retornoGramas: 1000 }],
    ['retorno 0 já preenchido', { retornoGramas: 0 }],
    ['nome do snapshot vazio', { nomeSnapshot: '' }],
    ['preço do snapshot zero', { precoPorKgCentavosSnapshot: 0 }],
    ['preço do snapshot com casas decimais', { precoPorKgCentavosSnapshot: 45.9 }],
    ['campo extra', { observacao: 'teste' }],
  ])('churras não lança saída com %s', async (_caso, errado) => {
    await assertFails(como(CHURRAS).doc(novo()).set({ ...saidaValida, ...errado }))
  })

  it('churras não lança saída sem o campo retornoGramas', async () => {
    const semRetorno = {
      proteinaId: 'fraldinha',
      nomeSnapshot: 'Fraldinha',
      precoPorKgCentavosSnapshot: 4590,
      saidaGramas: 5500,
      criadoPor: CHURRAS,
    }
    await assertFails(como(CHURRAS).doc(novo()).set(semRetorno))
  })

  it.each(['2026-1-5', 'hoje', '11-11-2026', '2026-11-110', '2026/11/11x'])(
    'data inválida "%s" é recusada na criação',
    async (dataInvalida) => {
      await assertFails(como(CHURRAS).doc(`dias/${dataInvalida}/movimentos/fraldinha`).set(saidaValida))
    },
  )

  it('ninguém apaga movimento', async () => {
    await assertFails(como(CHURRAS).doc(`dias/${DIA}/movimentos/picanha`).delete())
    await assertFails(como(ADM).doc(`dias/${DIA}/movimentos/picanha`).delete())
  })
})

describe('movimentos: retorno', () => {
  const pendente = `dias/${DIA}/movimentos/picanha` // saída 5000 g, sem retorno
  const fechado = `dias/${DIA}/movimentos/linguica` // saída 3000 g, retorno 1000 g

  it.each([
    ['retorno parcial', 1500],
    ['retorno 0', 0],
    ['retorno igual à saída', 5000],
  ])('churras informa %s', async (_caso, retornoGramas) => {
    await assertSucceeds(como(CHURRAS).doc(pendente).update({ retornoGramas }))
  })

  it('churras corrige um retorno já informado', async () => {
    await assertSucceeds(como(CHURRAS).doc(fechado).update({ retornoGramas: 500 }))
  })

  it.each([
    ['um grama maior que a saída', 5001],
    ['negativo', -1],
    ['com casas decimais', 1500.5],
    ['em texto', '1500'],
  ])('retorno %s é recusado', async (_caso, retornoGramas) => {
    await assertFails(como(CHURRAS).doc(pendente).update({ retornoGramas }))
  })

  it('retorno informado não volta para pendente', async () => {
    await assertFails(como(CHURRAS).doc(fechado).update({ retornoGramas: null }))
  })

  it('adm não informa retorno', async () => {
    await assertFails(como(ADM).doc(pendente).update({ retornoGramas: 1500 }))
  })

  it('data inválida é recusada também no update', async () => {
    await assertFails(como(CHURRAS).doc('dias/hoje/movimentos/picanha').update({ retornoGramas: 1500 }))
  })
})

describe('movimentos: correção de saída', () => {
  const pendente = `dias/${DIA}/movimentos/picanha` // sem retorno
  const fechado = `dias/${DIA}/movimentos/linguica` // retorno 1000 g
  const fechadoComZero = `dias/${DIA}/movimentos/costela` // retorno 0

  it('churras corrige a saída enquanto o retorno não foi informado', async () => {
    await assertSucceeds(como(CHURRAS).doc(pendente).update({ saidaGramas: 6250 }))
  })

  it('saída não muda depois do retorno informado', async () => {
    await assertFails(como(CHURRAS).doc(fechado).update({ saidaGramas: 6250 }))
  })

  it('saída não muda depois do retorno informado como 0', async () => {
    await assertFails(como(CHURRAS).doc(fechadoComZero).update({ saidaGramas: 6250 }))
  })

  it.each([
    ['zero', 0],
    ['negativa', -1],
    ['com casas decimais', 6250.5],
  ])('saída corrigida %s é recusada', async (_caso, saidaGramas) => {
    await assertFails(como(CHURRAS).doc(pendente).update({ saidaGramas }))
  })

  it('saída e retorno não mudam na mesma escrita', async () => {
    await assertFails(como(CHURRAS).doc(pendente).update({ saidaGramas: 6250, retornoGramas: 1000 }))
  })

  it('adm não corrige saída', async () => {
    await assertFails(como(ADM).doc(pendente).update({ saidaGramas: 6250 }))
  })
})

describe('movimentos: campos que nunca mudam', () => {
  const pendente = `dias/${DIA}/movimentos/picanha`

  it.each([
    ['o nome do snapshot', { nomeSnapshot: 'Picanha Angus' }],
    ['o preço do snapshot', { precoPorKgCentavosSnapshot: 100 }],
    ['o proteinaId', { proteinaId: 'linguica' }],
    ['o criadoPor', { criadoPor: ADM }],
  ])('churras não altera %s', async (_caso, alteracao) => {
    await assertFails(como(CHURRAS).doc(pendente).update(alteracao))
  })

  it('churras não altera o snapshot junto com o retorno', async () => {
    await assertFails(
      como(CHURRAS).doc(pendente).update({ retornoGramas: 1000, precoPorKgCentavosSnapshot: 100 }),
    )
  })

  it('churras não acrescenta campo novo', async () => {
    await assertFails(como(CHURRAS).doc(pendente).update({ observacao: 'teste' }))
  })
})

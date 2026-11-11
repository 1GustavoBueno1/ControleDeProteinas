# Controle de Proteínas (Dudu Bebidas)

Sistema web de controle diário de proteínas (carnes): quanto de cada carne saiu do estoque, quanto voltou e o custo real do dia.

## Restrição principal: plano gratuito (Spark) do Firebase

- NÃO existe servidor Node/Express. NÃO usar Cloud Functions, firebase-admin, Storage nem Analytics.
- App 100% front-end em TypeScript, falando direto com o Firestore pelo SDK web.
- A segurança vem das Firestore Security Rules (role por usuário + validação de dados), não de backend.
- Hospedagem: Firebase Hosting. Projeto único (sem pasta `backend/`).
- Projeto Firebase: `controledeprotreinas`. Config do SDK em `.env` (variáveis `VITE_FIREBASE_*`); só `.env.example` é commitado.

## Stack

- React + Vite + TypeScript (strict, sem `any`), Firebase SDK web (Auth + Firestore).
- Vitest para testes unitários das regras de cálculo.
- Sem biblioteca de estado global: Context só para auth.
- Interface simples, usável no celular.

## Comandos

- `npm run dev`: servidor de desenvolvimento
- `npm run typecheck`: `tsc -b`
- `npm run lint`: ESLint
- `npm test`: Vitest (uma execução)
- `npm run build`: typecheck + build de produção

## Arquitetura

```
src/
  config/       firebase.ts (lê variáveis VITE_*)
  auth/         AuthContext, useAuth, RequireRole
  services/     proteinasService, movimentosService, relatorioService -> ÚNICA camada que fala com o Firestore
  domain/       cálculo de custo e regra de liberação do relatório (funções puras, testáveis)
  types/
  utils/        data em America/Sao_Paulo, conversão gramas/kg e centavos/R$
  pages/        Login, Proteinas, Dia, Relatorio
  components/
firestore.rules
firebase.json   (hosting + rules)
```

Regra: `pages/` e `components/` nunca importam `firebase/*` direto; só chamam services (o ESLint barra).

## Modelo de dados

Peso em GRAMAS (inteiro), dinheiro em CENTAVOS (inteiro). Converter para kg e R$ só na exibição.
Datas: string `YYYY-MM-DD` no fuso `America/Sao_Paulo`.

- `usuarios/{uid}`: `{ email, role: "adm" | "churras" }`. Criado manualmente no console; o app nunca escreve aqui.
- `proteinas/{id}`: `{ nome, precoPorKgCentavos, ativo, criadoEm }`.
- `dias/{data}/movimentos/{proteinaId}`: `{ proteinaId, nomeSnapshot, precoPorKgCentavosSnapshot, saidaGramas, retornoGramas | null, criadoPor }`.
  - O ID do documento É o `proteinaId`: impede duplicar a mesma proteína no mesmo dia.
  - O snapshot de nome e preço é a cópia no momento do lançamento; relatório antigo nunca muda.

Entrada: o usuário digita peso em KG ("5,5") e preço em R$ ("45,90"), com vírgula ou ponto. A conversão para gramas/centavos acontece APENAS em `utils/unidades.ts`, com `Math.round`, rejeitando vazio, zero, negativo, texto e mais de 3 casas decimais no peso. Nenhuma outra camada manipula kg ou reais.

## Regras de negócio

- Todo dia, para cada proteína: lança-se a saída; depois o retorno, atualizando o mesmo movimento.
- Retorno não pode ser maior que a saída. Retorno 0 é válido e conta como "informado".
- A saída só pode ser corrigida enquanto o retorno ainda não foi informado. O retorno pode ser corrigido depois (respeitando retorno <= saída). O snapshot de nome e preço nunca muda.
- Consumo = saída - retorno. Custo do item = consumo (kg) x `precoPorKgCentavosSnapshot`, arredondado uma única vez por item. Custo do dia = soma dos itens.
- "Gerar relatório diário" só habilita quando o dia tem pelo menos 1 movimento E todos têm retorno informado; senão a tela mostra as proteínas pendentes. (Regra só de interface: as rules não conseguem impô-la entre documentos.)
- O relatório mostra por proteína: saiu, voltou, consumo, preço/kg e custo; e o custo total do dia.
- Proteína nunca é apagada, só desativada (`ativo=false`).

## Permissões

- `churras`: cadastra e edita proteínas, lança e corrige saída/retorno conforme as regras, gera o relatório do dia.
- `adm`: apenas VISUALIZA tudo (qualquer dia). Não escreve nada.
- Ambos precisam estar logados. Usuário sem documento em `usuarios/{uid}` não acessa nada.
- A role é lida do Firestore (`usuarios/{uid}`); nunca confiar em role vinda do cliente. Nunca colocar UID no código.

## Regras de trabalho

1. Trabalhar em ETAPAS. Ao terminar uma, PARAR e entregar: (a) arquivos criados/alterados, (b) o que cada um faz em 1 linha, (c) como testar (comandos exatos), (d) o que foi verificado e o que não foi. Só avançar quando o usuário escrever "aprovado".
2. NUNCA rodar `git add`, `git commit` ou `git push`. O usuário revisa e commita.
3. Código simples e legível: funções pequenas, nomes em português para o domínio (proteina, movimento, relatorio) e inglês para termos técnicos (service, hook, context). Sem abstrações genéricas. Comentário só quando o "porquê" não for óbvio.
4. TypeScript strict. Nada de `any`.
5. Decisão não prevista: escolher a opção mais simples e avisar em 1 linha.
6. Rodar typecheck, lint, build e os testes da etapa antes de dizer que terminou. Não dizer "funciona" sem ter rodado.
7. Design: avisar o usuário ANTES de começar qualquer tela, para ele decidir o design.

## Design

- Decisão do usuário: todas as cores vêm da logo da Dudu Bebidas, com fundo escuro (azul-marinho). Única exceção: vermelho discreto, só para erros.
- As cores ficam em variáveis CSS no topo de `src/index.css` (`--marinho`, `--amarelo`, `--gelo`, `--verde` e tons derivados). Não usar cor fora dessas variáveis.
- CSS puro em um arquivo só (`src/index.css`), sem biblioteca de UI. Títulos em Playfair Display, texto em Barlow (Google Fonts, com fonte do sistema como reserva).
- `src/assets/logo-dudu.jpg` e `folha-dudu.jpg` foram recortadas de uma captura de tela; trocar pelo arquivo original da logo quando o usuário enviar.

## Etapas

0. Setup (feito)
1. Firebase config + Auth (AuthContext, RequireRole, Login) (feito)
2. Domain + testes (tipos, utils, cálculo de custo, liberação do relatório) (feito)
3. proteinasService + tela Proteinas (feito)
4. movimentosService + tela Dia
5. relatorioService + tela Relatorio
6. firestore.rules (+ testes com emulador, se possível)
7. Polimento de UI para celular + firebase.json de Hosting
8. README (rodar, criar usuários, publicar rules, deploy)

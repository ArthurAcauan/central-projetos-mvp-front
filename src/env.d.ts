/// <reference types="vite/client" />

/**
 * Variáveis de ambiente do front. `vite/client` só declara um índice `any`:
 * tipar aqui faz o typecheck cobrar o nome certo em vez de aceitar qualquer um.
 *
 * Toda variável nova precisa entrar aqui **e** em `.env.example`.
 */
interface ImportMetaEnv {
  /** URL base da API REST do backend. Ex.: `http://localhost:3000`. */
  readonly VITE_API_URL?: string;
  /** Só `'false'` desliga a camada mock e chama a API real (ADR-0001). */
  readonly VITE_USE_MOCK?: string;
  /** `'padrao'` (default), `'vazio'` ou `'erro'` — ver `services/mock/store.ts`. */
  readonly VITE_MOCK_SCENARIO?: string;
}

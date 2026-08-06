/**
 * Cliente (RF02). 1:N com projetos.
 *
 * O spec limita o cadastro ao essencial: não incluir dados adicionais sem
 * contribuição direta ao objetivo do projeto
 * (`context/04_modelagem_dados_e_banco.md` §11).
 */
export interface Client {
  id: string;
  name: string;
  /** Timestamp ISO completo, gerado pelo backend. */
  createdAt: string;
  updatedAt: string;
}

/** Campos que o cliente envia ao cadastrar um cliente (RF02). */
export type ClientInput = Pick<Client, 'name'>;

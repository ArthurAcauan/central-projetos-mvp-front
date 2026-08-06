/**
 * Cliente HTTP base do front (F0-3).
 *
 * `services/` é a única camada que fala HTTP: páginas, componentes e hooks nunca
 * chamam `fetch` direto (ver ADR-0002 e docs/HARNESS.md §6). Este módulo é
 * genérico — não conhece entidade nem formato de campo. A tradução do contrato
 * da API para o tipo de domínio em camelCase acontece nos serviços por recurso
 * (F1-3), um mapeador por recurso.
 *
 * Toda falha sai daqui como {@link HttpError} com `message` em pt-BR pronta para
 * exibição. Quem consome trata um formato só: nunca `Response`, status cru ou
 * `TypeError` de rede.
 *
 * Única exceção: cancelamento pedido pelo próprio chamador via `options.signal`
 * (ex.: unmount) propaga o `AbortError` original — não é falha a exibir, e o
 * padrão da plataforma é o chamador ignorá-lo (`error.name === 'AbortError'`).
 */

/**
 * Natureza da falha, para quem precisa decidir comportamento (ex.: oferecer
 * "tentar de novo" em `network`/`timeout`/`server`). Para exibir, use `message`.
 *
 * - `config`: `VITE_API_URL` ausente — erro de ambiente, não da API
 * - `network`: não houve resposta (servidor fora do ar, DNS, conexão)
 * - `timeout`: a requisição estourou o tempo limite
 * - `client`: resposta 4xx
 * - `server`: resposta 5xx
 * - `parse`: resposta veio em formato inesperado (não é JSON válido)
 */
export type HttpErrorKind = 'config' | 'network' | 'timeout' | 'client' | 'server' | 'parse';

/** Erro padronizado de qualquer chamada à API. */
export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  /** Status HTTP, ou `null` quando a falha ocorreu antes da resposta. */
  readonly status: number | null;
  /** Corpo devolvido pela API, quando houve — para diagnóstico, não para a tela. */
  readonly body: unknown;

  constructor(kind: HttpErrorKind, message: string, status: number | null = null, body?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.kind = kind;
    this.status = status;
    this.body = body;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export interface RequestOptions {
  /** Cancelamento pelo chamador (ex.: unmount do componente). */
  signal?: AbortSignal;
  /** Tempo limite da requisição. Padrão: 10000 ms. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/** Mensagens por status. Curta de propósito: status novo entra quando aparecer. */
const MESSAGE_BY_STATUS: Record<number, string> = {
  400: 'Dados inválidos. Revise as informações e tente novamente.',
  401: 'Sem permissão para acessar este recurso.',
  403: 'Sem permissão para acessar este recurso.',
  404: 'Recurso não encontrado.',
  409: 'Este registro já foi alterado por outra operação. Recarregue e tente de novo.',
  422: 'Dados inválidos. Revise as informações e tente novamente.',
};

export function httpGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>('GET', path, undefined, options);
}

export function httpPost<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>('POST', path, body, options);
}

export function httpPut<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>('PUT', path, body, options);
}

export function httpDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>('DELETE', path, undefined, options);
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const url = resolveUrl(path);
  const { signal: callerSignal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abortByCaller = () => controller.abort();
  callerSignal?.addEventListener('abort', abortByCaller);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw new HttpError('timeout', 'A API demorou demais para responder. Tente novamente.');
    }
    // Cancelamento pelo chamador não é falha a exibir: repassa como veio.
    if (callerSignal?.aborted) {
      throw error;
    }
    throw new HttpError(
      'network',
      'Não foi possível conectar à API. Verifique sua conexão e se o servidor está no ar.'
    );
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener('abort', abortByCaller);
  }

  if (!response.ok) {
    throw await buildResponseError(response);
  }

  return (await parseBody<T>(response)) as T;
}

/** Junta `VITE_API_URL` e o caminho sem gerar `//`. */
function resolveUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_URL?.trim();
  if (!baseUrl) {
    throw new HttpError(
      'config',
      'URL da API não configurada. Defina VITE_API_URL no arquivo .env (veja .env.example).'
    );
  }
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** `204` e corpo vazio devolvem `undefined` — permite `httpDelete<void>()`. */
async function parseBody<T>(response: Response): Promise<T | undefined> {
  if (response.status === 204) {
    return undefined;
  }
  const text = await response.text();
  if (text.trim() === '') {
    return undefined;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(
      'parse',
      'A API devolveu uma resposta em formato inesperado.',
      response.status,
      text
    );
  }
}

async function buildResponseError(response: Response): Promise<HttpError> {
  const body = await readErrorBody(response);
  const kind: HttpErrorKind = response.status >= 500 ? 'server' : 'client';
  return new HttpError(kind, messageFor(response.status, body), response.status, body);
}

/** Lê o corpo do erro sem deixar o próprio parse virar a falha reportada. */
async function readErrorBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (text.trim() === '') {
      return undefined;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
}

/**
 * Mensagem da API tem prioridade: o backend fala pt-BR e conhece o caso melhor
 * que a tabela por status.
 */
function messageFor(status: number, body: unknown): string {
  const fromApi = extractApiMessage(body);
  if (fromApi) {
    return fromApi;
  }
  const known = MESSAGE_BY_STATUS[status];
  if (known) {
    return known;
  }
  return status >= 500
    ? 'Erro no servidor. Tente novamente em instantes.'
    : 'Não foi possível concluir a operação.';
}

function extractApiMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const candidate = body as { message?: unknown; error?: unknown };
  for (const value of [candidate.message, candidate.error]) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return null;
}

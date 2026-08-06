import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpDelete, httpGet, httpPost, isHttpError } from '@/services/http';

/**
 * `fetch` é mockado: a suíte roda sem backend no ar, e a indisponibilidade da API
 * é justamente um dos casos testados.
 */
const fetchMock = vi.fn<typeof fetch>();

/** Resposta mínima: só o que `http.ts` usa (`ok`, `status`, `text`). */
function responseOf(body: unknown, status = 200): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
  } as unknown as Response;
}

/** Requisição que só termina quando o `signal` aborta — para timeout e cancelamento. */
function pendingResponse(): (url: string | URL | Request, init?: RequestInit) => Promise<Response> {
  return (_url, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });
    });
}

function lastRequestInit(): RequestInit {
  const call = fetchMock.mock.calls.at(-1);
  expect(call).toBeDefined();
  return call![1] as RequestInit;
}

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('montagem da requisição', () => {
  it('usa VITE_API_URL como base e não gera barra dupla', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/');
    fetchMock.mockResolvedValue(responseOf([{ id: 'abc' }]));

    const data = await httpGet<{ id: string }[]>('/projects');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/projects');
    expect(data).toEqual([{ id: 'abc' }]);
    expect(lastRequestInit().method).toBe('GET');
  });

  it('serializa o corpo do POST e envia Content-Type JSON', async () => {
    fetchMock.mockResolvedValue(responseOf({ id: 'novo' }, 201));

    await httpPost('/projects', { name: 'Portal do Cliente' });

    const init = lastRequestInit();
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ name: 'Portal do Cliente' }));
    expect(init.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  });

  it('não envia Content-Type quando não há corpo', async () => {
    fetchMock.mockResolvedValue(responseOf(undefined, 204));

    await httpGet('/projects');

    expect(lastRequestInit().headers).not.toHaveProperty('Content-Type');
  });

  it('devolve undefined em 204, sem tentar interpretar corpo vazio', async () => {
    fetchMock.mockResolvedValue(responseOf(undefined, 204));

    await expect(httpDelete<void>('/projects/abc')).resolves.toBeUndefined();
  });
});

describe('tratamento de erro', () => {
  it('traduz 404 em mensagem pt-BR exibível', async () => {
    fetchMock.mockResolvedValue(responseOf({}, 404));

    await expect(httpGet('/projects/inexistente')).rejects.toMatchObject({
      kind: 'client',
      status: 404,
      message: 'Recurso não encontrado.',
    });
  });

  it('usa a mensagem da API quando ela vem no corpo', async () => {
    fetchMock.mockResolvedValue(
      responseOf({ message: 'Prazo não pode ser anterior à data de início.' }, 422)
    );

    await expect(httpPost('/projects', {})).rejects.toMatchObject({
      kind: 'client',
      status: 422,
      message: 'Prazo não pode ser anterior à data de início.',
    });
  });

  it('marca 5xx como server com mensagem genérica quando a API não explica', async () => {
    fetchMock.mockResolvedValue(responseOf('', 500));

    await expect(httpGet('/projects')).rejects.toMatchObject({
      kind: 'server',
      status: 500,
      message: 'Erro no servidor. Tente novamente em instantes.',
    });
  });

  it('trata resposta que não é JSON como erro de formato, não SyntaxError cru', async () => {
    fetchMock.mockResolvedValue(responseOf('<!doctype html><html></html>'));

    const error = await httpGet('/projects').catch((e: unknown) => e);

    expect(isHttpError(error)).toBe(true);
    expect(error).toMatchObject({
      kind: 'parse',
      status: 200,
      message: 'A API devolveu uma resposta em formato inesperado.',
    });
  });

  it('trata API fora do ar como erro de rede, sem status', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(httpGet('/projects')).rejects.toMatchObject({
      kind: 'network',
      status: null,
      message: 'Não foi possível conectar à API. Verifique sua conexão e se o servidor está no ar.',
    });
  });

  it('falha com erro de configuração quando VITE_API_URL não está definida', async () => {
    vi.stubEnv('VITE_API_URL', '');

    const error = await httpGet('/projects').catch((e: unknown) => e);

    expect(isHttpError(error)).toBe(true);
    expect(error).toMatchObject({ kind: 'config', status: null });
    expect((error as Error).message).toContain('VITE_API_URL');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('timeout e cancelamento', () => {
  it('aborta a requisição e reporta timeout ao estourar o tempo limite', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(pendingResponse());

    const pending = httpGet('/projects', { timeoutMs: 5000 });
    const assertion = expect(pending).rejects.toMatchObject({
      kind: 'timeout',
      status: null,
      message: 'A API demorou demais para responder. Tente novamente.',
    });

    await vi.advanceTimersByTimeAsync(5000);
    await assertion;

    expect(lastRequestInit().signal?.aborted).toBe(true);
  });

  it('cancelamento pelo chamador não é reportado como timeout', async () => {
    fetchMock.mockImplementation(pendingResponse());
    const controller = new AbortController();

    const pending = httpGet('/projects', { signal: controller.signal });
    controller.abort();
    const error = await pending.catch((e: unknown) => e);

    expect(isHttpError(error)).toBe(false);
    expect((error as Error).name).toBe('AbortError');
  });
});

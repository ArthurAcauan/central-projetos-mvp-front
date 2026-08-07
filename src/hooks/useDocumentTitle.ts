/**
 * Título do documento por tela (F5-2, RNF01).
 *
 * Em aplicação de página única a navegação não recarrega a página, então o
 * `<title>` do `index.html` permanece o mesmo em todas as telas. Quem usa
 * leitor de tela perde o anúncio que diz para onde foi, e quem usa várias abas
 * perde o rótulo que as distingue.
 *
 * Apresentação pura, sem regra: recebe o texto pronto.
 */

import { useEffect } from 'react';

const SUFFIX = 'GestProject';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${SUFFIX}`;
  }, [title]);
}

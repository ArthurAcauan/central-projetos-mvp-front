/**
 * Região rolável horizontalmente para as tabelas (F5-2).
 *
 * Uma tabela de sete colunas não cabe em 375 px. As três saídas possíveis são
 * espremer as colunas até o texto quebrar letra a letra, esconder colunas — que
 * tira informação de quem está no celular — ou rolar. Rolar é a única que não
 * perde dado.
 *
 * O que o componente carrega, e que é fácil esquecer copiando o `div`: uma
 * região rolável precisa ser alcançável pelo teclado (`tabIndex`) e precisa ter
 * nome e papel, senão o foco para em um ponto que o leitor de tela não sabe
 * anunciar.
 *
 * A largura mínima da tabela é decisão de quem usa — depende do número de
 * colunas — e vai na `<table>`, não aqui.
 */

import type { ReactNode } from 'react';

export interface TableScrollProps {
  /** Nome da região. Costuma repetir o `<caption>` da tabela. */
  label: string;
  className?: string;
  children: ReactNode;
}

export default function TableScroll({ label, className, children }: TableScrollProps) {
  return (
    <div
      aria-label={label}
      className={`overflow-x-auto ${className ?? ''}`}
      role="region"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

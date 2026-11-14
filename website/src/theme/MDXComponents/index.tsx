import React, {useState} from 'react';
import OriginalMDXComponents from '@theme-original/MDXComponents';
import OriginalCode from '@theme-original/MDXComponents/Code';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type BlockProps = React.ComponentProps<'pre'> & {metastring?: string; 'data-meta'?: string};

function contentText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(contentText).join('');
  if (React.isValidElement<{children?: React.ReactNode}>(node)) return contentText(node.props.children);
  return '';
}

function HighlightedCode(props: React.ComponentProps<'code'>) {
  // Rehype Shiki provides highlighted spans, whereas inline Markdown has text.
  if (React.Children.toArray(props.children).some(child => React.isValidElement(child))) {
    return <code {...props} />;
  }
  return <OriginalCode {...props} />;
}

function ShikiPre({children, className, style, ...rest}: BlockProps) {
  const [copied, setCopied] = useState(false);
  const {i18n: {currentLocale}} = useDocusaurusContext();
  if (!className?.includes('shiki')) return <pre {...rest} className={className} style={style}>{children}</pre>;
  const text = contentText(children).replace(/\n$/, '');
  const code = React.isValidElement<{className?: string}>(children) ? children.props.className : undefined;
  const language = /language-([\w-]+)/.exec(`${className} ${code ?? ''}`)?.[1] ?? 'code';
  const showLines = /(?:^|\s)showLineNumbers(?:\s|$)/.test(String(rest['data-meta'] ?? rest.metastring ?? ''));
  const isPortuguese = currentLocale === 'pt-BR';

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return <div className={`rb-shiki-block${showLines ? ' rb-shiki-lines' : ''}`}>
    <div className="rb-shiki-toolbar"><span>{language}</span><button type="button" onClick={copy} aria-label={isPortuguese ? 'Copiar código' : 'Copy code'}>{copied ? (isPortuguese ? 'Copiado' : 'Copied') : (isPortuguese ? 'Copiar' : 'Copy')}</button></div>
    <pre {...rest} className={className} style={style}>{children}</pre>
  </div>;
}

export default {...OriginalMDXComponents, code: HighlightedCode, pre: ShikiPre};

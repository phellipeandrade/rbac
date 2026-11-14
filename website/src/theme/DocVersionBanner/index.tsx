import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDocsVersion} from '@docusaurus/plugin-content-docs/client';
import OriginalDocVersionBanner from '@theme-original/DocVersionBanner';
import type {Props} from '@theme/DocVersionBanner';

export default function DocVersionBanner(props: Props) {
  const version = useDocsVersion();
  const {i18n: {currentLocale}} = useDocusaurusContext();
  const isPortuguese = currentLocale === 'pt-BR';
  const guide1to2 = useBaseUrl('/docs/migration-1-to-2');
  const guide2to3 = useBaseUrl('/docs/migration-2-to-3');

  if (version.version !== '1.x' && version.version !== '2.x') {
    return <OriginalDocVersionBanner {...props} />;
  }

  return <>
    <OriginalDocVersionBanner {...props} />
    <div className="rb-migration-banner" role="note">
      <strong>{isPortuguese ? 'Versão descontinuada.' : 'Deprecated version.'}</strong>{' '}
      {isPortuguese
        ? 'Recomendamos migrar para a 3.x (latest). Consulte os guias: '
        : 'We recommend upgrading to 3.x (latest). Follow the migration guides: '}
      {version.version === '1.x' && <>
        <Link to={guide1to2}>{isPortuguese ? '1.x para 2.x' : '1.x to 2.x'}</Link>
        {' · '}
      </>}
      <Link to={guide2to3}>{isPortuguese ? '2.x para 3.x' : '2.x to 3.x'}</Link>.
    </div>
  </>;
}

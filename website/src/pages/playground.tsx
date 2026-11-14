import React from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useCopy} from '../data/copy';
import Playground from '../playground/Playground';

export default function PlaygroundPage() {
  const t = useCopy();
  return <Layout title={t.playgroundTitle} description={t.playgroundSubtitle}>
    <main className="rb-page rb-container"><div className="rb-page-head"><div className="rb-kicker">RBAC / LAB</div><h1>{t.playgroundTitle}</h1><p>{t.playgroundSubtitle}</p></div>
      <BrowserOnly fallback={<div className="rb-card" aria-busy="true">Loading…</div>}>{() => <Playground/>}</BrowserOnly>
    </main>
  </Layout>;
}

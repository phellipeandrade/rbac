import React, {useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {motion, useReducedMotion} from 'motion/react';
import {ArrowRight, ArrowUpRight, Braces, Check, CheckCircle2, ChevronRight, Copy, Database, GitBranch, Layers3, LockKeyhole, ShieldCheck, Terminal, Workflow, Zap} from 'lucide-react';
import {useCopy} from '../data/copy';
import {Button, Card, Field, Select} from '../components/ui';
import {evaluate, initialScenario} from '../playground/engine';

const features = [
  {icon: GitBranch, heading: 'valueOne', description: 'valueOneText', number: '01'},
  {icon: ShieldCheck, heading: 'valueTwo', description: 'valueTwoText', number: '02'},
  {icon: Braces, heading: 'valueThree', description: 'valueThreeText', number: '03'},
  {icon: Layers3, heading: 'valueFour', description: 'valueFourText', number: '04'}
] as const;

function Preview() {
  const t = useCopy();
  const [role, setRole] = useState('editor');
  const [operation, setOperation] = useState('documents:edit');
  const [result, setResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  async function test() {
    setLoading(true);
    try {
      setResult(await evaluate(initialScenario.roles, [role], operation, {userId: 'u2', ownerId: 'u2', isActive: true}));
    } finally {setLoading(false);}
  }
  return <Card className="rb-preview-card"><div className="rb-preview-top"><span className="rb-pulse"/>{t.terminalBadge}<span className="rb-preview-version">RBAC / v4</span></div>
    <div className="rb-preview-form"><Field label={t.role}><Select value={role} onChange={event => {setRole(event.target.value);setResult(null);}}><option value="viewer">viewer</option><option value="editor">editor</option><option value="admin">admin</option></Select></Field>
      <Field label={t.permissionOperation}><Select value={operation} onChange={event => {setOperation(event.target.value);setResult(null);}}><option value="documents:read">documents:read</option><option value="documents:edit">documents:edit</option><option value="documents:delete">documents:delete</option></Select></Field>
      <Button onClick={test} disabled={loading} className="rb-preview-button">{t.runCheck}<ArrowRight size={17}/></Button>
    </div>
    <div className={`rb-preview-result ${result === null ? '' : result ? 'is-allowed' : 'is-denied'}`}><div className="rb-label">RESULT</div><strong aria-live="polite">{result === null ? 'await rbac.can(...)' : result ? `✓ ${t.allowed}` : `× ${t.denied}`}</strong><span className="rb-preview-corner"><CheckCircle2 size={22}/></span></div>
    <div className="rb-preview-caption"><span>●</span> {t.engineNote}</div>
  </Card>;
}

export default function Home() {
  const t = useCopy();
  const brandIcon = useBaseUrl('/img/rbac-icon.svg');
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {await navigator.clipboard.writeText('npm install @rbac/core'); setCopied(true); window.setTimeout(() => setCopied(false), 1600);};
  return <Layout title="Hierarchical authorization for Node.js" description={t.heroDescription}>
    <main className="rb-home">
      <section className="rb-hero"><div className="rb-container rb-hero-inner">
        <motion.div initial={reduceMotion ? false : {opacity: 0, y: 18}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}>
          <div className="rb-hero-brand"><img src={brandIcon} alt="RBAC shield and padlock" width="56" height="62"/><div className="rb-eyebrow"><span className="rb-led"/>{t.eyebrow}</div></div>
          <h1>{t.heroTitle.split('\n').map((line, i) => <React.Fragment key={line}>{i > 0 && <br/>}{line}</React.Fragment>)}</h1>
          <p className="rb-hero-description">{t.heroDescription}</p>
          <div className="rb-hero-actions"><Link className="rb-button rb-button--primary" to="/docs/intro">{t.getStarted}<ArrowUpRight size={19}/></Link><Link className="rb-button rb-button--outline" to="/playground">{t.openPlayground}<ArrowRight size={18}/></Link></div>
          <div className="rb-hero-meta"><div className="rb-meta-avatars"><span>TS</span><span>JS</span><span>MIT</span></div><span>{t.heroHint}</span></div>
        </motion.div>
        <motion.div className="rb-hero-demo" initial={reduceMotion ? false : {opacity: 0, y: 22}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6, delay: 0.14}}>
          <div className="rb-demo-top"><div className="rb-window-dots"><i/><i/><i/></div><span><Terminal size={14}/>{t.terminalTitle}</span><span className="rb-demo-live"><span className="rb-pulse"/>{t.terminalBadge}</span></div>
          <pre className="rb-code-pre"><code><span className="rb-syntax-violet">import</span> {'{'} createRBAC {'}'} <span className="rb-syntax-violet">from</span> <span className="rb-syntax-green">'@rbac/core'</span>;
{`\n\n`}<span className="rb-syntax-violet">const</span> rbac = <span className="rb-syntax-blue">createRBAC</span>({'{'}
{`\n  `}<span className="rb-syntax-orange">enableLogger</span>: <span className="rb-syntax-orange">false</span>,
{`\n  `}<span className="rb-syntax-blue">roles</span>: {'{'}
{`\n    `}<span className="rb-syntax-blue">viewer</span>: {'{'} <span className="rb-syntax-orange">can</span>: [<span className="rb-syntax-green">'docs:read'</span>] {'}'},
{`\n    `}<span className="rb-syntax-blue">editor</span>: {'{'}
{`\n      `}<span className="rb-syntax-orange">inherits</span>: [<span className="rb-syntax-green">'viewer'</span>],
{`\n      `}<span className="rb-syntax-orange">can</span>: [<span className="rb-syntax-green">'docs:edit'</span>]
{`\n    `}{'}'}
{`\n  `}{'}'}
{`\n`}{'}'});
{`\n\n`}<span className="rb-syntax-violet">await</span> rbac.<span className="rb-syntax-blue">can</span>(<span className="rb-syntax-green">'editor'</span>, <span className="rb-syntax-green">'docs:read'</span>);
{`\n`}<span className="rb-syntax-comment">// true — inherited permission</span></code></pre>
          <div className="rb-demo-bottom"><span><CheckCircle2 size={16}/>{t.status}</span><span>Node 22+ / ESM + CJS</span></div>
        </motion.div>
      </div><div className="rb-hero-grid" aria-hidden="true"/></section>

      <section className="rb-section rb-feature-section"><div className="rb-container"><div className="rb-section-intro"><div><div className="rb-kicker">{t.sectionTag}</div><h2 className="rb-display">{t.featuresTitle}</h2></div><p>{t.featuresDescription}</p></div>
        <div className="rb-feature-grid">{features.map(({icon: Icon, heading, description, number}) => <Card key={number} className="rb-feature"><div className="rb-feature-top"><span className="rb-feature-icon"><Icon size={23} strokeWidth={1.7}/></span><span className="rb-feature-num">{number} / 04</span></div><h3>{t[heading]}</h3><p>{t[description]}</p><ArrowUpRight size={20} className="rb-feature-arrow"/></Card>)}</div>
      </div></section>

      <section className="rb-section rb-hierarchy-section"><div className="rb-container rb-split"><div><div className="rb-kicker">{t.hierarchyTag}</div><h2 className="rb-display">{t.hierarchyTitle}</h2><p className="rb-large-muted">{t.hierarchyDescription}</p><Link to="/docs/concepts" className="rb-text-link">{t.exploreDocs}<ArrowUpRight size={18}/></Link></div>
        <div className="rb-hierarchy-card"><div className="rb-hierarchy-line"/><div className="rb-hierarchy-item"><span className="rb-iconbox rb-green"><LockKeyhole size={20}/></span><div><strong>viewer</strong><code>documents:read</code></div><span className="rb-hierarchy-tag">BASE</span></div><div className="rb-hierarchy-connector"/><div className="rb-hierarchy-item"><span className="rb-iconbox rb-purple"><GitBranch size={20}/></span><div><strong>editor</strong><code>documents:edit · when(owner)</code></div><span className="rb-hierarchy-tag">EXTENDS VIEWER</span></div><div className="rb-hierarchy-connector"/><div className="rb-hierarchy-item"><span className="rb-iconbox rb-blue"><ShieldCheck size={20}/></span><div><strong>admin</strong><code>documents:*</code></div><span className="rb-hierarchy-tag">EXTENDS EDITOR</span></div></div>
      </div></section>

      <section className="rb-section rb-preview-section"><div className="rb-container rb-split"><div><div className="rb-kicker">{t.previewTag}</div><h2 className="rb-display">{t.previewTitle}</h2><p className="rb-large-muted">{t.previewDescription}</p><Link to="/playground" className="rb-text-link">{t.openPlayground}<ArrowUpRight size={18}/></Link></div><Preview/></div></section>

      <section className="rb-section rb-install-section"><div className="rb-container"><div className="rb-section-intro"><div><div className="rb-kicker">{t.installTag}</div><h2 className="rb-display">{t.installTitle}</h2></div><p>{t.installDescription}</p></div>
        <div className="rb-install-grid"><div className="rb-install-command"><div className="rb-label">{t.npmInstall}</div><div className="rb-command-line"><span className="rb-terminal-sign">$</span><code>npm install @rbac/core</code><button type="button" onClick={copyCode} aria-label={t.copyCode}>{copied ? <Check size={19}/> : <Copy size={19}/>}</button></div><div className="rb-install-sub"><Zap size={17}/>{t.heroHint}</div></div>
          <div className="rb-integrations"><h3>{t.integrationsTitle}</h3><p>{t.integrationsDescription}</p><div className="rb-tags"><span>Express</span><span>NestJS</span><span>Fastify</span><span>MongoDB</span><span>PostgreSQL</span><span>MySQL</span></div></div>
        </div>
      </div></section>

      <section className="rb-closing"><div className="rb-container rb-closing-inner"><div><div className="rb-kicker">RBAC / OPEN SOURCE</div><h2 className="rb-display">{t.closingTitle}</h2><p>{t.closingText}</p></div><div className="rb-closing-links"><Link className="rb-button rb-button--primary" to="/docs/intro">{t.exploreDocs}<ArrowUpRight size={18}/></Link><Link className="rb-button rb-button--outline" to="/docs/api">{t.exploreApi}<ArrowRight size={18}/></Link></div></div></section>
    </main>
  </Layout>;
}

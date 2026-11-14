import {useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {javascript} from '@codemirror/lang-javascript';
import {Play, RotateCcw, Copy} from 'lucide-react';
import {Button, Card} from '../components/ui';
import {useCopy} from '../data/copy';
import {evaluate} from './engine';
import {interpretCode} from './code-interpreter';

const example = `import {createRBAC} from '@rbac/core';

const rbac = createRBAC({
  roles: {
    viewer: {
      can: ['documents:read']
    },
    editor: {
      inherits: ['viewer'],
      can: ['documents:edit']
    }
  },
  enableLogger: false
});

const allowed = await rbac.can('editor', 'documents:read', {
  userId: 'u2',
  ownerId: 'u2',
  isActive: true
});

console.log(allowed);`;

export default function CodeEditor() {
  const t = useCopy();
  const [code, setCode] = useState(example);
  const [result, setResult] = useState('—');
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      const {roles, role, operation, context} = interpretCode(code);
      const allowed = await evaluate(roles, [role], operation, context);
      setResult(`${role} / ${operation}: ${allowed ? t.allowed : t.denied}`);
    } catch {
      setResult(t.invalidCode);
    } finally {
      setRunning(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return <div className="rb-stack">
    <p className="rb-muted">{t.codeDescription}</p>
    <div className="rb-code-editor" data-color-mode="dark">
      <CodeMirror value={code} height="390px" theme="dark" extensions={[javascript()]} onChange={setCode} basicSetup={{lineNumbers: true, foldGutter: true}} aria-label="JavaScript code editor" />
    </div>
    <div className="rb-actions">
      <Button onClick={run} disabled={running}><Play size={16} />{t.runCode}</Button>
      <Button variant="secondary" onClick={() => {setCode(example); setResult('—');}}><RotateCcw size={16} />{t.reset}</Button>
      <Button variant="subtle" onClick={copyCode}><Copy size={16} />{copied ? t.copied : t.copyCode}</Button>
    </div>
    <Card className="rb-result"><div className="rb-label">{t.output}</div><pre aria-live="polite">{result}</pre></Card>
  </div>;
}

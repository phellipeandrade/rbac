import React, {useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {json} from '@codemirror/lang-json';
import {Play, RotateCcw, Copy} from 'lucide-react';
import {Button, Card} from '../components/ui';
import {useCopy} from '../data/copy';
import {evaluate, type VisualRole, type Context} from './engine';

const example = JSON.stringify({
  roles: {
    viewer: {can: ['documents:read']},
    editor: {inherits: ['viewer'], can: ['documents:edit']}
  },
  check: {role: 'editor', operation: 'documents:read', context: {userId: 'u2', ownerId: 'u2', isActive: true}}
}, null, 2);

function parseCode(text: string) {
  const input: unknown = JSON.parse(text);
  if (!input || typeof input !== 'object') throw new Error('Invalid input');
  const data = input as Record<string, unknown>;
  if (!data.roles || typeof data.roles !== 'object' || Array.isArray(data.roles) || !data.check || typeof data.check !== 'object') throw new Error('Invalid policy');
  const roles: VisualRole[] = Object.entries(data.roles).map(([id, value]) => {
    if (!id || id === '__proto__' || id === 'constructor' || !value || typeof value !== 'object') throw new Error('Invalid role');
    const role = value as Record<string, unknown>;
    if (!Array.isArray(role.can) || role.can.some(grant => typeof grant !== 'string') || (role.inherits !== undefined && (!Array.isArray(role.inherits) || role.inherits.some(parent => typeof parent !== 'string')))) throw new Error('Invalid grants');
    return {id, inherits: role.inherits as string[] ?? [], rules: role.can.map((operation: string) => ({operation, condition: 'always' as const}))};
  });
  const check = data.check as Record<string, unknown>;
  if (typeof check.role !== 'string' || typeof check.operation !== 'string' || !roles.some(role => role.id === check.role)) throw new Error('Invalid check');
  const ctx = check.context && typeof check.context === 'object' ? check.context as Record<string, unknown> : {};
  const context: Context = {userId: String(ctx.userId ?? ''), ownerId: String(ctx.ownerId ?? ''), isActive: ctx.isActive === true};
  return {roles, role: check.role, operation: check.operation, context};
}

export default function CodeEditor() {
  const t = useCopy();
  const [code, setCode] = useState(example);
  const [result, setResult] = useState<string>('—');
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const run = async () => {
    setRunning(true);
    try {
      const {roles, role, operation, context} = parseCode(code);
      const allowed = await evaluate(roles, [role], operation, context);
      setResult(JSON.stringify({role, operation, allowed}, null, 2));
    } catch {
      setResult(t.invalidJSON);
    } finally {setRunning(false);}
  };
  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return <div className="rb-stack">
    <p className="rb-muted">{t.codeDescription}</p>
    <div className="rb-code-editor" data-color-mode="dark">
      <CodeMirror value={code} height="330px" theme="dark" extensions={[json()]} onChange={setCode} basicSetup={{lineNumbers: true, foldGutter: true}} aria-label="JSON policy editor" />
    </div>
    <div className="rb-actions">
      <Button onClick={run} disabled={running}><Play size={16} />{t.runCode}</Button>
      <Button variant="secondary" onClick={() => {setCode(example); setResult('—');}}><RotateCcw size={16} />{t.reset}</Button>
      <Button variant="subtle" onClick={copyCode}><Copy size={16} />{copied ? t.copied : t.copyCode}</Button>
    </div>
    <Card className="rb-result"><div className="rb-label">{t.output}</div><pre aria-live="polite">{result}</pre></Card>
  </div>;
}

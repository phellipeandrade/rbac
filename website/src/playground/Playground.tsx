import React, {useState} from 'react';
import {ArrowRight, Check, CheckCircle2, CircleOff, GitBranch, Plus, ShieldCheck, Trash2} from 'lucide-react';
import {Button, Card, Field, Input, Select, Tabs, TabsContent, TabsList, TabsTrigger} from '../components/ui';
import {useCopy} from '../data/copy';
import CodeEditor from './CodeEditor';
import {RoleGraph} from './RoleGraph';
import {evaluate, initialScenario, referencedRules, type Condition, type Context, type Rule, type Scenario, type VisualRole} from './engine';

const driverExamples = {
  MongoDB: `import { MongoRoleAdapter } from '@rbac/adapters';\n\nconst adapter = new MongoRoleAdapter({\n  uri: 'mongodb://localhost:27017',\n  dbName: 'application',\n  collection: 'roles'\n});\nconst roles = await adapter.getRoles('tenant-a');`,
  MySQL: `import { MySQLRoleAdapter } from '@rbac/adapters';\n\nconst adapter = new MySQLRoleAdapter({\n  uri: 'mysql://localhost:3306/application',\n  table: 'roles'\n});\nconst roles = await adapter.getRoles('tenant-a');`,
  PostgreSQL: `import { PostgresRoleAdapter } from '@rbac/adapters';\n\nconst adapter = new PostgresRoleAdapter({\n  connectionString: 'postgres://localhost:5432/application',\n  table: 'roles'\n});\nconst roles = await adapter.getRoles('tenant-a');`
} as const;

function PermissionRow({rule, onChange, onDelete}: {rule: Rule; onChange: (rule: Rule) => void; onDelete: () => void}) {
  const t = useCopy();
  return <div className="rb-permission-row">
    <Input aria-label={t.permissionOperation} value={rule.operation} onChange={event => onChange({...rule, operation: event.target.value})} />
    <Select aria-label={t.condition} value={rule.condition} onChange={event => onChange({...rule, condition: event.target.value as Condition})}>
      <option value="always">{t.always}</option><option value="owner">{t.owner}</option><option value="active">{t.active}</option>
    </Select>
    <Button variant="subtle" aria-label={t.delete} onClick={onDelete}><Trash2 size={16} /></Button>
  </div>;
}

export default function Playground() {
  const t = useCopy();
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [selectedRole, setSelectedRole] = useState('editor');
  const [newRole, setNewRole] = useState('');
  const [newUser, setNewUser] = useState('');
  const [userRole, setUserRole] = useState('viewer');
  const [selectedUser, setSelectedUser] = useState('u2');
  const [resource, setResource] = useState('documents');
  const [action, setAction] = useState('edit');
  const [context, setContext] = useState<Context>({userId: 'u2', ownerId: 'u2', isActive: true});
  const [result, setResult] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [newOperation, setNewOperation] = useState('documents:publish');
  const [newCondition, setNewCondition] = useState<Condition>('active');
  const [adapter, setAdapter] = useState<keyof typeof driverExamples>('MongoDB');

  const role = scenario.roles.find(item => item.id === selectedRole) ?? scenario.roles[0];
  const user = scenario.users.find(item => item.id === selectedUser);
  const operation = `${resource.trim()}:${action.trim()}`;

  function updateRole(id: string, changes: Partial<VisualRole>) {
    setScenario(current => ({...current, roles: current.roles.map(item => item.id === id ? {...item, ...changes} : item)}));
    setResult(null);
  }

  function addRole() {
    const id = newRole.trim();
    if (!/^[\w-]+$/.test(id) || scenario.roles.some(item => item.id === id) || ['constructor', '__proto__', 'prototype'].includes(id)) {setMessage(t.reservedName); return;}
    setScenario(current => ({...current, roles: [...current.roles, {id, inherits: [], rules: []}]}));
    setSelectedRole(id);
    setNewRole('');
    setMessage(t.successRole);
  }

  function deleteRole(id: string) {
    if (scenario.roles.length < 2) return;
    const next = scenario.roles.filter(item => item.id !== id);
    setScenario(current => ({
      roles: next.map(item => ({...item, inherits: item.inherits.filter(parent => parent !== id)})),
      users: current.users.map(item => ({...item, roles: item.roles.filter(parent => parent !== id)}))
    }));
    setSelectedRole(next[0].id);
    setResult(null);
  }

  function addUser() {
    if (!newUser.trim()) {setMessage(t.emptyUser); return;}
    const id = `u-${Date.now()}`;
    setScenario(current => ({...current, users: [...current.users, {id, name: newUser.trim(), roles: [userRole]}]}));
    setSelectedUser(id);
    setContext(current => ({...current, userId: id}));
    setNewUser('');
    setMessage(t.successUser);
  }

  function addRule() {
    const normalized = newOperation.trim();
    if (!normalized) {setMessage(t.invalidRule); return;}
    updateRole(role.id, {rules: [...role.rules, {operation: normalized, condition: newCondition}]});
    setMessage(t.successRule);
  }

  async function check() {
    setChecking(true);
    setResult(null);
    try {setResult(await evaluate(scenario.roles, user?.roles ?? [], operation, context));}
    catch {setMessage(t.checkError);}
    finally {setChecking(false);}
  }

  const conditions = <><option value="always">{t.always}</option><option value="owner">{t.owner}</option><option value="active">{t.active}</option></>;
  const roleOptions = scenario.roles.map(item => <option key={item.id} value={item.id}>{item.id}</option>);

  return <div className="rb-playground">
    <Tabs defaultValue="workspace" className="rb-tabs">
      <TabsList className="rb-tabs-list" aria-label="Playground tools">
        {Object.entries(t.tabs).map(([id, label]) => <TabsTrigger key={id} value={id} className="rb-tab">{label}</TabsTrigger>)}
      </TabsList>

      <TabsContent value="workspace" className="rb-panel">
        <div className="rb-workspace-grid">
          <Card className="rb-workspace-side">
            <div className="rb-panel-heading"><h2>{t.roleList}</h2><GitBranch size={17}/></div>
            <div className="rb-role-list">{scenario.roles.map(item => <button key={item.id} className={`rb-role-item ${role?.id === item.id ? 'is-selected' : ''}`} onClick={() => {setSelectedRole(item.id); setResult(null);}}><span className="rb-dot"/>{item.id}<span className="rb-role-count">{item.rules.length}</span></button>)}</div>
            <div className="rb-inline-form"><Input value={newRole} aria-label={t.roleName} placeholder={t.roleName} onChange={event => setNewRole(event.target.value)} onKeyDown={event => {if (event.key === 'Enter') addRole();}}/><Button aria-label={t.addRole} onClick={addRole}><Plus size={17}/></Button></div>
            <div className="rb-divider"/>
            <h3>{t.users}</h3>
            <div className="rb-user-list">{scenario.users.map(item => <div key={item.id} className="rb-user-item"><span className="rb-avatar">{item.name.charAt(0)}</span><span>{item.name}<small>{item.roles.join(', ') || '—'}</small></span></div>)}</div>
            <div className="rb-stack rb-compact"><Input placeholder={t.userName} aria-label={t.userName} value={newUser} onChange={event => setNewUser(event.target.value)}/><Select aria-label={t.userRole} value={userRole} onChange={event => setUserRole(event.target.value)}>{roleOptions}</Select><Button variant="secondary" onClick={addUser}><Plus size={16}/>{t.addUser}</Button></div>
          </Card>

          {role && <Card className="rb-workspace-main">
            <div className="rb-panel-heading"><div><div className="rb-label">{t.editor}</div><h2 className="rb-role-title">{role.id}</h2></div><Button variant="subtle" disabled={scenario.roles.length < 2} onClick={() => deleteRole(role.id)}><Trash2 size={16}/>{t.delete}</Button></div>
            <div className="rb-editor-section"><Field label={t.inherited}><Select value={role.inherits[0] ?? ''} onChange={event => {
              const parent = event.target.value;
              // Refuse cycles; this preserves the visual graph's hierarchy.
              const ancestors = (id: string, seen = new Set<string>()): Set<string> => {
                if (seen.has(id)) return seen;
                seen.add(id);
                scenario.roles.find(item => item.id === id)?.inherits.forEach(next => ancestors(next, seen));
                return seen;
              };
              if (parent && ancestors(parent).has(role.id)) return;
              updateRole(role.id, {inherits: parent ? [parent] : []});
            }}><option value="">{t.noInheritance}</option>{scenario.roles.filter(item => item.id !== role.id).map(item => <option key={item.id} value={item.id}>{item.id}</option>)}</Select></Field></div>
            <div className="rb-panel-heading rb-heading-space"><h3>{t.permissions}</h3><span className="rb-counter">{role.rules.length}</span></div>
            <div className="rb-stack">{role.rules.length ? role.rules.map((rule, index) => <PermissionRow key={`${role.id}-${index}`} rule={rule} onChange={updated => updateRole(role.id, {rules: role.rules.map((item, i) => i === index ? updated : item)})} onDelete={() => updateRole(role.id, {rules: role.rules.filter((_, i) => i !== index)})}/>) : <p className="rb-muted">{t.noPermissions}</p>}</div>
            <Button variant="secondary" className="rb-add-grant" onClick={() => updateRole(role.id, {rules: [...role.rules, {operation: 'documents:read', condition: 'always'}]})}><Plus size={16}/>{t.addPermission}</Button>
            <div className="rb-editor-foot"><ShieldCheck size={17}/><span>{t.engineNote}</span></div>
          </Card>}
        </div>
      </TabsContent>

      <TabsContent value="tester" className="rb-panel">
        <div className="rb-panel-heading"><div><h2>{t.testerTitle}</h2><p>{t.testerDescription}</p></div><ShieldCheck size={25}/></div>
        <div className="rb-test-grid">
          <Card className="rb-stack"><Field label={t.user}><Select value={selectedUser} onChange={event => {const id = event.target.value; setSelectedUser(id); setContext(current => ({...current, userId: id})); setResult(null);}}>{scenario.users.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <Field label={t.role}><Input value={user?.roles.join(', ') ?? ''} readOnly /></Field>
            <div className="rb-two-cols"><Field label={t.resource}><Input value={resource} onChange={event => {setResource(event.target.value); setResult(null);}} /></Field><Field label={t.action}><Input value={action} onChange={event => {setAction(event.target.value); setResult(null);}} /></Field></div>
            <div className="rb-two-cols"><Field label={t.userId}><Input value={context.userId} onChange={event => {setContext(current => ({...current, userId: event.target.value}));setResult(null);}} /></Field><Field label={t.ownerId}><Input value={context.ownerId} onChange={event => {setContext(current => ({...current, ownerId: event.target.value}));setResult(null);}} /></Field></div>
            <label className="rb-checkbox"><input type="checkbox" checked={context.isActive} onChange={event => {setContext(current => ({...current, isActive: event.target.checked}));setResult(null);}} />{t.accountActive}</label>
            <Button className="rb-wide" disabled={checking} onClick={check}><ShieldCheck size={17}/>{t.runCheck}</Button>
          </Card>
          <Card className="rb-check-result"><div className="rb-label">{operation}</div><div className={`rb-decision ${result === true ? 'yes' : result === false ? 'no' : ''}`}>{result === true ? <CheckCircle2 size={37}/> : result === false ? <CircleOff size={37}/> : <ShieldCheck size={37}/>}<h2 aria-live="polite">{result === null ? t.waiting : result ? t.allowed : t.denied}</h2></div><p className="rb-muted">{t.engineNote}</p><div className="rb-divider"/><h3>{t.matchHint}</h3><div className="rb-grant-list">{referencedRules(scenario.roles, user?.roles ?? []).map(({role, rule}, index) => <div key={index} className="rb-grant"><code>{rule.operation}</code><small>{role} · {t[rule.condition]}</small></div>)}</div><p className="rb-note">{t.noteMultiple}</p></Card>
        </div>
      </TabsContent>

      <TabsContent value="graph" className="rb-panel"><div className="rb-panel-heading"><div><h2>{t.graphTitle}</h2><p>{t.graphDescription}</p></div><GitBranch size={26}/></div><RoleGraph roles={scenario.roles} users={scenario.users}/></TabsContent>

      <TabsContent value="builder" className="rb-panel"><div className="rb-panel-heading"><div><h2>{t.builderTitle}</h2><p>{t.builderDescription}</p></div><Plus size={25}/></div><Card className="rb-stack"><Field label={t.selectRole}><Select value={selectedRole} onChange={event => setSelectedRole(event.target.value)}>{roleOptions}</Select></Field><Field label={t.permissionOperation}><Input value={newOperation} onChange={event => setNewOperation(event.target.value)}/></Field><Field label={t.condition}><Select value={newCondition} onChange={event => setNewCondition(event.target.value as Condition)}>{conditions}</Select></Field><Button onClick={addRule}><Plus size={16}/>{t.saveRule}</Button><pre className="rb-policy-preview">{JSON.stringify({[role?.id ?? 'role']: {can: [{name: newOperation, when: newCondition === 'always' ? true : `[${newCondition} predicate]`}]}}, null, 2)}</pre></Card></TabsContent>

      <TabsContent value="code" className="rb-panel"><div className="rb-panel-heading"><h2>{t.codeTitle}</h2></div><CodeEditor/></TabsContent>

      <TabsContent value="adapters" className="rb-panel"><div className="rb-panel-heading"><div><h2>{t.adaptersTitle}</h2><p>{t.adaptersDescription}</p></div></div><Card className="rb-stack"><Field label={t.adapterOptions}><Select value={adapter} onChange={event => setAdapter(event.target.value as keyof typeof driverExamples)}>{Object.keys(driverExamples).map(name => <option key={name} value={name}>{name}</option>)}</Select></Field><pre className="rb-policy-preview">{driverExamples[adapter]}</pre><p className="rb-muted">{t.installDriver}</p></Card></TabsContent>

      <TabsContent value="flow" className="rb-panel"><div className="rb-panel-heading"><div><h2>{t.flowTitle}</h2><p>{t.flowDescription}</p></div></div><div className="rb-flow">{t.flowSteps.map((step, index) => <React.Fragment key={step}><Card className="rb-flow-step"><span className="rb-step-num">0{index + 1}</span><strong>{step}</strong>{index === t.flowSteps.length - 1 && <Check size={19}/>}</Card>{index < t.flowSteps.length - 1 && <ArrowRight size={20} className="rb-flow-arrow"/>}</React.Fragment>)}</div></TabsContent>
    </Tabs>
    {message && <div role="status" className="rb-toast" onClick={() => setMessage('')}>{message}</div>}
  </div>;
}

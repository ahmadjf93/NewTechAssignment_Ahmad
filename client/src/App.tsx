import React, { useEffect, useMemo, useRef, useState } from 'react';
import Tree, { type RawNodeDatum } from 'react-d3-tree';
import { Button as UiButton, Card as UiCard, Input as UiInput } from '@newtech/ui-core';
import { createTeam, createUser, deleteTeam, deleteUser, getTeam, getTeams, getUser, getUsers, updateTeam, updateUser } from './api';
import { Team, User } from './types';

// Controls the create/edit modal state for teams and users.
type ModalState =
  | { type: 'team'; mode: 'create'; data: { name: string; parentId: number | null } }
  | { type: 'team'; mode: 'edit'; data: { id: number; name: string; parentId: number | null } }
  | { type: 'user'; mode: 'create'; data: { name: string; teamIds: number[] } }
  | { type: 'user'; mode: 'edit'; data: { id: number; name: string; teamIds: number[] } }
  | null;

export default function App() {
  // Global app state.
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [searchUserId, setSearchUserId] = useState('');
  const [searchUserName, setSearchUserName] = useState('');
  const [searchTeamId, setSearchTeamId] = useState('');
  const [searchTeamName, setSearchTeamName] = useState('');
  const [userSearchBusy, setUserSearchBusy] = useState(false);
  const [teamSearchBusy, setTeamSearchBusy] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [teamSearchError, setTeamSearchError] = useState<string | null>(null);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [teamResults, setTeamResults] = useState<Team[]>([]);
  const [userSearchCollapsed, setUserSearchCollapsed] = useState(true);
  const [teamSearchCollapsed, setTeamSearchCollapsed] = useState(true);

  // Derived maps and collapse flags.
  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const [teamsCollapsed, setTeamsCollapsed] = useState(true);
  const [usersCollapsed, setUsersCollapsed] = useState(true);

  // Load initial data for teams and users.
  async function loadData() {
    try {
      setError(null);
      const [t, u] = await Promise.all([getTeams(), getUsers()]);
      setTeams(t);
      setUsers(u);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Tree layout state and refs.
  const rootParents = useMemo(() => teams.filter((t) => !t.parentId), [teams]);
  const treeRef = useRef<HTMLDivElement | null>(null);
  const [treeTranslate, setTreeTranslate] = useState<{ x: number; y: number }>({ x: 400, y: 60 });
  const [treeHeight, setTreeHeight] = useState(420);
  const [treeZoom, setTreeZoom] = useState(0.75);
  const [treeSize, setTreeSize] = useState<{ width: number; height: number }>({ width: 800, height: 420 });
  const nodeSize = { x: 200, y: 140 };
  const separation = { siblings: 1.3, nonSiblings: 1.8 };

  // Track tree container size and react to resize events.
  useEffect(() => {
    if (!treeRef.current) return;
    const element = treeRef.current;
    const updateSize = () => {
      const width = element.offsetWidth || 800;
      const height = element.offsetHeight || 420;
      setTreeSize({ width, height });
    };
    updateSize();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(element);
    }
    const handleResize = () => updateSize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
  }, []);

  // Build tree nodes from teams and users.
  const treeData = useMemo(() => {
    const buildNode = (team: Team): RawNodeDatum => {
      const childTeams = team.childTeamIds.map((id) => teamsById.get(id)).filter(Boolean) as Team[];
      const childUsers = users.filter((u) => u.teamIds?.includes(team.id));
      return {
        name: team.name,
        attributes: {
          ID: team.id,
          Users: childUsers.length,
          'Child teams': childTeams.length,
        },
        children: [
          ...childUsers.map((u) => ({
            name: u.name,
            attributes: { ID: u.id, Type: 'User' },
            children: [],
          })),
          ...childTeams.map((ct) => buildNode(ct)),
        ],
      };
    };
    return rootParents.length ? rootParents.map((r) => buildNode(r)) : [];
  }, [rootParents, teamsById, users]);

  // Compute tree depth for zoom and layout decisions.
  const maxDepth = useMemo(() => {
    const depthOf = (node: RawNodeDatum): number => {
      if (!node?.children || node.children.length === 0) return 1;
      return 1 + Math.max(...node.children.map(depthOf));
    };
    return treeData.length ? Math.max(...treeData.map(depthOf)) : 0;
  }, [treeData]);

  // Compute tree breadth for zoom and layout decisions.
  const treeBreadth = useMemo(() => {
    const levelCounts = new Map<number, number>();
    const visit = (node: RawNodeDatum, level: number) => {
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
      node?.children?.forEach((child) => visit(child, level + 1));
    };
    treeData.forEach((root) => visit(root, 0));
    return levelCounts.size ? Math.max(...levelCounts.values()) : 0;
  }, [treeData]);

  // Update zoom and translate to fit the available space.
  useEffect(() => {
    const width = treeSize.width || 800;
    const height = treeSize.height || 420;
    const breadth = Math.max(1, treeBreadth);
    const depth = Math.max(1, maxDepth);
    const estimatedWidth = breadth * nodeSize.x * separation.siblings * 1.15;
    const estimatedHeight = depth * nodeSize.y * separation.nonSiblings * 1.15;
    const nextZoom = Math.min(width / estimatedWidth, height / estimatedHeight, 1);
    const clampedZoom = Math.max(0.2, Math.min(1, nextZoom));
    setTreeZoom(clampedZoom);
    setTreeTranslate({ x: width / 2, y: 60 });
  }, [treeSize, treeBreadth, maxDepth, nodeSize.x, nodeSize.y, separation.siblings, separation.nonSiblings]);

  // Keep the tree canvas at a fixed baseline height.
  useEffect(() => {
    // Keep canvas at baseline height; we rely on initial zoom to fit content.
    setTreeHeight(420);
  }, [maxDepth]);

  // Custom SVG node renderer for react-d3-tree.
  const renderTreeNode = (rd3tProps: { nodeDatum: RawNodeDatum }) => {
    const { nodeDatum } = rd3tProps;
    const isUser = nodeDatum.attributes?.Type === 'User';
    const boxWidth = 150;
    const boxHeight = 60;
    const fill = isUser ? '#ffffff' : '#4c6ef5';
    const stroke = isUser ? '#4c6ef5' : '#1f2a4d';
    const nameColor = isUser ? '#0b1535' : '#f7fbff';
    const nameStroke = isUser ? '#ffffff' : '#1a2b55';
    const idColor = isUser ? '#0b1535' : '#e9edff';
    const idStroke = isUser ? '#ffffff' : '#1a2b55';
    const id = nodeDatum.attributes?.ID;

    return (
      <g style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}>
        <rect
          x={-boxWidth / 2}
          y={-boxHeight / 2}
          width={boxWidth}
          height={boxHeight}
          rx={12}
          ry={12}
          fill={fill}
          stroke={stroke}
          strokeWidth={2.4}
        />
        <text
          y={-6}
          textAnchor="middle"
          fill={nameColor}
          fontWeight={800}
          fontSize={14}
          paintOrder="stroke fill"
          stroke={nameStroke}
          strokeWidth={0.45}
        >
          {nodeDatum.name}
        </text>
        {id != null ? (
          <text
            y={14}
            textAnchor="middle"
            fill={idColor}
            fontWeight={600}
            fontSize={12}
            paintOrder="stroke fill"
            stroke={idStroke}
            strokeWidth={0.35}
          >
            ID: {id}
          </text>
        ) : null}
      </g>
    );
  };

  // Modal open helpers.
  function openCreateTeam() {
    setModal({ type: 'team', mode: 'create', data: { name: '', parentId: null } });
  }

  function openEditTeam(team: Team) {
    setModal({ type: 'team', mode: 'edit', data: { id: team.id, name: team.name, parentId: team.parentId ?? null } });
  }

  function openCreateUser() {
    setModal({ type: 'user', mode: 'create', data: { name: '', teamIds: [] } });
  }

  function openEditUser(user: User) {
    setModal({ type: 'user', mode: 'edit', data: { id: user.id, name: user.name, teamIds: user.teamIds ?? [] } });
  }

  // Persist team changes and reload lists.
  async function handleSaveTeam(data: { id?: number; name: string; parentId: number | null }) {
    try {
      setBusy(true);
      if (data.id) {
        await updateTeam(data.id, { name: data.name, parentId: data.parentId });
      } else {
        await createTeam({ name: data.name, parentId: data.parentId });
      }
      setModal(null);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Persist user changes and reload lists.
  async function handleSaveUser(data: { id?: number; name: string; teamIds: number[] }) {
    try {
      setBusy(true);
      if (data.id) {
        await updateUser(data.id, { name: data.name, teamIds: data.teamIds });
      } else {
        await createUser({ name: data.name, teamIds: data.teamIds });
      }
      setModal(null);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Delete a team and refresh the data.
  async function handleDeleteTeam(id: number) {
    const team = teamsById.get(id);
    const confirmMessage = team
      ? `Delete team "${team.name}" and ALL its children? This cannot be undone.`
      : 'Delete this team and children?';
    if (!window.confirm(confirmMessage)) return;
    try {
      setBusy(true);
      await deleteTeam(id);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Delete a user and refresh the data.
  async function handleDeleteUser(id: number) {
    const user = users.find((u) => u.id === id);
    const confirmMessage = user ? `Delete user "${user.name}"?` : 'Delete user?';
    if (!window.confirm(confirmMessage)) return;
    try {
      setBusy(true);
      await deleteUser(id);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Deduplicate results by id.
  function dedupeById<T extends { id: number }>(items: T[]): T[] {
    const seen = new Set<number>();
    const unique: T[] = [];
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }
    return unique;
  }

  // Search users by id or name.
  async function handleUserSearch() {
    if (!searchUserId && !searchUserName) {
      setUserSearchError('Enter user ID or name.');
      return;
    }
    setUserSearchError(null);
    setUserResults([]);
    setUserSearchBusy(true);
    try {
      const results: User[] = [];
      if (searchUserId) {
        const user = await getUser(Number(searchUserId));
        if (user) results.push(user);
      }
      if (searchUserName) {
        const usersByName = await getUsers(searchUserName);
        results.push(...usersByName);
      }
      const deduped = dedupeById(results);
      setUserResults(deduped);
      setUserSearchError(deduped.length === 0 ? 'No matching users found.' : null);
    } catch (err) {
      setUserSearchError('No matching users found.');
      setUserResults([]);
    } finally {
      setUserSearchBusy(false);
    }
  }

  // Search teams by id or name.
  async function handleTeamSearch() {
    if (!searchTeamId && !searchTeamName) {
      setTeamSearchError('Enter team ID or name.');
      return;
    }
    setTeamSearchError(null);
    setTeamResults([]);
    setTeamSearchBusy(true);
    try {
      const results: Team[] = [];
      if (searchTeamId) {
        const team = await getTeam(Number(searchTeamId));
        if (team) results.push(team);
      }
      if (searchTeamName) {
        const teamsByName = await getTeams(searchTeamName);
        results.push(...teamsByName);
      }
      const deduped = dedupeById(results);
      setTeamResults(deduped);
      setTeamSearchError(deduped.length === 0 ? 'No matching teams found.' : null);
    } catch (err) {
      setTeamSearchError('No matching teams found.');
      setTeamResults([]);
    } finally {
      setTeamSearchBusy(false);
    }
  }

  // Clear user search filters and results.
  function clearUserSearch() {
    setSearchUserId('');
    setSearchUserName('');
    setUserResults([]);
    setUserSearchError(null);
  }

  // Clear team search filters and results.
  function clearTeamSearch() {
    setSearchTeamId('');
    setSearchTeamName('');
    setTeamResults([]);
    setTeamSearchError(null);
  }

  // org chart now rendered via react-d3-tree

  // Collect all descendant team ids for exclusion lists.
  function collectDescendants(startId: number, acc: Set<number>) {
    const start = teamsById.get(startId);
    if (!start) return;
    start.childTeamIds.forEach((cid) => {
      if (!acc.has(cid)) {
        acc.add(cid);
        collectDescendants(cid, acc);
      }
    });
  }

  // Available parent teams, excluding the current team and descendants.
  const parentOptions = useMemo(() => {
    const exclude = new Set<number>();
    if (modal?.type === 'team' && 'id' in modal.data && modal.data.id != null) {
      exclude.add(modal.data.id);
      collectDescendants(modal.data.id, exclude);
    }
    return teams.filter((t) => !exclude.has(t.id));
  }, [teams, modal]);

  // Main UI.
  return (
    <main>
      <header>
        <div>
          <h1>Teams & Users</h1>
          <p className="small">Manage parent/child teams, attach users, and view the org tree.</p>
        </div>
        {error ? <span className="badge">Error: {error}</span> : null}
      </header>

      <section>
        <div className="section-head">
          <div>
            <h2>Search</h2>
            <p className="small">Find users and teams by ID or name.</p>
          </div>
        </div>

        <UiCard>
          <div className="section-head" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>User search</h3>
            <div className="row">
              <UiButton
                variant="ghost"
                onClick={() => setUserSearchCollapsed((v) => !v)}
                aria-label={userSearchCollapsed ? 'Expand user search' : 'Collapse user search'}
                title={userSearchCollapsed ? 'Expand user search' : 'Collapse user search'}
              >
                {userSearchCollapsed ? '⯈' : '⯆'}
              </UiButton>
              <UiButton onClick={handleUserSearch} disabled={userSearchBusy}>
                {userSearchBusy ? 'Searching…' : 'Search'}
              </UiButton>
              <UiButton variant="ghost" onClick={clearUserSearch} disabled={userSearchBusy}>
                Clear
              </UiButton>
            </div>
          </div>
          {!userSearchCollapsed && (
            <>
              <div className="form" style={{ marginTop: 8 }}>
                <UiInput
                  label="User ID"
                  type="number"
                  value={searchUserId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchUserId(e.target.value)}
                  placeholder="e.g. 1"
                />
                <UiInput
                  label="User name"
                  value={searchUserName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchUserName(e.target.value)}
                  placeholder="e.g. Alice"
                />
              </div>
              {userSearchError ? <p className="small">Warning: {userSearchError}</p> : null}
              <h4 style={{ margin: '16px 0 8px' }}>User results</h4>
              {userResults.length === 0 ? (
                <div className="empty">No users.</div>
              ) : (
                <div className="list">
                  {userResults.map((user) => (
                    <div key={user.id} className="card">
                      <div className="row">
                        <strong>{user.name}</strong>
                        <span className="badge">{user.id}</span>
                      </div>
                      <div className="small row" style={{ alignItems: 'center' }}>
                        <span>Teams:</span>
                        {user.teamIds && user.teamIds.length > 0 ? (
                          user.teamIds.map((tid) => (
                            <span key={tid} className="pill">
                              {teamsById.get(tid)?.name || `ID ${tid}`}
                            </span>
                          ))
                        ) : (
                          <span>Unassigned</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </UiCard>

        <UiCard style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Team search</h3>
            <div className="row">
              <UiButton
                variant="ghost"
                onClick={() => setTeamSearchCollapsed((v) => !v)}
                aria-label={teamSearchCollapsed ? 'Expand team search' : 'Collapse team search'}
                title={teamSearchCollapsed ? 'Expand team search' : 'Collapse team search'}
              >
                {teamSearchCollapsed ? '⯈' : '⯆'}
              </UiButton>
              <UiButton onClick={handleTeamSearch} disabled={teamSearchBusy}>
                {teamSearchBusy ? 'Searching…' : 'Search'}
              </UiButton>
              <UiButton variant="ghost" onClick={clearTeamSearch} disabled={teamSearchBusy}>
                Clear
              </UiButton>
            </div>
          </div>
          {!teamSearchCollapsed && (
            <>
              <div className="form" style={{ marginTop: 8 }}>
                <UiInput
                  label="Team ID"
                  type="number"
                  value={searchTeamId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTeamId(e.target.value)}
                  placeholder="e.g. 2"
                />
                <UiInput
                  label="Team name"
                  value={searchTeamName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTeamName(e.target.value)}
                  placeholder="e.g. Dev"
                />
              </div>
              {teamSearchError ? <p className="small">Warning: {teamSearchError}</p> : null}
              <h4 style={{ margin: '16px 0 8px' }}>Team results</h4>
              {teamResults.length === 0 ? (
                <div className="empty">No teams.</div>
              ) : (
                <div className="list">
                  {teamResults.map((team) => (
                    <div key={team.id} className="card">
                      <div className="row">
                        <strong>{team.name}</strong>
                        <span className="badge">{team.id}</span>
                      </div>
                      <div className="small">Parent: {team.parentId ? teamsById.get(team.parentId)?.name || team.parentId : 'None'}</div>
                      <div className="small">Child teams: {team.childTeamIds.length}</div>
                      <div className="small">Child users: {team.childUserIds.length}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </UiCard>
      </section>

      <div className="two-grid">
        <section>
          <div className="section-head">
            <div>
              <h2>Teams</h2>
              <p className="small">A team can be a parent or a child (never both).</p>
            </div>
            <div className="row">
              <button
                className="icon-btn ghost"
                aria-label={teamsCollapsed ? 'Expand teams' : 'Collapse teams'}
                title={teamsCollapsed ? 'Expand teams' : 'Collapse teams'}
                onClick={() => setTeamsCollapsed((v) => !v)}
              >
                {teamsCollapsed ? '⯈' : '⯆'}
              </button>
              <button onClick={openCreateTeam}>Add team</button>
            </div>
          </div>
          {!teamsCollapsed && (
            <div>
              {teams.length === 0 ? (
                <div className="empty">No teams yet.</div>
              ) : (
                <div className="list">
                  {teams.map((team) => (
                    <div key={team.id} className="card">
                      <div className="row">
                        <strong>{team.name}</strong>
                        <span className="badge">{team.id}</span>
                      </div>
                      <div className="small">Parent: {team.parentId ? teamsById.get(team.parentId)?.name || team.parentId : 'None'}</div>
                      <div className="small">Child teams: {team.childTeamIds.length}</div>
                      <div className="small">Child users: {team.childUserIds.length}</div>
                      <div className="row" style={{ marginTop: 8 }}>
                        <button onClick={() => openEditTeam(team)} disabled={busy}>Edit</button>
                        <button onClick={() => handleDeleteTeam(team.id)} disabled={busy} className="ghost">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <div className="section-head">
            <div>
              <h2>Users</h2>
              <p className="small">Users can belong to multiple teams.</p>
            </div>
            <div className="row">
              <button
                className="icon-btn ghost"
                aria-label={usersCollapsed ? 'Expand users' : 'Collapse users'}
                title={usersCollapsed ? 'Expand users' : 'Collapse users'}
                onClick={() => setUsersCollapsed((v) => !v)}
              >
                {usersCollapsed ? '⯈' : '⯆'}
              </button>
              <button onClick={openCreateUser}>Add user</button>
            </div>
          </div>
          {!usersCollapsed && (
            <div>
              {users.length === 0 ? (
                <div className="empty">No users yet.</div>
              ) : (
                <div className="list">
                  {users.map((user) => (
                    <div key={user.id} className="card">
                      <div className="row">
                        <strong>{user.name}</strong>
                        <span className="badge">{user.id}</span>
                      </div>
                      <div className="small">
                        Teams: {user.teamIds?.map((tid) => teamsById.get(tid)?.name || tid).join(', ') || 'Unassigned'}
                      </div>
                      <div className="row" style={{ marginTop: 8 }}>
                        <button onClick={() => openEditUser(user)} disabled={busy}>Edit</button>
                        <button onClick={() => handleDeleteUser(user.id)} disabled={busy} className="ghost">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <section>
        <h2>Organization tree</h2>
        <p className="small">Hierarchical view of teams and their users.</p>
        <div className="tree-wrapper" ref={treeRef} style={{ height: treeHeight }}>
          {treeData.length === 0 ? (
            <div className="empty">No teams yet.</div>
          ) : (
            <Tree
              data={treeData}
              translate={treeTranslate}
              nodeSize={nodeSize}
              separation={separation}
              orientation="vertical"
              zoomable
              zoom={treeZoom}
              scaleExtent={{ min: 0.2, max: 1 }}
              collapsible={false}
              pathFunc="step"
              renderCustomNodeElement={renderTreeNode}
              styles={{
                nodes: {
                  node: { circle: {}, name: {}, attributes: {} },
                  leafNode: { circle: {}, name: {}, attributes: {} },
                },
                links: { stroke: '#b7c6ff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
              }}
            />
          )}
        </div>
        <div className="row" style={{ marginTop: 8, alignItems: 'center', gap: 12 }}>
          <span className="small" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 12, borderRadius: 6, background: '#4c6ef5', display: 'inline-block', border: '2px solid #1f2a4d' }} />
            Team
          </span>
          <span className="small" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 12, borderRadius: 6, background: '#ffffff', display: 'inline-block', border: '2px solid #4c6ef5' }} />
            User
          </span>
        </div>
      </section>

      {modal ? (
        <Modal onClose={() => setModal(null)}>
          {modal.type === 'team' ? (
            <TeamForm
              mode={modal.mode}
              data={modal.data}
              parentOptions={parentOptions}
              teamsById={teamsById}
              onSave={handleSaveTeam}
              busy={busy}
            />
          ) : (
            <UserForm
              mode={modal.mode}
              data={modal.data}
              teams={teams}
              onSave={handleSaveUser}
              busy={busy}
            />
          )}
        </Modal>
      ) : null}
    </main>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
}

function TeamForm({
  mode,
  data,
  parentOptions,
  teamsById,
  onSave,
  busy,
}: {
  mode: 'create' | 'edit';
  data: { id?: number; name: string; parentId: number | null };
  parentOptions: Team[];
  teamsById: Map<number, Team>;
  onSave: (data: { id?: number; name: string; parentId: number | null }) => Promise<void>;
  busy: boolean;
}) {
  const [name, setName] = useState(data.name);
  const [parentId, setParentId] = useState<number | null>(data.parentId ?? null);
  const team = data.id ? teamsById.get(data.id) : null;
  const hasChildren = (team?.childTeamIds?.length ?? 0) > 0;
  const parentLocked = hasChildren; // cannot make a parent into a child

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({ id: data.id, name, parentId });
  }

  return (
    <form onSubmit={submit} className="form">
      <h3>{mode === 'create' ? 'Create team' : 'Edit team'}</h3>
      <label>
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        <span>Parent (dropdown)</span>
        <select
          value={parentId ?? ''}
          onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
          disabled={parentLocked}
        >
          <option value="">No parent (top-level)</option>
          {parentOptions
            .filter((t) => t.id !== data.id)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </select>
        {parentLocked ? <span className="small">Cannot assign a parent while this team has children.</span> : null}
      </label>
      <div className="row" style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>Save</button>
      </div>
    </form>
  );
}

function UserForm({
  mode,
  data,
  teams,
  onSave,
  busy,
}: {
  mode: 'create' | 'edit';
  data: { id?: number; name: string; teamIds: number[] };
  teams: Team[];
  onSave: (data: { id?: number; name: string; teamIds: number[] }) => Promise<void>;
  busy: boolean;
}) {
  const [name, setName] = useState(data.name);
  const [teamIds, setTeamIds] = useState<number[]>(data.teamIds ?? []);

  function toggleTeam(id: number) {
    setTeamIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({ id: data.id, name, teamIds });
  }

  return (
    <form onSubmit={submit} className="form">
      <h3>{mode === 'create' ? 'Create user' : 'Edit user'}</h3>
      <label>
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <div className="checkboxes">
        <span className="small">Teams (multi-select)</span>
        {teams.length === 0 ? <div className="small">No teams yet</div> : null}
        {teams.map((team) => (
          <label key={team.id} className="checkbox">
            <input type="checkbox" checked={teamIds.includes(team.id)} onChange={() => toggleTeam(team.id)} />
            <span>{team.name}</span>
          </label>
        ))}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>Save</button>
      </div>
    </form>
  );
}

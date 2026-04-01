import { readDb, writeDb } from './data/store';
import { Database, Team, User } from './types';

function normalizeName(name: string): string {
  return name.trim();
}

function searchByName<T extends { name: string }>(items: T[], term?: string): T[] {
  if (!term) return items;
  const lowered = term.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(lowered));
}

async function save(db: Database): Promise<void> {
  await writeDb(db);
}

function nextTeamId(db: Database): number {
  db.counters = db.counters ?? { team: 0, user: 0 };
  db.counters.team += 1;
  return db.counters.team;
}

function nextUserId(db: Database): number {
  db.counters = db.counters ?? { team: 0, user: 0 };
  db.counters.user += 1;
  return db.counters.user;
}

function findTeam(db: Database, id: number): Team {
  const team = db.teams.find((t) => t.id === id);
  if (!team) throw new Error('Team not found');
  team.childTeamIds = team.childTeamIds ?? [];
  team.childUserIds = team.childUserIds ?? [];
  return team;
}

function findUser(db: Database, id: number): User {
  const user = db.users.find((u) => u.id === id);
  if (!user) throw new Error('User not found');
  user.teamIds = user.teamIds ?? [];
  return user;
}

function ensureTeamsExist(db: Database, ids: number[]): void {
  ids.forEach((id) => {
    const exists = db.teams.some((t) => t.id === id);
    if (!exists) throw new Error(`Team ${id} not found`);
  });
}

function detachChildFromPreviousParent(db: Database, childId: number): void {
  db.teams.forEach((t) => {
    if (t.childTeamIds.includes(childId)) {
      t.childTeamIds = t.childTeamIds.filter((id) => id !== childId);
    }
  });
}

function isDescendant(db: Database, rootId: number, searchFor: number): boolean {
  const root = db.teams.find((t) => t.id === rootId);
  if (!root) return false;
  if (root.childTeamIds.includes(searchFor)) return true;
  return root.childTeamIds.some((cid) => isDescendant(db, cid, searchFor));
}

function setTeamParent(db: Database, childId: number, parentId?: number): void {
  const child = findTeam(db, childId);
  if (parentId === childId) throw new Error('A team cannot be its own parent');

  if (parentId) {
    const parent = findTeam(db, parentId);
    if (isDescendant(db, childId, parentId)) {
      throw new Error('Cannot create a cycle: parent is a descendant of child');
    }

    // Move child under new parent (unique).
    detachChildFromPreviousParent(db, childId);
    if (!parent.childTeamIds.includes(childId)) {
      parent.childTeamIds.push(childId);
    }
    child.parentId = parentId;
  } else {
    // Detach child from any parent.
    detachChildFromPreviousParent(db, childId);
    delete child.parentId;
  }
}

function detachUserFromAllTeams(db: Database, userId: number): void {
  db.teams.forEach((t) => {
    t.childUserIds = t.childUserIds.filter((id) => id !== userId);
  });
}

function setUserTeams(db: Database, userId: number, teamIds: number[]): void {
  ensureTeamsExist(db, teamIds);
  const uniqueTeams = Array.from(new Set(teamIds));
  const user = findUser(db, userId);
  detachUserFromAllTeams(db, userId);
  uniqueTeams.forEach((id) => {
    const team = findTeam(db, id);
    if (!team.childUserIds.includes(userId)) {
      team.childUserIds.push(userId);
    }
  });
  user.teamIds = uniqueTeams;
}

function collectDescendants(db: Database, id: number, acc: Set<number>): void {
  acc.add(id);
  const team = db.teams.find((t) => t.id === id);
  if (!team) return;
  team.childTeamIds.forEach((childId) => collectDescendants(db, childId, acc));
}

export async function createTeam(name: string, parentId?: number): Promise<Team> {
  const cleanName = normalizeName(name);
  if (!cleanName) throw new Error('Team name is required');

  const db = await readDb();
  const team: Team = { id: nextTeamId(db), name: cleanName, parentId: undefined, childTeamIds: [], childUserIds: [] };
  db.teams.push(team);

  if (parentId) {
    setTeamParent(db, team.id, parentId);
  }

  await save(db);
  return team;
}

export async function updateTeam(id: number, updates: { name?: string; parentId?: number | null }): Promise<Team> {
  const db = await readDb();
  const team = findTeam(db, id);

  if (typeof updates.name === 'string') {
    const clean = normalizeName(updates.name);
    if (!clean) throw new Error('Team name is required');
    team.name = clean;
  }

  if (updates.parentId !== undefined) {
    const nextParent = updates.parentId === null ? undefined : updates.parentId;
    setTeamParent(db, id, nextParent);
  }

  await save(db);
  return team;
}

export async function getTeamById(id: number): Promise<Team | undefined> {
  const db = await readDb();
  return db.teams.find((t) => t.id === id);
}

export async function getTeamsByName(name?: string): Promise<Team[]> {
  const db = await readDb();
  return searchByName(db.teams, name);
}

export async function createUser(name: string, teamIds: number[] = []): Promise<User> {
  const cleanName = normalizeName(name);
  if (!cleanName) throw new Error('User name is required');
  const db = await readDb();
  ensureTeamsExist(db, teamIds);
  const uniqueTeams = Array.from(new Set(teamIds));
  const user: User = { id: nextUserId(db), name: cleanName, teamIds: uniqueTeams };
  db.users.push(user);

  uniqueTeams.forEach((id) => {
    const team = findTeam(db, id);
    if (!team.childUserIds.includes(user.id)) {
      team.childUserIds.push(user.id);
    }
  });

  await save(db);
  return user;
}

export async function updateUser(id: number, updates: { name?: string; teamIds?: number[] }): Promise<User> {
  const db = await readDb();
  const user = findUser(db, id);

  if (typeof updates.name === 'string') {
    const clean = normalizeName(updates.name);
    if (!clean) throw new Error('User name is required');
    user.name = clean;
  }

  if (updates.teamIds !== undefined) {
    setUserTeams(db, id, updates.teamIds ?? []);
  }

  await save(db);
  return user;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await readDb();
  return db.users.find((u) => u.id === id);
}

export async function getUsersByName(name?: string): Promise<User[]> {
  const db = await readDb();
  return searchByName(db.users, name);
}

export async function attachChildTeam(parentId: number, childTeamId: number): Promise<Team> {
  const db = await readDb();
  setTeamParent(db, childTeamId, parentId);
  await save(db);
  return findTeam(db, parentId);
}

export async function attachChildUser(parentId: number, childUserId: number): Promise<Team> {
  const db = await readDb();
  const parent = findTeam(db, parentId);
  setUserTeams(db, childUserId, [...findUser(db, childUserId).teamIds, parentId]);
  await save(db);
  return parent;
}

export async function deleteTeam(id: number): Promise<void> {
  const db = await readDb();
  const target = db.teams.find((t) => t.id === id);
  if (!target) throw new Error('Team not found');

  const toDelete = new Set<number>();
  collectDescendants(db, id, toDelete);

  // Remove deleted teams from user memberships.
  db.users.forEach((u) => {
    u.teamIds = u.teamIds.filter((teamId) => !toDelete.has(teamId));
  });

  // Remove deleted teams from parents and child arrays.
  db.teams.forEach((t) => {
    t.childTeamIds = t.childTeamIds.filter((childId) => !toDelete.has(childId));
  });

  // Drop teams themselves.
  db.teams = db.teams.filter((t) => !toDelete.has(t.id));

  await save(db);
}

export async function deleteUser(id: number): Promise<void> {
  const db = await readDb();
  const initialLength = db.users.length;
  db.users = db.users.filter((u) => u.id !== id);
  if (db.users.length === initialLength) throw new Error('User not found');

  detachUserFromAllTeams(db, id);

  await save(db);
}

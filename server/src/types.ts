// Team entity shape used by services and persistence.
export type Team = {
  id: number;
  name: string;
  parentId?: number;
  childTeamIds: number[];
  childUserIds: number[];
};

// User entity shape used by services and persistence.
export type User = {
  id: number;
  name: string;
  teamIds: number[];
};

// Database root shape stored in db.json.
export type Database = {
  teams: Team[];
  users: User[];
  counters?: {
    team: number;
    user: number;
  };
};

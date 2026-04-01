export type Team = {
  id: number;
  name: string;
  parentId?: number;
  childTeamIds: number[];
  childUserIds: number[];
};

export type User = {
  id: number;
  name: string;
  teamIds: number[];
};

export type Database = {
  teams: Team[];
  users: User[];
  counters?: {
    team: number;
    user: number;
  };
};

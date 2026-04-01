// Team entity used by the client UI.
export type Team = {
  id: number;
  name: string;
  parentId?: number;
  childTeamIds: number[];
  childUserIds: number[];
};

// User entity used by the client UI.
export type User = {
  id: number;
  name: string;
  teamIds: number[];
};

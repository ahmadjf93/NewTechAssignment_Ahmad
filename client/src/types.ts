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

export interface RoomType {
  name: string;
  users: string[];
}

export interface DataRoomResponse {
  room: RoomType;
  error?: string | null;
  data: { user: string; message: string };
}

export interface DataVideoRoomResponse {
  room: RoomType;
  error?: string | null;
  data: unknown | null;
}

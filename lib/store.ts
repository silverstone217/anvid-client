import { RoomType } from "@/types/room";
import { UserType } from "@/types/user";
import { create } from "zustand";

interface UserStore {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  resetUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user: UserType | null) => set({ user }),
  resetUser: () => set({ user: null }),
}));

interface RoomUsersType {
  room: RoomType | null;
  setRoom: (room: RoomType | null) => void;
}

export const useRoomUsersStore = create<RoomUsersType>((set) => ({
  room: null,
  setRoom: (room: RoomType | null) => set({ room }),
}));

interface VideoRoomUsersType {
  vRoom: RoomType | null;
  setVRoom: (room: RoomType | null) => void;
}

export const useVideoRoomUsersStore = create<VideoRoomUsersType>((set) => ({
  vRoom: null,
  setVRoom: (vRoom: RoomType | null) => set({ vRoom }),
}));

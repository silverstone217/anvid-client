import { SERVER_URL } from "@/utils/data";
import { io } from "socket.io-client";

export const socket = io(SERVER_URL as string, {
  autoConnect: false,
});

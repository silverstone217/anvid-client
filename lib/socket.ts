import { SERVER_URL } from "@/utils/data";
import { io } from "socket.io-client";

export const socket = io("http://192.168.1.5:4000", {
  autoConnect: false,
});

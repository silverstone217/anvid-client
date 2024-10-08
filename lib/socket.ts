import { SERVER_URL } from "@/utils/data";
import { io } from "socket.io-client";

// export const socket = io("https://anvid-server.onrender.com", {
//   autoConnect: false,
// });
export const socket = io(SERVER_URL as string, {
  autoConnect: false,
});

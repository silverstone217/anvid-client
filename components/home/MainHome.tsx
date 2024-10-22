"use client";
import { socket } from "@/lib/socket";
import {
  useRoomUsersStore,
  useUserStore,
  useVideoRoomUsersStore,
} from "@/lib/store";
import {
  DataRoomResponse,
  DataVideoRoomResponse,
  RoomType,
} from "@/types/room";
// import { SERVER_URL } from "@/utils/data";
import { Video, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const MainHome = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const { user, setUser } = useUserStore();
  const { room, setRoom } = useRoomUsersStore();
  const { vRoom, setVRoom } = useVideoRoomUsersStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vLoading, setVLoading] = useState(false);

  useEffect(() => {
    // Connect the socket when the component mounts
    if (!isConnected) {
      socket.connect();
    }

    // Event handlers
    const onConnect = async () => {
      setIsConnected(true);

      await socket.on("userId", ({ id }: { id: string }) => {
        setUser({
          id: id,
          isChatting: false,
          isConnected: true,
        });

        // console.log({ id });
      });

      console.log("A user connected");
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("User disconnected");
    };

    // console.log("Is infinite loop running?");

    // Listen for events
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    // socket.on("userId", onUserIdReceived);

    // Cleanup function to remove listeners
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      //   socket.off("userId", onUserIdReceived); // Clean up userId listener
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Empty dependency array ensures this runs once

  // Join or create a room when the user is connected
  const joinOrCreateRoom = async (userId: string) => {
    setLoading(true);
    // Emit an event to join or create a room
    socket.emit("join_or_create_room", userId);

    // Listen for the room information from the server
    socket.on("chat_room", (data: DataRoomResponse) => {
      const currRoom = data.room as RoomType;
      // console.log("Joined Room:", currRoom.name);
      console.log(data.data.message);
      // Handle the updated room information here
      // For example, you might want to update your state or UI
      setRoom(currRoom);
    });

    // Optionally handle errors
    socket.on("error", (errorMessage) => {
      console.error("Error:", errorMessage);
      // Handle any errors here
    });

    // console.log(room);

    setTimeout(() => {
      setLoading(false);

      router.push(`/chat`);
    }, 1000);
  };

  // launch room for video player
  const launchVideoRoom = async (userId: string) => {
    setVLoading(true);
    // Emit an event to join or create a room
    socket.emit("join_or_create_video_room", userId);

    // Listen for the room information from the server
    socket.on("video_room", (payload: DataVideoRoomResponse) => {
      const currRoom = payload.room as RoomType;
      // For example, you might want to update your state or UI
      setVRoom(currRoom);
    });

    // Optionally handle errors
    socket.on("error", (errorMessage) => {
      console.error("Error:", errorMessage);
      // Handle any errors here
    });

    setTimeout(() => {
      setVLoading(false);

      router.push(`/video`);
    }, 1000);
  };

  return (
    <div
      className="w-full p-4 flex flex-col gap-10 min-h-[100dvh] items-center justify-center
        transition-all duration-500 ease-in-out relative
    "
    >
      <div>
        <h1 className="text-4xl font-bold text-center">
          Welcome to <span className="text-blue-500">Anvid!</span>
        </h1>

        <p className="text-lg text-center">
          {`Let's get fun on the best video anonym and chat application.`}
        </p>
      </div>

      {/* buttons and links */}
      <div className="flex flex-wrap gap-6 items-center justify-around">
        <button
          className={`w-full py-2 px-4 bg-blue-500 border-blue-500 border-2 text-white rounded-md ${
            !user?.isConnected ? "opacity-50 cursor-not-allowed" : ""
          }
          flex items-center gap-4 justify-center transition-all duration-500 ease-in-out  
          hover:opacity-75 hover:scale-105
          `}
          disabled={user?.isConnected ? false : true || loading || vLoading}
          onClick={() => {
            if (user) joinOrCreateRoom(user?.id);
          }}
        >
          <span>{loading ? "joining..." : "Join the chat"}</span>
          <MessageCircle />
        </button>

        <button
          className={`w-full py-2 px-4 border-blue-500 border-2 text-white rounded-md ${
            !user?.isConnected ? "opacity-50 cursor-not-allowed" : ""
          }
          flex items-center gap-4 justify-center transition-all duration-500 ease-in-out 
          hover:opacity-75 hover:scale-105
          `}
          disabled={user?.isConnected ? false : true || loading || vLoading}
          onClick={() => {
            if (user) launchVideoRoom(user?.id);
          }}
        >
          <span>{vLoading ? "joining..." : "Launch video chat"}</span>
          <Video />
        </button>
      </div>

      {/* footer */}
      <footer className="text-center text-sm text-gray-500 fixed bottom-1 ">
        &copy; 2024 Anvid. All rights reserved.
      </footer>
    </div>
  );
};

export default MainHome;

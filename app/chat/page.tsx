"use client";
import { socket } from "@/lib/socket";
import { useRoomUsersStore, useUserStore } from "@/lib/store";
import { DataRoomResponse } from "@/types/room";
import { capitalizeText } from "@/utils/function";
import { redirect } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

type MessageType = {
  user: string;
  message: string;
};

const ChatRoomPage = () => {
  const { user, setUser } = useUserStore();
  const { room, setRoom } = useRoomUsersStore();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [message, setMessage] = useState("");

  // Créez une référence pour le conteneur des messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null); //

  // Fonction pour faire défiler vers le bas
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight; // Défiler vers le bas
    }
  };

  useEffect(() => {
    // Emit an event to join or create a room when the component mounts
    if (user) {
      socket.emit("join_or_create_room", user.id); // Assuming user.id is available
    }

    // Listen for the room information from the server
    socket.on("chat_room", (data: DataRoomResponse) => {
      const updatedRoom = data.room;
      // console.log("Joined Room:", updatedRoom.name);
      // console.log(data.data.message);
      setMessages((prev) => [...prev, data.data]);
      setRoom(updatedRoom); // Update Zustand store with new room information
      scrollToBottom(); // Faites défiler vers le bas
    });

    socket.on("user_joined", (data: DataRoomResponse) => {
      const updatedRoom = data.room;
      // console.log(data.data.message);
      setMessages((prev) => [...prev, data.data]);
      setRoom(updatedRoom); // Update Zustand store with new room information
      scrollToBottom(); // Faites défiler vers le bas
    });
    socket.on("receive_message", (data: DataRoomResponse) => {
      const updatedRoom = data.room;
      // console.log(data.data.message);
      setMessages((prev) => [...prev, data.data]);
      setRoom(updatedRoom); // Update Zustand store with new room information
      scrollToBottom(); // Faites défiler vers le bas
    });

    // Event handler to handle user leaving the room
    socket.on("user_left", (data: DataRoomResponse) => {
      const updatedRoom = data.room;
      // console.log(data.data.message);
      setMessages((prev) => [...prev, data.data]);
      setRoom(updatedRoom); // Update Zustand store with new room information
      scrollToBottom(); // Faites défiler vers le bas
    });

    // Optionally handle errors
    socket.on("error", (errorMessage) => {
      console.error("Error:", errorMessage);
      // Handle any errors here
    });

    // Cleanup function to remove listeners on unmount
    return () => {
      socket.off("chat_room");
      socket.off("user_joined");
      socket.off("receive_message");
      socket.off("user_left");
      socket.off("error");
    };
  }, [user, setRoom]); // Dependencies: user and setRoom

  if (!user || !room) {
    return redirect("/");
  }

  return (
    <div className="w-full flex items-center justify-center h-[100dvh] overflow-hidden lg:px-4 lg:py-4 py-2 px-2">
      <div className="border-2 border-gray-600 shadow-xl w-full h-full relative flex flex-col">
        {/* top chat */}
        <div
          className="w-full flex items-center justify-between px-2 overflow-hidden h-14 bg-gray-600 
        transition-all duration-500 ease-in-out"
        >
          <p className="text-sm">
            <small>
              Room: <strong>{room.name}</strong>
            </small>
            ,{" "}
            <small>
              user: <strong>{room.users.length}</strong>
            </small>
          </p>

          {/* btn leave */}
          <span
            role="button"
            className="text-sm bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => {
              socket.emit("leave_room", { userId: user.id, room });
              // setUser(null);
              setRoom(null);
              window.location.replace("/");
            }}
          >
            Leave
          </span>
        </div>

        {/* chat messages */}
        <div
          ref={messagesContainerRef} // Ajoutez la référence ici
          className="w-full flex-1 lg:px-4 lg:py-4 py-2 px-2 overflow-x-hidden overflow-y-auto flex flex-col gap-4 text-sm
          transition-all duration-500 ease-in-out
          "
        >
          {messages &&
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`transition-all duration-500 ease-in-out
          flex ${
            user.id === msg.user
              ? "self-start"
              : msg.user === "admin"
              ? "self-center"
              : "self-end"
          }
        `}
              >
                <div className="w-full ">
                  <p
                    className={`text-[12px] ${
                      msg.user === "admin" ? "opacity-70" : ""
                    }`}
                  >
                    {user.id === msg.user
                      ? "You:"
                      : msg.user === "admin"
                      ? ""
                      : ""}
                  </p>
                  <p
                    className={` max-w-[250px] lg:max-w-[450px] w-full
            p-2 rounded text-white ${
              user.id === msg.user
                ? "bg-blue-500"
                : msg.user === "admin"
                ? "opacity-80"
                : "bg-gray-800"
            }
            transition-all duration-500 ease-in-out
          `}
                  >
                    {capitalizeText(msg.message)}
                  </p>
                </div>
              </div>
            ))}

          {/* Référence pour faire défiler vers le bas */}
          <div ref={messagesEndRef} />
        </div>

        {/* bottom input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            socket.emit("send_message", {
              message: message,
              room: room,
              userId: user.id,
            });
            setMessage("");
          }}
          className="w-full flex items-center justify-between px-2 h-14 bg-gray-600 mt-auto gap-2"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 px-4 py-2 rounded focus:outline-none bg-transparent/40"
            placeholder="Type a message..."
          />

          {/* btn send */}
          <button
            role="submit"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded flex-shrink-0
            disabled:opacity-50
            "
            disabled={message.trim() === ""}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoomPage;

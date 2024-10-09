"use client";
import { socket } from "@/lib/socket";
import { useUserStore, useVideoRoomUsersStore } from "@/lib/store";
import { DataRoomResponse } from "@/types/room";
import { iceServers } from "@/utils/data";
import { redirect } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

const VideoChatPage = () => {
  const { user } = useUserStore();
  const { vRoom, setVRoom } = useVideoRoomUsersStore();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // const [isMuted, setIsMuted] = useState<boolean>(false);
  // const [isVideoHidden, setIsVideoHidden] = useState<boolean>(false);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        if (navigator.mediaDevices) {
          console.log("Tentative d'accès à la caméra et au micro...");
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: true,
          });

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          if (stream) {
            if (!user || !vRoom) return;

            // Initialiser la connexion WebRTC
            peerConnectionRef.current = new RTCPeerConnection({
              iceServers,
            });

            // Ajouter le flux local à la connexion
            stream.getTracks().forEach((track) => {
              peerConnectionRef.current?.addTrack(track, stream);
            });

            // Émettre une offre
            const offer = await peerConnectionRef.current.createOffer();
            await setLocalDescriptionSafe(offer);
            socket.emit("video_offer", {
              room: vRoom,
              offer,
              userId: user?.id,
            });

            // Gestion des candidats ICE
            peerConnectionRef.current.onicecandidate = (event) => {
              if (event.candidate) {
                socket.emit("localVideo", {
                  room: vRoom,
                  candidate: event.candidate,
                  userId: user?.id,
                });
              }
            };

            // Écouter le flux distant
            peerConnectionRef.current.ontrack = (event) => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
              }
            };
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'accès aux médias :", error);
      }
    };

    initializeMedia();

    // Écouter les événements Socket.io
    socket.on("user_joined", (data: DataRoomResponse) => {
      const updatedRoom = data.room;
      setVRoom(updatedRoom);
    });

    socket.on("video_offer", async (data) => {
      const { offer } = data;
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        // Créer une réponse
        const answer = await peerConnectionRef.current.createAnswer();
        await setLocalDescriptionSafe(answer); // Utiliser la fonction sécurisée ici

        // Émettre la réponse à l'autre utilisateur
        socket.emit("video_answer", {
          room: vRoom,
          answer,
          userId: user?.id,
        });
      }
    });

    socket.on("video_answer", async (data) => {
      const { answer } = data;
      if (peerConnectionRef.current) {
        // Log the incoming answer SDP for debugging
        console.log("Received answer SDP:", answer);

        // Check signaling state before setting remote description
        if (peerConnectionRef.current.signalingState === "have-remote-offer") {
          try {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
            console.log("Remote description set successfully.");
          } catch (error) {
            console.error("Error setting remote description:", error);
          }
        } else {
          console.warn(
            "Invalid signaling state for setting remote description:",
            peerConnectionRef.current.signalingState
          );
        }
      }
    });

    socket.on("localVideo", (data) => {
      const { candidate } = data;
      if (candidate && peerConnectionRef.current) {
        peerConnectionRef.current
          .addIceCandidate(new RTCIceCandidate(candidate))
          .then(() => console.log("Candidat ajouté avec succès"))
          .catch((error) =>
            console.error("Erreur lors de l'ajout du candidat :", error)
          );
      }
    });

    socket.on("user_left", (data) => {
      const { room, data: messageData } = data;
      console.log(messageData.message);
      setVRoom(room);
    });

    return () => {
      // Nettoyage des écouteurs d'événements
      socket.off("user_joined");
      socket.off("video_offer");
      socket.off("video_answer");
      socket.off("localVideo");
      socket.off("user_left");
    };
  }, [setVRoom, vRoom, user]);

  // Fonction sécurisée pour définir la description locale
  const setLocalDescriptionSafe = async (
    description: RTCSessionDescriptionInit
  ): Promise<void> => {
    if (
      peerConnectionRef.current &&
      (peerConnectionRef.current.signalingState === "stable" ||
        peerConnectionRef.current.signalingState === "have-local-offer")
    ) {
      try {
        await peerConnectionRef.current.setLocalDescription(description);
        console.log("Description locale définie avec succès");
      } catch (error) {
        console.error(
          "Erreur lors de la définition de la description locale :",
          error
        );
      }
    } else {
      console.warn(
        "Tentative de définition de la description locale dans un état incorrect :",
        peerConnectionRef.current?.signalingState
      );
    }
  };

  // redirect to the home page if no room is available or not user authenticated

  if (!user || !vRoom) {
    return redirect("/");
  }

  return (
    <div
      className="w-full flex flex-col items-center justify-start 
    h-[100dvh] overflow-hidden lg:px-4 pt-6 px-2 relative"
    >
      <div className="w-full h-full absolute top-0 bottom-0 left-0 right-0">
        <div className="w-full  flex items-center justify-center gap-2 flex-1 relative h-full">
          {vRoom.users.length === 2 ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-full h-full border border-gray-600 rounded object-cover"
            />
          ) : (
            <p>Wait soemeone is joining...</p>
          )}
          {/* my stream */}
          <div className="absolute bottom-12 right-2 w-32 h-32 lg:w-44 lg:h-40 bg-transparent/40 flex items-center justify-center z-20">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline // Ajouté ici
              className="w-full h-full border border-gray-600 rounded object-cover"
            />
          </div>
        </div>
      </div>

      {/* <p className="text-xs">
        You are currently connected in {vRoom.name}.
        <br />
        {vRoom.users[0]} and {vRoom.users[1]} are in a video call.
      </p> */}

      <div className="w-full flex gap-4 items-center justify-center flex-wrap mt-2 text-sm z-20">
        {/* <span role="button" className="p-2 bg-blue-600/30 rounded shadow-lg">
          Show
        </span>
        <span role="button" className="p-2 bg-blue-700/30 rounded shadow-lg">
          Mute
        </span> */}
        <span
          role="button"
          className="p-2 bg-red-500/40 rounded shadow-lg ml-auto"
          onClick={() => {
            socket.emit("leave_room", { userId: user.id, room: vRoom });
            // setUser(null);
            setVRoom(null);
            location.replace("/");
            location.reload();
          }}
        >
          Leave
        </span>
      </div>
    </div>
  );
};

export default VideoChatPage;

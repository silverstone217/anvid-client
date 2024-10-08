"use client";
import { socket } from "@/lib/socket";
import { useUserStore, useVideoRoomUsersStore } from "@/lib/store";
import { DataRoomResponse } from "@/types/room";
import { redirect } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

const VideoChatPage = () => {
  const { user } = useUserStore();
  const { vRoom, setVRoom } = useVideoRoomUsersStore();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoHidden, setIsVideoHidden] = useState<boolean>(false);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn("getUserMedia is not supported in this browser.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerConnectionRef.current = new RTCPeerConnection();

        stream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(track, stream);
        });

        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket?.emit("ice-candidate", {
              target: vRoom?.name,
              candidate: event.candidate,
            });
          }
        };
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };

    initializeMedia();

    socket.on("offer", async (offer) => {
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnectionRef.current?.createAnswer();
      await peerConnectionRef.current?.setLocalDescription(answer);
      socket.emit("answer", {
        target: offer.sender,
        answer,
      });
    });

    socket.on("answer", async (answer) => {
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("ice-candidate", async (candidate) => {
      await peerConnectionRef.current?.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    });

    socket.on("user_joined", (data: DataRoomResponse) => {
      const updatedRoom = data.room;
      console.log(data.data.message);
      setVRoom(updatedRoom);
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user_joined");
      peerConnectionRef.current?.close();
    };
  }, [setVRoom, vRoom?.name]);

  //   useEffect(() => {
  //     // Initialize Socket.IO connection

  //     // Check for getUserMedia support
  //     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  //       console.error("getUserMedia is not supported in this browser.");
  //       return;
  //     }

  //     // Request user media
  //     if (socket) {
  //       navigator.mediaDevices
  //         .getUserMedia({
  //           video: { facingMode: "user" }, // Use 'environment' for back camera
  //           audio: true,
  //         })
  //         .then((stream) => {
  //           if (localVideoRef.current) {
  //             localVideoRef.current.srcObject = stream;
  //           }

  //           // Create Peer Connection
  //           peerConnectionRef.current = new RTCPeerConnection();

  //           // Add local stream tracks to Peer Connection
  //           stream.getTracks().forEach((track) => {
  //             peerConnectionRef.current?.addTrack(track, stream);
  //           });

  //           // Handle incoming remote stream
  //           peerConnectionRef.current.ontrack = (event) => {
  //             if (remoteVideoRef.current) {
  //               remoteVideoRef.current.srcObject = event.streams[0];
  //             }
  //           };

  //           // Signaling: Handle offer from another user
  //           if (socket) {
  //             socket.on("offer", async (offer) => {
  //               await peerConnectionRef.current?.setRemoteDescription(
  //                 new RTCSessionDescription(offer)
  //               );
  //               const answer = await peerConnectionRef.current?.createAnswer();
  //               await peerConnectionRef.current?.setLocalDescription(answer);
  //               socket?.emit("answer", {
  //                 target: offer.sender,
  //                 answer,
  //               });
  //             });
  //           }

  //           // Signaling: Handle answer from another user
  //           if (socket) {
  //             socket.on("answer", async (answer) => {
  //               await peerConnectionRef.current?.setRemoteDescription(
  //                 new RTCSessionDescription(answer)
  //               );
  //             });
  //           }

  //           // Signaling: Handle ICE candidates
  //           if (socket) {
  //             socket.on("ice-candidate", async (candidate) => {
  //               await peerConnectionRef.current?.addIceCandidate(
  //                 new RTCIceCandidate(candidate)
  //               );
  //             });
  //           }
  //           // Send ICE candidates to other users
  //           peerConnectionRef.current.onicecandidate = (event) => {
  //             if (event.candidate) {
  //               socket?.emit("ice-candidate", {
  //                 target: "targetUserId",
  //                 candidate: event.candidate,
  //               });
  //             }
  //           };
  //         })
  //         .catch((error) => {
  //           console.error("Error accessing media devices.", error);
  //         });
  //     }
  //     return () => {
  //       socket.off("answer");
  //       socket.off("ice-candidate");
  //       socket.off("offer");
  //       peerConnectionRef.current?.close();
  //     };
  //   }, []);

  if (!user || !vRoom) {
    return redirect("/");
  }

  return (
    <div className="w-full flex flex-col items-center justify-center h-[100dvh] overflow-hidden lg:px-4 lg:py-4 py-2 px-2">
      <h2>Video Chat</h2>
      <p className="text-xs">
        You are currently connected in {vRoom.name}.
        <br />
        {vRoom.users[0]} and {vRoom.users[1]} are in a video call.
      </p>

      <video ref={localVideoRef} autoPlay muted style={{ width: "300px" }} />
      <video ref={remoteVideoRef} autoPlay style={{ width: "300px" }} />
    </div>
  );
};

export default VideoChatPage;

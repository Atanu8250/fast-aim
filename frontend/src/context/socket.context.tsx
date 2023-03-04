import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from 'react-router-dom';
import useToastMsg, { TToastMsg } from "../customHooks/useToastMsg";

export interface IUser {
    score: number,
    userName: string
}

export interface IRoom {
    room_name: string,
    vacant: boolean,
    players: IUser
}

export type TContext = {
    socket?: any,
    handleRoomCreator?: (user: string, room: string) => void,
    handleJoinRoom?: (user: string, room: string) => void,
    rooms?: Array<IRoom>,
    currentRoom?: IRoom,
    playerOne?: IUser,
    playerTwo?: IUser
}

export const SocketContext = createContext<TContext | null>(null);

const SocketContextProvider = ({ children }: { children: React.ReactNode }) => {
    const toastMsg: TToastMsg = useToastMsg();
    const [socket, setSocket] = useState<any>()
    const [rooms, setRooms] = useState<IRoom[]>([])
    const [currentRoom, setCurrentRoom] = useState<IRoom>()
    const [playerOne, setPlayerOne] = useState<IUser>()
    const [playerTwo, setPlayerTwo] = useState<IUser>()
    const navigate = useNavigate()


    useEffect(() => {
        const socket = io("http://localhost:3000");
        setSocket(socket);

        socket.on("room:created", (msg, room) => {
            toastMsg({
                title: msg,
                status: 'info'
            })
            setPlayerOne(room.players[socket.id])
            setCurrentRoom(room);
        })

        socket.on("room:joined", (msg, roomDetails) => {
            toastMsg({
                title: msg,
                status: 'info'
            })
            setPlayerOne(roomDetails.players[Object.keys(roomDetails.players)[0]])
            setPlayerTwo(roomDetails.players[Object.keys(roomDetails.players)[1]])
            setCurrentRoom(roomDetails);
        })

        socket.on("get:rooms", (rooms) => {
            setRooms(rooms)
        })

        socket.on("room:updated", roomDetails => {
            setCurrentRoom(roomDetails)
        })

    }, [])

    const handleRoomCreator = (user: string, room: string): void => {
        console.log("handleRoomCreator called with", { user, room });
        if (!user || !room) return;
        socket.emit("create:room", user, room)
        navigate("/game")
    }

    const handleJoinRoom = (user: string, room: string): void => {
        console.log("handleJoinRoom called with", { user, room });
        if (!user || !room) return;
        socket.emit("join:room", user, room)
        navigate("/game")
    }

    return <SocketContext.Provider value={{ socket, rooms, handleRoomCreator, handleJoinRoom, playerOne, playerTwo, currentRoom }}>{children}</SocketContext.Provider>
}

export default SocketContextProvider;
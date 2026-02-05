"use client";
import React, { useState } from "react";
import "./RoomSelector.css";

/**
 * RoomSelector: Provides guest autonomy.
 * Uses a visual floor plan similar to airline seat maps.
 */
const RoomSelector = ({ onSelect, rooms: propRooms }) => {
    const [selectedRoom, setSelectedRoom] = useState(null);

    // Default mock data (fallback)
    const defaultRooms = [
        { id: "701", type: "Deluxe", status: "available", features: "Near Elevator", price: "$198" },
        { id: "702", type: "Deluxe", status: "available", features: "Park View", price: "$210" },
        { id: "703", type: "Standard", status: "occupied", features: "Quiet Zone", price: "$150" },
        { id: "704", type: "Deluxe", status: "available", features: "High Floor", price: "$220" },
    ];

    // Use passed rooms if available and has items, otherwise use default
    const rooms = (propRooms && propRooms.length > 0) ? propRooms : defaultRooms;

    return (
        <div className="w-full flex flex-col items-center">
            {/* Using the new grid layout class */}
            <div className="room-grid">
                {rooms.map((room) => (
                    <div
                        key={room.id}
                        className={`room-card ${room.status} ${selectedRoom?.id === room.id ? "selected" : ""}`}
                        onClick={() => room.status === "available" && setSelectedRoom(room)}
                    >
                        <div className={`status-indicator ${room.status}`}></div>

                        <span className="room-type">{room.type}</span>
                        <span className="room-number">{room.id}</span>
                        <p className="text-sm text-gray-400 mt-2">{room.features}</p>

                        <div className="room-price">{room.price || "$198"}</div>
                    </div>
                ))}
            </div>

            {selectedRoom && (
                <div className="mt-8 p-6 glass-panel rounded-2xl text-center w-full max-w-md animate-slide-up">
                    <h3 className="text-xl font-bold mb-2">Room {selectedRoom.id} Selected</h3>
                    <p className="text-gray-300 mb-6">✨ {selectedRoom.features}</p>
                    <button
                        className="btn-primary w-full"
                        onClick={() => onSelect(selectedRoom)}
                    >
                        Confirm Room {selectedRoom.id}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomSelector;

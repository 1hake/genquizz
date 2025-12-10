'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinPage() {
    const [roomCode, setRoomCode] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomCode.trim()) {
            setError('Please enter a room code');
            return;
        }

        if (!nickname.trim()) {
            setError('Please enter a nickname');
            return;
        }

        // Navigate to the player game page with the room code and nickname
        router.push(`/join/${roomCode.toUpperCase()}?nickname=${encodeURIComponent(nickname)}`);
    };

    return (
        <div className="min-h-screen gradient-brutal flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                <div className="text-center mb-8">
                    <h1 className="text-5xl md:text-6xl font-black text-black mb-4 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                        JOIN GAME!
                    </h1>
                    <div className="text-6xl mb-4 animate-bounce-slow">🎮</div>
                    <p className="text-xl text-neutral-800 font-medium">Enter your details to join an active quiz!</p>
                </div>

                <div className="card-brutal-secondary mb-8">
                    {error && (
                        <div className="card-brutal-danger mb-6">
                            <div className="flex items-center">
                                <span className="text-3xl mr-3">⚠️</span>
                                <p className="font-bold text-lg">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleJoin} className="space-y-6">
                        <div>
                            <label htmlFor="roomCode" className="block text-brutal text-lg mb-3">
                                ROOM CODE
                            </label>
                            <input
                                type="text"
                                id="roomCode"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                className="input-brutal text-center font-mono text-2xl"
                                maxLength={6}
                            />
                        </div>

                        <div>
                            <label htmlFor="nickname" className="block text-brutal text-lg mb-3">
                                YOUR NICKNAME
                            </label>
                            <input
                                type="text"
                                id="nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Enter your epic name!"
                                className="input-brutal"
                                maxLength={20}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-brutal-secondary w-full text-2xl"
                        >
                            JOIN GAME! 🚀
                        </button>
                    </form>
                </div>

                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="btn-brutal-danger"
                    >
                        ← BACK HOME
                    </Link>
                </div>

                <div className="card-brutal-accent">
                    <h3 className="text-brutal text-lg mb-4">TIPS & TRICKS 💡</h3>
                    <ul className="text-sm text-neutral-800 space-y-2 font-medium">
                        <li className="flex items-start">
                            <span className="text-2xl mr-2">🔤</span>
                            The room code is usually 6 characters long
                        </li>
                        <li className="flex items-start">
                            <span className="text-2xl mr-2">🎯</span>
                            Choose a unique nickname that others will see
                        </li>
                        <li className="flex items-start">
                            <span className="text-2xl mr-2">📶</span>
                            Make sure you have a stable internet connection
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
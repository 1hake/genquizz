'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { Quiz } from '@/lib/types';
import { parseQuizFile } from '@/lib/quiz';
import { getSocket } from '@/lib/socket';

interface Player {
    nickname: string;
    score: number;
}

interface AnswerResult {
    correctAnswer: number;
    scores: Array<{
        playerId: string;
        nickname: string;
        answer: number;
        diff: number;
        pointsEarned: number;
    }>;
    leaderboard: Array<{ nickname: string; score: number }>;
}

export default function HostPage() {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [roomId, setRoomId] = useState<string>('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameStatus, setGameStatus] = useState<'setup' | 'waiting' | 'in-progress' | 'finished'>('setup');
    const [currentQuestion, setCurrentQuestion] = useState<{ index: number; text: string; total: number } | null>(null);
    const [answersCount, setAnswersCount] = useState<{ received: number; total: number }>({ received: 0, total: 0 });
    const [lastAnswerResult, setLastAnswerResult] = useState<AnswerResult | null>(null);
    const [finalLeaderboard, setFinalLeaderboard] = useState<Array<{ nickname: string; score: number }>>([]);
    const [error, setError] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const socket = getSocket();

    useEffect(() => {
        socket.on('room:created', (data) => {
            setRoomId(data.roomId);
            setGameStatus('waiting');
        });

        socket.on('room:players', (playersData) => {
            setPlayers(playersData);
        });

        socket.on('game:question', (data) => {
            setCurrentQuestion({
                index: data.questionIndex,
                text: data.text,
                total: data.totalQuestions
            });
            setAnswersCount({ received: 0, total: players.length });
            setLastAnswerResult(null);
        });

        socket.on('question:answersCount', (data) => {
            setAnswersCount(data);
        });

        socket.on('game:answerResult', (data) => {
            setLastAnswerResult(data);
            setPlayers(data.leaderboard);
        });

        socket.on('game:leaderboard', (leaderboard) => {
            setFinalLeaderboard(leaderboard);
            setGameStatus('finished');
        });

        socket.on('error', (data) => {
            setError(data.message);
        });

        return () => {
            socket.off('room:created');
            socket.off('room:players');
            socket.off('game:question');
            socket.off('question:answersCount');
            socket.off('game:answerResult');
            socket.off('game:leaderboard');
            socket.off('error');
        };
    }, [socket, players.length]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const parsedQuiz = await parseQuizFile(file);
        if (parsedQuiz) {
            setQuiz(parsedQuiz);
            setError('');
        } else {
            setError('Failed to parse quiz file. Please check the format.');
        }
    };

    const createRoom = () => {
        if (!quiz) return;
        socket.emit('host:createRoom', { quiz });
    };

    const startGame = () => {
        if (!roomId) return;
        socket.emit('host:startGame', { roomId });
        setGameStatus('in-progress');
    };

    const nextQuestion = () => {
        if (!roomId) return;
        socket.emit('host:nextQuestion', { roomId });
    };

    const revealAnswer = () => {
        if (!roomId) return;
        socket.emit('host:revealAnswer', { roomId });
    };

    const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${roomId}` : '';

    return (
        <div className="min-h-screen gradient-brutal p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="card-brutal mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-brutal text-3xl md:text-4xl mb-2">HOST DASHBOARD</h1>
                            <p className="text-neutral-700 font-medium text-lg">Manage your epic quiz game! 🎯</p>
                        </div>
                        <Link
                            href="/"
                            className="btn-brutal-danger"
                        >
                            ← BACK HOME
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="card-brutal-danger mb-8">
                        <div className="flex items-center">
                            <span className="text-4xl mr-4">⚠️</span>
                            <p className="font-bold text-lg">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column - Quiz Setup and Controls */}
                    <div className="space-y-8">
                        {/* Quiz Upload */}
                        {!quiz && (
                            <div className="card-brutal-primary">
                                <h2 className="text-brutal text-2xl mb-6">UPLOAD QUIZ 📄</h2>
                                <div className="border-4 border-dashed border-black bg-white p-8 text-center transform hover:scale-105 transition-transform duration-200">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileUpload}
                                        ref={fileInputRef}
                                        className="hidden"
                                    />
                                    <div className="space-y-4">
                                        <div className="text-6xl animate-bounce-slow">📄</div>
                                        <p className="text-neutral-800 font-medium text-lg">Drop your epic quiz JSON file here!</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="btn-brutal-accent text-lg"
                                        >
                                            CHOOSE FILE! 🚀
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quiz Preview */}
                        {quiz && gameStatus === 'setup' && (
                            <div className="card-brutal-secondary">
                                <h2 className="text-brutal text-2xl mb-4">{quiz.title.toUpperCase()}</h2>
                                <div className="space-y-4 mb-6">
                                    <p className="text-neutral-800 font-bold text-lg">📊 {quiz.questions.length} QUESTIONS LOADED!</p>
                                    <div className="max-h-32 overflow-y-auto bg-white border-3 border-black p-4">
                                        {quiz.questions.map((q, index) => (
                                            <div key={q.id} className="text-sm font-medium text-neutral-700 mb-1">
                                                {index + 1}. {q.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={createRoom}
                                    className="btn-brutal-secondary w-full text-xl"
                                >
                                    CREATE ROOM! 🎯
                                </button>
                            </div>
                        )}

                        {/* Game Controls */}
                        {roomId && gameStatus !== 'setup' && (
                            <div className="card-brutal-accent">
                                <h2 className="text-brutal text-2xl mb-6">GAME CONTROLS 🎮</h2>

                                {gameStatus === 'waiting' && (
                                    <button
                                        onClick={startGame}
                                        disabled={players.length === 0}
                                        className={`w-full text-xl ${players.length === 0 ? 'bg-neutral-400 border-neutral-600 text-neutral-700 cursor-not-allowed' : 'btn-brutal-secondary'}`}
                                    >
                                        START GAME! ({players.length} players) 🚀
                                    </button>
                                )}

                                {gameStatus === 'in-progress' && currentQuestion && (
                                    <div className="space-y-6">
                                        <div className="bg-white border-4 border-black p-6 shadow-brutal">
                                            <h3 className="text-brutal text-lg mb-3">
                                                QUESTION {currentQuestion.index + 1} OF {currentQuestion.total}
                                            </h3>
                                            <p className="text-neutral-800 font-medium text-lg">{currentQuestion.text}</p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-neutral-700 mb-3 font-bold text-lg">
                                                ANSWERS: {answersCount.received} / {answersCount.total}
                                            </p>
                                            <div className="w-full bg-neutral-200 border-3 border-black h-6">
                                                <div
                                                    className="bg-secondary-400 h-full border-r-3 border-black transition-all duration-300"
                                                    style={{ width: `${(answersCount.received / Math.max(answersCount.total, 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={revealAnswer}
                                                disabled={answersCount.received === 0}
                                                className={`flex-1 text-lg ${answersCount.received === 0 ? 'bg-neutral-400 border-neutral-600 text-neutral-700 cursor-not-allowed' : 'btn-brutal-accent'}`}
                                            >
                                                REVEAL ANSWER! 💡
                                            </button>
                                            <button
                                                onClick={nextQuestion}
                                                className="flex-1 btn-brutal-primary text-lg"
                                            >
                                                {currentQuestion.index + 1 >= currentQuestion.total ? 'FINISH GAME! 🏁' : 'NEXT QUESTION! ➡️'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {gameStatus === 'finished' && (
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">🎉</div>
                                        <h3 className="text-brutal text-2xl mb-2">GAME FINISHED!</h3>
                                        <p className="text-neutral-700 font-medium text-lg">Check the epic final leaderboard below! 🏆</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Last Answer Result */}
                        {lastAnswerResult && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Last Question Results</h2>
                                <p className="text-lg font-medium text-green-600 mb-4">
                                    Correct Answer: {lastAnswerResult.correctAnswer}
                                </p>
                                <div className="space-y-2">
                                    {lastAnswerResult.scores.map((result, index) => (
                                        <div key={result.playerId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <span>{result.nickname}: {result.answer}</span>
                                            <div className="text-right">
                                                <span className="text-gray-600">Diff: {result.diff}</span>
                                                {result.pointsEarned > 0 && (
                                                    <span className="ml-2 text-green-600 font-medium">+{result.pointsEarned} pt</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Room Info and Players */}
                    <div className="space-y-6">
                        {/* Room Info */}
                        {roomId && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Room Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
                                        <div className="text-2xl font-mono font-bold text-primary-600">{roomId}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Join URL</label>
                                        <div className="text-sm text-gray-600 break-all">{joinUrl}</div>
                                    </div>

                                    {/* QR Code */}
                                    <div className="text-center">
                                        <QRCode
                                            size={200}
                                            value={joinUrl}
                                            className="mx-auto"
                                        />
                                        <p className="text-sm text-gray-600 mt-2">Scan to join</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Players List */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Players ({players.length})
                            </h2>
                            {players.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">
                                    Waiting for players to join...
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {players.map((player, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium">{player.nickname}</span>
                                            <span className="text-primary-600 font-semibold">{player.score} pts</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Final Leaderboard */}
                        {gameStatus === 'finished' && finalLeaderboard.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">🏆 Final Leaderboard</h2>
                                <div className="space-y-2">
                                    {finalLeaderboard.map((player, index) => (
                                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                                            index === 1 ? 'bg-gray-50 border border-gray-200' :
                                                index === 2 ? 'bg-orange-50 border border-orange-200' :
                                                    'bg-gray-50'
                                            }`}>
                                            <div className="flex items-center">
                                                <span className="text-xl mr-3">
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                                </span>
                                                <span className="font-medium">{player.nickname}</span>
                                            </div>
                                            <span className="text-lg font-bold text-primary-600">{player.score} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
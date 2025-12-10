'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import { validateNumericInput } from '@/lib/quiz';

interface Question {
    questionIndex: number;
    text: string;
    totalQuestions: number;
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

type GameState = 'connecting' | 'waiting' | 'answering' | 'answered' | 'results' | 'finished' | 'error';

export default function PlayerGamePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const roomId = params.roomId as string;
    const nicknameFromUrl = searchParams.get('nickname');

    const [nickname, setNickname] = useState(nicknameFromUrl || '');
    const [gameState, setGameState] = useState<GameState>('connecting');
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [answer, setAnswer] = useState('');
    const [lastAnswerResult, setLastAnswerResult] = useState<AnswerResult | null>(null);
    const [finalLeaderboard, setFinalLeaderboard] = useState<Array<{ nickname: string; score: number }>>([]);
    const [error, setError] = useState('');
    const [myAnswer, setMyAnswer] = useState<number | null>(null);

    const socket = getSocket();

    useEffect(() => {
        if (!roomId) {
            setError('Invalid room code');
            setGameState('error');
            return;
        }

        // If we have a nickname from URL, try to join immediately
        if (nicknameFromUrl) {
            joinRoom(nicknameFromUrl);
        } else {
            setGameState('connecting');
        }

        // Socket event listeners
        socket.on('player:joinResult', (data) => {
            if (data.success) {
                setGameState('waiting');
                setError('');
            } else {
                setError(data.message || 'Failed to join room');
                setGameState('error');
            }
        });

        socket.on('game:question', (data) => {
            setCurrentQuestion({
                questionIndex: data.questionIndex,
                text: data.text,
                totalQuestions: data.totalQuestions
            });
            setGameState('answering');
            setAnswer('');
            setMyAnswer(null);
            setLastAnswerResult(null);
        });

        socket.on('player:answerReceived', () => {
            setGameState('answered');
        });

        socket.on('game:answerResult', (data) => {
            setLastAnswerResult(data);
            setGameState('results');

            // Find my result
            const myResult = data.scores.find(s => s.playerId === socket.id);
            if (myResult) {
                setMyAnswer(myResult.answer);
            }
        });

        socket.on('game:leaderboard', (leaderboard) => {
            setFinalLeaderboard(leaderboard);
            setGameState('finished');
        });

        socket.on('host:disconnected', () => {
            setError('Host disconnected. Game ended.');
            setGameState('error');
        });

        socket.on('error', (data) => {
            setError(data.message);
            setGameState('error');
        });

        return () => {
            socket.off('player:joinResult');
            socket.off('game:question');
            socket.off('player:answerReceived');
            socket.off('game:answerResult');
            socket.off('game:leaderboard');
            socket.off('host:disconnected');
            socket.off('error');
        };
    }, [roomId, nicknameFromUrl, socket]);

    const joinRoom = (playerNickname: string) => {
        if (!playerNickname.trim()) {
            setError('Please enter a nickname');
            return;
        }

        socket.emit('player:join', {
            roomId: roomId,
            nickname: playerNickname.trim()
        });
    };

    const handleNicknameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        joinRoom(nickname);
    };

    const submitAnswer = () => {
        const numericAnswer = validateNumericInput(answer);
        if (numericAnswer === null) {
            setError('Please enter a valid number');
            return;
        }

        socket.emit('player:answer', {
            roomId: roomId,
            answer: numericAnswer
        });
        setMyAnswer(numericAnswer);
        setError('');
    };

    const getMyRank = () => {
        if (!finalLeaderboard.length) return null;
        const myIndex = finalLeaderboard.findIndex(p => p.nickname === nickname);
        return myIndex >= 0 ? myIndex + 1 : null;
    };

    const getMyScore = () => {
        const myPlayer = finalLeaderboard.find(p => p.nickname === nickname);
        return myPlayer?.score || 0;
    };

    // Nickname input screen
    if (gameState === 'connecting' && !nicknameFromUrl) {
        return (
            <div className="min-h-screen gradient-brutal flex items-center justify-center p-4">
                <div className="max-w-lg w-full">
                    <div className="card-brutal-primary">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">🎮</div>
                            <h1 className="text-brutal text-2xl md:text-3xl mb-3">JOINING ROOM</h1>
                            <p className="text-neutral-800 font-medium text-lg">Room: <span className="font-mono font-black text-2xl">{roomId}</span></p>
                        </div>

                        <form onSubmit={handleNicknameSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="nickname" className="block text-brutal text-lg mb-3">
                                    YOUR EPIC NICKNAME
                                </label>
                                <input
                                    type="text"
                                    id="nickname"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="Enter your awesome name!"
                                    className="input-brutal text-xl"
                                    maxLength={20}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-brutal-secondary w-full text-xl"
                            >
                                JOIN GAME! 🚀
                            </button>
                        </form>

                        {error && (
                            <div className="card-brutal-danger mt-6">
                                <div className="flex items-center">
                                    <span className="text-3xl mr-3">⚠️</span>
                                    <p className="font-bold text-lg">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (gameState === 'error') {
        return (
            <div className="min-h-screen gradient-brutal flex items-center justify-center p-4">
                <div className="max-w-lg w-full">
                    <div className="card-brutal-danger text-center">
                        <div className="text-8xl mb-6">😞</div>
                        <h1 className="text-brutal text-3xl mb-4">OOPS!</h1>
                        <p className="text-neutral-800 font-medium text-lg mb-8">{error}</p>
                        <Link
                            href="/join"
                            className="btn-brutal-secondary text-xl"
                        >
                            TRY AGAIN! 🔄
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-brutal p-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="card-brutal mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-brutal text-2xl md:text-3xl mb-1">QUIZ GAME 🎯</h1>
                            <p className="text-neutral-700 font-medium">Playing as: <span className="font-black">{nickname}</span></p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-neutral-600">ROOM:</div>
                            <div className="font-mono font-black text-2xl">{roomId}</div>
                        </div>
                    </div>
                </div>

                {/* Game Content */}
                <div className="card-brutal-primary">
                    {/* Waiting for game to start */}
                    {gameState === 'waiting' && (
                        <div className="text-center">
                            <div className="text-8xl mb-8 animate-pulse-slow">⏳</div>
                            <h2 className="text-brutal text-3xl mb-6">WAITING FOR HOST</h2>
                            <p className="text-neutral-800 font-medium text-lg">The host will start the epic game soon...</p>
                        </div>
                    )}

                    {/* Question and Answer Input */}
                    {gameState === 'answering' && currentQuestion && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <div className="text-brutal text-lg mb-4">
                                    QUESTION {currentQuestion.questionIndex + 1} OF {currentQuestion.totalQuestions}
                                </div>
                                <div className="w-full bg-neutral-200 border-4 border-black h-6 mb-6">
                                    <div
                                        className="bg-secondary-400 h-full border-r-4 border-black transition-all duration-500"
                                        style={{ width: `${((currentQuestion.questionIndex + 1) / currentQuestion.totalQuestions) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="bg-white border-4 border-black shadow-brutal-lg p-8 text-center transform hover:scale-105 transition-transform duration-200">
                                <h2 className="text-brutal text-2xl md:text-3xl">{currentQuestion.text}</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="answer" className="block text-brutal text-lg mb-3">
                                        YOUR ANSWER (NUMBERS ONLY) 🔢
                                    </label>
                                    <input
                                        type="number"
                                        id="answer"
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        placeholder="Enter your epic guess!"
                                        className="input-brutal text-3xl text-center"
                                    />
                                </div>

                                <button
                                    onClick={submitAnswer}
                                    disabled={!answer.trim()}
                                    className={`w-full text-2xl ${!answer.trim() ? 'bg-neutral-400 border-neutral-600 text-neutral-700 cursor-not-allowed' : 'btn-brutal-primary'}`}
                                >
                                    SUBMIT ANSWER! 🚀
                                </button>
                            </div>

                            {error && (
                                <div className="card-brutal-danger">
                                    <div className="flex items-center">
                                        <span className="text-3xl mr-3">⚠️</span>
                                        <p className="font-bold text-lg">{error}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Answer submitted, waiting for results */}
                    {gameState === 'answered' && currentQuestion && (
                        <div className="text-center space-y-8">
                            <div className="text-8xl animate-bounce">✅</div>
                            <h2 className="text-brutal text-3xl">ANSWER SUBMITTED!</h2>
                            <div className="bg-white border-4 border-black shadow-brutal-green p-6">
                                <p className="text-neutral-800 font-medium text-lg">Your answer: <span className="font-black text-3xl text-secondary-600">{myAnswer}</span></p>
                            </div>
                            <p className="text-neutral-800 font-medium text-lg">Waiting for other players and host to reveal the answer...</p>
                        </div>
                    )}

                    {/* Answer results */}
                    {gameState === 'results' && lastAnswerResult && currentQuestion && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-brutal text-3xl mb-6">QUESTION RESULTS 📊</h2>
                                <div className="bg-white border-4 border-black shadow-brutal-yellow p-6">
                                    <p className="text-neutral-800 font-medium text-lg">
                                        Correct Answer: <span className="font-black text-4xl text-accent-600">{lastAnswerResult.correctAnswer}</span>
                                    </p>
                                </div>
                            </div>

                            {/* My result */}
                            {(() => {
                                const myResult = lastAnswerResult.scores.find(s => s.playerId === socket.id);
                                if (!myResult) return null;

                                const isWinner = myResult.pointsEarned > 0;
                                return (
                                    <div className={`rounded-lg p-4 text-center ${isWinner ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                                        <h3 className="font-bold text-lg mb-2">Your Result</h3>
                                        <p className="text-gray-700">
                                            Your answer: <span className="font-bold">{myResult.answer}</span>
                                        </p>
                                        <p className="text-gray-700">
                                            Difference: <span className="font-bold">{myResult.diff}</span>
                                        </p>
                                        {isWinner ? (
                                            <p className="text-green-600 font-bold text-lg">🎉 You got a point! +{myResult.pointsEarned}</p>
                                        ) : (
                                            <p className="text-gray-600">No points this round</p>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Current leaderboard */}
                            <div>
                                <h3 className="font-bold text-lg mb-3 text-center">Current Standings</h3>
                                <div className="space-y-2">
                                    {lastAnswerResult.leaderboard.slice(0, 5).map((player, index) => (
                                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${player.nickname === nickname ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                                            }`}>
                                            <div className="flex items-center">
                                                <span className="text-lg mr-3">
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                                </span>
                                                <span className="font-medium">{player.nickname}</span>
                                            </div>
                                            <span className="font-bold text-blue-600">{player.score} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-gray-600">Waiting for next question...</p>
                            </div>
                        </div>
                    )}

                    {/* Final results */}
                    {gameState === 'finished' && finalLeaderboard.length > 0 && (
                        <div className="space-y-6 text-center">
                            <div className="text-6xl mb-4">🏁</div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Game Finished!</h2>

                            {/* My final result */}
                            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                                <h3 className="text-xl font-bold text-blue-900 mb-2">Your Final Result</h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    Rank: #{getMyRank()} | Score: {getMyScore()} points
                                </p>
                            </div>

                            {/* Final leaderboard */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Final Leaderboard</h3>
                                <div className="space-y-2">
                                    {finalLeaderboard.map((player, index) => (
                                        <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                                            index === 1 ? 'bg-gray-100 border border-gray-300' :
                                                index === 2 ? 'bg-orange-50 border border-orange-200' :
                                                    player.nickname === nickname ? 'bg-blue-50 border border-blue-200' :
                                                        'bg-gray-50'
                                            }`}>
                                            <div className="flex items-center">
                                                <span className="text-xl mr-3">
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                                </span>
                                                <span className="font-medium">{player.nickname}</span>
                                                {player.nickname === nickname && (
                                                    <span className="ml-2 text-blue-600 font-bold">(You)</span>
                                                )}
                                            </div>
                                            <span className="text-xl font-bold text-gray-900">{player.score} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6">
                                <Link
                                    href="/"
                                    className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg"
                                >
                                    Play Again
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
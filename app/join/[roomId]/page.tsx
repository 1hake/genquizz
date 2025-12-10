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
            setError('Code de salle invalide');
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
                setError(data.message || 'Échec de rejoindre la salle');
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
            setError('L\'hôte s\'est déconnecté. Partie terminée.');
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
            setError('Veuillez entrer un pseudonyme');
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
            setError('Veuillez entrer un nombre valide');
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
            <div className="h-screen-mobile gradient-brutal flex flex-col justify-center p-4 overflow-hidden safe-area-inset">
                <div className="max-w-sm mx-auto w-full">
                    <div className="card-brutal-primary">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-3">🎮</div>
                            <h1 className="text-brutal text-xl mb-2">REJOINDRE LA SALLE</h1>
                            <p className="text-neutral-800 font-medium">Salle : <span className="font-mono font-black text-xl">{roomId}</span></p>
                        </div>

                        <form onSubmit={handleNicknameSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="nickname" className="block text-brutal text-sm mb-2">
                                    VOTRE PSEUDONYME
                                </label>
                                <input
                                    type="text"
                                    id="nickname"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="Votre nom"
                                    className="input-brutal text-lg"
                                    maxLength={20}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-brutal-secondary w-full text-lg py-4"
                            >
                                REJOINDRE ! 🚀
                            </button>
                        </form>

                        {error && (
                            <div className="card-brutal-danger mt-4">
                                <div className="flex items-center">
                                    <span className="text-xl mr-2">⚠️</span>
                                    <p className="font-bold text-sm">{error}</p>
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
            <div className="h-screen-mobile gradient-brutal flex flex-col justify-center p-4 overflow-hidden safe-area-inset">
                <div className="max-w-sm mx-auto w-full">
                    <div className="card-brutal-danger text-center">
                        <div className="text-6xl mb-4">😞</div>
                        <h1 className="text-brutal text-2xl mb-3">OUPS !</h1>
                        <p className="text-neutral-800 font-medium text-base mb-6">{error}</p>
                        <Link
                            href="/join"
                            className="btn-brutal-secondary text-lg py-4 px-6"
                        >
                            ESSAYER ENCORE ! 🔄
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen-mobile gradient-brutal flex flex-col overflow-hidden safe-area-inset">
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-3">
                <div className="card-brutal">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-brutal text-lg mb-1">QUIZ 🎯</h1>
                            <p className="text-neutral-700 font-medium text-sm">
                                <span className="font-black">{nickname}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-neutral-600">SALLE</div>
                            <div className="font-mono font-black text-lg">{roomId}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Flexible Content Area */}
            <div className="flex-1 flex flex-col p-3 pt-0 min-h-0">
                <div className="card-brutal-primary flex-1 flex flex-col min-h-0">
                    {/* Waiting for game to start */}
                    {gameState === 'waiting' && (
                        <div className="flex flex-col items-center justify-center text-center h-full">
                            <div className="text-6xl mb-6 animate-pulse-slow">⏳</div>
                            <h2 className="text-brutal text-xl mb-4">EN ATTENTE</h2>
                            <p className="text-neutral-800 font-medium">L'hôte va démarrer le jeu...</p>
                        </div>
                    )}

                    {/* Question and Answer Input */}
                    {gameState === 'answering' && currentQuestion && (
                        <div className="flex flex-col h-full">
                            {/* Progress bar */}
                            <div className="mb-4">
                                <div className="text-brutal text-sm mb-2 text-center">
                                    QUESTION {currentQuestion.questionIndex + 1}/{currentQuestion.totalQuestions}
                                </div>
                                <div className="w-full bg-neutral-200 border-2 border-black h-3">
                                    <div
                                        className="bg-secondary-400 h-full border-r-2 border-black transition-all duration-500"
                                        style={{ width: `${((currentQuestion.questionIndex + 1) / currentQuestion.totalQuestions) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Question - scrollable if needed */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="bg-white border-4 border-black shadow-brutal p-4 mb-4 min-h-0 flex items-center justify-center">
                                    <h2 className="text-brutal text-lg text-center leading-tight">{currentQuestion.text}</h2>
                                </div>

                                {/* Answer Input - Fixed at bottom */}
                                <div className="flex-shrink-0 space-y-3">
                                    <div>
                                        <label htmlFor="answer" className="block text-brutal text-sm mb-2">
                                            VOTRE RÉPONSE 🔢
                                        </label>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            id="answer"
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            placeholder="123456"
                                            className="input-brutal-numeric text-2xl text-center font-bold"
                                            autoFocus
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck="false"
                                        />
                                    </div>

                                    <button
                                        onClick={submitAnswer}
                                        disabled={!answer.trim()}
                                        className={`w-full text-lg py-4 ${!answer.trim() ? 'bg-neutral-400 border-neutral-600 text-neutral-700 cursor-not-allowed border-4' : 'btn-brutal-primary'}`}
                                    >
                                        VALIDER ! 🚀
                                    </button>

                                    {error && (
                                        <div className="card-brutal-danger p-3">
                                            <div className="flex items-center">
                                                <span className="text-xl mr-2">⚠️</span>
                                                <p className="font-bold text-sm">{error}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Answer submitted, waiting for results */}
                    {gameState === 'answered' && currentQuestion && (
                        <div className="flex flex-col items-center justify-center text-center h-full space-y-6">
                            <div className="text-6xl animate-bounce">✅</div>
                            <h2 className="text-brutal text-xl">RÉPONSE SOUMISE !</h2>
                            <div className="bg-white border-4 border-black shadow-brutal-green p-4 w-full">
                                <p className="text-neutral-800 font-medium">
                                    Votre réponse : <span className="font-black text-2xl text-secondary-600">{myAnswer}</span>
                                </p>
                            </div>
                            <p className="text-neutral-800 font-medium text-sm">En attente des autres joueurs...</p>
                        </div>
                    )}

                    {/* Answer results */}
                    {gameState === 'results' && lastAnswerResult && currentQuestion && (
                        <div className="flex flex-col h-full">
                            <div className="text-center mb-4">
                                <h2 className="text-brutal text-lg mb-3">RÉSULTATS 📊</h2>
                                <div className="bg-white border-4 border-black shadow-brutal-yellow p-3">
                                    <p className="text-neutral-800 font-medium">
                                        Bonne réponse : <span className="font-black text-2xl text-accent-600">{lastAnswerResult.correctAnswer}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Scrollable results area */}
                            <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
                                {/* My result */}
                                {(() => {
                                    const myResult = lastAnswerResult.scores.find(s => s.playerId === socket.id);
                                    if (!myResult) return null;

                                    const isWinner = myResult.pointsEarned > 0;
                                    return (
                                        <div className={`card-brutal p-3 text-center ${isWinner ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            <h3 className="font-bold mb-2">Votre résultat</h3>
                                            <p className="text-sm text-gray-700">
                                                Votre réponse : <span className="font-bold">{myResult.answer}</span>
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                Écart : <span className="font-bold">{myResult.diff}</span>
                                            </p>
                                            {isWinner ? (
                                                <p className="text-green-600 font-bold">🎉 +{myResult.pointsEarned} point !</p>
                                            ) : (
                                                <p className="text-gray-600 text-sm">Aucun point</p>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Current leaderboard */}
                                <div>
                                    <h3 className="font-bold text-center mb-2">Classement</h3>
                                    <div className="space-y-2">
                                        {lastAnswerResult.leaderboard.slice(0, 5).map((player, index) => (
                                            <div key={index} className={`flex items-center justify-between p-2 rounded border-2 border-black ${player.nickname === nickname ? 'bg-blue-100' : 'bg-gray-50'}`}>
                                                <div className="flex items-center">
                                                    <span className="mr-2">
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                                    </span>
                                                    <span className="font-medium text-sm">{player.nickname}</span>
                                                </div>
                                                <span className="font-bold text-blue-600 text-sm">{player.score}pts</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center pt-3 text-sm text-gray-600">
                                En attente de la prochaine question...
                            </div>
                        </div>
                    )}

                    {/* Final results */}
                    {gameState === 'finished' && finalLeaderboard.length > 0 && (
                        <div className="flex flex-col h-full">
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-2">🏁</div>
                                <h2 className="text-brutal text-xl mb-3">JEU TERMINÉ !</h2>

                                {/* My final result */}
                                <div className="bg-blue-50 border-4 border-black shadow-brutal p-3 mb-4">
                                    <h3 className="font-bold text-blue-900 mb-1">Votre résultat</h3>
                                    <p className="text-lg font-bold text-blue-600">
                                        #{getMyRank()} | {getMyScore()} points
                                    </p>
                                </div>
                            </div>

                            {/* Scrollable leaderboard */}
                            <div className="flex-1 overflow-y-auto min-h-0">
                                <h3 className="text-brutal text-center mb-3">🏆 CLASSEMENT</h3>
                                <div className="space-y-2">
                                    {finalLeaderboard.map((player, index) => (
                                        <div key={index} className={`flex items-center justify-between p-3 border-4 border-black ${index === 0 ? 'bg-yellow-100' :
                                            index === 1 ? 'bg-gray-100' :
                                                index === 2 ? 'bg-orange-100' :
                                                    player.nickname === nickname ? 'bg-blue-100' :
                                                        'bg-gray-50'
                                            }`}>
                                            <div className="flex items-center">
                                                <span className="text-lg mr-2">
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                                </span>
                                                <span className="font-medium text-sm">{player.nickname}</span>
                                                {player.nickname === nickname && (
                                                    <span className="ml-2 text-blue-600 font-bold text-xs">(Vous)</span>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-900">{player.score}pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 text-center">
                                <Link
                                    href="/"
                                    className="btn-brutal-secondary py-3 px-6"
                                >
                                    Rejouer 🔄
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
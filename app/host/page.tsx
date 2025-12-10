'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { Quiz, QuizLibraryItem } from '@/lib/types';
import { parseQuizFile } from '@/lib/quiz';
import { getSocket } from '@/lib/socket';
import {
    getQuizLibrary,
    loadQuizFromLibrary,
    getCategories,
    getCategoryDisplay,
    getDifficultyDisplay,
    searchQuizzes
} from '@/lib/quiz-library';

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
    const [showLibrary, setShowLibrary] = useState<boolean>(false);
    const [librarySearch, setLibrarySearch] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
            setShowLibrary(false);
        } else {
            setError('Échec de l\'analyse du fichier de quiz. Veuillez vérifier le format.');
        }
    };

    const handleLibraryQuizSelect = async (quizId: string) => {
        const loadedQuiz = await loadQuizFromLibrary(quizId);
        if (loadedQuiz) {
            setQuiz(loadedQuiz);
            setError('');
            setShowLibrary(false);
        } else {
            setError('Échec du chargement du quiz depuis la bibliothèque.');
        }
    };

    // Get filtered quiz library
    const allQuizzes = getQuizLibrary();
    const categories = getCategories();

    let filteredQuizzes = allQuizzes;
    if (selectedCategory !== 'all') {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.category === selectedCategory);
    }
    if (librarySearch.trim()) {
        filteredQuizzes = searchQuizzes(librarySearch).filter(quiz =>
            selectedCategory === 'all' || quiz.category === selectedCategory
        );
    }

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
                            <h1 className="text-brutal text-3xl md:text-4xl mb-2">TABLEAU DE BORD HÔTE</h1>
                            <p className="text-neutral-700 font-medium text-lg">Gérez votre jeu de quiz épique ! 🎯</p>
                        </div>
                        <Link
                            href="/"
                            className="btn-brutal-danger"
                        >
                            ← RETOUR ACCUEIL
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
                        {/* Quiz Selection */}
                        {!quiz && (
                            <div className="space-y-6">
                                {/* Tab Selector */}
                                <div className="card-brutal-primary">
                                    <div className="flex gap-4 mb-6">
                                        <button
                                            onClick={() => setShowLibrary(false)}
                                            className={`flex-1 py-3 px-4 font-bold text-lg border-3 border-black shadow-brutal transition-all ${!showLibrary
                                                ? 'bg-accent-400 text-white'
                                                : 'bg-white text-neutral-700 hover:bg-neutral-100'
                                                }`}
                                        >
                                            📄 TÉLÉCHARGER QUIZ
                                        </button>
                                        <button
                                            onClick={() => setShowLibrary(true)}
                                            className={`flex-1 py-3 px-4 font-bold text-lg border-3 border-black shadow-brutal transition-all ${showLibrary
                                                ? 'bg-accent-400 text-white'
                                                : 'bg-white text-neutral-700 hover:bg-neutral-100'
                                                }`}
                                        >
                                            📚 BIBLIOTHÈQUE DE QUIZ
                                        </button>
                                    </div>                                    {!showLibrary ? (
                                        /* File Upload Section */
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
                                                <p className="text-neutral-800 font-medium text-lg">Déposez votre fichier JSON de quiz épique ici !</p>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="btn-brutal-accent text-lg"
                                                >
                                                    CHOISIR UN FICHIER ! 🚀
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Quiz Library Section */
                                        <div className="space-y-6">
                                            {/* Search and Filter */}
                                            <div className="space-y-4">
                                                <input
                                                    type="text"
                                                    placeholder="Rechercher des quiz..."
                                                    value={librarySearch}
                                                    onChange={(e) => setLibrarySearch(e.target.value)}
                                                    className="w-full px-4 py-3 text-lg font-medium border-3 border-black shadow-brutal"
                                                />
                                                <div className="flex gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => setSelectedCategory('all')}
                                                        className={`px-4 py-2 font-bold border-2 border-black shadow-brutal ${selectedCategory === 'all'
                                                            ? 'bg-secondary-400 text-white'
                                                            : 'bg-white text-neutral-700 hover:bg-neutral-100'
                                                            }`}
                                                    >
                                                        🌟 TOUT
                                                    </button>
                                                    {categories.map(category => (
                                                        <button
                                                            key={category}
                                                            onClick={() => setSelectedCategory(category)}
                                                            className={`px-4 py-2 font-bold border-2 border-black shadow-brutal ${selectedCategory === category
                                                                ? 'bg-secondary-400 text-white'
                                                                : 'bg-white text-neutral-700 hover:bg-neutral-100'
                                                                }`}
                                                        >
                                                            {getCategoryDisplay(category).toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Quiz Grid */}
                                            <div className="grid gap-4 max-h-96 overflow-y-auto">
                                                {filteredQuizzes.map(quiz => {
                                                    const difficultyDisplay = getDifficultyDisplay(quiz.difficulty);
                                                    return (
                                                        <div
                                                            key={quiz.id}
                                                            onClick={() => handleLibraryQuizSelect(quiz.id)}
                                                            className="bg-white border-3 border-black p-4 shadow-brutal cursor-pointer hover:scale-105 transition-transform duration-200"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="font-bold text-lg text-neutral-800">{quiz.title}</h3>
                                                                <span className={`text-sm font-bold ${difficultyDisplay.color}`}>
                                                                    {difficultyDisplay.text}
                                                                </span>
                                                            </div>
                                                            <p className="text-neutral-600 text-sm mb-3">{quiz.description}</p>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-neutral-500">
                                                                    {getCategoryDisplay(quiz.category)}
                                                                </span>
                                                                <span className="text-sm font-bold text-neutral-700">
                                                                    📊 {quiz.questionCount} questions
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {filteredQuizzes.length === 0 && (
                                                    <div className="text-center py-8 text-neutral-600">
                                                        <div className="text-4xl mb-2">😔</div>
                                                        <p className="font-medium">Aucun quiz trouvé correspondant à vos critères.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quiz Preview */}
                        {quiz && gameStatus === 'setup' && (
                            <div className="card-brutal-secondary">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-brutal text-2xl">{quiz.title.toUpperCase()}</h2>
                                    <button
                                        onClick={() => { setQuiz(null); setShowLibrary(false); }}
                                        className="btn-brutal-danger text-sm"
                                    >
                                        CHANGER DE QUIZ
                                    </button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {/* Quiz metadata */}
                                    <div className="flex gap-4 flex-wrap">
                                        <span className="text-neutral-800 font-bold">📊 {quiz.questions.length} QUESTIONS</span>
                                        {quiz.category && (
                                            <span className="text-neutral-700 font-medium">
                                                {getCategoryDisplay(quiz.category)}
                                            </span>
                                        )}
                                        {quiz.difficulty && (
                                            <span className={`font-bold ${getDifficultyDisplay(quiz.difficulty).color}`}>
                                                {getDifficultyDisplay(quiz.difficulty).text}
                                            </span>
                                        )}
                                    </div>

                                    {quiz.description && (
                                        <p className="text-neutral-700 font-medium">{quiz.description}</p>
                                    )}

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
                                    CRÉER LA SALLE ! 🎯
                                </button>
                            </div>
                        )}

                        {/* Game Controls */}
                        {roomId && gameStatus !== 'setup' && (
                            <div className="card-brutal-accent">
                                <h2 className="text-brutal text-2xl mb-6">CONTRÔLES DE JEU 🎮</h2>

                                {gameStatus === 'waiting' && (
                                    <button
                                        onClick={startGame}
                                        disabled={players.length === 0}
                                        className={`w-full text-xl ${players.length === 0 ? 'bg-neutral-400 border-neutral-600 text-neutral-700 cursor-not-allowed' : 'btn-brutal-secondary'}`}
                                    >
                                        DÉMARRER LE JEU ! ({players.length} joueurs) 🚀
                                    </button>
                                )}

                                {gameStatus === 'in-progress' && currentQuestion && (
                                    <div className="space-y-6">
                                        <div className="bg-white border-4 border-black p-6 shadow-brutal">
                                            <h3 className="text-brutal text-lg mb-3">
                                                QUESTION {currentQuestion.index + 1} SUR {currentQuestion.total}
                                            </h3>
                                            <p className="text-neutral-800 font-medium text-lg">{currentQuestion.text}</p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-neutral-700 mb-3 font-bold text-lg">
                                                RÉPONSES : {answersCount.received} / {answersCount.total}
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
                                                RÉVÉLER LA RÉPONSE ! 💡
                                            </button>
                                            <button
                                                onClick={nextQuestion}
                                                className="flex-1 btn-brutal-primary text-lg"
                                            >
                                                {currentQuestion.index + 1 >= currentQuestion.total ? 'TERMINER LE JEU ! 🏁' : 'QUESTION SUIVANTE ! ➡️'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {gameStatus === 'finished' && (
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">🎉</div>
                                        <h3 className="text-brutal text-2xl mb-2">JEU TERMINÉ !</h3>
                                        <p className="text-neutral-700 font-medium text-lg">Consultez le classement final épique ci-dessous ! 🏆</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Last Answer Result */}
                        {lastAnswerResult && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Résultats de la dernière question</h2>
                                <p className="text-lg font-medium text-green-600 mb-4">
                                    Réponse correcte : {lastAnswerResult.correctAnswer}
                                </p>
                                <div className="space-y-2">
                                    {lastAnswerResult.scores.map((result, index) => (
                                        <div key={result.playerId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <span>{result.nickname}: {result.answer}</span>
                                            <div className="text-right">
                                                <span className="text-gray-600">Diff : {result.diff}</span>
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
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations de la salle</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Code de salle</label>
                                        <div className="text-2xl font-mono font-bold text-primary-600">{roomId}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">URL de participation</label>
                                        <div className="text-sm text-gray-600 break-all">{joinUrl}</div>
                                    </div>

                                    {/* QR Code */}
                                    <div className="text-center">
                                        <QRCode
                                            size={200}
                                            value={joinUrl}
                                            className="mx-auto"
                                        />
                                        <p className="text-sm text-gray-600 mt-2">Scanner pour rejoindre</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Players List */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Joueurs ({players.length})
                            </h2>
                            {players.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">
                                    En attente de l'arrivée des joueurs...
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
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">🏆 Classement final</h2>
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
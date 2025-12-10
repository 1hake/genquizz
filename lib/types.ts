// Types for quiz data structure
export interface Question {
    id: number;
    text: string;
    answer: number;
}

export interface Quiz {
    title: string;
    questions: Question[];
}

// Types for game state
export interface Player {
    id: string;
    nickname: string;
    score: number;
}

export interface Room {
    id: string;
    quiz: Quiz;
    players: Player[];
    status: 'waiting' | 'in-progress' | 'finished';
    currentQuestionIndex: number;
}

// Types for Socket.IO events
export interface ServerToClientEvents {
    'room:created': (data: { roomId: string }) => void;
    'room:players': (players: Array<{ nickname: string; score: number }>) => void;
    'game:question': (data: { questionIndex: number; text: string; totalQuestions: number }) => void;
    'question:answersCount': (data: { received: number; total: number }) => void;
    'game:answerResult': (data: {
        correctAnswer: number;
        scores: Array<{
            playerId: string;
            nickname: string;
            answer: number;
            diff: number;
            pointsEarned: number;
        }>;
        leaderboard: Array<{ nickname: string; score: number }>;
    }) => void;
    'game:leaderboard': (leaderboard: Array<{ nickname: string; score: number }>) => void;
    'player:joinResult': (data: { success: boolean; message?: string }) => void;
    'player:answerReceived': () => void;
    'host:disconnected': () => void;
    'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
    'host:createRoom': (data: { quiz: Quiz }) => void;
    'host:startGame': (data: { roomId: string }) => void;
    'host:nextQuestion': (data: { roomId: string }) => void;
    'host:revealAnswer': (data: { roomId: string }) => void;
    'player:join': (data: { roomId: string; nickname: string }) => void;
    'player:answer': (data: { roomId: string; answer: number }) => void;
}

// Client-side socket type
export type SocketType = {
    id: string;
    emit: <K extends keyof ClientToServerEvents>(event: K, data: Parameters<ClientToServerEvents[K]>[0]) => void;
    on: <K extends keyof ServerToClientEvents>(event: K, listener: ServerToClientEvents[K]) => void;
    off: <K extends keyof ServerToClientEvents>(event: K, listener?: ServerToClientEvents[K]) => void;
    connect: () => void;
    disconnect: () => void;
};
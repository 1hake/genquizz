const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// In-memory storage for rooms and players
const rooms = new Map();

// Helper function to generate room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to calculate scores
function calculateScores(answers, correctAnswer) {
    const diffs = answers.map(answer => ({
        playerId: answer.playerId,
        diff: Math.abs(answer.value - correctAnswer),
        value: answer.value
    }));

    // Find minimum difference
    const minDiff = Math.min(...diffs.map(d => d.diff));

    // Award 1 point to all players with minimum difference (handles ties)
    return diffs.map(d => ({
        playerId: d.playerId,
        pointsEarned: d.diff === minDiff ? 1 : 0,
        diff: d.diff,
        value: d.value
    }));
}

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handler(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Host creates a room
        socket.on('host:createRoom', (data) => {
            const roomId = generateRoomId();
            const room = {
                id: roomId,
                quiz: data.quiz,
                hostSocketId: socket.id,
                players: [],
                status: 'waiting', // waiting, in-progress, finished
                currentQuestionIndex: -1,
                answers: {}, // questionIndex -> [{ playerId, value }]
                createdAt: Date.now()
            };

            rooms.set(roomId, room);
            socket.join(roomId);

            socket.emit('room:created', { roomId });
            console.log(`Room ${roomId} created by ${socket.id}`);
        });

        // Host starts the game
        socket.on('host:startGame', (data) => {
            const room = rooms.get(data.roomId);
            if (!room || room.hostSocketId !== socket.id) {
                socket.emit('error', { message: 'Invalid room or not host' });
                return;
            }

            room.status = 'in-progress';
            room.currentQuestionIndex = 0;

            const question = room.quiz.questions[0];
            io.to(data.roomId).emit('game:question', {
                questionIndex: 0,
                text: question.text,
                totalQuestions: room.quiz.questions.length
            });

            console.log(`Game started in room ${data.roomId}`);
        });

        // Host moves to next question or ends game
        socket.on('host:nextQuestion', (data) => {
            const room = rooms.get(data.roomId);
            if (!room || room.hostSocketId !== socket.id) {
                socket.emit('error', { message: 'Invalid room or not host' });
                return;
            }

            room.currentQuestionIndex++;

            if (room.currentQuestionIndex >= room.quiz.questions.length) {
                // Game finished
                room.status = 'finished';
                const finalLeaderboard = room.players
                    .map(p => ({ nickname: p.nickname, score: p.score }))
                    .sort((a, b) => b.score - a.score);

                io.to(data.roomId).emit('game:leaderboard', finalLeaderboard);
                console.log(`Game finished in room ${data.roomId}`);
            } else {
                // Send next question
                const question = room.quiz.questions[room.currentQuestionIndex];
                io.to(data.roomId).emit('game:question', {
                    questionIndex: room.currentQuestionIndex,
                    text: question.text,
                    totalQuestions: room.quiz.questions.length
                });

                console.log(`Question ${room.currentQuestionIndex + 1} sent in room ${data.roomId}`);
            }
        });

        // Host reveals answer and calculates scores
        socket.on('host:revealAnswer', (data) => {
            const room = rooms.get(data.roomId);
            if (!room || room.hostSocketId !== socket.id || room.currentQuestionIndex < 0) {
                socket.emit('error', { message: 'Invalid room, not host, or no active question' });
                return;
            }

            const questionIndex = room.currentQuestionIndex;
            const question = room.quiz.questions[questionIndex];
            const answers = room.answers[questionIndex] || [];

            if (answers.length === 0) {
                socket.emit('error', { message: 'No answers received yet' });
                return;
            }

            const scores = calculateScores(answers, question.answer);

            // Update player scores
            scores.forEach(scoreResult => {
                const player = room.players.find(p => p.id === scoreResult.playerId);
                if (player) {
                    player.score += scoreResult.pointsEarned;
                }
            });

            const currentLeaderboard = room.players
                .map(p => ({ nickname: p.nickname, score: p.score }))
                .sort((a, b) => b.score - a.score);

            // Emit answer result to all players
            io.to(data.roomId).emit('game:answerResult', {
                correctAnswer: question.answer,
                scores: scores.map(s => ({
                    playerId: s.playerId,
                    nickname: room.players.find(p => p.id === s.playerId)?.nickname,
                    answer: s.value,
                    diff: s.diff,
                    pointsEarned: s.pointsEarned
                })),
                leaderboard: currentLeaderboard
            });

            console.log(`Answer revealed for question ${questionIndex + 1} in room ${data.roomId}`);
        });

        // Player joins a room
        socket.on('player:join', (data) => {
            const room = rooms.get(data.roomId);
            if (!room) {
                socket.emit('player:joinResult', { success: false, message: 'Room not found' });
                return;
            }

            if (room.status !== 'waiting') {
                socket.emit('player:joinResult', { success: false, message: 'Game already in progress' });
                return;
            }

            // Check if nickname already exists
            if (room.players.some(p => p.nickname === data.nickname)) {
                socket.emit('player:joinResult', { success: false, message: 'Nickname already taken' });
                return;
            }

            const player = {
                id: socket.id,
                nickname: data.nickname,
                score: 0,
                socketId: socket.id
            };

            room.players.push(player);
            socket.join(data.roomId);

            socket.emit('player:joinResult', { success: true });

            // Notify host of updated player list
            io.to(room.hostSocketId).emit('room:players', room.players.map(p => ({
                nickname: p.nickname,
                score: p.score
            })));

            console.log(`Player ${data.nickname} joined room ${data.roomId}`);
        });

        // Player submits an answer
        socket.on('player:answer', (data) => {
            const room = rooms.get(data.roomId);
            if (!room || room.status !== 'in-progress' || room.currentQuestionIndex < 0) {
                socket.emit('error', { message: 'Invalid room or game not in progress' });
                return;
            }

            const questionIndex = room.currentQuestionIndex;

            // Initialize answers array for this question if it doesn't exist
            if (!room.answers[questionIndex]) {
                room.answers[questionIndex] = [];
            }

            // Check if player already answered this question
            const existingAnswer = room.answers[questionIndex].find(a => a.playerId === socket.id);
            if (existingAnswer) {
                socket.emit('error', { message: 'You already answered this question' });
                return;
            }

            // Store the answer
            room.answers[questionIndex].push({
                playerId: socket.id,
                value: data.answer
            });

            socket.emit('player:answerReceived');

            // Notify host of answer count
            io.to(room.hostSocketId).emit('question:answersCount', {
                received: room.answers[questionIndex].length,
                total: room.players.length
            });

            console.log(`Answer received from ${socket.id} in room ${data.roomId}: ${data.answer}`);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            // Remove player from all rooms
            rooms.forEach((room, roomId) => {
                const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
                if (playerIndex !== -1) {
                    room.players.splice(playerIndex, 1);

                    // Notify host of updated player list
                    if (room.hostSocketId) {
                        io.to(room.hostSocketId).emit('room:players', room.players.map(p => ({
                            nickname: p.nickname,
                            score: p.score
                        })));
                    }
                }

                // If host disconnects, you might want to end the room
                if (room.hostSocketId === socket.id) {
                    console.log(`Host disconnected from room ${roomId}`);
                    // Optionally notify players and clean up room
                    io.to(roomId).emit('host:disconnected');
                    rooms.delete(roomId);
                }
            });
        });
    });

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
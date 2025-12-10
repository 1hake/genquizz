# GenQuizz - Real-time Quiz Game

A real-time quiz web application where hosts create numeric answer quizzes and players compete to give the closest answers. Built with Next.js, Socket.IO, and TypeScript.

## Features

- **Host Dashboard**: Upload quiz JSON files, create rooms, control game flow
- **Real-time Gameplay**: Live questions, answers, and leaderboards
- **QR Code Sharing**: Easy room joining via QR codes
- **Scoring System**: Players with closest numeric answers earn points
- **Mobile Friendly**: Responsive design for all devices
- **No Database Required**: In-memory storage for quick setup

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start the development server (includes Socket.IO server)
npm run dev
```

The application will be available at `http://localhost:3000`.

### Running the Game

1. **Host a Quiz**:
   - Go to `/host`
   - Upload a quiz JSON file (see format below)
   - Create a room and share the QR code or room code

2. **Join as Player**:
   - Go to `/join` or scan the QR code
   - Enter room code and nickname
   - Answer questions with numeric values

3. **Game Flow**:
   - Host starts the game
   - Questions are sent one by one
   - Host reveals answers and shows scoring
   - Final leaderboard shown at the end

## Quiz File Format

Create a JSON file with the following structure:

```json
{
  "title": "Your Quiz Title",
  "questions": [
    {
      "id": 1,
      "text": "What is the population of Paris?",
      "answer": 2200000
    },
    {
      "id": 2,
      "text": "Height of Mount Everest in meters?",
      "answer": 8849
    }
  ]
}
```

### Requirements:
- `title`: String - Name of your quiz
- `questions`: Array - List of questions
  - `id`: Number - Unique identifier for each question
  - `text`: String - The question text
  - `answer`: Number - The correct numeric answer

An example quiz file is included: `example-quiz.json`

## Game Rules

### Scoring System
- Each question awards **1 point** to the player(s) with the closest numeric answer
- Ties are allowed - multiple players can earn points if they have the same closest difference
- Final leaderboard ranks players by total points earned

### Question Types
- All questions must have numeric answers
- Players enter their best guess as a number
- The game calculates the absolute difference between player answers and the correct answer
- Closest answer(s) win the round

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **Real-time**: Socket.IO for WebSocket communication
- **QR Codes**: react-qr-code for easy room sharing
- **Server**: Custom Node.js server integrating Next.js and Socket.IO

### Project Structure
```
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── host/              # Host dashboard
│   ├── join/              # Player join pages
│   └── layout.tsx         # App layout
├── lib/                   # Utilities and types
│   ├── types.ts           # TypeScript interfaces
│   ├── quiz.ts            # Quiz validation logic
│   └── socket.ts          # Socket.IO client setup
├── server.js              # Custom server with Socket.IO
├── example-quiz.json      # Sample quiz file
└── package.json
```

### Socket.IO Events

**Host Events**:
- `host:createRoom` - Create a new game room
- `host:startGame` - Begin the quiz
- `host:nextQuestion` - Move to next question or finish
- `host:revealAnswer` - Calculate and show results

**Player Events**:
- `player:join` - Join a room with nickname
- `player:answer` - Submit numeric answer

**Server Events**:
- `room:created` - Room created successfully
- `game:question` - New question broadcast
- `game:answerResult` - Question results and scoring
- `game:leaderboard` - Final rankings

## Development

### Scripts
- `npm run dev` - Start development server (includes Socket.IO)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Environment
- Development: `http://localhost:3000`
- Socket.IO automatically connects to the same host
- No additional configuration required

## Deployment

The application can be deployed on any Node.js hosting platform:

1. Build the application: `npm run build`
2. Start the production server: `npm start`
3. Ensure the hosting platform supports WebSocket connections for Socket.IO

### Production Considerations
- Room data is stored in memory and will be lost on server restart
- Consider adding Redis or another persistent store for production use
- The app scales to one server instance (no clustering support currently)

## Examples

### Sample Quiz Topics
- **Geography**: Country populations, mountain heights, distances
- **Science**: Constants, dates, quantities, measurements
- **History**: Years, durations, quantities
- **Sports**: Scores, records, statistics
- **General Knowledge**: Any topic with numeric answers

### Creating Engaging Questions
- Use "Au plus proche" (closest guess) style questions
- Provide context in question text
- Mix easy and challenging numbers
- Include units in the question (meters, years, etc.)

## License

MIT License - feel free to use this project as a base for your own quiz applications.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

---

**Happy Quizzing! 🧠✨**
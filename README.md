# Au plus proche - Jeu de quiz en temps réel

Une application web de quiz en temps réel où les hôtes créent des quiz avec des réponses numériques et les joueurs rivalisent pour donner les réponses les plus proches. Construit avec Next.js, Socket.IO et TypeScript.

## Fonctionnalités

- **Tableau de bord hôte** : Téléchargez des fichiers JSON de quiz, créez des salles, contrôlez le déroulement du jeu
- **Jeu en temps réel** : Questions, réponses et classements en direct
- **Partage par QR Code** : Rejoindre facilement les salles via des QR codes
- **Système de notation** : Les joueurs avec les réponses numériques les plus proches gagnent des points
- **Compatible mobile** : Design responsive pour tous les appareils
- **Aucune base de données requise** : Stockage en mémoire pour une configuration rapide

## Démarrage rapide

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement (inclut le serveur Socket.IO)
npm run dev
```

L'application sera disponible à `http://localhost:3000`.

### Utilisation du jeu

1. **Héberger un quiz** :
   - Allez sur `/host`
   - Téléchargez un fichier JSON de quiz (voir le format ci-dessous)
   - Créez une salle et partagez le QR code ou le code de salle

2. **Rejoindre en tant que joueur** :
   - Allez sur `/join` ou scannez le QR code
   - Entrez le code de salle et votre pseudonyme
   - Répondez aux questions avec des valeurs numériques

3. **Déroulement du jeu** :
   - L'hôte démarre le jeu
   - Les questions sont envoyées une par une
   - L'hôte révèle les réponses et montre les scores
   - Le classement final est affiché à la fin

## Format de fichier de quiz

Créez un fichier JSON avec la structure suivante :

```json
{
  "title": "Titre de votre quiz",
  "questions": [
    {
      "id": 1,
      "text": "Quelle est la population de Paris ?",
      "answer": 2200000
    },
    {
      "id": 2,
      "text": "Hauteur du mont Everest en mètres ?",
      "answer": 8849
    }
  ]
}
```

### Exigences :
- `title` : String - Nom de votre quiz
- `questions` : Array - Liste des questions
  - `id` : Number - Identifiant unique pour chaque question
  - `text` : String - Le texte de la question
  - `answer` : Number - La réponse numérique correcte

Un exemple de fichier de quiz est inclus : `example-quiz.json`

## Règles du jeu

### Système de notation
- Chaque question accorde **1 point** au(x) joueur(s) avec la réponse numérique la plus proche
- Les égalités sont autorisées - plusieurs joueurs peuvent gagner des points s'ils ont la même différence la plus proche
- Le classement final classe les joueurs par total de points gagnés

### Types de questions
- Toutes les questions doivent avoir des réponses numériques
- Les joueurs entrent leur meilleure estimation sous forme de nombre
- Le jeu calcule la différence absolue entre les réponses des joueurs et la réponse correcte
- La ou les réponses les plus proches gagnent le tour

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
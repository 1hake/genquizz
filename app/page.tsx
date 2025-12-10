import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen gradient-brutal flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-block mb-6">
                        <h1 className="text-7xl md:text-9xl font-black text-black mb-2 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                            AU PLUS PROCHE
                        </h1>
                        <div className="h-2 bg-black transform rotate-1"></div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-black mb-4 transform rotate-1">
                        JEU DE QUIZ EN TEMPS RÉEL
                    </p>
                    <p className="text-lg md:text-xl text-neutral-800 max-w-2xl mx-auto font-medium">
                        Créez des quiz captivants où les joueurs soumettent des réponses numériques.
                        La réponse la plus proche GAGNE chaque manche ! 🎯
                    </p>
                </div>

                {/* Main Action Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Host Card */}
                    <div className="card-brutal-primary group">
                        <div className="text-center">
                            <div className="text-8xl mb-6 group-hover:animate-bounce">🎯</div>
                            <h2 className="text-brutal text-2xl md:text-3xl mb-4">
                                HÉBERGER UN QUIZ
                            </h2>
                            <p className="text-neutral-800 font-medium text-lg mb-8 leading-relaxed">
                                Téléchargez votre fichier JSON de quiz, créez une salle, et contrôlez le déroulement épique du jeu pour vos joueurs !
                            </p>
                            <Link
                                href="/host"
                                className="btn-brutal-primary text-xl w-full block text-center"
                            >
                                COMMENCER L'HÉBERGEMENT ! 🚀
                            </Link>
                        </div>
                    </div>

                    {/* Player Card */}
                    <div className="card-brutal-secondary group">
                        <div className="text-center">
                            <div className="text-8xl mb-6 group-hover:animate-pulse">🎮</div>
                            <h2 className="text-brutal text-2xl md:text-3xl mb-4">
                                REJOINDRE UNE PARTIE
                            </h2>
                            <p className="text-neutral-800 font-medium text-lg mb-8 leading-relaxed">
                                Entrez un code de salle ou scannez un QR code pour rejoindre un quiz actif et concourir avec d'autres !
                            </p>
                            <Link
                                href="/join"
                                className="btn-brutal-secondary text-xl w-full block text-center"
                            >
                                REJOINDRE LA PARTIE ! 🎉
                            </Link>
                        </div>
                    </div>
                </div>

                {/* How it Works Section */}
                <div className="card-brutal-accent">
                    <h3 className="text-brutal text-2xl md:text-3xl text-center mb-8">
                        COMMENT ÇA MARCHE
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-6xl mb-4">📤</div>
                            <div className="text-brutal text-lg mb-2">1. CRÉER UN QUIZ</div>
                            <div className="text-neutral-800 font-medium">Téléchargez un fichier JSON avec des questions et des réponses numériques</div>
                        </div>
                        <div className="text-center">
                            <div className="text-6xl mb-4">📱</div>
                            <div className="text-brutal text-lg mb-2">2. PARTAGER LA SALLE</div>
                            <div className="text-neutral-800 font-medium">Partagez le code de salle ou le QR code avec les joueurs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-6xl mb-4">🏆</div>
                            <div className="text-brutal text-lg mb-2">3. JOUER ET GAGNER</div>
                            <div className="text-neutral-800 font-medium">Les joueurs devinent les nombres, la réponse la plus proche gagne chaque manche !</div>
                        </div>
                    </div>
                </div>

                {/* Fun decorative elements */}
                <div className="flex justify-center items-center mt-12 space-x-8">
                    <div className="w-4 h-4 bg-primary-400 border-2 border-black transform rotate-45 animate-bounce"></div>
                    <div className="w-6 h-6 bg-secondary-400 border-2 border-black rounded-full animate-pulse"></div>
                    <div className="w-4 h-4 bg-accent-400 border-2 border-black transform -rotate-12 animate-bounce"></div>
                    <div className="w-5 h-5 bg-danger-400 border-2 border-black transform rotate-12 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}
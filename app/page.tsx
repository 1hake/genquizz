import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen gradient-brutal flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-block mb-6">
                        <h1 className="text-7xl md:text-9xl font-black text-black mb-2 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                            GENQUIZZ
                        </h1>
                        <div className="h-2 bg-black transform rotate-1"></div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-black mb-4 transform rotate-1">
                        REAL-TIME QUIZ GAME
                    </p>
                    <p className="text-lg md:text-xl text-neutral-800 max-w-2xl mx-auto font-medium">
                        Create engaging "Au plus proche" quizzes where players submit numeric answers.
                        The closest guess WINS each round! 🎯
                    </p>
                </div>

                {/* Main Action Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Host Card */}
                    <div className="card-brutal-primary group">
                        <div className="text-center">
                            <div className="text-8xl mb-6 group-hover:animate-bounce">🎯</div>
                            <h2 className="text-brutal text-2xl md:text-3xl mb-4">
                                HOST A QUIZ
                            </h2>
                            <p className="text-neutral-800 font-medium text-lg mb-8 leading-relaxed">
                                Upload your quiz JSON file, create a room, and control the epic game flow for your players!
                            </p>
                            <Link
                                href="/host"
                                className="btn-brutal-primary text-xl w-full block text-center"
                            >
                                START HOSTING! 🚀
                            </Link>
                        </div>
                    </div>

                    {/* Player Card */}
                    <div className="card-brutal-secondary group">
                        <div className="text-center">
                            <div className="text-8xl mb-6 group-hover:animate-pulse">🎮</div>
                            <h2 className="text-brutal text-2xl md:text-3xl mb-4">
                                JOIN A GAME
                            </h2>
                            <p className="text-neutral-800 font-medium text-lg mb-8 leading-relaxed">
                                Enter a room code or scan a QR code to join an active quiz game and compete with others!
                            </p>
                            <Link
                                href="/join"
                                className="btn-brutal-secondary text-xl w-full block text-center"
                            >
                                JOIN GAME! 🎉
                            </Link>
                        </div>
                    </div>
                </div>

                {/* How it Works Section */}
                <div className="card-brutal-accent">
                    <h3 className="text-brutal text-2xl md:text-3xl text-center mb-8">
                        HOW IT WORKS
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-6xl mb-4">📤</div>
                            <div className="text-brutal text-lg mb-2">1. CREATE QUIZ</div>
                            <div className="text-neutral-800 font-medium">Upload a JSON file with questions and numeric answers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-6xl mb-4">📱</div>
                            <div className="text-brutal text-lg mb-2">2. SHARE ROOM</div>
                            <div className="text-neutral-800 font-medium">Share the room code or QR code with players</div>
                        </div>
                        <div className="text-center">
                            <div className="text-6xl mb-4">🏆</div>
                            <div className="text-brutal text-lg mb-2">3. PLAY & WIN</div>
                            <div className="text-neutral-800 font-medium">Players guess numbers, closest answer wins each round!</div>
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
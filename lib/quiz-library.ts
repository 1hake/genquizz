import { Quiz, QuizLibraryItem } from './types';

// Quiz library metadata
const QUIZ_LIBRARY: QuizLibraryItem[] = [
    {
        id: 'animal-lifespan',
        title: 'Espérance de vie des animaux',
        description: 'Questions sur l\'espérance de vie de différents animaux du monde entier.',
        category: 'animals',
        difficulty: 'medium',
        questionCount: 50,
        filename: 'animal-lifespan.json'
    }
];

/**
 * Get all available quizzes from the library
 */
export function getQuizLibrary(): QuizLibraryItem[] {
    return QUIZ_LIBRARY;
}

/**
 * Get quizzes by category
 */
export function getQuizzesByCategory(category: string): QuizLibraryItem[] {
    return QUIZ_LIBRARY.filter(quiz => quiz.category === category);
}

/**
 * Get quizzes by difficulty
 */
export function getQuizzesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): QuizLibraryItem[] {
    return QUIZ_LIBRARY.filter(quiz => quiz.difficulty === difficulty);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
    const categories = new Set<string>();
    QUIZ_LIBRARY.forEach(quiz => categories.add(quiz.category));
    return Array.from(categories);
}

/**
 * Load a quiz from the library by ID
 */
export async function loadQuizFromLibrary(quizId: string): Promise<Quiz | null> {
    const quizItem = QUIZ_LIBRARY.find(item => item.id === quizId);
    if (!quizItem) {
        console.error(`Quiz with ID "${quizId}" not found in library`);
        return null;
    }

    try {
        // Fetch the quiz file from the public directory
        const response = await fetch(`/quiz-library/${quizItem.filename}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const quiz = await response.json();

        // Validate the loaded quiz
        if (!quiz || !quiz.title || !Array.isArray(quiz.questions)) {
            console.error(`Invalid quiz format in ${quizItem.filename}`);
            return null;
        }

        return quiz as Quiz;
    } catch (error) {
        console.error(`Failed to load quiz ${quizId}:`, error);
        return null;
    }
}

/**
 * Search quizzes by title or description
 */
export function searchQuizzes(searchTerm: string): QuizLibraryItem[] {
    const term = searchTerm.toLowerCase();
    return QUIZ_LIBRARY.filter(quiz =>
        quiz.title.toLowerCase().includes(term) ||
        quiz.description.toLowerCase().includes(term)
    );
}

/**
 * Get category display name with emoji
 */
export function getCategoryDisplay(category: string): string {
    const categoryMap: Record<string, string> = {
        'general': '🌍 General',
        'science': '🔬 Science',
        'entertainment': '🎬 Entertainment',
        'geography': '🗺️ Geography',
        'math': '📐 Math',
        'history': '📚 History',
        'sports': '⚽ Sports',
        'animals': '🐾 Animals'
    };

    return categoryMap[category] || `📋 ${category}`;
}

/**
 * Get difficulty display with color indicator
 */
export function getDifficultyDisplay(difficulty: 'easy' | 'medium' | 'hard'): { text: string; color: string } {
    const difficultyMap = {
        'easy': { text: '🟢 Easy', color: 'text-green-600' },
        'medium': { text: '🟡 Medium', color: 'text-yellow-600' },
        'hard': { text: '🔴 Hard', color: 'text-red-600' }
    };

    return difficultyMap[difficulty];
}
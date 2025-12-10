import { Quiz } from './types';

export function validateQuiz(data: any): Quiz | null {
    try {
        // Check if data is an object
        if (!data || typeof data !== 'object') {
            throw new Error('Quiz must be an object');
        }

        // Check for title
        if (!data.title || typeof data.title !== 'string') {
            throw new Error('Quiz must have a title (string)');
        }

        // Check for questions array
        if (!Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error('Quiz must have a non-empty questions array');
        }

        // Validate each question
        for (let i = 0; i < data.questions.length; i++) {
            const question = data.questions[i];

            if (!question || typeof question !== 'object') {
                throw new Error(`Question ${i + 1} must be an object`);
            }

            if (!question.id || typeof question.id !== 'number') {
                throw new Error(`Question ${i + 1} must have an id (number)`);
            }

            if (!question.text || typeof question.text !== 'string') {
                throw new Error(`Question ${i + 1} must have text (string)`);
            }

            if (typeof question.answer !== 'number' || isNaN(question.answer)) {
                throw new Error(`Question ${i + 1} must have a numeric answer`);
            }
        }

        return {
            title: data.title,
            questions: data.questions.map((q: any) => ({
                id: q.id,
                text: q.text,
                answer: q.answer
            }))
        };
    } catch (error) {
        console.error('Quiz validation error:', error);
        return null;
    }
}

export function parseQuizFile(file: File): Promise<Quiz | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                const quiz = validateQuiz(data);
                resolve(quiz);
            } catch (error) {
                console.error('Failed to parse quiz file:', error);
                resolve(null);
            }
        };

        reader.onerror = () => {
            console.error('Failed to read quiz file');
            resolve(null);
        };

        reader.readAsText(file);
    });
}

export function validateNumericInput(input: string): number | null {
    const trimmed = input.trim();
    if (trimmed === '') return null;

    const number = Number(trimmed);
    if (isNaN(number)) return null;

    return number;
}
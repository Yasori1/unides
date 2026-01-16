/**
 * Forum Models
 * Backend DTO'larına birebir uyumlu TypeScript interface'leri
 */

// Backend: CreateQuestionRequest
export interface CreateQuestionRequest {
  title: string;
  content: string;
}

// Backend: CreateAnswerRequest
export interface CreateAnswerRequest {
  questionId: number;
  content: string;
}

// Backend: QuestionDto
export interface QuestionDto {
  id: number;
  title: string;
  content: string;
  authorName: string;
  createdAt: string; // DateTime ISO string
  answers: AnswerDto[];
}

// Backend: AnswerDto
export interface AnswerDto {
  id: number;
  content: string;
  authorName: string;
  createdAt: string; // DateTime ISO string
}

// Backend: UpdateQuestionRequest
export interface UpdateQuestionRequest {
  questionId: number;
  title: string;
  content: string;
}

// Backend: UpdateAnswerRequest
export interface UpdateAnswerRequest {
  answerId: number;
  content: string;
}

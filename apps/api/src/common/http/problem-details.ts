export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  correlationId: string;
  timestamp: string;
  retryable: boolean;
};

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

import { describe, it, expect } from 'vitest'
import { evaluateQuiz, quizQuestions, QUIZ_PASS_THRESHOLD } from '@/lib/onboarding-quiz'

describe('evaluateQuiz', () => {
  it('všechny správné → score=100, passed=true', () => {
    const answers: Record<string, string> = {}
    for (const q of quizQuestions) {
      answers[q.id] = q.correctAnswer
    }

    const result = evaluateQuiz(answers)
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
    expect(result.correctCount).toBe(quizQuestions.length)
    expect(result.totalCount).toBe(quizQuestions.length)
  })

  it('všechny špatné → score=0, passed=false', () => {
    const answers: Record<string, string> = {}
    for (const q of quizQuestions) {
      answers[q.id] = 'špatná odpověď'
    }

    const result = evaluateQuiz(answers)
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
    expect(result.correctCount).toBe(0)
  })

  it('80% → passed=true (threshold)', () => {
    // 10 otázek, 8 správných = 80%
    const answers: Record<string, string> = {}
    const totalQuestions = quizQuestions.length
    const correctNeeded = Math.ceil(totalQuestions * (QUIZ_PASS_THRESHOLD / 100))

    for (let i = 0; i < totalQuestions; i++) {
      if (i < correctNeeded) {
        answers[quizQuestions[i].id] = quizQuestions[i].correctAnswer
      } else {
        answers[quizQuestions[i].id] = 'špatná odpověď'
      }
    }

    const result = evaluateQuiz(answers)
    expect(result.passed).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(QUIZ_PASS_THRESHOLD)
  })

  it('70% → passed=false', () => {
    // 10 otázek, 7 správných = 70%
    const answers: Record<string, string> = {}
    const correctCount = 7

    for (let i = 0; i < quizQuestions.length; i++) {
      if (i < correctCount) {
        answers[quizQuestions[i].id] = quizQuestions[i].correctAnswer
      } else {
        answers[quizQuestions[i].id] = 'špatná odpověď'
      }
    }

    const result = evaluateQuiz(answers)
    expect(result.score).toBe(70)
    expect(result.passed).toBe(false)
  })

  it('prázdné odpovědi → score=0', () => {
    const result = evaluateQuiz({})
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('threshold je 80%', () => {
    expect(QUIZ_PASS_THRESHOLD).toBe(80)
  })
})

import { SCORE_TUNING } from '@/config/constants';

const HIGH_SCORE_KEY = 'project-racer:high-score';

export class ScoreSystem {
  private score = 0;

  update(distanceTraveled: number): void {
    this.score = Math.floor(distanceTraveled * SCORE_TUNING.pointsPerMeter);
  }

  getScore(): number {
    return this.score;
  }

  static getHighScore(): number {
    return Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0);
  }

  /** Call once when a run ends. Returns true if this run set a new record. */
  static commitIfHighScore(score: number): boolean {
    const current = ScoreSystem.getHighScore();
    if (score > current) {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
      return true;
    }
    return false;
  }
}

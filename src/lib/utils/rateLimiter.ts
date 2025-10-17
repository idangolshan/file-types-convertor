/**
 * Rate Limiter Utility
 * Prevents API abuse by limiting the number of requests within a time window
 */

export class RateLimiter {
	private requests: number[] = [];
	private readonly maxRequests: number;
	private readonly timeWindow: number;

	constructor(maxRequests: number, timeWindowMs: number) {
		this.maxRequests = maxRequests;
		this.timeWindow = timeWindowMs;
	}

	/**
	 * Check if a request is allowed based on rate limit
	 * @returns true if request is allowed, false if rate limit exceeded
	 */
	checkLimit(): boolean {
		const now = Date.now();

		// Remove requests outside the time window
		this.requests = this.requests.filter((time) => now - time < this.timeWindow);

		// Check if we've exceeded the limit
		if (this.requests.length >= this.maxRequests) {
			return false; // Rate limit exceeded
		}

		// Record this request
		this.requests.push(now);
		return true;
	}

	/**
	 * Get time until next request is allowed (in seconds)
	 */
	getTimeUntilReset(): number {
		if (this.requests.length < this.maxRequests) {
			return 0;
		}

		const oldestRequest = this.requests[0];
		const timeElapsed = Date.now() - oldestRequest;
		const timeRemaining = this.timeWindow - timeElapsed;

		return Math.ceil(timeRemaining / 1000);
	}
}

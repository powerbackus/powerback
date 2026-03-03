/**
 * @fileoverview Congressional Session Service
 *
 * This service manages detection of Congressional session endings using the
 * Congress.gov API and provides session information for celebration lifecycle
 * management. It includes caching, fallback mechanisms, and warning period
 * detection for proactive user notifications.
 *
 * KEY FUNCTIONS
 *
 * getCurrentCongress()
 * - Calculates current Congress number based on year
 * - Formula: floor((year - 1787) / 2)
 *
 * getCurrentSession()
 * - Returns current session number (1 or 2)
 * - Even years = session 2, odd years = session 1
 *
 * fetchSessionData(congress, forceRefresh)
 * - Fetches session data from Congress.gov API
 * - Uses caching to avoid repeated API calls
 * - Falls back to constitutional defaults if API unavailable
 * - Tries both plural and singular endpoint forms
 *
 * getSessionEndDate()
 * - Gets actual session end date from API or fallback
 * - Returns Date object for current session
 *
 * hasSessionEnded()
 * - Checks if current Congressional session has ended
 * - Returns boolean for session end detection
 *
 * isInWarningPeriod()
 * - Checks if within warning period (1 month before session ends)
 * - Used for proactive user notifications
 *
 * getNextGeneralElectionDate()
 * - Calculates next general election date (first Tuesday in November)
 * - Skips first Tuesday if it's the 1st (uses second Tuesday)
 *
 * getSessionInfo()
 * - Returns comprehensive session information for email templates
 * - Includes formatted dates, warning period status, session end status
 *
 * BUSINESS LOGIC
 *
 * SESSION DETECTION
 * - Uses Congress.gov API when available
 * - Falls back to constitutional defaults (January 3rd) if API unavailable
 * - Caches session data to reduce API calls
 *
 * WARNING PERIOD
 * - 1 month before session end date
 * - Used to send proactive warnings to users with active Celebrations
 * - Allows users to prepare for potential defunct conversions
 *
 * FALLBACK MECHANISMS
 * - Constitutional default: January 3rd of following year
 * - Used when API is unavailable or returns errors
 * - Logs errors but continues operation with fallback
 *
 * API ENDPOINT HANDLING
 * - Tries plural form first: /congresses/{congress}
 * - Falls back to singular: /congress/{congress}
 * - Handles 404 errors gracefully
 *
 * DEPENDENCIES
 * - axios: HTTP client for Congress.gov API
 * - process.env.CONGRESS_GOV_API_KEY: API key for Congress.gov
 * - process.env.CONGRESS_API_BASE_URL: Base URL for Congress.gov API
 *
 * @module services/congress/sessionService
 * @requires axios
 * @requires ../utils/logger
 */

const axios = require('axios');
const logger = require('../utils/logger')(__filename);

// Congress.gov API configuration
const CONGRESS_GOV_API_KEY = process.env.CONGRESS_GOV_API_KEY,
  CONGRESS_API_BASE_URL = process.env.CONGRESS_API_BASE_URL;
class CongressionalSessionService {
  // Cache session data to avoid repeated API calls
  static _sessionDataCache = new Map();

  /**
   * Get current Congress number
   * @returns {number} Current Congress number
   */
  static getCurrentCongress() {
    const currentYear = new Date().getFullYear();
    return Math.floor((currentYear - 1787) / 2);
  }

  /**
   * Get current session number (1 or 2)
   * @returns {number} Current session number
   */
  static getCurrentSession() {
    const currentYear = new Date().getFullYear();
    return currentYear % 2 === 0 ? 2 : 1;
  }

  /**
   * Fetch session data from Congress.gov API
   * @param {number} congress - Congress number
   * @param {boolean} forceRefresh - Force refresh cache
   * @returns {Promise<Object>} Session data
   */
  static async fetchSessionData(congress, forceRefresh = false) {
    // Check cache first
    if (!forceRefresh && this._sessionDataCache.has(congress)) {
      return this._sessionDataCache.get(congress);
    }

    try {
      if (!CONGRESS_GOV_API_KEY) {
        logger.warn(
          'Congress.gov API key not configured, using fallback dates'
        );
        const fallbackData = this.getFallbackSessionData(congress);
        this._sessionDataCache.set(congress, fallbackData);
        return fallbackData;
      }

      // Normalize base URL to remove trailing slash to avoid double slashes
      const baseUrl =
        CONGRESS_API_BASE_URL?.replace(/\/+$/, '') ||
        'https://api.congress.gov/v3';
      // Try both plural and singular forms of the endpoint
      const urlPlural = `${baseUrl}/congresses/${congress}?api_key=${CONGRESS_GOV_API_KEY}`;
      const urlSingular = `${baseUrl}/congress/${congress}?api_key=${CONGRESS_GOV_API_KEY}`;
      let response;
      try {
        // Try plural form first
        response = await axios.get(urlPlural, {
          timeout: 10000,
          validateStatus: (status) => status < 500, // Don't throw on 404, we'll try singular
        });
        if (response.status === 404) {
          // Try singular form
          response = await axios.get(urlSingular, {
            timeout: 10000,
          });
        }
        // If response is not successful (200-299), throw error to be caught by outer catch
        if (response.status < 200 || response.status >= 300) {
          throw new Error(
            `API returned status ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        // If singular also fails, throw to be caught by outer catch
        throw error;
      }

      const sessionData = response.data;
      this._sessionDataCache.set(congress, sessionData);
      return sessionData;
    } catch (error) {
      // Only log error once per congress to reduce noise
      if (!this._sessionDataCache.has(congress)) {
        logger.error('Failed to fetch session data from Congress.gov API', {
          congress,
          error: error.message,
          note: 'Using fallback session data. This may be normal if Congress data is not yet available in the API.',
        });
      }
      const fallbackData = this.getFallbackSessionData(congress);
      this._sessionDataCache.set(congress, fallbackData);
      return fallbackData;
    }
  }

  /**
   * Get fallback session data when API is unavailable
   * @param {number} congress - Congress number
   * @returns {Object} Fallback session data
   */
  static getFallbackSessionData(congress) {
    const startYear = 1787 + congress * 2;
    const endYear = startYear + 1;

    return {
      congress: congress,
      startYear: startYear,
      endYear: endYear,
      sessions: [
        {
          session: 1,
          startDate: `${startYear}-01-03`,
          endDate: `${endYear}-01-03`, // Constitutional default
        },
        {
          session: 2,
          startDate: `${endYear}-01-03`,
          endDate: `${endYear + 1}-01-03`, // Constitutional default
        },
      ],
    };
  }

  /**
   * Get the actual session end date from Congress.gov or fallback
   * @returns {Promise<Date>} Session end date
   */
  static async getSessionEndDate() {
    const congress = this.getCurrentCongress();
    const session = this.getCurrentSession();
    const sessionData = await this.fetchSessionData(congress);

    // Find the current session
    const currentSessionData = sessionData.sessions?.find(
      (s) => s.session === session
    );

    if (currentSessionData?.endDate) {
      return new Date(currentSessionData.endDate);
    }

    // Fallback to constitutional default
    const currentYear = new Date().getFullYear();
    const endYear = currentYear % 2 === 0 ? currentYear + 1 : currentYear + 1;
    return new Date(endYear, 0, 3); // January 3rd
  }

  /**
   * Check if the current Congressional session has ended
   * @returns {Promise<boolean>} True if session has ended
   */
  static async hasSessionEnded() {
    const sessionEndDate = await this.getSessionEndDate();
    const now = new Date();
    return now > sessionEndDate;
  }

  /**
   * Check if we're within the warning period (1 month before session ends)
   * @returns {Promise<boolean>} True if within warning period
   */
  static async isInWarningPeriod() {
    const sessionEndDate = await this.getSessionEndDate();
    const warningDate = new Date(sessionEndDate);
    warningDate.setMonth(warningDate.getMonth() - 1); // 1 month before

    const now = new Date();
    return now >= warningDate && now < sessionEndDate;
  }

  /**
   * Get the next general election date
   * @returns {Date} Next general election date
   */
  static getNextGeneralElectionDate() {
    const currentYear = new Date().getFullYear();
    const nextElectionYear =
      currentYear % 2 === 0 ? currentYear : currentYear + 1;

    // First Tuesday in November
    const electionDate = new Date(nextElectionYear, 10, 1); // November 1st
    const dayOfWeek = electionDate.getDay();
    const daysToAdd = (9 - dayOfWeek) % 7; // Days to first Tuesday
    electionDate.setDate(electionDate.getDate() + daysToAdd);

    // If it's the first Tuesday, move to second Tuesday
    if (electionDate.getDate() === 1) {
      electionDate.setDate(8);
    }

    return electionDate;
  }

  /**
   * Get session information for email templates
   * @returns {Promise<Object>} Session information
   */
  static async getSessionInfo() {
    const nextElectionDate = this.getNextGeneralElectionDate();
    const inWarningPeriod = await this.isInWarningPeriod();
    const sessionEndDate = await this.getSessionEndDate();
    const currentCongress = this.getCurrentCongress();
    const currentSession = this.getCurrentSession();
    const hasEnded = await this.hasSessionEnded();

    return {
      formattedSessionEndDate: sessionEndDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      formattedNextElectionDate: nextElectionDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      nextElectionDate: nextElectionDate.toISOString(),
      sessionEndDate: sessionEndDate.toISOString(),
      currentCongress,
      inWarningPeriod,
      currentSession,
      hasEnded,
    };
  }

  /**
   * Log session status for monitoring
   */
  static async logSessionStatus() {
    const info = await this.getSessionInfo();

    logger.info('Congressional session status', {
      nextElectionDate: info.nextElectionDate,
      currentCongress: info.currentCongress,
      inWarningPeriod: info.inWarningPeriod,
      currentSession: info.currentSession,
      sessionEndDate: info.sessionEndDate,
      hasEnded: info.hasEnded,
    });
  }
}

module.exports = CongressionalSessionService;

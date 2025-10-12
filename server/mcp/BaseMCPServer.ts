/**
 * Base class for MCP Servers
 * Provides common functionality for regulatory monitoring servers
 * Reduces code duplication across EUR-Lex, CNIL, and EC AI Office servers
 */

import { MCPServerConfig, RawRegulatoryData } from '../types/regulatory-monitoring';
import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';

export interface HTTPFetchOptions {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string>;
}

export abstract class BaseMCPServer {
  protected config: MCPServerConfig;
  protected readonly defaultTimeout = 30000; // 30 seconds
  protected readonly defaultUserAgent = 'AI-Act-Navigator/1.0 (Compliance Monitoring)';

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  /**
   * Performs an HTTP GET request with standardized headers and error handling
   * @param url - The URL to fetch
   * @param options - Optional HTTP options (headers, timeout, params)
   * @returns The response data
   */
  protected async fetchHTML(url: string, options: HTTPFetchOptions = {}): Promise<string> {
    const axiosConfig: AxiosRequestConfig = {
      headers: {
        'User-Agent': this.defaultUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(options.headers || {}),
      },
      timeout: options.timeout || this.defaultTimeout,
      params: options.params,
    };

    try {
      const response = await axios.get(url, axiosConfig);
      return response.data;
    } catch (error) {
      this.logError(`HTTP fetch error for ${url}`, error);
      throw error;
    }
  }

  /**
   * Parses HTML with cheerio
   * @param html - The HTML string to parse
   * @returns Cheerio instance for DOM manipulation
   */
  protected parseHTML(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  /**
   * Parses a date string with fallback to current date
   * Subclasses can override for custom date parsing (e.g., French months)
   * @param dateStr - The date string to parse
   * @returns Parsed Date object or current date as fallback
   */
  protected parseDate(dateStr: string): Date {
    if (!dateStr || dateStr.trim() === '') {
      return new Date();
    }

    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  /**
   * Maps document type keywords to standardized types
   * Subclasses can override for source-specific mappings
   * @param docType - The document type string from source
   * @returns Standardized document type
   */
  protected mapDocumentType(docType: string): 'regulation' | 'directive' | 'decision' | 'guidance' {
    const normalized = docType.toLowerCase();

    if (normalized.includes('règlement') || normalized.includes('regulation')) {
      return 'regulation';
    }
    if (normalized.includes('directive')) {
      return 'directive';
    }
    if (normalized.includes('décision') || normalized.includes('decision') || normalized.includes('sanction')) {
      return 'decision';
    }
    if (normalized.includes('recommandation') || normalized.includes('guide') || normalized.includes('orientation') || normalized.includes('communication')) {
      return 'guidance';
    }

    return 'regulation'; // Default fallback
  }

  /**
   * Handles errors with consistent logging
   * @param context - Error context message
   * @param error - The error object
   */
  protected logError(context: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${this.config.name}] ${context}:`, errorMessage);
  }

  /**
   * Safely handles errors in data fetching methods
   * Returns empty array instead of throwing, for graceful degradation
   * @param fn - The async function to execute
   * @param context - Context message for error logging
   * @returns Array of regulatory data or empty array on error
   */
  protected async safelyFetchData(
    fn: () => Promise<RawRegulatoryData[]>,
    context: string
  ): Promise<RawRegulatoryData[]> {
    try {
      return await fn();
    } catch (error) {
      this.logError(context, error);
      return []; // Graceful degradation
    }
  }

  /**
   * Normalizes a URL to absolute format
   * @param url - The URL (relative or absolute)
   * @param baseUrl - The base URL for relative URLs
   * @returns Absolute URL
   */
  protected normalizeUrl(url: string, baseUrl: string): string {
    if (!url) return baseUrl;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    return `${baseUrl}/${url}`;
  }

  /**
   * Generates a unique source ID for a document
   * @param prefix - Source prefix (e.g., 'eurlex', 'cnil')
   * @param identifier - Optional unique identifier
   * @returns Unique source ID
   */
  protected generateSourceId(prefix: string, identifier?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return identifier ? `${prefix}-${identifier}` : `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Returns the MCP server configuration
   * @returns The server configuration object
   */
  public getConfig(): MCPServerConfig {
    return this.config;
  }

  /**
   * Abstract method: Each server must implement its main data fetching logic
   * This enforces a consistent interface across all MCP servers
   */
  abstract fetchRecentUpdates(params?: Record<string, any>): Promise<RawRegulatoryData[]>;
}

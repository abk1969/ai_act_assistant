import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import Anthropic from '@anthropic-ai/sdk';
import { storage } from "../storage";

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string;
  endpoint?: string;
  temperature?: number;
}

class LLMService {
  private openaiClient?: OpenAI;
  private geminiClient?: GoogleGenAI;
  private anthropicClient?: Anthropic;

  private initializeClients(config: LLMConfig) {
    switch (config.provider.toLowerCase()) {
      case 'openai':
        this.openaiClient = new OpenAI({ apiKey: config.apiKey });
        break;
      case 'google':
      case 'gemini':
        this.geminiClient = new GoogleGenAI({ apiKey: config.apiKey });
        break;
      case 'anthropic':
        this.anthropicClient = new Anthropic({ apiKey: config.apiKey });
        break;
    }
  }

  async generateResponse(
    prompt: string,
    userId: string,
    options?: { systemPrompt?: string; maxTokens?: number }
  ): Promise<LLMResponse> {
    const settings = await storage.getActiveLlmSettings(userId);
    if (!settings) {
      throw new Error("No active LLM configuration found. Please configure an LLM provider in settings.");
    }

    const config: LLMConfig = {
      provider: settings.provider,
      model: settings.model || this.getDefaultModel(settings.provider),
      apiKey: settings.apiKey || '',
      endpoint: settings.endpoint || undefined,
      temperature: (settings.temperature || 30) / 100, // Convert back to decimal
    };

    if (!config.apiKey) {
      throw new Error(`API key not configured for ${config.provider}`);
    }

    this.initializeClients(config);

    switch (config.provider.toLowerCase()) {
      case 'openai':
        return await this.generateOpenAIResponse(prompt, config, options);
      case 'google':
      case 'gemini':
        return await this.generateGeminiResponse(prompt, config, options);
      case 'anthropic':
        return await this.generateAnthropicResponse(prompt, config, options);
      case 'ollama':
        return await this.generateOllamaResponse(prompt, config, options);
      case 'lmstudio':
        return await this.generateLMStudioResponse(prompt, config, options);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  private getDefaultModel(provider: string): string {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'gpt-5'; // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      case 'google':
      case 'gemini':
        return 'gemini-2.5-flash';
      case 'anthropic':
        return 'claude-sonnet-4-20250514'; // newest Anthropic model
      case 'mistral':
        return 'mistral-large-latest';
      case 'ollama':
        return 'llama3.2:latest';
      case 'lmstudio':
        return 'local-model';
      default:
        return 'gpt-5';
    }
  }

  private async generateOpenAIResponse(
    prompt: string,
    config: LLMConfig,
    options?: { systemPrompt?: string; maxTokens?: number }
  ): Promise<LLMResponse> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const messages: any[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    // Build request parameters - GPT-5 only supports default temperature (1)
    const requestParams: any = {
      model: config.model,
      messages,
      max_completion_tokens: options?.maxTokens || 2000,
    };

    // Only set temperature for models that support it (not GPT-5)
    if (config.model !== 'gpt-5' && config.temperature !== undefined) {
      requestParams.temperature = config.temperature;
    }

    const response = await this.openaiClient.chat.completions.create(requestParams);

    return {
      content: response.choices[0].message.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  private async generateGeminiResponse(
    prompt: string,
    config: LLMConfig,
    options?: { systemPrompt?: string; maxTokens?: number }
  ): Promise<LLMResponse> {
    if (!this.geminiClient) {
      throw new Error("Gemini client not initialized");
    }

    const fullPrompt = options?.systemPrompt 
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt;

    const response = await this.geminiClient.models.generateContent({
      model: config.model,
      contents: fullPrompt,
    });

    return {
      content: response.text || '',
    };
  }

  private async generateAnthropicResponse(
    prompt: string,
    config: LLMConfig,
    options?: { systemPrompt?: string; maxTokens?: number }
  ): Promise<LLMResponse> {
    if (!this.anthropicClient) {
      throw new Error("Anthropic client not initialized");
    }

    const response = await this.anthropicClient.messages.create({
      model: config.model,
      max_tokens: options?.maxTokens || 2000,
      temperature: config.temperature || 0.3,
      system: options?.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: response.usage ? {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      } : undefined,
    };
  }

  private async generateOllamaResponse(
    prompt: string,
    config: LLMConfig,
    options?: { systemPrompt?: string; maxTokens?: number }
  ): Promise<LLMResponse> {
    const endpoint = config.endpoint || 'http://localhost:11434';
    
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt: options?.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt,
        stream: false,
        options: {
          temperature: config.temperature || 0.3,
          num_predict: options?.maxTokens || 2000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response || '',
    };
  }

  private async generateLMStudioResponse(
    prompt: string,
    config: LLMConfig,
    options?: { systemPrompt?: string; maxTokens?: number }
  ): Promise<LLMResponse> {
    const endpoint = config.endpoint || 'http://localhost:1234/v1';
    
    const messages: any[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature || 0.3,
        max_tokens: options?.maxTokens || 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content || '',
      usage: data.usage,
    };
  }

  async initializeFromEnvironment(userId: string): Promise<void> {
    try {
      const envConfigs = [
        {
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-5'
        },
        {
          provider: 'google',
          apiKey: process.env.GEMINI_API_KEY,
          model: 'gemini-2.5-flash'
        },
        {
          provider: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: 'claude-sonnet-4-20250514'
        }
      ];

      for (const config of envConfigs) {
        if (config.apiKey) {
          await storage.upsertLlmSettings({
            userId,
            provider: config.provider,
            model: config.model,
            apiKey: config.apiKey,
            temperature: 30,
            isActive: true
          });
          console.log(`Initialized ${config.provider} LLM configuration for user ${userId}`);
        }
      }
    } catch (error) {
      console.error('Error initializing LLM configurations:', error);
    }
  }

  async testConnection(userId: string, provider: string): Promise<boolean> {
    try {
      const settings = await storage.getLlmSettings(userId);
      const config = settings.find(s => s.provider === provider);
      
      if (!config || !config.apiKey) {
        return false;
      }

      const response = await this.generateResponse(
        "Test connection. Please respond with 'OK'.",
        userId
      );
      
      return response.content.toLowerCase().includes('ok');
    } catch (error) {
      console.error(`LLM connection test failed for ${provider}:`, error);
      return false;
    }
  }
}

export const llmService = new LLMService();

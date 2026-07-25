/**
 * ai.js - Phase 2: Bring Your Own Key (BYOK) LLM integration
 * 
 * This module provides AI-powered content analysis.
 * API keys are stored ONLY in sessionStorage and never persisted.
 */

import Storage from './storage.js';

const AI = {
  /**
   * Check if AI is configured
   */
  isConfigured() {
    return !!Storage.session.get('mahikshu_ai_key');
  },

  /**
   * Get current provider and key
   */
  getConfig() {
    return {
      key: Storage.session.get('mahikshu_ai_key'),
      provider: Storage.session.get('mahikshu_ai_provider', 'openai')
    };
  },

  /**
   * Clear AI configuration
   */
  clearConfig() {
    Storage.session.remove('mahikshu_ai_key');
    Storage.session.remove('mahikshu_ai_provider');
  },

  /**
   * Generate content ideas based on an opportunity
   * @param {Object} opportunity - The opportunity item
   * @returns {Promise<string>} - AI-generated content ideas
   */
  async generateIdeas(opportunity) {
    const { key, provider } = this.getConfig();
    if (!key) throw new Error('AI not configured');

    const prompt = `You are a crypto content strategist. Based on this opportunity, suggest 3 content ideas for a blog post or social media thread.

Title: ${opportunity.title}
Platform: ${opportunity.platform}
Type: ${opportunity.content_type}
Summary: ${opportunity.summary}

Provide concise, actionable ideas.`;

    if (provider === 'openai') {
      return this.callOpenAI(key, prompt);
    } else if (provider === 'anthropic') {
      return this.callAnthropic(key, prompt);
    }
    throw new Error('Unknown AI provider');
  },

  /**
   * Call OpenAI API
   */
  async callOpenAI(apiKey, prompt) {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = await resp.json();
    return data.choices[0].message.content;
  },

  /**
   * Call Anthropic API
   */
  async callAnthropic(apiKey, prompt) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Anthropic error: ${err}`);
    }

    const data = await resp.json();
    return data.content[0].text;
  }
};

export default AI;

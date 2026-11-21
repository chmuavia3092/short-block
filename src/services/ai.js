const AI_API_KEY = '189b4900e4ad1221810112014a96deca';
const AI_BASE_URL = 'https://api.bytez.com/models/v2/openai/v1';
const AI_MODEL = 'openai-community/gpt2';
const NEWS_API_KEY = '';
const NEWS_API_BASE = 'https://newsapi.org/v2';

const FALLBACK_HEADLINES = [
  { title: 'AI Focus Guard Research', description: 'Showing sample AI research headlines.', source: { name: 'Local' }, url: 'https://huggingface.co', urlToImage: '', publishedAt: new Date().toISOString() },
  { title: 'Latest AI Models Directory', description: 'Explore open source AI models on Hugging Face.', source: { name: 'Hugging Face' }, url: 'https://huggingface.co/models', urlToImage: '', publishedAt: new Date().toISOString() },
  { title: 'OpenAI releases new tools', description: 'Latest updates on GPT and developer tools.', source: { name: 'OpenAI' }, url: 'https://openai.com/blog', urlToImage: '', publishedAt: new Date().toISOString() },
  { title: 'Machine Learning Crash Course', description: 'Free interactive ML course by Google.', source: { name: 'Google' }, url: 'https://developers.google.com/machine-learning/crash-course', urlToImage: '', publishedAt: new Date().toISOString() },
  { title: 'ArXiv - Latest AI Papers', description: 'Browse latest AI research papers.', source: { name: 'ArXiv' }, url: 'https://arxiv.org/list/cs.AI/recent', urlToImage: '', publishedAt: new Date().toISOString() },
  { title: 'AI Startups Funding Landscape', description: 'Track latest AI startup funding.', source: { name: 'Crunchbase' }, url: 'https://www.crunchbase.com/hub/ai-startups/', urlToImage: '', publishedAt: new Date().toISOString() }
];

async function fetchWithBytez(prompt, max_tokens = 300) {
  const response = await fetch(`${AI_BASE_URL}/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      prompt,
      temperature: 0.7,
      max_tokens
    })
  });
  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }
  const data = await response.json();
  if (!data.choices || !data.choices[0].text) {
    throw new Error(`AI API returned no text: ${JSON.stringify(data)}`);
  }
  return data.choices[0].text.trim();
}

async function fetchLiveHeadlines(query = 'artificial intelligence') {
  try {
    if (NEWS_API_KEY && NEWS_API_KEY !== 'your_api_key_here') {
      const params = new URLSearchParams({
        q: query,
        language: 'en',
        pageSize: '10',
        apiKey: NEWS_API_KEY
      });
      const response = await fetch(`${NEWS_API_BASE}/top-headlines?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.articles && data.articles.length) {
          return data.articles
            .filter((a) => a.title && a.title !== '[Removed]')
            .map((a) => ({
              title: a.title || '',
              description: a.description || '',
              url: a.url || '',
              urlToImage: a.urlToImage || '',
              publishedAt: a.publishedAt || '',
              source: a.source || { name: '' }
            }));
        }
      }
    }
  } catch (e) {
    console.warn('NewsAPI fetch failed, falling back:', e);
  }

  try {
    const params = new URLSearchParams({
      query: encodeURIComponent(query),
      hitsPerPage: '10'
    });
    const response = await fetch(`https://hn.algolia.com/api/v1/search?${params}`);
    if (response.ok) {
      const data = await response.json();
      if (data.hits && data.hits.length) {
        return data.hits.map((h) => ({
          title: h.title || h.story_text || 'HN result',
          description: h.story_text || h.comment_text || '',
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          urlToImage: '',
          publishedAt: new Date(h.created_at).toISOString(),
          source: { name: 'Hacker News' }
        }));
      }
    }
  } catch (e) {
    console.warn('HackerNews fallback failed:', e);
  }

  return FALLBACK_HEADLINES.filter((h) =>
    h.title.toLowerCase().includes(query.toLowerCase()) ||
    h.description.toLowerCase().includes(query.toLowerCase())
  ) || FALLBACK_HEADLINES;
}

export const AIService = {
  async generateCompletion(prompt, temperature = 0.7, max_tokens = 150) {
    try {
      const text = await fetchWithBytez(prompt, max_tokens);
      return { success: true, text };
    } catch (error) {
      console.error('AI generation failed:', error);
      return { success: false, error: error.message };
    }
  },

  async generateFocusTip() {
    const prompt = 'Give me a short motivational productivity tip for staying focused while working on tasks. Keep it under 2 sentences.';
    try {
      return await fetchWithBytez(prompt, 100);
    } catch (e) {
      return 'Stay focused and build something meaningful today!';
    }
  },

  async getLiveResearchBrief(topic = 'artificial intelligence') {
    const headlines = await fetchLiveHeadlines(topic);
    const headlineTexts = headlines
      .map((h, i) => `${i + 1}. ${h.title}${h.description ? ' - ' + h.description : ''}`)
      .join('\n');

    if (!headlines.length || headlineTexts.length === 0) {
      return { success: true, brief: `No live results found for "${topic}". Try another term.`, headlines };
    }

    const prompt = `You are an AI research assistant. Summarize the following live headlines into a concise, insightful research brief (max 6 sentences). Highlight key trends and the most important takeaways:\n\n${headlineTexts}\n\nResearch Brief:`;
    try {
      const brief = await fetchWithBytez(prompt, 400);
      return { success: true, brief, headlines };
    } catch (e) {
      const synthesized = [
        `<b>Live Research Brief: ${topic}</b>`,
        '',
        headlines.map((h) => `<b>${h.title}</b>${h.description ? ' - ' + h.description : ''}`).join('\n\n'),
        '',
        `<i>Sourced ${headlines.length} live headlines. AI summarization unavailable (Bytez model access required).</i>`
      ].join('\n');
      return { success: true, brief: synthesized, headlines };
    }
  }
};

export default AIService;
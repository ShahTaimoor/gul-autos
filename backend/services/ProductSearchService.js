const { productRepository } = require('../repositories');
const { BadRequestError } = require('../errors');

class ProductSearchService {
  extractKeywords(query) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from']);
    return query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0 && !stopWords.has(word));
  }

  calculateRelevanceScore(product, keywords, categoryName = '') {
    const titleLower = (product.title || '').toLowerCase();
    const descriptionLower = (product.description || '').toLowerCase();
    const categoryLower = (categoryName || '').toLowerCase();
    const tagsLower = (product.tags || []).map(t => t.toLowerCase()).join(' ');

    let score = 0;
    let matchedKeywords = 0;
    const totalKeywords = keywords.length;

    for (const keyword of keywords) {
      let keywordMatched = false;

      if (titleLower === keyword) {
        score += 1000;
        keywordMatched = true;
      } else if (titleLower.startsWith(keyword + ' ') || titleLower.endsWith(' ' + keyword)) {
        score += 800;
        keywordMatched = true;
      } else if (titleLower.includes(keyword)) {
        score += 600;
        keywordMatched = true;
      }

      if (tagsLower.includes(keyword)) {
        score += 500;
        keywordMatched = true;
      }

      if (categoryLower.includes(keyword)) {
        score += 300;
        keywordMatched = true;
      }

      if (descriptionLower.includes(keyword)) {
        score += 100;
        keywordMatched = true;
      }

      if (keywordMatched) {
        matchedKeywords++;
      }
    }

    if (matchedKeywords === totalKeywords && totalKeywords > 0) {
      score += 500;
    } else if (matchedKeywords < totalKeywords) {
      score = score * (matchedKeywords / totalKeywords) * 0.3;
    }

    if (product.isFeatured) {
      score += 50;
    }

    return {
      score,
      matchedKeywords,
      totalKeywords
    };
  }

  async searchProducts(searchQuery, limit = 20, page = 1) {
    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
      throw new BadRequestError('Search query is required');
    }

    const trimmedQuery = searchQuery.trim();
    const searchLimit = Math.min(parseInt(limit) || 20, 100);
    const searchPage = Math.max(parseInt(page) || 1, 1);
    const skip = (searchPage - 1) * searchLimit;

    const keywords = this.extractKeywords(trimmedQuery);

    if (keywords.length === 0) {
      return {
        data: [],
        query: trimmedQuery,
        keywords: [],
        pagination: {
          total: 0,
          page: searchPage,
          limit: searchLimit,
          totalPages: 0
        }
      };
    }

    const baseQuery = { stock: { $gt: 0 } };
    const regexPatterns = keywords.map(keyword => {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, 'i');
    });

    const searchConditions = regexPatterns.map(pattern => ({
      $or: [
        { title: pattern },
        { description: pattern },
        { tags: pattern }
      ]
    }));

    const products = await productRepository.find({
      ...baseQuery,
      $and: searchConditions
    }, {
      select: 'title picture price description stock isFeatured createdAt category tags',
      populate: [{ path: 'category', select: 'name' }]
    });

    const productsWithScores = products.map(product => {
      const categoryName = product.category?.name || '';
      const relevance = this.calculateRelevanceScore(product, keywords, categoryName);

      if (relevance.matchedKeywords < keywords.length) {
        return null;
      }

      return {
        ...product,
        relevanceScore: relevance.score,
        matchedKeywords: relevance.matchedKeywords,
        totalKeywords: relevance.totalKeywords
      };
    }).filter(product => product !== null);

    productsWithScores.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      if (b.isFeatured !== a.isFeatured) {
        return b.isFeatured ? 1 : -1;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const total = productsWithScores.length;
    const paginatedResults = productsWithScores.slice(skip, skip + searchLimit);

    const formattedResults = paginatedResults.map(({ relevanceScore, matchedKeywords, totalKeywords, ...product }) => ({
      ...product,
      image: product.picture?.secure_url || null
    }));

    return {
      data: formattedResults,
      query: trimmedQuery,
      keywords,
      pagination: {
        total,
        page: searchPage,
        limit: searchLimit,
        totalPages: Math.ceil(total / searchLimit)
      }
    };
  }

  async getSearchSuggestions(searchQuery, limit = 8) {
    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length < 2) {
      return {
        data: {
          products: [],
          categories: []
        },
        query: searchQuery || ''
      };
    }

    const trimmedQuery = searchQuery.trim();
    const suggestionLimit = Math.min(parseInt(limit) || 8, 8);
    const keywords = this.extractKeywords(trimmedQuery);

    if (keywords.length === 0) {
      return {
        data: {
          products: [],
          categories: []
        },
        query: trimmedQuery
      };
    }

    const baseQuery = { stock: { $gt: 0 } };
    const regexPatterns = keywords.map(keyword => {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, 'i');
    });

    const searchConditions = regexPatterns.map(pattern => ({
      $or: [
        { title: pattern },
        { description: pattern },
        { tags: pattern }
      ]
    }));

    const products = await productRepository.find({
      ...baseQuery,
      $and: searchConditions
    }, {
      select: 'title picture price category tags',
      populate: [{ path: 'category', select: 'name' }],
      limit: suggestionLimit * 2
    });

    const productsWithScores = products.map(product => {
      const categoryName = product.category?.name || '';
      const relevance = this.calculateRelevanceScore(product, keywords, categoryName);

      if (relevance.matchedKeywords < keywords.length) {
        return null;
      }

      return {
        ...product,
        relevanceScore: relevance.score
      };
    }).filter(product => product !== null);

    productsWithScores.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const suggestions = productsWithScores
      .slice(0, suggestionLimit)
      .map(({ relevanceScore, ...product }) => ({
        ...product,
        image: product.picture?.secure_url || null
      }));

    const categorySet = new Set();
    products.forEach(product => {
      if (product.category?.name) {
        const categoryLower = product.category.name.toLowerCase();
        if (keywords.some(keyword => categoryLower.includes(keyword))) {
          categorySet.add(product.category.name);
        }
      }
    });
    const categories = Array.from(categorySet).slice(0, 3);

    return {
      data: {
        products: suggestions,
        categories
      },
      query: trimmedQuery,
      keywords
    };
  }
}

module.exports = new ProductSearchService();


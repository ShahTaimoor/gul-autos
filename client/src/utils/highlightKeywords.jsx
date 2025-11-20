/**
 * Utility function to highlight keywords in text
 * @param {string} text - The text to highlight keywords in
 * @param {string} searchTerm - The search term (keywords to highlight)
 * @returns {JSX.Element|string} - Returns JSX with highlighted keywords or original text
 */
export const highlightKeywords = (text, searchTerm) => {
  if (!text || !searchTerm || searchTerm.trim().length < 2) {
    return text;
  }

  const cleanSearchTerm = searchTerm.trim().toLowerCase();
  
  // Extract words from brackets: (word), {word}, [word]
  const bracketWords = [];
  const bracketPatterns = [
    /\(([^)]+)\)/g,  // (word)
    /\{([^}]+)\}/g,  // {word}
    /\[([^\]]+)\]/g  // [word]
  ];
  
  bracketPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(cleanSearchTerm)) !== null) {
      bracketWords.push(match[1].trim());
    }
  });
  
  // Remove bracket content from search string for normal processing
  let searchWithoutBrackets = cleanSearchTerm
    .replace(/\([^)]+\)/g, '')  // Remove (word)
    .replace(/\{[^}]+\}/g, '')   // Remove {word}
    .replace(/\[[^\]]+\]/g, ''); // Remove [word]
  
  // Split search term into individual words
  const searchWords = searchWithoutBrackets
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  // Add bracket words to search words
  searchWords.push(...bracketWords);
  
  // Escape special regex characters (but preserve bracket words)
  const escapedWords = searchWords.map(word => {
    // If word contains brackets, handle it specially
    if (word.includes('(') || word.includes('{') || word.includes('[')) {
      return word.replace(/[.*+?^$|\\]/g, '\\$&'); // Escape only non-bracket special chars
    }
    return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  if (escapedWords.length === 0) {
    return text;
  }

  // Create a regex pattern that matches any of the search words
  const pattern = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  
  // Split text by the pattern while keeping the matches
  const parts = text.split(pattern);
  
  // Return JSX with highlighted parts
  return (
    <>
      {parts.map((part, index) => {
        const isMatch = searchWords.some(word => 
          part.toLowerCase() === word.toLowerCase()
        );
        
        if (isMatch) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 text-gray-900 px-0.5 rounded font-semibold"
            >
              {part}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

/**
 * Alternative function that returns HTML string (useful for dangerouslySetInnerHTML)
 * @param {string} text - The text to highlight keywords in
 * @param {string} searchTerm - The search term (keywords to highlight)
 * @returns {string} - Returns HTML string with highlighted keywords
 */
export const highlightKeywordsHTML = (text, searchTerm) => {
  if (!text || !searchTerm || searchTerm.trim().length < 2) {
    return text;
  }

  const cleanSearchTerm = searchTerm.trim().toLowerCase();
  
  // Extract words from brackets: (word), {word}, [word]
  const bracketWords = [];
  const bracketPatterns = [
    /\(([^)]+)\)/g,  // (word)
    /\{([^}]+)\}/g,  // {word}
    /\[([^\]]+)\]/g  // [word]
  ];
  
  bracketPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(cleanSearchTerm)) !== null) {
      bracketWords.push(match[1].trim());
    }
  });
  
  // Remove bracket content from search string for normal processing
  let searchWithoutBrackets = cleanSearchTerm
    .replace(/\([^)]+\)/g, '')  // Remove (word)
    .replace(/\{[^}]+\}/g, '')   // Remove {word}
    .replace(/\[[^\]]+\]/g, ''); // Remove [word]
  
  // Split search term into individual words
  const searchWords = searchWithoutBrackets
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  // Add bracket words to search words
  searchWords.push(...bracketWords);
  
  // Escape special regex characters (but preserve bracket words)
  const escapedWords = searchWords.map(word => {
    // If word contains brackets, handle it specially
    if (word.includes('(') || word.includes('{') || word.includes('[')) {
      return word.replace(/[.*+?^$|\\]/g, '\\$&'); // Escape only non-bracket special chars
    }
    return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  if (escapedWords.length === 0) {
    return text;
  }

  const pattern = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  
  return text.replace(pattern, (match) => {
    return `<mark class="bg-yellow-200 text-gray-900 px-0.5 rounded font-semibold">${match}</mark>`;
  });
};


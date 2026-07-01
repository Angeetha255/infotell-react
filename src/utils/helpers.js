/**
 * Helper utility functions for the application
 */

/**
 * Converts a string to Title Case (first letter of each word capitalized)
 * @param {string} str - The string to convert
 * @returns {string} The title-cased string
 */
export const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a company name to Title Case for display
 * @param {string} companyName - The company name to format
 * @returns {string} The formatted company name
 */
export const formatCompanyName = (companyName) => {
  if (!companyName || typeof companyName !== 'string') return '';
  return toTitleCase(companyName);
};

/**
 * Removes duplicates from an array
 * @param {Array} arr - The array to deduplicate
 * @returns {Array} The array with duplicates removed
 */
export const removeDuplicates = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr)];
};

/**
 * Generates a clean SEO-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} The SEO-friendly slug
 * 
 * Rules:
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * - Remove duplicate hyphens
 * - Remove punctuation and special characters
 * - Remove %20, %, ?, &, #, =, quotes, commas, brackets, and other encoded characters
 * - No URL-encoded characters in final URL
 */
export const generateSlug = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Convert to lowercase
    .toLowerCase()
    // Remove URL-encoded characters first
    .replace(/%[0-9a-f]{2}/gi, '')
    // Remove special characters and punctuation (keep letters, numbers, spaces, hyphens)
    .replace(/[^\w\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove duplicate hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Remove any remaining special characters that might have been missed
    .replace(/[?&=#]/g, '')
    // Ensure it's not empty
    || 'slug';
};

/**
 * Resolves a slug back to its original name by matching against a list of names
 * @param {string} slug - The slug to resolve
 * @param {Array} names - Array of possible names to match against
 * @returns {string|null} The matching original name, or null if not found
 */
export const resolveSlugToName = (slug, names = []) => {
  if (!slug || !Array.isArray(names) || names.length === 0) return null;
  
  const slugLower = slug.toLowerCase();
  
  // Try to find a name that generates the same slug
  for (const name of names) {
    if (name && typeof name === 'string') {
      const nameSlug = generateSlug(name);
      if (nameSlug === slugLower) {
        return name;
      }
    }
  }
  
  return null;
};

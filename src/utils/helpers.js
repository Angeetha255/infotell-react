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

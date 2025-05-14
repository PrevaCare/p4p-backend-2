/**
 * Template Manager Utility
 *
 * Provides functions for optimizing HTML template generation with precompilation
 */

const cacheManager = require("./cacheManager");

// Cache for compiled templates
const compiledTemplates = {};

/**
 * Precompile a template function for faster rendering
 * @param {string} templateName - Unique name for the template
 * @param {Function} templateFn - Function that takes data and returns HTML
 * @returns {Function} - The compiled template function
 */
function compileTemplate(templateName, templateFn) {
  if (compiledTemplates[templateName]) {
    return compiledTemplates[templateName];
  }

  // Wrap the template function to enable caching
  const compiledFn = (data) => {
    const cacheKey = `template:${templateName}:${JSON.stringify(data)}`;

    // Check if this exact rendering is cached
    const cachedHtml = cacheManager.get(cacheKey);
    if (cachedHtml) {
      return cachedHtml;
    }

    // Generate HTML and cache it
    const html = templateFn(data);
    cacheManager.set(cacheKey, html, 600); // Cache for 10 minutes
    return html;
  };

  compiledTemplates[templateName] = compiledFn;
  return compiledFn;
}

/**
 * Clear compiled templates from cache
 * @param {string} templateName - Optional name of template to clear, or all if not specified
 */
function clearCompiledTemplate(templateName) {
  if (templateName) {
    delete compiledTemplates[templateName];
  } else {
    // Clear all compiled templates
    Object.keys(compiledTemplates).forEach((key) => {
      delete compiledTemplates[key];
    });
  }
}

/**
 * Optimize an HTML string for faster rendering
 * @param {string} html - HTML string to optimize
 * @returns {string} - Optimized HTML
 */
function optimizeHtml(html) {
  // Remove unnecessary whitespace and comments
  return html
    .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
    .replace(/\s{2,}/g, " ") // Remove extra spaces
    .replace(/>\s+</g, "><") // Remove whitespace between tags
    .trim();
}

module.exports = {
  compileTemplate,
  clearCompiledTemplate,
  optimizeHtml,
};

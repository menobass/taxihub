// i18n - Internationalization utility
class I18n {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.translations = {};
    this.fallbackLanguage = 'en';
    this.availableLanguages = ['en', 'es'];
  }

  /**
   * Load translation file for a language
   */
  async loadLanguage(lang) {
    if (this.translations[lang]) {
      return this.translations[lang];
    }

    try {
      const response = await fetch(`/locales/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load language: ${lang}`);
      }
      const translations = await response.json();
      this.translations[lang] = translations;
      return translations;
    } catch (error) {
      console.error(`Error loading language ${lang}:`, error);
      
      // Load fallback language
      if (lang !== this.fallbackLanguage) {
        return this.loadLanguage(this.fallbackLanguage);
      }
      
      return {};
    }
  }

  /**
   * Initialize i18n system
   */
  async init() {
    await this.loadLanguage(this.currentLanguage);
    
    // Load fallback if different
    if (this.currentLanguage !== this.fallbackLanguage) {
      await this.loadLanguage(this.fallbackLanguage);
    }

    this.updateDOM();
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key (e.g., "login.title")
   * @param {object} params - Optional parameters for interpolation
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let translation = this.translations[this.currentLanguage];
    let fallback = this.translations[this.fallbackLanguage];

    // Navigate through nested keys
    for (const k of keys) {
      translation = translation?.[k];
      fallback = fallback?.[k];
    }

    // Use current language or fallback
    let text = translation || fallback || key;

    // Replace parameters
    if (typeof text === 'string' && params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{{${param}}}`, params[param]);
      });
    }

    return text;
  }

  /**
   * Change current language
   */
  async changeLanguage(lang) {
    if (!this.availableLanguages.includes(lang)) {
      console.error(`Language ${lang} not available`);
      return;
    }

    await this.loadLanguage(lang);
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    this.updateDOM();
    
    // Trigger custom event for components to update
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }

  /**
   * Update DOM elements with data-i18n attribute
   */
  updateDOM() {
    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });

    // Update titles
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });

    // Update values (for buttons, etc.)
    document.querySelectorAll('[data-i18n-value]').forEach(element => {
      const key = element.getAttribute('data-i18n-value');
      element.value = this.t(key);
    });
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get available languages
   */
  getAvailableLanguages() {
    return this.availableLanguages;
  }

  /**
   * Add a new language (for future expansion)
   */
  addLanguage(code, name) {
    if (!this.availableLanguages.includes(code)) {
      this.availableLanguages.push(code);
    }
  }
}

// Create global instance
const i18n = new I18n();

// Helper function for translations (shorthand)
function t(key, params) {
  return i18n.t(key, params);
}

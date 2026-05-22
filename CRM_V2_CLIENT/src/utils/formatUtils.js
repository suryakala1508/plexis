/**
 * Formats a date string or object to DD/MM/YYYY format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
};

/**
 * Formats a number as Indian currency (INR) with proper comma placement
 * Uses Indian numbering system (lakhs/crores)
 * @param {number|string} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the ₹ symbol (default: true)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export const formatIndianCurrency = (amount, showSymbol = true, decimals = 2) => {
    if (amount === null || amount === undefined || amount === '') return showSymbol ? '₹0.00' : '0.00';

    const number = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(number)) return showSymbol ? '₹0.00' : '0.00';

    // Use Intl.NumberFormat for Indian locale formatting
    const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);

    return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Formats bytes as human-readable string (KB, MB, GB, TB)
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Normalizes URLs by adding https:// if protocol is missing
 * @param {string} url - The URL to normalize
 * @returns {string} Normalized URL
 */
export const normalizeUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    return `https://${trimmed}`;
};
/**
 * Formats a number string with Indian comma placement (lakhs/crores)
 * Useful for input fields where you want formatting as the user types
 * @param {string|number} value - The value to format
 * @returns {string} Formatted string
 */
export const formatIndianNumber = (value) => {
    if (!value && value !== 0) return '';
    let str = value.toString().replace(/[^0-9.]/g, '');
    let [integer, decimal] = str.split('.');

    // Indian comma logic (lakhs, crores)
    let lastThree = integer.substring(integer.length - 3);
    let otherNumbers = integer.substring(0, integer.length - 3);
    if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
    }
    let formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

    return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
};

/**
 * Parses an Indian formatted number string back to a numeric string
 * @param {string} value - The formatted string (e.g., "1,25,000")
 * @returns {string} Clean numeric string (e.g., "125000")
 */
export const parseIndianNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/,/g, '');
};

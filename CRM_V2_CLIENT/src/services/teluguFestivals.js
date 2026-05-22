/**
 * Telugu Festivals Data (2025-2026)
 * Since date-holidays and other common packages lack specific Telugu festival dates,
 * this utility provides hardcoded dates for major Telugu festivals.
 */

export const teluguFestivals = [
    // 2025
    { date: '2025-01-14', name: 'Makar Sankranti / Pongal', type: 'telugu-festival' },
    { date: '2025-01-15', name: 'Kanuma', type: 'telugu-festival' },
    { date: '2025-02-26', name: 'Maha Shivaratri', type: 'telugu-festival' },
    { date: '2025-03-30', name: 'Ugadi (Telugu New Year)', type: 'telugu-festival' },
    { date: '2025-04-06', name: 'Sri Rama Navami', type: 'telugu-festival' },
    { date: '2025-08-08', name: 'Varalakshmi Vratam', type: 'telugu-festival' },
    { date: '2025-08-27', name: 'Vinayaka Chavithi', type: 'telugu-festival' },
    { date: '2025-09-22', name: 'Bathukamma Begins (Telangana)', type: 'telugu-festival' },
    { date: '2025-10-02', name: 'Dasara / Vijayadashami', type: 'telugu-festival' },
    { date: '2025-10-20', name: 'Deepavali', type: 'telugu-festival' },

    // 2026
    { date: '2026-01-14', name: 'Makar Sankranti / Pongal', type: 'telugu-festival' },
    { date: '2026-01-15', name: 'Kanuma', type: 'telugu-festival' },
    { date: '2026-02-15', name: 'Maha Shivaratri', type: 'telugu-festival' },
    { date: '2026-03-19', name: 'Ugadi (Telugu New Year)', type: 'telugu-festival' },
    { date: '2026-03-27', name: 'Sri Rama Navami', type: 'telugu-festival' },
    { date: '2026-09-14', name: 'Vinayaka Chavithi', type: 'telugu-festival' },
    { date: '2026-10-20', name: 'Dasara / Vijayadashami', type: 'telugu-festival' },
    { date: '2026-11-08', name: 'Deepavali', type: 'telugu-festival' },
];

/**
 * Get Telugu festivals for a specific year
 * @param {number} year 
 * @returns {Array} List of festival events
 */
export const getTeluguFestivals = (year) => {
    return teluguFestivals
        .filter(f => f.date.startsWith(year.toString()))
        .map(f => ({
            id: `telugu-${f.date}-${f.name}`,
            title: f.name,
            start: f.date,
            end: f.date,
            type: "holiday", // Tag as holiday for rendering consistency
            subtype: "telugu-festival",
            color: "orange", // Distinct color for Telugu festivals
            description: "Telugu Festival",
            allDay: true
        }));
};

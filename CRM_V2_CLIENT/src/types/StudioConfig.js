/**
 * Studio Configuration Types & Constants
 * Defines the structure for lead form customization
 */

// Enquiry Type Options
export const ENQUIRY_TYPE_OPTIONS = [
  'General Enquiry',
  'Shoot Booking',
  'Availability Check',
  'Price Request',
  'Collaboration',
  'Other'
]

// Event Options
export const EVENT_OPTIONS = [
  'Wedding',
  'Pre-Wedding',
  'Baby Shoot',
  'Birthday',
  'Engagement',
  'Corporate Event',
  'Commercial Shoot',
  'Music Video',
  'Other'
]

// Relation Options
export const RELATION_OPTIONS = [
  'Self',
  'Parent',
  'Friend',
  'Relative',
  'Company Representative'
]

// Banner Height Options
export const BANNER_HEIGHT_OPTIONS = [
  { value: 'small', label: 'Small', height: 'h-48 md:h-56' },
  { value: 'medium', label: 'Medium', height: 'h-56 md:h-72 lg:h-80' },
  { value: 'large', label: 'Large', height: 'h-72 md:h-96 lg:h-[450px]' }
]

// Default Configuration
export const DEFAULT_STUDIO_CONFIG = {
  studioName: 'Your Studio',
  tagline: 'Capturing moments that last forever',
  logo: null,
  bannerImage: null,
  backgroundImage: null,
  banner: {
    show: true,
    height: 'medium',
    overlay: 30,
    showGradient: true,
    objectPosition: 'center'
  },
  accentColor: '#D4AF37', // Gold
  portfolio: [],
  portfolioSelected: null,
  youtubeLinks: [], // Array of { id, url, title, subtitle }
  aboutUs: {
    title: '',
    description: ''
  },
  form: {
    title: 'Send Enquiry',
    description: "We'd love to hear about your event",
    fields: {
      contactNumber: true,
      whatsappNumber: true,
      enquiryType: true,
      event: true,
      eventType: true,
      eventDates: true,
      location: true,
      relation: true,
      budget: true
    },
    // By default, enabled fields are mandatory (legacy behavior).
    // If a saved config doesn’t have this object, the UI/form will treat enabled fields as mandatory.
    mandatory: {
      contactNumber: true,
      whatsappNumber: true,
      enquiryType: true,
      event: true,
      eventType: true,
      eventDates: true,
      location: true,
      relation: true,
      budget: false
    },
    customFields: []
  }
}


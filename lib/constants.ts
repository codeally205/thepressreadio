export const CATEGORIES = [
  'politics',
  'economy',
  'business',
  'culture',
  'sport',
  'technology',
  'health',
  'environment',
] as const

export const AFRICAN_COUNTRIES = [
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG',
  'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW',
  'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'YT', 'MA', 'MZ',
  'NA', 'NE', 'NG', 'RE', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS',
  'SD', 'SZ', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW',
]

export const SUBSCRIPTION_PLANS = {
  diaspora_monthly: {
    name: 'Diaspora Monthly',
    price: 5,
    currency: 'USD',
    interval: 'month',
    processor: 'stripe',
  },
  continent_monthly: {
    name: 'Continent Monthly',
    price: 16, // ~$1 USD = 16 GHS (approximate)
    currency: 'GHS',
    interval: 'month',
    processor: 'paystack',
  },
  continent_yearly: {
    name: 'Continent Yearly',
    price: 160, // ~$10 USD = 160 GHS (approximate)
    currency: 'GHS',
    interval: 'year',
    processor: 'paystack',
  },
} as const

export const FREE_PREMIUM_ARTICLE_LIMIT = 3

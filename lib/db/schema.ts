import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, primaryKey, check, unique } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// NEXTAUTH TABLES (Required by DrizzleAdapter)
// Note: Using 'user' (singular) to match NextAuth expectations
export const users = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  // Custom fields
  avatarUrl: text('avatar_url'),
  authProvider: text('auth_provider').notNull().default('email'),
  passwordHash: text('password_hash'),
  role: text('role').default('viewer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const accounts = pgTable('account', {
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId],
  }),
}))

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}))

// SUBSCRIPTIONS
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeCustomerId: text('stripe_customer_id'),
  paystackSubscriptionCode: text('paystack_subscription_code').unique(),
  paystackCustomerCode: text('paystack_customer_code'),
  paymentProcessor: text('payment_processor').notNull(),
  // New fields for better tracking
  upgradedFromTrialId: uuid('upgraded_from_trial_id').references(() => subscriptions.id),
  paymentReference: text('payment_reference'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ARTICLES
export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  body: jsonb('body').notNull(),
  category: text('category').notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  accessLevel: text('access_level').notNull().default('free'),
  status: text('status').notNull().default('draft'),
  coverImageUrl: text('cover_image_url'),
  // Video support fields
  videoUrl: text('video_url'),
  videoThumbnailUrl: text('video_thumbnail_url'),
  videoDuration: integer('video_duration'), // in seconds
  videoType: text('video_type'), // 'youtube', 'vimeo', 'upload', etc.
  // Publishing fields
  publishedAt: timestamp('published_at', { withTimezone: true }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  // SEO fields
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  ogImageUrl: text('og_image_url'),
  // Analytics
  viewCount: integer('view_count').notNull().default(0),
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// TAGS
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
})

// ARTICLE TAGS
export const articleTags = pgTable('article_tags', {
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.articleId, table.tagId] }),
}))

// NEWSLETTERS
export const newsletters = pgTable('newsletters', {
  id: uuid('id').primaryKey().defaultRandom(),
  subject: text('subject').notNull(),
  previewText: text('preview_text'),
  content: jsonb('content').notNull(),
  status: text('status').notNull().default('draft'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  recipientCount: integer('recipient_count').notNull().default(0),
  openCount: integer('open_count').notNull().default(0),
  clickCount: integer('click_count').notNull().default(0),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// NEWSLETTER SENDS
export const newsletterSends = pgTable('newsletter_sends', {
  id: uuid('id').primaryKey().defaultRandom(),
  newsletterId: uuid('newsletter_id').notNull().references(() => newsletters.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  clickedAt: timestamp('clicked_at', { withTimezone: true }),
  unsubscribed: boolean('unsubscribed').notNull().default(false),
})

// PAYMENT EVENTS
export const paymentEvents = pgTable('payment_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  processor: text('processor').notNull(),
  eventType: text('event_type').notNull(),
  amount: integer('amount'),
  currency: text('currency'),
  processorEventId: text('processor_event_id').unique(),
  status: text('status'),
  metadata: jsonb('metadata'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ARTICLE VIEWS
export const articleViews = pgTable('article_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  fingerprint: text('fingerprint'),
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  viewedAt: timestamp('viewed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Ensure at least one of userId or fingerprint is provided
  userOrFingerprintCheck: check('user_or_fingerprint_check', 
    sql`(${table.userId} IS NOT NULL OR ${table.fingerprint} IS NOT NULL)`
  ),
  // Prevent duplicate views per user per article
  uniqueUserArticleView: unique('unique_user_article_view').on(table.userId, table.articleId),
}))

// SIDEBAR CACHE
export const sidebarCache = pgTable('sidebar_cache', {
  key: text('key').primaryKey(),
  data: jsonb('data').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

// MEDIA UPLOADS
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(), // in bytes
  url: text('url').notNull(),
  alt: text('alt'),
  caption: text('caption'),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// SHORT VIDEOS
export const shortVideos = pgTable('short_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  cloudinaryPublicId: text('cloudinary_public_id'), // For easier deletion from Cloudinary
  duration: integer('duration'), // in seconds
  fileSize: integer('file_size'), // in bytes
  mimeType: text('mime_type').notNull(),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  viewCount: integer('view_count').notNull().default(0),
  likeCount: integer('like_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// SHORT VIDEO LIKES
export const shortVideoLikes = pgTable('short_video_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  videoId: uuid('video_id').notNull().references(() => shortVideos.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueVideoUserLike: unique('unique_video_user_like').on(table.videoId, table.userId),
}))

// SHORT VIDEO VIEWS
export const shortVideoViews = pgTable('short_video_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  videoId: uuid('video_id').notNull().references(() => shortVideos.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  fingerprint: text('fingerprint'),
  viewedAt: timestamp('viewed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userOrFingerprintCheck: check('user_or_fingerprint_check', 
    sql`(${table.userId} IS NOT NULL OR ${table.fingerprint} IS NOT NULL)`
  ),
}))

// ADS
export const ads = pgTable('ads', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  buttonText: text('button_text').default('Learn More'),
  position: text('position').notNull().default('sidebar'), // sidebar, banner, inline
  status: text('status').notNull().default('active'), // active, inactive, scheduled
  priority: integer('priority').notNull().default(0), // Higher number = higher priority
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  targetAudience: text('target_audience').notNull().default('unsubscribed'), // unsubscribed, all, subscribers
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// AD INTERACTIONS
export const adInteractions = pgTable('ad_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  adId: uuid('ad_id').notNull().references(() => ads.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  fingerprint: text('fingerprint'),
  interactionType: text('interaction_type').notNull(), // impression, click
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userOrFingerprintCheck: check('user_or_fingerprint_check', 
    sql`(${table.userId} IS NOT NULL OR ${table.fingerprint} IS NOT NULL)`
  ),
}))

// RELATIONS
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  articles: many(articles),
  newsletters: many(newsletters),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}))

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  tags: many(articleTags),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  articles: many(articleTags),
}))

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}))

export const newslettersRelations = relations(newsletters, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [newsletters.createdBy],
    references: [users.id],
  }),
  sends: many(newsletterSends),
}))

export const newsletterSendsRelations = relations(newsletterSends, ({ one }) => ({
  newsletter: one(newsletters, {
    fields: [newsletterSends.newsletterId],
    references: [newsletters.id],
  }),
  user: one(users, {
    fields: [newsletterSends.userId],
    references: [users.id],
  }),
}))

export const mediaRelations = relations(media, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [media.uploadedBy],
    references: [users.id],
  }),
}))

export const shortVideosRelations = relations(shortVideos, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [shortVideos.uploadedBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [shortVideos.approvedBy],
    references: [users.id],
  }),
  likes: many(shortVideoLikes),
  views: many(shortVideoViews),
}))

export const shortVideoLikesRelations = relations(shortVideoLikes, ({ one }) => ({
  video: one(shortVideos, {
    fields: [shortVideoLikes.videoId],
    references: [shortVideos.id],
  }),
  user: one(users, {
    fields: [shortVideoLikes.userId],
    references: [users.id],
  }),
}))

export const shortVideoViewsRelations = relations(shortVideoViews, ({ one }) => ({
  video: one(shortVideos, {
    fields: [shortVideoViews.videoId],
    references: [shortVideos.id],
  }),
  user: one(users, {
    fields: [shortVideoViews.userId],
    references: [users.id],
  }),
}))

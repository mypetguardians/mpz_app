import { relations } from "drizzle-orm/relations";
import { adoptionContractTemplates, adoptionContracts, adoptions, adoptionQuestions, adoptionQuestionResponses, centers, animals, user, animalImages, account, session, matchingQuestionnaires, matchingQuestions, matchingResponses, matchingResults, matchingSessions, userPreferences, favorites, notifications, personalityTests, questionForms, posts, postImages, postTags, animalFavorites, centerFavorites, notices, phoneVerificationTokens, userSettings, adoptionMonitoring, adoptionMonitoringChecks, replies, comments } from "./schema";

export const adoptionContractsRelations = relations(adoptionContracts, ({one}) => ({
	adoptionContractTemplate: one(adoptionContractTemplates, {
		fields: [adoptionContracts.templateId],
		references: [adoptionContractTemplates.id]
	}),
	adoption: one(adoptions, {
		fields: [adoptionContracts.adoptionId],
		references: [adoptions.id]
	}),
}));

export const adoptionContractTemplatesRelations = relations(adoptionContractTemplates, ({one, many}) => ({
	adoptionContracts: many(adoptionContracts),
	center: one(centers, {
		fields: [adoptionContractTemplates.centerId],
		references: [centers.id]
	}),
}));

export const adoptionsRelations = relations(adoptions, ({one, many}) => ({
	adoptionContracts: many(adoptionContracts),
	adoptionQuestionResponses: many(adoptionQuestionResponses),
	animal: one(animals, {
		fields: [adoptions.animalId],
		references: [animals.id]
	}),
	user: one(user, {
		fields: [adoptions.userId],
		references: [user.id]
	}),
	adoptionMonitorings: many(adoptionMonitoring),
	adoptionMonitoringChecks: many(adoptionMonitoringChecks),
}));

export const adoptionQuestionResponsesRelations = relations(adoptionQuestionResponses, ({one}) => ({
	adoptionQuestion: one(adoptionQuestions, {
		fields: [adoptionQuestionResponses.questionId],
		references: [adoptionQuestions.id]
	}),
	adoption: one(adoptions, {
		fields: [adoptionQuestionResponses.adoptionId],
		references: [adoptions.id]
	}),
}));

export const adoptionQuestionsRelations = relations(adoptionQuestions, ({one, many}) => ({
	adoptionQuestionResponses: many(adoptionQuestionResponses),
	center: one(centers, {
		fields: [adoptionQuestions.centerId],
		references: [centers.id]
	}),
}));

export const centersRelations = relations(centers, ({one, many}) => ({
	adoptionQuestions: many(adoptionQuestions),
	animals: many(animals),
	adoptionContractTemplates: many(adoptionContractTemplates),
	user: one(user, {
		fields: [centers.userId],
		references: [user.id]
	}),
	questionForms: many(questionForms),
	centerFavorites: many(centerFavorites),
	notices: many(notices),
}));

export const animalsRelations = relations(animals, ({one, many}) => ({
	adoptions: many(adoptions),
	animalImages: many(animalImages),
	center: one(centers, {
		fields: [animals.centerId],
		references: [centers.id]
	}),
	matchingResults: many(matchingResults),
	posts: many(posts),
	animalFavorites: many(animalFavorites),
}));

export const userRelations = relations(user, ({many}) => ({
	adoptions: many(adoptions),
	accounts: many(account),
	sessions: many(session),
	centers: many(centers),
	matchingResponses: many(matchingResponses),
	matchingSessions: many(matchingSessions),
	userPreferences: many(userPreferences),
	favorites: many(favorites),
	notifications: many(notifications),
	personalityTests: many(personalityTests),
	posts: many(posts),
	animalFavorites: many(animalFavorites),
	centerFavorites: many(centerFavorites),
	phoneVerificationTokens: many(phoneVerificationTokens),
	userSettings: many(userSettings),
	replies: many(replies),
	comments: many(comments),
}));

export const animalImagesRelations = relations(animalImages, ({one}) => ({
	animal: one(animals, {
		fields: [animalImages.animalId],
		references: [animals.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const matchingQuestionsRelations = relations(matchingQuestions, ({one, many}) => ({
	matchingQuestionnaire: one(matchingQuestionnaires, {
		fields: [matchingQuestions.questionnaireId],
		references: [matchingQuestionnaires.id]
	}),
	matchingResponses: many(matchingResponses),
}));

export const matchingQuestionnairesRelations = relations(matchingQuestionnaires, ({many}) => ({
	matchingQuestions: many(matchingQuestions),
	matchingResponses: many(matchingResponses),
	matchingSessions: many(matchingSessions),
}));

export const matchingResponsesRelations = relations(matchingResponses, ({one}) => ({
	matchingQuestion: one(matchingQuestions, {
		fields: [matchingResponses.questionId],
		references: [matchingQuestions.id]
	}),
	matchingQuestionnaire: one(matchingQuestionnaires, {
		fields: [matchingResponses.questionnaireId],
		references: [matchingQuestionnaires.id]
	}),
	user: one(user, {
		fields: [matchingResponses.userId],
		references: [user.id]
	}),
}));

export const matchingResultsRelations = relations(matchingResults, ({one}) => ({
	animal: one(animals, {
		fields: [matchingResults.animalId],
		references: [animals.id]
	}),
	matchingSession: one(matchingSessions, {
		fields: [matchingResults.sessionId],
		references: [matchingSessions.id]
	}),
}));

export const matchingSessionsRelations = relations(matchingSessions, ({one, many}) => ({
	matchingResults: many(matchingResults),
	matchingQuestionnaire: one(matchingQuestionnaires, {
		fields: [matchingSessions.questionnaireId],
		references: [matchingQuestionnaires.id]
	}),
	user: one(user, {
		fields: [matchingSessions.userId],
		references: [user.id]
	}),
	userPreferences: many(userPreferences),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	matchingSession: one(matchingSessions, {
		fields: [userPreferences.sessionId],
		references: [matchingSessions.id]
	}),
	user: one(user, {
		fields: [userPreferences.userId],
		references: [user.id]
	}),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	user: one(user, {
		fields: [favorites.userId],
		references: [user.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(user, {
		fields: [notifications.userId],
		references: [user.id]
	}),
}));

export const personalityTestsRelations = relations(personalityTests, ({one}) => ({
	user: one(user, {
		fields: [personalityTests.userId],
		references: [user.id]
	}),
}));

export const questionFormsRelations = relations(questionForms, ({one}) => ({
	center: one(centers, {
		fields: [questionForms.centerId],
		references: [centers.id]
	}),
}));

export const postImagesRelations = relations(postImages, ({one}) => ({
	post: one(posts, {
		fields: [postImages.postId],
		references: [posts.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	postImages: many(postImages),
	postTags: many(postTags),
	animal: one(animals, {
		fields: [posts.animalId],
		references: [animals.id]
	}),
	user: one(user, {
		fields: [posts.userId],
		references: [user.id]
	}),
	adoptionMonitorings: many(adoptionMonitoring),
	comments: many(comments),
}));

export const postTagsRelations = relations(postTags, ({one}) => ({
	post: one(posts, {
		fields: [postTags.postId],
		references: [posts.id]
	}),
}));

export const animalFavoritesRelations = relations(animalFavorites, ({one}) => ({
	animal: one(animals, {
		fields: [animalFavorites.animalId],
		references: [animals.id]
	}),
	user: one(user, {
		fields: [animalFavorites.userId],
		references: [user.id]
	}),
}));

export const centerFavoritesRelations = relations(centerFavorites, ({one}) => ({
	center: one(centers, {
		fields: [centerFavorites.centerId],
		references: [centers.id]
	}),
	user: one(user, {
		fields: [centerFavorites.userId],
		references: [user.id]
	}),
}));

export const noticesRelations = relations(notices, ({one}) => ({
	center: one(centers, {
		fields: [notices.centerId],
		references: [centers.id]
	}),
}));

export const phoneVerificationTokensRelations = relations(phoneVerificationTokens, ({one}) => ({
	user: one(user, {
		fields: [phoneVerificationTokens.userId],
		references: [user.id]
	}),
}));

export const userSettingsRelations = relations(userSettings, ({one}) => ({
	user: one(user, {
		fields: [userSettings.userId],
		references: [user.id]
	}),
}));

export const adoptionMonitoringRelations = relations(adoptionMonitoring, ({one}) => ({
	post: one(posts, {
		fields: [adoptionMonitoring.postId],
		references: [posts.id]
	}),
	adoption: one(adoptions, {
		fields: [adoptionMonitoring.adoptionId],
		references: [adoptions.id]
	}),
}));

export const adoptionMonitoringChecksRelations = relations(adoptionMonitoringChecks, ({one}) => ({
	adoption: one(adoptions, {
		fields: [adoptionMonitoringChecks.adoptionId],
		references: [adoptions.id]
	}),
}));

export const repliesRelations = relations(replies, ({one}) => ({
	user: one(user, {
		fields: [replies.userId],
		references: [user.id]
	}),
	comment: one(comments, {
		fields: [replies.commentId],
		references: [comments.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	replies: many(replies),
	user: one(user, {
		fields: [comments.userId],
		references: [user.id]
	}),
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
}));
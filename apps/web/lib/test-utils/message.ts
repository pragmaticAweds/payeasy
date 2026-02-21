import { faker } from '@faker-js/faker';
import type {
    ConversationMessage,
    ConversationMessageInsert,
    ISOTimestamp,
    MessageType
} from '@/lib/types/database';

/**
 * Factory to generate mock ConversationMessage data for testing.
 */
export const MessageFactory = {
    /**
     * Generates a fully populated ConversationMessage object.
     */
    build: (overrides?: Partial<ConversationMessage>): ConversationMessage => {
        const createdAt = faker.date.recent().toISOString() as ISOTimestamp;

        return {
            id: faker.string.uuid(),
            conversation_id: faker.string.uuid(),
            sender_id: faker.string.uuid(),
            content: faker.lorem.sentences(2),
            message_type: 'text',
            read_at: undefined,
            deleted_at: undefined,
            created_at: createdAt,
            ...overrides,
        };
    },

    /**
     * Generates a read ConversationMessage object.
     */
    buildRead: (overrides?: Partial<ConversationMessage>): ConversationMessage => {
        return MessageFactory.build({
            read_at: faker.date.recent().toISOString() as ISOTimestamp,
            ...overrides,
        });
    },

    /**
     * Generates a ConversationMessage object suitable for database insertion.
     */
    buildInsert: (overrides?: Partial<ConversationMessageInsert>): ConversationMessageInsert => {
        return {
            id: faker.string.uuid(),
            conversation_id: faker.string.uuid(),
            sender_id: faker.string.uuid(),
            content: faker.lorem.sentences(2),
            message_type: 'text',
            read_at: null,
            deleted_at: null,
            ...overrides,
        };
    },

    /**
     * Builds multiple ConversationMessage objects.
     */
    buildList: (count: number, overrides?: Partial<ConversationMessage>): ConversationMessage[] => {
        return Array.from({ length: count }, () => MessageFactory.build(overrides));
    },
};

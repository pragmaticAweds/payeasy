'use client'

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

type Message = {
    id: string
    content: string
    senderId: string
    senderName?: string
    createdAt: string
    readAt?: string | null
    status?: 'sending' | 'sent' | 'failed'
}

type ConversationResponse = {
    conversation?: {
        id: string
        title?: string
        currentUserId?: string
        typingUserName?: string
    }
    messages?: Message[]
    currentUserId?: string
    typingUserName?: string
}

const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {
        return ''
    }

    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function ConversationDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [messages, setMessages] = useState<Message[]>([])
    const [currentUserId, setCurrentUserId] = useState<string>('')
    const [title, setTitle] = useState<string>('Conversation')
    const [typingUserName, setTypingUserName] = useState<string | null>(null)
    const [messageText, setMessageText] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messageEndRef = useRef<HTMLDivElement | null>(null)

    const scrollToLatest = useCallback(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    const fetchConversation = useCallback(async () => {
        if (!id) {
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/conversations/${id}/messages?page=1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Unable to load conversation history')
            }

            const data = (await response.json()) as ConversationResponse
            const nextMessages = data.messages ?? []

            setMessages(nextMessages)
            setTitle(data.conversation?.title ?? 'Conversation')
            setCurrentUserId(data.currentUserId ?? data.conversation?.currentUserId ?? '')
            setTypingUserName(data.typingUserName ?? data.conversation?.typingUserName ?? null)
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'An unknown error occurred')
        } finally {
            setIsLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchConversation()
    }, [fetchConversation])

    useEffect(() => {
        scrollToLatest()
    }, [messages.length, scrollToLatest])

    const markMessagesAsRead = useCallback(async () => {
        const unreadIncomingIds = messages
            .filter((message) => message.senderId !== currentUserId && !message.readAt)
            .map((message) => message.id)

        if (unreadIncomingIds.length === 0) {
            return
        }

        try {
            await fetch('/api/messages/read', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messageIds: unreadIncomingIds }),
            })

            setMessages((previous) =>
                previous.map((message) => {
                    if (unreadIncomingIds.includes(message.id)) {
                        return {
                            ...message,
                            readAt: new Date().toISOString(),
                        }
                    }

                    return message
                }),
            )
        } catch {
            // Non-blocking background action.
        }
    }, [currentUserId, messages])

    useEffect(() => {
        if (!currentUserId || messages.length === 0) {
            return
        }

        markMessagesAsRead()
    }, [currentUserId, markMessagesAsRead, messages.length])

    const ownLatestMessage = useMemo(() => {
        const ownMessages = messages.filter((message) => message.senderId === currentUserId)
        return ownMessages.length > 0 ? ownMessages[ownMessages.length - 1] : null
    }, [currentUserId, messages])

    const sendMessage = useCallback(async () => {
        const trimmed = messageText.trim()

        if (!trimmed || !id || isSending) {
            return
        }

        setIsSending(true)
        setError(null)

        const optimisticMessage: Message = {
            id: `optimistic-${Date.now()}`,
            content: trimmed,
            senderId: currentUserId || 'self',
            createdAt: new Date().toISOString(),
            status: 'sending',
        }

        setMessages((previous) => [...previous, optimisticMessage])
        setMessageText('')

        try {
            const response = await fetch(`/api/conversations/${id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: trimmed }),
            })

            if (!response.ok) {
                throw new Error('Unable to send message')
            }

            const savedMessage = (await response.json()) as Message

            setMessages((previous) =>
                previous.map((message) =>
                    message.id === optimisticMessage.id
                        ? {
                              ...savedMessage,
                              status: 'sent',
                          }
                        : message,
                ),
            )
        } catch (sendError) {
            setMessages((previous) =>
                previous.map((message) =>
                    message.id === optimisticMessage.id
                        ? {
                              ...message,
                              status: 'failed',
                          }
                        : message,
                ),
            )
            setError(sendError instanceof Error ? sendError.message : 'Failed to send message')
        } finally {
            setIsSending(false)
        }
    }, [currentUserId, id, isSending, messageText])

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        sendMessage()
    }

    const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            sendMessage()
        }
    }

    return (
        <main className="mx-auto flex h-screen w-full max-w-5xl flex-col bg-slate-950 px-3 py-4 sm:px-6">
            <header className="border-b border-slate-800 pb-4">
                <h1 className="text-lg font-semibold text-slate-100 sm:text-2xl">{title}</h1>
            </header>

            <section className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                    {isLoading ? (
                        <p className="text-sm text-slate-400">Loading messages...</p>
                    ) : messages.length === 0 ? (
                        <p className="text-sm text-slate-400">No messages yet. Start the conversation.</p>
                    ) : (
                        messages.map((message) => {
                            const isCurrentUser = message.senderId === currentUserId

                            return (
                                <article
                                    key={message.id}
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[75%] ${
                                        isCurrentUser
                                            ? 'ml-auto bg-blue-600 text-white'
                                            : 'mr-auto bg-slate-700 text-slate-100'
                                    }`}
                                >
                                    {!isCurrentUser && message.senderName ? (
                                        <p className="mb-1 text-xs font-semibold text-slate-200">{message.senderName}</p>
                                    ) : null}
                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                    <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-slate-200/80">
                                        <span>{formatTime(message.createdAt)}</span>
                                        {isCurrentUser ? (
                                            <span>
                                                {message.status === 'sending'
                                                    ? 'Sending...'
                                                    : message.status === 'failed'
                                                      ? 'Failed'
                                                      : message.readAt
                                                        ? 'Read'
                                                        : 'Sent'}
                                            </span>
                                        ) : null}
                                    </div>
                                </article>
                            )
                        })
                    )}

                    {typingUserName ? (
                        <p className="text-xs italic text-slate-400">{typingUserName} is typing...</p>
                    ) : null}
                    <div ref={messageEndRef} />
                </div>

                <form onSubmit={onSubmit} className="border-t border-slate-800 p-3 sm:p-4">
                    <div className="flex items-end gap-2 sm:gap-3">
                        <textarea
                            value={messageText}
                            onChange={(event) => setMessageText(event.target.value)}
                            onKeyDown={onInputKeyDown}
                            placeholder="Write a message..."
                            rows={1}
                            className="max-h-32 min-h-[44px] flex-1 resize-y rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                            disabled={isSending}
                        />
                        <button
                            type="submit"
                            disabled={isSending || !messageText.trim()}
                            className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900"
                        >
                            {isSending ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                    {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
                    {ownLatestMessage?.readAt ? (
                        <p className="mt-1 text-right text-[11px] text-slate-400">Seen {formatTime(ownLatestMessage.readAt)}</p>
                    ) : null}
                </form>
            </section>
        </main>
    )
}

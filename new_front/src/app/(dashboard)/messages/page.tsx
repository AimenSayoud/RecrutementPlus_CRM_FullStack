// app/(dashboard)/messages/page.tsx

'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMessagingStore } from '@/stores/useMessagingStore'
import { useTranslation } from '@/hooks/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate, truncateText } from '@/utils/format.utils'
import { ConversationWithDetails, MessageWithDetails } from '@/types/messaging.types'
import { cn } from '@/lib/utils'
import {
  Search,
  Send,
  Plus,
  Archive,
  MoreVertical,
  Paperclip,
  Smile,
  Phone,
  Video,
  Info,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  Users,
  X,
  ArrowLeft,
  Edit,
  Trash2,
  Reply
} from 'lucide-react'

// Conversation item component
interface ConversationItemProps {
  conversation: ConversationWithDetails
  isActive: boolean
  onClick: () => void
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const { t } = useTranslation()
  
  const getConversationIcon = () => {
    if (conversation.type === 'group') {
      return <Users className="h-5 w-5" />
    }
    return (
      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
        <span className="text-sm font-medium">
          {conversation.participant_names?.[0]?.charAt(0) || 'U'}
        </span>
      </div>
    )
  }
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 flex items-start space-x-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left",
        isActive && "bg-gray-100 dark:bg-gray-800"
      )}
    >
      {getConversationIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium truncate">
            {conversation.title || conversation.participant_names?.join(', ') || 'Conversation'}
          </p>
          <span className="text-xs text-muted-foreground">
            {conversation.last_message_at && formatDate(conversation.last_message_at, 'relative')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-1">
          {conversation.last_message_preview || 'No messages yet'}
        </p>
        {conversation.unread_count > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full mt-1">
            {conversation.unread_count}
          </span>
        )}
      </div>
    </button>
  )
}

// Message component
interface MessageItemProps {
  message: MessageWithDetails
  isOwn: boolean
  showAvatar: boolean
  onEdit?: () => void
  onDelete?: () => void
  onReply?: () => void
}

function MessageItem({ message, isOwn, showAvatar, onEdit, onDelete, onReply }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false)
  
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check className="h-3 w-3" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-600" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }
  
  return (
    <div
      className={cn(
        "flex items-end space-x-2 mb-4",
        isOwn && "flex-row-reverse space-x-reverse"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {showAvatar && !isOwn && (
        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium">
            {message.sender_name?.charAt(0) || 'U'}
          </span>
        </div>
      )}
      
      <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-muted-foreground mb-1 px-2">
            {message.sender_name}
          </span>
        )}
        
        <div className="relative group">
          <div
            className={cn(
              "px-4 py-2 rounded-2xl",
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 dark:bg-gray-800"
            )}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
            
            {message.is_edited && (
              <span className="text-xs opacity-70 ml-2">(edited)</span>
            )}
          </div>
          
          {/* Message actions */}
          {showActions && (
            <div
              className={cn(
                "absolute top-0 flex items-center space-x-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-1",
                isOwn ? "right-full mr-2" : "left-full ml-2"
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onReply}
              >
                <Reply className="h-3 w-3" />
              </Button>
              {isOwn && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={onEdit}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mt-1 px-2">
          <span className="text-xs text-muted-foreground">
            {formatDate(message.created_at, 'relative')}
          </span>
          {isOwn && getStatusIcon()}
        </div>
      </div>
    </div>
  )
}

// Compose message component
interface ComposeMessageProps {
  onSend: (content: string) => void
  disabled?: boolean
}

function ComposeMessage({ onSend, disabled }: ComposeMessageProps) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
      inputRef.current?.focus()
    }
  }
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  return (
    <div className="border-t p-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="flex-shrink-0">
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1"
        />
        
        <Button variant="ghost" size="sm" className="flex-shrink-0">
          <Smile className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// New conversation modal
interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: any) => void
}

function NewConversationModal({ isOpen, onClose, onCreate }: NewConversationModalProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [participants, setParticipants] = useState('')
  
  const handleCreate = () => {
    if (participants.trim()) {
      onCreate({
        title: title.trim() || undefined,
        participant_ids: [], // In real app, you'd search and select users
        type: 'direct',
      })
      onClose()
      setTitle('')
      setParticipants('')
    }
  }
  
  if (!isOpen) return null
  
  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">New Conversation</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Conversation title"
              />
            </div>
            
            <div>
              <Label htmlFor="participants">To</Label>
              <Input
                id="participants"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Search users..."
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!participants.trim()}>
              Create
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    isLoading,
    isLoadingMessages,
    error,
    fetchConversations,
    fetchConversation,
    fetchMessages,
    sendMessage,
    createConversation,
    markAsRead,
    setCurrentConversation,
  } = useMessagingStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])
  
  // Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id)
      setMobileView('chat')
    }
  }, [currentConversation])
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Mark messages as read
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      const unreadMessages = messages.filter(
        (m) => !m.is_deleted && m.sender_id !== user?.id && m.status !== 'read'
      )
      unreadMessages.forEach((m) => markAsRead(m.id))
    }
  }, [messages, currentConversation, user])
  
  const handleSendMessage = async (content: string) => {
    if (currentConversation) {
      await sendMessage(currentConversation.id, content)
    }
  }
  
  const handleCreateConversation = async (data: any) => {
    try {
      const conversationId = await createConversation(data)
      const newConversation = conversations.find((c) => c.id === conversationId)
      if (newConversation) {
        setCurrentConversation(newConversation)
      }
    } catch (error) {
      // Error handled by store
    }
  }
  
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      conv.title?.toLowerCase().includes(searchLower) ||
      conv.participant_names?.some((name) => name.toLowerCase().includes(searchLower)) ||
      conv.last_message_preview?.toLowerCase().includes(searchLower)
    )
  })
  
  // Group messages by sender for avatar display
  const groupedMessages = messages.reduce((groups: MessageWithDetails[][], message, index) => {
    if (index === 0 || messages[index - 1].sender_id !== message.sender_id) {
      groups.push([message])
    } else {
      groups[groups.length - 1].push(message)
    }
    return groups
  }, [])
  
  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="flex h-full">
        {/* Conversations sidebar */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r bg-white dark:bg-gray-900 flex flex-col",
          mobileView === 'chat' && "hidden md:flex"
        )}>
          {/* Sidebar header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t('messages.inbox')}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewConversation(true)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4">
                <Loading />
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={currentConversation?.id === conversation.id}
                  onClick={() => setCurrentConversation(conversation)}
                />
              ))
            ) : (
              <EmptyState
                icon={<MessageSquare className="h-12 w-12" />}
                title={searchQuery ? t('common.noResults') : t('messages.noMessages')}
                description={searchQuery ? "Try a different search" : "Start a conversation"}
                action={
                  !searchQuery && (
                    <Button onClick={() => setShowNewConversation(true)}>
                      {t('messages.newMessage')}
                    </Button>
                  )
                }
              />
            )}
          </div>
        </div>
        
        {/* Message area */}
        <div className={cn(
          "flex-1 flex flex-col bg-gray-50 dark:bg-gray-950",
          mobileView === 'list' && "hidden md:flex"
        )}>
          {currentConversation ? (
            <>
              {/* Chat header */}
              <div className="bg-white dark:bg-gray-900 border-b p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden"
                      onClick={() => setMobileView('list')}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                      <h3 className="font-semibold">
                        {currentConversation.title || currentConversation.participant_names?.join(', ') || 'Conversation'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentConversation.participant_count} participants
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Info className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center">
                    <Loading />
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {groupedMessages.map((group, groupIndex) => (
                      <div key={groupIndex}>
                        {group.map((message, messageIndex) => (
                          <MessageItem
                            key={message.id}
                            message={message}
                            isOwn={message.sender_id === user?.id}
                            showAvatar={messageIndex === 0}
                            onEdit={() => console.log('Edit message')}
                            onDelete={() => console.log('Delete message')}
                            onReply={() => console.log('Reply to message')}
                          />
                        ))}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>
              
              {/* Compose message */}
              <ComposeMessage onSend={handleSendMessage} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <EmptyState
                icon={<MessageSquare className="h-16 w-16" />}
                title="Select a conversation"
                description="Choose a conversation from the list or start a new one"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* New conversation modal */}
      <NewConversationModal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onCreate={handleCreateConversation}
      />
    </div>
  )
}
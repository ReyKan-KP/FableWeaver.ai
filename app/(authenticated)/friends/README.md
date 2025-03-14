# TaleTethers Feature

This directory contains the implementation of the TaleTethers feature for FableWeaver.ai, a social connection system that allows users to connect with fellow storytellers and readers.

## Features

- **Storyteller Discovery**: Browse and search for other users on the platform
- **Tether Requests**: Send, accept, and reject connection requests
- **Tether Management**: View your connections list, remove connections, and see their online status
- **Real-time Status**: See which connections are currently active
- **Real-time Chat**: Message your connections with a beautiful, responsive chat interface
- **Unread Message Indicators**: See when you have unread messages from connections
- **Notifications**: Get notified when you receive tether requests, when your requests are accepted, or when you receive new messages

## Components

- `page.tsx`: Main page component with tabs for "My Tethers" and "Discover Storytellers"
- `_components/friends-list.tsx`: Component for managing existing connections, tether requests, and initiating chats
- `_components/user-list.tsx`: Component for discovering and adding new connections
- `_components/friend-chat.tsx`: Real-time chat interface for messaging connections

## Database Structure

The feature uses the following Supabase tables:

### Friendships Table

```sql
CREATE TABLE IF NOT EXISTS "friendships" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  "friend_id" UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  "status" TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ
);
```

### Friend Messages Table

```sql
CREATE TABLE IF NOT EXISTS "friend_messages" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sender_id" UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  "receiver_id" UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Notifications Table

```sql
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Tether States

- **None**: No connection exists between users
- **Pending Sent**: User has sent a tether request that is awaiting response
- **Pending Received**: User has received a tether request that they can accept or reject
- **Tethered**: Users are connected

## Chat Features

- **Real-time Messaging**: Messages appear instantly using Supabase's realtime functionality
- **Read Status**: Track whether messages have been read
- **Unread Indicators**: Show unread message count on the friend's avatar
- **Typing Indicators**: Show when a message is being sent
- **Message History**: Load and display previous messages
- **Responsive Design**: Works on all device sizes with beautiful animations

## Usage

1. Navigate to the TaleTethers page
2. Use the "Discover Storytellers" tab to find and add new connections
3. Use the "My Tethers" tab to manage your existing connections and tether requests
4. Accept or reject incoming tether requests in the "Incoming" tab
5. Track your sent tether requests in the "Outgoing" tab
6. Click on the message icon next to a connection to start chatting
7. Send messages in real-time and see when they've been read

## Future Enhancements

- Storyteller suggestions based on common interests
- Connection activity feed
- Group creation with connections
- Connection tagging and categorization
- Connection privacy settings
- Media sharing in chats (images, files)
- Voice and video calls 
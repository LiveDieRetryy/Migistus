# Followers System - Complete Guide

## Overview
The MIGISTUS platform now has a complete followers system with three guild feed types and post visibility controls.

## Features Implemented

### 1. **Followers System**
- ✅ Follow/Unfollow functionality with real-time updates
- ✅ Follower counts synced to database (`users.json`)
- ✅ Follower data stored in `followers.json`
- ✅ Real-time follower/following count updates
- ✅ Activity tracking for follows/unfollows
- ✅ Live UI updates when follow status changes

### 2. **Three Guild Feed Types**

#### 👥 Personal Guild
- **Shows**: Posts from you and people you follow
- **Visibility**: Public posts + Followers-only posts (from people you follow)
- **Use Case**: Stay connected with your network
- **Counter**: Displays number of people you're following

#### 🌍 Local Guild
- **Shows**: Posts from members in your country
- **Visibility**: Public posts only from users in the same country
- **Use Case**: Connect with your local community
- **Fallback**: If no country set, falls back to Personal Guild

#### 🌐 Worldwide Guild
- **Shows**: All public posts from all community members
- **Visibility**: Public posts only
- **Use Case**: Discover content from the entire community
- **Default**: Shows all public community activity

### 3. **Post Visibility Options**

When creating a post, users can choose:

#### 🌍 Public
- Visible to everyone
- Appears in Worldwide Guild for all users
- Appears in Local Guild for users in same country
- Appears in Personal Guild for followers

#### 👥 Followers Only
- Only visible to your followers
- Appears in followers' Personal Guild feed
- Does NOT appear in Worldwide or Local Guild
- Good for sharing with your network

#### 🔒 Private
- Only you can see this post
- Appears only on your own profile
- Good for personal notes or drafts

### 4. **API Endpoints**

#### `GET /api/followers?userId={id}&type={followers|following}`
Returns follower/following lists and counts
```json
{
  "followers": [{ "userId": 123, "timestamp": "..." }],
  "following": [{ "userId": 456, "timestamp": "..." }],
  "followersCount": 5,
  "followingCount": 3
}
```

#### `POST /api/followers`
Follow or unfollow a user
```json
{
  "followerId": 1,
  "followingId": 2,
  "action": "follow" // or "unfollow"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully followed user",
  "followerCount": 6,
  "followingCount": 4
}
```

## Database Schema

### `public/data/followers.json`
```json
{
  "follows": [
    {
      "followerId": 1,
      "followingId": 2,
      "timestamp": "2025-12-07T12:00:00.000Z"
    }
  ]
}
```

### `public/data/users.json`
Updated fields:
```json
{
  "users": [
    {
      "id": 1,
      "username": "Admin",
      "followers": 5,    // Auto-updated when someone follows/unfollows
      "following": 3,    // Auto-updated when user follows/unfollows
      "country": "United States",  // Used for Local Guild filtering
      "updatedAt": "2025-12-07T12:00:00.000Z"
    }
  ]
}
```

## Component Integration

### FollowButton Component
- Located: `src/components/FollowButton.tsx`
- Features:
  - Real-time follow/unfollow
  - Live follower count updates
  - Activity tracking
  - API sync on every action
  - Custom events for UI updates

### CreatePost Component
- Located: `src/components/social/CreatePost.tsx`
- Features:
  - Visibility selector (Public/Followers/Private)
  - Tooltip explaining each visibility option
  - Character counter (1000 char limit)
  - Image uploads
  - Emoji picker

### Community Feed
- Located: `src/pages/community/index.tsx`
- Features:
  - Three guild filter buttons
  - Real-time post feed
  - Visibility-based filtering
  - Live updates on new posts/follows
  - Smart fallbacks for empty feeds

## User Flow Examples

### Example 1: User A Follows User B
1. User A clicks "Follow" button on User B's profile
2. `UserStorage.followUser()` is called
3. Follow data saved to localStorage
4. API call to `/api/followers` with `action: "follow"`
5. Server updates `followers.json` and `users.json`
6. User B's follower count increases
7. User A's following count increases
8. Real-time event `followerUpdate` fired
9. UI updates across all open windows

### Example 2: Viewing Personal Guild Feed
1. User is on Community page with "Personal Guild" selected
2. System fetches user's following list
3. Gets posts from followed users (visibility: public OR followers)
4. Gets own posts (all visibilities)
5. Filters out posts marked as "private" from others
6. Displays combined feed sorted by timestamp

### Example 3: Creating a Followers-Only Post
1. User creates post on profile
2. Selects "👥 Followers Only" from visibility dropdown
3. Posts with `visibility: "followers"`
4. Post appears in:
   - Own profile (all visibility levels)
   - Followers' Personal Guild feeds
5. Post does NOT appear in:
   - Worldwide Guild
   - Local Guild
   - Non-followers' feeds

## Real-Time Updates

The system uses custom events for real-time updates:

### `followerUpdate`
Fired when someone follows/unfollows
```javascript
window.dispatchEvent(new CustomEvent('followerUpdate', {
  detail: { 
    followerId: 1,
    followingId: 2,
    action: 'follow'
  }
}));
```

### `newSocialPost`
Fired when a new post is created
```javascript
window.dispatchEvent(new CustomEvent('newSocialPost', { 
  detail: newPost 
}));
```

## Testing Guide

### Test Follow/Unfollow
1. Create two user accounts
2. Login as User A
3. Go to Community → Guild Mates
4. Find User B and click "View Profile"
5. Click "Follow" button
6. Check User B's follower count increases
7. Check User A's following count increases
8. Open another browser/window as User B
9. See follower count updated in real-time

### Test Feed Filtering

#### Personal Guild
1. Login as User A
2. Follow User B
3. User B creates a "Followers Only" post
4. Go to Community → Personal Guild
5. See User B's post in feed
6. Switch to Worldwide Guild
7. Post should NOT appear (followers-only)

#### Local Guild
1. Set country to "United States" for User A
2. Set country to "United States" for User B
3. User B creates public post
4. Go to Community → Local Guild
5. See User B's post
6. Change User A's country to "Canada"
7. Refresh - User B's post should disappear

#### Worldwide Guild
1. Go to Community → Worldwide Guild
2. See all public posts from all users
3. Should NOT see followers-only or private posts
4. Should see posts from users you don't follow

## Troubleshooting

### Follower counts not updating
- Check browser console for API errors
- Verify `followers.json` file exists and is writable
- Check `users.json` is being updated
- Ensure server has file write permissions

### Posts not appearing in feed
- Check post visibility setting
- Verify user is following the poster (for followers-only posts)
- Check guild filter selection
- Verify user's country matches (for Local Guild)

### Follow button not working
- Check network tab for API errors
- Verify `followUser()` is calling the API
- Check localStorage for `migistus_follows`
- Ensure both users exist in database

## Future Enhancements

Potential additions:
- [ ] Push notifications for new followers
- [ ] Suggested users to follow (based on interests)
- [ ] Mutual followers indicator
- [ ] Follow requests for private profiles
- [ ] Block/mute functionality
- [ ] Follower analytics dashboard
- [ ] Export follower list
- [ ] Bulk follow/unfollow management

## Production Considerations

### Performance
- Follower lists cached in localStorage
- API syncs in background (async)
- Database writes are atomic
- Real-time events throttled to prevent spam

### Security
- Can't follow yourself
- Session-based authentication required
- Follower data validated on server
- User IDs verified before database updates

### Scalability
- Current: File-based storage (JSON)
- Future: Consider database migration for 10,000+ users
- Implement pagination for follower lists
- Add caching layer for frequently accessed data

## Quick Reference

| Feature | Location | Status |
|---------|----------|--------|
| Follow Button | `src/components/FollowButton.tsx` | ✅ Complete |
| Followers API | `src/pages/api/followers/index.ts` | ✅ Complete |
| Feed Filtering | `src/pages/community/index.tsx` | ✅ Complete |
| Post Visibility | `src/components/social/CreatePost.tsx` | ✅ Complete |
| User Storage | `src/utils/userStorage.ts` | ✅ Complete |
| Database Sync | Automatic on follow/unfollow | ✅ Complete |

---

**Last Updated**: December 7, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅

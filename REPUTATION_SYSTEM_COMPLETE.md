# Reputation System - COMPLETE ✅

## Overview
Implemented a comprehensive reputation system where all users start at 0 reputation and earn +1 reputation for each social interaction.

---

## Changes Made

### 1. **Reputation Storage** (`userStorage.ts`)

#### Before (Calculated System):
```typescript
static getUserReputation(userId: number): number {
  const key = `${this.getUserPrefix(userId)}reputation`;
  const data = localStorage.getItem(key);
  if (data) return parseInt(data);
  
  // Calculate based on activity
  const pledges = this.getUserPledges(userId);
  const votes = this.getUserVotes(userId);
  const completedPledges = pledges.filter((p: any) => p.status === 'completed').length;
  
  return Math.min(200, (completedPledges * 10) + (votes.length * 2) + 25); // ❌ Complex formula
}
```

#### After (Simple +1 System):
```typescript
static getUserReputation(userId: number): number {
  const key = `${this.getUserPrefix(userId)}reputation`;
  const data = localStorage.getItem(key);
  
  // If no data exists, initialize with 0 and save it
  if (!data) {
    localStorage.setItem(key, '0');
    return 0;
  }
  
  return parseInt(data);
}

static incrementReputation(userId: number, amount: number = 1): void {
  const current = this.getUserReputation(userId);
  const key = `${this.getUserPrefix(userId)}reputation`;
  localStorage.setItem(key, String(current + amount));
}

static decrementReputation(userId: number, amount: number = 1): void {
  const current = this.getUserReputation(userId);
  const key = `${this.getUserPrefix(userId)}reputation`;
  localStorage.setItem(key, String(Math.max(0, current - amount)));
}
```

---

### 2. **Social Interactions** (`socialPostsStorage.ts`)

#### Likes (Post Owner Gets +1 Rep)
```typescript
static likePost(postId: number, userId: number): boolean {
  // ... existing code ...
  
  if (isLiked) {
    // Unlike
    post.likedBy = post.likedBy.filter(id => id !== userId);
    post.likes = Math.max(0, post.likes - 1);
    // Decrement reputation when unliked (-1 rep)
    UserStorage.decrementReputation(post.userId, 1);
  } else {
    // Like
    post.likedBy.push(userId);
    post.likes += 1;
    this.addPostActivity(userId, `Liked ${post.username}'s post`, postId);
    // Increment reputation when liked (+1 rep)
    UserStorage.incrementReputation(post.userId, 1);
  }
}
```

#### Comments (Post Owner Gets +1 Rep)
```typescript
static addComment(postId: number, comment: Omit<PostComment, 'id' | 'timestamp' | 'likes' | 'likedBy' | 'replies'>): boolean {
  // ... existing code ...
  
  allPosts[postIndex].commentsList.push(newComment);
  allPosts[postIndex].comments = allPosts[postIndex].commentsList.length;
  
  localStorage.setItem(this.POSTS_KEY, JSON.stringify(allPosts));
  this.addPostActivity(comment.userId, `Commented on ${allPosts[postIndex].username}'s post`, postId);
  
  // Increment reputation of post owner when someone comments (+1 rep)
  UserStorage.incrementReputation(allPosts[postIndex].userId, 1);
}
```

#### Shares (Post Owner Gets +1 Rep)
```typescript
static sharePost(postId: number, userId: number): boolean {
  // ... existing code ...
  
  if (!post.sharedBy.includes(userId)) {
    post.sharedBy.push(userId);
    post.shares += 1;
    localStorage.setItem(this.POSTS_KEY, JSON.stringify(allPosts));
    this.addPostActivity(userId, `Shared ${post.username}'s post`, postId);
    
    // Increment reputation of post owner when someone shares (+1 rep)
    UserStorage.incrementReputation(post.userId, 1);
  }
}
```

---

### 3. **Follow System** (`userStorage.ts`)

#### Follow (Person Being Followed Gets +1 Rep)
```typescript
static followUser(followerId: number, followingId: number): boolean {
  // ... existing code ...
  
  // Track activity for the person being followed
  this.addUserActivity(followingId, {
    type: 'social', 
    action: `${followerName} started following you`,
    targetUserId: followerId,
    description: `${followerName} is now following you`
  });
  
  // Increment reputation of the person being followed (+1 rep per follower)
  this.incrementReputation(followingId, 1);
}
```

#### Unfollow (Person Being Unfollowed Loses -1 Rep)
```typescript
static unfollowUser(followerId: number, followingId: number): boolean {
  // ... existing code ...
  
  // Track activity for the person being unfollowed
  this.addUserActivity(followingId, {
    type: 'social',
    action: `${followerName} unfollowed you`,
    targetUserId: followerId,
    description: `${followerName} unfollowed you`
  });
  
  // Decrement reputation of the person being unfollowed (-1 rep per lost follower)
  this.decrementReputation(followingId, 1);
}
```

---

## Reputation Point System

| Action | Reputation Change | Who Receives |
|--------|-------------------|--------------|
| Someone likes your post | **+1** | Post Owner |
| Someone unlikes your post | **-1** | Post Owner |
| Someone comments on your post | **+1** | Post Owner |
| Someone shares your post | **+1** | Post Owner |
| Someone follows you | **+1** | User Being Followed |
| Someone unfollows you | **-1** | User Being Unfollowed |

---

## How It Works

### Starting Fresh
- All new users start at **0 reputation**
- No base points, no complex formulas
- Pure social interaction-based system

### Earning Reputation
1. **Create engaging posts** → Get likes, comments, shares
2. **Build your following** → Each follower = +1 rep
3. **Stay active** → More content = more opportunities

### Reputation Display
- Profile page shows live reputation count
- Updates every 10 seconds automatically
- Displayed in profile stats badge: "🔥 [X] reputation"

### Example Growth
```
New user joins: 0 rep
First post gets 5 likes: 5 rep
Post gets 2 comments: 7 rep
Post gets 1 share: 8 rep
Gains 3 followers: 11 rep
Loses 1 follower: 10 rep
```

---

## Storage Location

Reputation is stored in localStorage:
- **Key**: `user_[userId]_reputation`
- **Value**: Integer (0, 1, 2, 3, ...)
- **Persistence**: Survives page reloads and sessions

---

## Benefits

✅ **Simple & Fair**: +1 per interaction, easy to understand  
✅ **Engagement Driven**: Rewards active community participation  
✅ **Real-time Updates**: Instant feedback on social actions  
✅ **Transparent**: Users can see exactly how they earn reputation  
✅ **Gamified**: Encourages quality content and community building  

---

## Integration Points

### Files Modified:
1. `src/utils/userStorage.ts`
   - `getUserReputation()` - Returns stored reputation
   - `incrementReputation()` - Adds reputation
   - `decrementReputation()` - Removes reputation (min: 0)
   - `followUser()` - Awards +1 rep to person being followed
   - `unfollowUser()` - Removes -1 rep from person being unfollowed

2. `src/utils/socialPostsStorage.ts`
   - `likePost()` - Awards +1 rep to post owner
   - `addComment()` - Awards +1 rep to post owner
   - `sharePost()` - Awards +1 rep to post owner

### Display Locations:
- Profile page: Banner stats badge
- Profile page: Live stats bar
- Profile page: Sidebar stats
- Community pages: Member cards

---

## Future Enhancements (Optional)

1. **Reputation Tiers**:
   - 0-10: Newcomer
   - 11-50: Active Member
   - 51-100: Veteran
   - 101-250: Elite
   - 251+: Legend

2. **Reputation Bonuses**:
   - Quality content multipliers
   - Streak bonuses for daily activity
   - Special badges at milestones

3. **Reputation Requirements**:
   - Minimum rep to create polls
   - Minimum rep to moderate
   - Unlock features at thresholds

---

**Status**: ✅ COMPLETE - All reputation tracking implemented and tested  
**Date**: December 7, 2025  
**Version**: 1.0.0

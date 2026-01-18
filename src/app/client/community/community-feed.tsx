"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Trash2,
  Send,
  User,
  Plus,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  ThumbsUp,
  Pin,
  Image as ImageIcon,
  Video,
  Clock,
  X,
  Smile,
  Paperclip,
  Link2,
  Play
} from "lucide-react";

interface Author {
  id: string;
  name: string | null;
  role: string;
}

interface CommentLike {
  id: string;
  userId: string;
}

interface Comment {
  id: string;
  content: string;
  gifUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  videoUrl?: string | null;
  linkUrl?: string | null;
  createdAt: string;
  author: Author;
  likes?: CommentLike[];
  _count?: { likes: number };
  parentId?: string | null;
  replies?: Comment[];
}

interface PostLike {
  id: string;
  userId: string;
}

interface LinkedEvent {
  id: string;
  title: string;
  startDate: string;
  location: string | null;
  maxAttendees: number | null;
  _count: { registrations: number };
}

interface Post {
  id: string;
  title: string | null;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isPinned?: boolean;
  createdAt: string;
  author: Author;
  comments: Comment[];
  likes?: PostLike[];
  _count: { comments: number; likes?: number };
  event?: LinkedEvent | null;
}

interface CommunityOption {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

interface CommunityFeedProps {
  initialPosts: Post[];
  currentUserId: string;
  canCreatePosts?: boolean;
  communities?: CommunityOption[];
}

export function CommunityFeed({ initialPosts, currentUserId, canCreatePosts = false, communities = [] }: CommunityFeedProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", imageUrl: "", videoUrl: "", communityId: "" });

  // Get the default community for pre-selection
  const defaultCommunity = communities.find(c => c.isDefault);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(defaultCommunity?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [likingPost, setLikingPost] = useState<string | null>(null);
  const [likingComment, setLikingComment] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [commentGifUrl, setCommentGifUrl] = useState<Record<string, string>>({});
  const [commentAttachment, setCommentAttachment] = useState<Record<string, { url: string; name: string; type: string }>>({});
  const [commentVideoUrl, setCommentVideoUrl] = useState<Record<string, string>>({});
  const [commentLinkUrl, setCommentLinkUrl] = useState<Record<string, string>>({});
  const [showGifSearch, setShowGifSearch] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showVideoInput, setShowVideoInput] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [gifResults, setGifResults] = useState<Array<{ id: string; url: string; preview: string }>>([]);
  const [searchingGifs, setSearchingGifs] = useState(false);

  // Common emojis for quick access
  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊",
    "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😎",
    "🤔", "🤗", "🤩", "🥳", "😤", "😭", "😱", "🙄",
    "👍", "👎", "👏", "🙌", "💪", "🔥", "❤️", "💯",
    "✅", "⭐", "🎉", "🎊", "💪", "🏋️", "🏃", "💪"
  ];

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPost,
          imageUrl: newPost.imageUrl || undefined,
          videoUrl: newPost.videoUrl || undefined,
          communityId: selectedCommunityId || undefined,
        }),
      });

      if (res.ok) {
        setNewPost({ title: "", content: "", imageUrl: "", videoUrl: "", communityId: "" });
        setShowNewPost(false);
        setSelectedCommunityId(defaultCommunity?.id || "");
        router.refresh();
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Weet je zeker dat je deze post wilt verwijderen?")) return;

    try {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
      }
    } catch {
      alert("Er ging iets mis");
    }
  };

  const handleToggleLike = async (postId: string) => {
    setLikingPost(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes: data.liked
                ? [...(p.likes || []), { id: 'temp', userId: currentUserId }]
                : (p.likes || []).filter(l => l.userId !== currentUserId),
              _count: {
                ...p._count,
                likes: data.likeCount
              }
            };
          }
          return p;
        }));
      }
    } catch {
      console.error("Error toggling like");
    } finally {
      setLikingPost(null);
    }
  };

  const handleToggleCommentLike = async (postId: string, commentId: string) => {
    setLikingComment(commentId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments/${commentId}/like`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();

        // Update posts state with the new like status
        setPosts(posts.map(p => {
          if (p.id !== postId) return p;

          return {
            ...p,
            comments: p.comments.map(c => {
              // Check if this is the comment or if it's in replies
              if (c.id === commentId) {
                return {
                  ...c,
                  likes: data.liked
                    ? [...(c.likes || []), { id: 'temp', userId: currentUserId }]
                    : (c.likes || []).filter(l => l.userId !== currentUserId),
                  _count: { ...c._count, likes: data.likeCount }
                };
              }

              // Check replies
              if (c.replies) {
                return {
                  ...c,
                  replies: c.replies.map(r => {
                    if (r.id === commentId) {
                      return {
                        ...r,
                        likes: data.liked
                          ? [...(r.likes || []), { id: 'temp', userId: currentUserId }]
                          : (r.likes || []).filter(l => l.userId !== currentUserId),
                        _count: { ...r._count, likes: data.likeCount }
                      };
                    }
                    return r;
                  })
                };
              }

              return c;
            })
          };
        }));
      }
    } catch {
      console.error("Error toggling comment like");
    } finally {
      setLikingComment(null);
    }
  };

  const handleAddComment = async (postId: string, parentId?: string) => {
    const content = parentId
      ? replyText[parentId]?.trim()
      : commentText[postId]?.trim();

    const gifUrl = commentGifUrl[postId];
    const attachment = commentAttachment[postId];
    const videoUrl = commentVideoUrl[postId];
    const linkUrl = commentLinkUrl[postId];

    // Need at least content or one media type
    if (!content && !gifUrl && !attachment && !videoUrl) return;

    setSubmittingComment(parentId || postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content || "",
          parentId,
          gifUrl: gifUrl || undefined,
          attachmentUrl: attachment?.url || undefined,
          attachmentName: attachment?.name || undefined,
          attachmentType: attachment?.type || undefined,
          videoUrl: videoUrl || undefined,
          linkUrl: linkUrl || undefined,
        }),
      });

      if (res.ok) {
        const newComment = await res.json();

        // Update posts state with the new comment
        setPosts(posts.map(p => {
          if (p.id !== postId) return p;

          if (parentId) {
            // Add reply to parent comment
            return {
              ...p,
              comments: p.comments.map(c => {
                if (c.id === parentId) {
                  return {
                    ...c,
                    replies: [...(c.replies || []), {
                      id: newComment.id,
                      content: newComment.content,
                      gifUrl: newComment.gifUrl,
                      attachmentUrl: newComment.attachmentUrl,
                      attachmentName: newComment.attachmentName,
                      attachmentType: newComment.attachmentType,
                      videoUrl: newComment.videoUrl,
                      linkUrl: newComment.linkUrl,
                      createdAt: newComment.createdAt,
                      author: newComment.author,
                      likes: [],
                      _count: { likes: 0 },
                      parentId: parentId,
                    }]
                  };
                }
                return c;
              }),
              _count: { ...p._count, comments: p._count.comments + 1 }
            };
          } else {
            // Add new top-level comment
            return {
              ...p,
              comments: [...p.comments, {
                id: newComment.id,
                content: newComment.content,
                gifUrl: newComment.gifUrl,
                attachmentUrl: newComment.attachmentUrl,
                      attachmentName: newComment.attachmentName,
                      attachmentType: newComment.attachmentType,
                videoUrl: newComment.videoUrl,
                linkUrl: newComment.linkUrl,
                createdAt: newComment.createdAt,
                author: newComment.author,
                likes: [],
                _count: { likes: 0 },
                parentId: null,
                replies: []
              }],
              _count: { ...p._count, comments: p._count.comments + 1 }
            };
          }
        }));

        // Clear all inputs for this post
        if (parentId) {
          setReplyText({ ...replyText, [parentId]: "" });
          setReplyingTo(null);
        } else {
          setCommentText({ ...commentText, [postId]: "" });
          setCommentGifUrl({ ...commentGifUrl, [postId]: "" });
          const newAttachments = { ...commentAttachment };
          delete newAttachments[postId];
          setCommentAttachment(newAttachments);
          setCommentVideoUrl({ ...commentVideoUrl, [postId]: "" });
          setCommentLinkUrl({ ...commentLinkUrl, [postId]: "" });
        }
      } else {
        const error = await res.json();
        alert(error.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setSubmittingComment(null);
    }
  };

  const insertEmoji = (postId: string, emoji: string) => {
    setCommentText({ ...commentText, [postId]: (commentText[postId] || "") + emoji });
    setShowEmojiPicker(null);
  };

  const closeAllPanels = (exceptPanel?: string) => {
    if (exceptPanel !== 'gif') setShowGifSearch(null);
    if (exceptPanel !== 'emoji') setShowEmojiPicker(null);
    if (exceptPanel !== 'video') setShowVideoInput(null);
    if (exceptPanel !== 'link') setShowLinkInput(null);
  };

  const handleFileUpload = async (postId: string, file: File) => {
    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert("Bestand is te groot. Maximum is 2MB.");
      return;
    }

    setUploadingFile(postId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCommentAttachment({
          ...commentAttachment,
          [postId]: { url: data.url, name: data.fileName, type: data.fileType }
        });
      } else {
        const error = await res.json();
        alert(error.error || "Upload mislukt");
      }
    } catch {
      alert("Upload mislukt");
    } finally {
      setUploadingFile(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.includes("word") || mimeType.includes("document")) return "doc";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "xls";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "ppt";
    return "file";
  };

  const isImageType = (mimeType: string | null | undefined) => {
    return mimeType?.startsWith("image/") ?? false;
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      setGifResults([]);
      return;
    }
    setSearchingGifs(true);
    try {
      // Using Tenor API (free tier)
      const res = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=AIzaSyDhTLR9x3HB9R2gf0xIBqDEVD1V1r8VG-Y&limit=12&media_filter=gif`
      );
      if (res.ok) {
        const data = await res.json();
        setGifResults(
          data.results?.map((r: { id: string; media_formats: { gif: { url: string }; tinygif: { url: string } } }) => ({
            id: r.id,
            url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url,
            preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url,
          })) || []
        );
      }
    } catch {
      console.error("Error searching GIFs");
    } finally {
      setSearchingGifs(false);
    }
  };

  const selectGif = (postOrCommentId: string, gifUrl: string) => {
    setCommentGifUrl({ ...commentGifUrl, [postOrCommentId]: gifUrl });
    setShowGifSearch(null);
    setGifSearchQuery("");
    setGifResults([]);
  };

  const handleTogglePin = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/pin`, {
        method: "POST",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch {
      alert("Er ging iets mis");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Zojuist";
    if (diffMins < 60) return `${diffMins} min geleden`;
    if (diffHours < 24) return `${diffHours} uur geleden`;
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  };

  const getRoleBadge = (role: string) => {
    if (role === "INSTRUCTOR") {
      return <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Instructeur</span>;
    }
    if (role === "SUPER_ADMIN") {
      return <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Admin</span>;
    }
    return null;
  };

  const isLikedByUser = (post: Post) => {
    return post.likes?.some(l => l.userId === currentUserId) ?? false;
  };

  const isCommentLikedByUser = (comment: Comment) => {
    return comment.likes?.some(l => l.userId === currentUserId) ?? false;
  };

  // Sort posts: pinned first, then by date
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const renderComment = (comment: Comment, postId: string, isReply = false) => (
    <div key={comment.id} className={`flex gap-2 ${isReply ? 'ml-10' : ''}`}>
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author.name}</span>
            {getRoleBadge(comment.author.role)}
            <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
          </div>
          {comment.content && <p className="text-sm text-gray-700 mt-1">{comment.content}</p>}
          {comment.gifUrl && (
            <img src={comment.gifUrl} alt="GIF" className="mt-2 rounded max-w-[200px]" />
          )}
          {comment.attachmentUrl && (
            isImageType(comment.attachmentType) ? (
              <img src={comment.attachmentUrl} alt={comment.attachmentName || "Afbeelding"} className="mt-2 rounded max-w-[300px]" />
            ) : (
              <a
                href={comment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200 max-w-fit"
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-blue-600 hover:underline">{comment.attachmentName || "Bijlage"}</span>
              </a>
            )
          )}
          {comment.videoUrl && (
            <div className="mt-2">
              {comment.videoUrl.includes('youtube.com') || comment.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={comment.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full max-w-[400px] aspect-video rounded"
                  allowFullScreen
                />
              ) : comment.videoUrl.includes('loom.com') ? (
                <iframe
                  src={comment.videoUrl.replace('share/', 'embed/')}
                  className="w-full max-w-[400px] aspect-video rounded"
                  allowFullScreen
                />
              ) : (
                <video src={comment.videoUrl} controls className="max-w-[400px] rounded" />
              )}
            </div>
          )}
          {comment.linkUrl && (
            <a
              href={comment.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <Link2 className="w-3 h-3" />
              {comment.linkUrl}
            </a>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 ml-2">
          <button
            onClick={() => handleToggleCommentLike(postId, comment.id)}
            disabled={likingComment === comment.id}
            className={`text-xs flex items-center gap-1 ${
              isCommentLikedByUser(comment) ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${isCommentLikedByUser(comment) ? 'fill-current' : ''}`} />
            {comment._count?.likes || 0}
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs text-gray-500 hover:text-blue-500"
            >
              Reageren
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="flex gap-2 mt-2 ml-2">
            <Input
              placeholder="Schrijf een reactie..."
              value={replyText[comment.id] || ""}
              onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment(postId, comment.id);
                }
              }}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={() => handleAddComment(postId, comment.id)}
              disabled={submittingComment === comment.id}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map(reply => renderComment(reply, postId, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* New Post Button/Form - Only shown if canCreatePosts is true */}
      {canCreatePosts && (
        <>
          {!showNewPost ? (
            <Button onClick={() => setShowNewPost(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe post
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Titel van je post"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Wat wil je delen met je klanten?"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={4}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <ImageIcon className="w-3 h-3" /> Afbeelding URL (optioneel)
                      </label>
                      <Input
                        placeholder="https://..."
                        value={newPost.imageUrl}
                        onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <Video className="w-3 h-3" /> Video URL (optioneel)
                      </label>
                      <Input
                        placeholder="https://youtube.com/..."
                        value={newPost.videoUrl}
                        onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                      />
                    </div>
                  </div>
                  {/* Community Selector - only show if there are multiple communities */}
                  {communities.length > 1 && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Plaatsen in community
                      </label>
                      <Select
                        value={selectedCommunityId}
                        onValueChange={setSelectedCommunityId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer community" />
                        </SelectTrigger>
                        <SelectContent>
                          {communities.map((community) => (
                            <SelectItem key={community.id} value={community.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: community.color }}
                                />
                                {community.name}
                                {community.isDefault && (
                                  <span className="text-xs text-gray-400">(Alle klanten)</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400 mt-1">
                        {communities.find(c => c.id === selectedCommunityId)?.isDefault
                          ? "Alle klanten kunnen deze post zien"
                          : "Alleen leden van deze community kunnen deze post zien"}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleCreatePost} disabled={submitting}>
                      {submitting ? "Posten..." : "Plaatsen"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewPost(false);
                        setNewPost({ title: "", content: "", imageUrl: "", videoUrl: "", communityId: "" });
                        setSelectedCommunityId(defaultCommunity?.id || "");
                      }}
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Posts List */}
      {sortedPosts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nog geen posts in de community.</p>
            {!canCreatePosts && (
              <p className="text-sm">Je instructeur zal hier updates delen.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        sortedPosts.map((post) => (
          <Card key={post.id} className={post.isPinned ? 'border-blue-200 bg-blue-50/30' : ''}>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{post.author.name}</span>
                      {getRoleBadge(post.author.role)}
                      {post.isPinned && (
                        <Badge variant="secondary" className="text-xs">
                          <Pin className="w-3 h-3 mr-1" />
                          Vastgepind
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                {post.author.id === currentUserId && canCreatePosts && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePin(post.id)}
                      className="text-gray-400 hover:text-blue-600"
                      title={post.isPinned ? "Losmaken" : "Vastpinnen"}
                    >
                      <Pin className={`w-4 h-4 ${post.isPinned ? 'fill-blue-600 text-blue-600' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {post.title && <h3 className="font-semibold mb-2">{post.title}</h3>}
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{post.content}</p>

              {/* Post Image */}
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Post afbeelding"
                  className="mt-3 rounded-lg max-h-96 w-full object-cover"
                />
              )}

              {/* Post Video */}
              {post.videoUrl && (
                <div className="mt-3">
                  {post.videoUrl.includes('youtube.com') || post.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={post.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full aspect-video rounded-lg"
                      allowFullScreen
                    />
                  ) : (
                    <video src={post.videoUrl} controls className="w-full rounded-lg" />
                  )}
                </div>
              )}

              {/* Linked Event Card */}
              {post.event && (
                <Link href={`/client/events`}>
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Badge className="bg-blue-100 text-blue-700 mb-2">
                          <Calendar className="w-3 h-3 mr-1" />
                          Event
                        </Badge>
                        <h4 className="font-semibold text-gray-900">{post.event.title}</h4>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.event.startDate).toLocaleDateString("nl-NL", {
                              weekday: "short",
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {post.event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {post.event.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {post.event._count.registrations}
                            {post.event.maxAttendees && ` / ${post.event.maxAttendees}`} aanmeldingen
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" className="shrink-0">
                        Bekijken
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Link>
              )}

              {/* Like and Comment buttons */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                <button
                  onClick={() => handleToggleLike(post.id)}
                  disabled={likingPost === post.id}
                  className={`flex items-center gap-1 text-sm ${
                    isLikedByUser(post) ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                  }`}
                >
                  <ThumbsUp className={`w-5 h-5 ${isLikedByUser(post) ? 'fill-current' : ''}`} />
                  <span>{post._count.likes || 0}</span>
                </button>
                <button
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{post._count.comments} {post._count.comments === 1 ? "reactie" : "reacties"}</span>
                </button>
              </div>

              {/* Comments Section */}
              {expandedPost === post.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  {post.comments
                    .filter(c => !c.parentId)
                    .map((comment) => renderComment(comment, post.id))}

                  {/* Add comment with rich media toolbar */}
                  <div className="mt-4 space-y-2">
                    {/* Media Previews */}
                    <div className="flex flex-wrap gap-2">
                      {commentGifUrl[post.id] && (
                        <div className="relative inline-block">
                          <img src={commentGifUrl[post.id]} alt="GIF" className="max-w-[120px] rounded border" />
                          <button
                            onClick={() => setCommentGifUrl({ ...commentGifUrl, [post.id]: "" })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {commentAttachment[post.id] && (
                        <div className="relative inline-block">
                          {isImageType(commentAttachment[post.id].type) ? (
                            <img src={commentAttachment[post.id].url} alt={commentAttachment[post.id].name} className="max-w-[120px] rounded border" />
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded border pr-6">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <span className="text-sm truncate max-w-[100px]">{commentAttachment[post.id].name}</span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              const newAttachments = { ...commentAttachment };
                              delete newAttachments[post.id];
                              setCommentAttachment(newAttachments);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {commentVideoUrl[post.id] && (
                        <div className="relative inline-block bg-gray-100 rounded border p-2 pr-6">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Play className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">{commentVideoUrl[post.id]}</span>
                          </div>
                          <button
                            onClick={() => setCommentVideoUrl({ ...commentVideoUrl, [post.id]: "" })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {commentLinkUrl[post.id] && (
                        <div className="relative inline-block bg-gray-100 rounded border p-2 pr-6">
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Link2 className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">{commentLinkUrl[post.id]}</span>
                          </div>
                          <button
                            onClick={() => setCommentLinkUrl({ ...commentLinkUrl, [post.id]: "" })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>


                    {/* Link URL Input Panel */}
                    {showLinkInput === post.id && (
                      <div className="p-3 bg-white rounded-lg border shadow-lg space-y-3">
                        <h4 className="font-medium">Link toevoegen</h4>
                        <Input
                          placeholder="Voer een URL in..."
                          value={commentLinkUrl[post.id] || ""}
                          onChange={(e) => setCommentLinkUrl({ ...commentLinkUrl, [post.id]: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowLinkInput(null)}>
                            Annuleren
                          </Button>
                          <Button size="sm" onClick={() => setShowLinkInput(null)} disabled={!commentLinkUrl[post.id]}>
                            Link
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Video URL Input Panel */}
                    {showVideoInput === post.id && (
                      <div className="p-3 bg-white rounded-lg border shadow-lg space-y-3">
                        <h4 className="font-medium">Video toevoegen</h4>
                        <Input
                          placeholder="YouTube, Loom, Vimeo of Wistia link..."
                          value={commentVideoUrl[post.id] || ""}
                          onChange={(e) => setCommentVideoUrl({ ...commentVideoUrl, [post.id]: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">Of sleep een video hierheen</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowVideoInput(null)}>
                            Annuleren
                          </Button>
                          <Button size="sm" onClick={() => setShowVideoInput(null)} disabled={!commentVideoUrl[post.id]}>
                            Toevoegen
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Emoji Picker Panel */}
                    {showEmojiPicker === post.id && (
                      <div className="p-3 bg-white rounded-lg border shadow-lg">
                        <div className="grid grid-cols-8 gap-1">
                          {commonEmojis.map((emoji, i) => (
                            <button
                              key={i}
                              onClick={() => insertEmoji(post.id, emoji)}
                              className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GIF Search Panel */}
                    {showGifSearch === post.id && (
                      <div className="p-3 bg-white rounded-lg border shadow-lg space-y-2">
                        <Input
                          placeholder="Zoek GIFs..."
                          value={gifSearchQuery}
                          onChange={(e) => {
                            setGifSearchQuery(e.target.value);
                            searchGifs(e.target.value);
                          }}
                          className="text-sm"
                        />
                        {searchingGifs && <p className="text-xs text-gray-500">Zoeken...</p>}
                        {gifResults.length > 0 && (
                          <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
                            {gifResults.map((gif) => (
                              <button
                                key={gif.id}
                                onClick={() => {
                                  selectGif(post.id, gif.url);
                                  setShowGifSearch(null);
                                }}
                                className="hover:opacity-75 transition-opacity"
                              >
                                <img src={gif.preview} alt="GIF" className="w-full h-20 object-cover rounded" />
                              </button>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-400">Powered by GIPHY</p>
                      </div>
                    )}

                    {/* Comment Input with Toolbar */}
                    <div className="border rounded-full flex items-center bg-gray-50 hover:bg-white focus-within:bg-white focus-within:border-gray-300 transition-colors">
                      <Input
                        placeholder="Jouw reactie"
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <div className="flex items-center gap-1 pr-2">
                        {/* File Attachment */}
                        <input
                          type="file"
                          id={`file-upload-${post.id}`}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(post.id, file);
                            }
                            e.target.value = "";
                          }}
                        />
                        <button
                          onClick={() => document.getElementById(`file-upload-${post.id}`)?.click()}
                          disabled={uploadingFile === post.id}
                          className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${uploadingFile === post.id ? 'opacity-50' : ''}`}
                          title="Bestand toevoegen (max 2MB)"
                        >
                          <Paperclip className={`w-5 h-5 text-gray-500 ${uploadingFile === post.id ? 'animate-pulse' : ''}`} />
                        </button>
                        {/* Link */}
                        <button
                          onClick={() => { closeAllPanels('link'); setShowLinkInput(showLinkInput === post.id ? null : post.id); }}
                          className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${showLinkInput === post.id ? 'bg-gray-200' : ''}`}
                          title="Link toevoegen"
                        >
                          <Link2 className="w-5 h-5 text-gray-500" />
                        </button>
                        {/* Video */}
                        <button
                          onClick={() => { closeAllPanels('video'); setShowVideoInput(showVideoInput === post.id ? null : post.id); }}
                          className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${showVideoInput === post.id ? 'bg-gray-200' : ''}`}
                          title="Video toevoegen"
                        >
                          <Play className="w-5 h-5 text-gray-500" />
                        </button>
                        {/* Emoji */}
                        <button
                          onClick={() => { closeAllPanels('emoji'); setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id); }}
                          className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${showEmojiPicker === post.id ? 'bg-gray-200' : ''}`}
                          title="Emoji toevoegen"
                        >
                          <Smile className="w-5 h-5 text-gray-500" />
                        </button>
                        {/* GIF */}
                        <button
                          onClick={() => { closeAllPanels('gif'); setShowGifSearch(showGifSearch === post.id ? null : post.id); }}
                          className={`p-2 rounded-full hover:bg-gray-200 transition-colors font-semibold text-sm ${showGifSearch === post.id ? 'bg-gray-200' : ''}`}
                          title="GIF toevoegen"
                        >
                          <span className="text-gray-500">GIF</span>
                        </button>
                        {/* Send */}
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          disabled={submittingComment === post.id || (!commentText[post.id]?.trim() && !commentGifUrl[post.id] && !commentAttachment[post.id] && !commentVideoUrl[post.id])}
                          className="rounded-full ml-1"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

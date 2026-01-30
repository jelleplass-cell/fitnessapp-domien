"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/components/media/media-picker";
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
  Heart,
  Pin,
  Image as ImageIcon,
  Video,
  X,
  Smile,
  Paperclip,
  Link2,
  Play,
  MoreHorizontal,
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

// Filter pill types
type FilterType = "all" | "pinned" | "events" | "media";

export function CommunityFeed({ initialPosts, currentUserId, canCreatePosts = false, communities = [] }: CommunityFeedProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", imageUrl: "", videoUrl: "", communityId: "" });
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

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

        setPosts(posts.map(p => {
          if (p.id !== postId) return p;

          return {
            ...p,
            comments: p.comments.map(c => {
              if (c.id === commentId) {
                return {
                  ...c,
                  likes: data.liked
                    ? [...(c.likes || []), { id: 'temp', userId: currentUserId }]
                    : (c.likes || []).filter(l => l.userId !== currentUserId),
                  _count: { ...c._count, likes: data.likeCount }
                };
              }

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

        setPosts(posts.map(p => {
          if (p.id !== postId) return p;

          if (parentId) {
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
      return (
        <span className="text-[11px] font-medium bg-[#E8F5F0] text-[#2D7A5F] px-2 py-0.5 rounded-full">
          Instructeur
        </span>
      );
    }
    if (role === "SUPER_ADMIN") {
      return (
        <span className="text-[11px] font-medium bg-[#FCE8F0] text-[#9B3A5A] px-2 py-0.5 rounded-full">
          Admin
        </span>
      );
    }
    return null;
  };

  const isLikedByUser = (post: Post) => {
    return post.likes?.some(l => l.userId === currentUserId) ?? false;
  };

  const isCommentLikedByUser = (comment: Comment) => {
    return comment.likes?.some(l => l.userId === currentUserId) ?? false;
  };

  // Sort and filter posts
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredPosts = sortedPosts.filter((post) => {
    switch (activeFilter) {
      case "pinned":
        return post.isPinned;
      case "events":
        return post.event != null;
      case "media":
        return post.imageUrl || post.videoUrl;
      default:
        return true;
    }
  });

  // Get author initials
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Get avatar color based on role
  const getAvatarStyle = (role: string) => {
    if (role === "INSTRUCTOR") return "bg-gradient-to-br from-blue-400 to-blue-600 text-white";
    if (role === "SUPER_ADMIN") return "bg-gradient-to-br from-purple-400 to-purple-600 text-white";
    return "bg-gradient-to-br from-gray-300 to-gray-400 text-white";
  };

  const renderComment = (comment: Comment, postId: string, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${getAvatarStyle(comment.author.role)}`}>
        {getInitials(comment.author.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-[#F8FAFC] rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">{comment.author.name}</span>
            {getRoleBadge(comment.author.role)}
            <span className="text-[11px] text-gray-400">{formatDate(comment.createdAt)}</span>
          </div>
          {comment.content && <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>}
          {comment.gifUrl && (
            <img src={comment.gifUrl} alt="GIF" className="mt-2 rounded-xl max-w-[200px]" />
          )}
          {comment.attachmentUrl && (
            isImageType(comment.attachmentType) ? (
              <img src={comment.attachmentUrl} alt={comment.attachmentName || "Afbeelding"} className="mt-2 rounded-xl max-w-[300px]" />
            ) : (
              <a
                href={comment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-100 hover:border-gray-200 max-w-fit"
              >
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-blue-600 hover:underline">{comment.attachmentName || "Bijlage"}</span>
              </a>
            )
          )}
          {comment.videoUrl && (
            <div className="mt-2">
              {comment.videoUrl.includes('youtube.com') || comment.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={comment.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full max-w-[400px] aspect-video rounded-xl"
                  allowFullScreen
                />
              ) : comment.videoUrl.includes('loom.com') ? (
                <iframe
                  src={comment.videoUrl.replace('share/', 'embed/')}
                  className="w-full max-w-[400px] aspect-video rounded-xl"
                  allowFullScreen
                />
              ) : (
                <video src={comment.videoUrl} controls className="max-w-[400px] rounded-xl" />
              )}
            </div>
          )}
          {comment.linkUrl && (
            <a
              href={comment.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-sm text-blue-500 hover:underline flex items-center gap-1"
            >
              <Link2 className="w-3 h-3" />
              {comment.linkUrl}
            </a>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1.5 ml-4">
          <button
            onClick={() => handleToggleCommentLike(postId, comment.id)}
            disabled={likingComment === comment.id}
            className={`text-xs flex items-center gap-1 transition-colors ${
              isCommentLikedByUser(comment) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isCommentLikedByUser(comment) ? 'fill-current' : ''}`} />
            {(comment._count?.likes || 0) > 0 && <span>{comment._count?.likes}</span>}
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors font-medium"
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
              className="text-sm rounded-full bg-[#F8FAFC] border-gray-200"
            />
            <Button
              size="sm"
              onClick={() => handleAddComment(postId, comment.id)}
              disabled={submittingComment === comment.id}
              className="rounded-full bg-blue-500 hover:bg-blue-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => renderComment(reply, postId, true))}
          </div>
        )}
      </div>
    </div>
  );

  // Filter pills
  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "Alles" },
    { key: "pinned", label: "Vastgepind" },
    { key: "events", label: "Events" },
    { key: "media", label: "Media" },
  ];

  return (
    <div className="space-y-5">
      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === filter.key
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* New Post Composer - Only shown if canCreatePosts is true */}
      {canCreatePosts && (
        <>
          {!showNewPost ? (
            <button
              onClick={() => setShowNewPost(true)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-gray-200 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-gray-400 text-sm">Wat wil je delen?</span>
            </button>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="space-y-4">
                <Input
                  placeholder="Titel van je post"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="border-0 border-b border-gray-100 rounded-none px-0 text-lg font-semibold placeholder:text-gray-300 placeholder:font-normal focus-visible:ring-0"
                />
                <Textarea
                  placeholder="Wat wil je delen met je klanten?"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                  className="border-0 px-0 resize-none placeholder:text-gray-300 focus-visible:ring-0"
                />
                {/* Media toolbar */}
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Afbeelding</p>
                    <MediaPicker
                      value={newPost.imageUrl}
                      onChange={(url) => setNewPost({ ...newPost, imageUrl: url })}
                      accept="image/*"
                      label="Afbeelding"
                    />
                  </div>
                  {/* Video URL */}
                  {newPost.videoUrl ? (
                    <div className="flex items-center gap-2 p-2 bg-[#FCE8F0] rounded-xl text-sm text-[#9B3A5A]">
                      <Video className="w-4 h-4" />
                      <span className="truncate flex-1">{newPost.videoUrl}</span>
                      <button onClick={() => setNewPost({ ...newPost, videoUrl: "" })}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#FCE8F0] transition-colors text-sm text-[#9B3A5A]"
                      onClick={() => {
                        const url = prompt("Video URL (YouTube, Loom, etc.):");
                        if (url) setNewPost({ ...newPost, videoUrl: url });
                      }}
                      title="Video toevoegen"
                    >
                      <Video className="w-5 h-5" />
                      Video toevoegen
                    </button>
                  )}
                </div>
                {/* Community Selector - only show if there are multiple communities */}
                {communities.length > 1 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block font-medium">
                      Plaatsen in community
                    </label>
                    <Select
                      value={selectedCommunityId}
                      onValueChange={setSelectedCommunityId}
                    >
                      <SelectTrigger className="rounded-xl">
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
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={handleCreatePost}
                    disabled={submitting}
                    className="bg-blue-500 hover:bg-blue-600 rounded-xl px-6"
                  >
                    {submitting ? "Posten..." : "Plaatsen"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowNewPost(false);
                      setNewPost({ title: "", content: "", imageUrl: "", videoUrl: "", communityId: "" });
                      setSelectedCommunityId(defaultCommunity?.id || "");
                    }}
                    className="rounded-xl text-gray-500"
                  >
                    Annuleren
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Nog geen posts in de community.</p>
          {!canCreatePosts && (
            <p className="text-sm text-gray-400 mt-1">Je instructeur zal hier updates delen.</p>
          )}
        </div>
      ) : (
        filteredPosts.map((post) => (
          <div key={post.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
            post.isPinned ? 'border-[#FFF0E8] ring-1 ring-[#FFF0E8]' : 'border-gray-100'
          }`}>
            {/* Post Header */}
            <div className="p-5 pb-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarStyle(post.author.role)}`}>
                    {getInitials(post.author.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{post.author.name}</span>
                      {getRoleBadge(post.author.role)}
                      {post.isPinned && (
                        <span className="text-[11px] font-medium bg-[#FFF0E8] text-[#C4693B] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Pin className="w-3 h-3" />
                          Vastgepind
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                {post.author.id === currentUserId && canCreatePosts && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(post.id)}
                      className={`p-2 rounded-xl hover:bg-gray-50 transition-colors ${post.isPinned ? 'text-[#C4693B]' : 'text-gray-300 hover:text-gray-500'}`}
                      title={post.isPinned ? "Losmaken" : "Vastpinnen"}
                    >
                      <Pin className={`w-4 h-4 ${post.isPinned ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div className="px-5 py-3">
              {post.title && (
                <h3 className="font-semibold text-gray-900 text-[15px] mb-2">{post.title}</h3>
              )}
              <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>

              {/* Post Image */}
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Post afbeelding"
                  className="mt-3 rounded-xl max-h-96 w-full object-cover"
                />
              )}

              {/* Post Video */}
              {post.videoUrl && (
                <div className="mt-3">
                  {post.videoUrl.includes('youtube.com') || post.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={post.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full aspect-video rounded-xl"
                      allowFullScreen
                    />
                  ) : (
                    <video src={post.videoUrl} controls className="w-full rounded-xl" />
                  )}
                </div>
              )}

              {/* Linked Event Card */}
              {post.event && (
                <Link href={`/client/events`}>
                  <div className="mt-4 p-4 bg-[#E8F5F0] rounded-2xl hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-white/60 text-[#2D7A5F] px-2 py-0.5 rounded-full mb-2">
                          <Calendar className="w-3 h-3" />
                          Event
                        </span>
                        <h4 className="font-semibold text-gray-900">{post.event.title}</h4>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-[#2D7A5F]" />
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
                              <MapPin className="w-4 h-4 text-[#2D7A5F]" />
                              {post.event.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-[#2D7A5F]" />
                            {post.event._count.registrations}
                            {post.event.maxAttendees && ` / ${post.event.maxAttendees}`} aanmeldingen
                          </span>
                        </div>
                      </div>
                      <Button size="sm" className="shrink-0 bg-[#2D7A5F] hover:bg-[#245F4A] rounded-xl text-white">
                        Bekijken
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* Engagement Stats & Actions */}
            <div className="px-5 py-3 border-t border-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    disabled={likingPost === post.id}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                      isLikedByUser(post) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLikedByUser(post) ? 'fill-current' : ''}`} />
                    <span>{post._count.likes || 0}</span>
                  </button>
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{post._count.comments}</span>
                  </button>
                </div>
                {post._count.comments > 0 && expandedPost !== post.id && (
                  <button
                    onClick={() => setExpandedPost(post.id)}
                    className="text-xs text-blue-500 font-medium hover:underline"
                  >
                    Bekijk {post._count.comments} {post._count.comments === 1 ? "reactie" : "reacties"}
                  </button>
                )}
              </div>
            </div>

            {/* Comments Section */}
            {expandedPost === post.id && (
              <div className="px-5 pb-5 space-y-4">
                <div className="space-y-4">
                  {post.comments
                    .filter(c => !c.parentId)
                    .map((comment) => renderComment(comment, post.id))}
                </div>

                {/* Add comment with rich media toolbar */}
                <div className="space-y-2 pt-2">
                  {/* Media Previews */}
                  <div className="flex flex-wrap gap-2">
                    {commentGifUrl[post.id] && (
                      <div className="relative inline-block">
                        <img src={commentGifUrl[post.id]} alt="GIF" className="max-w-[120px] rounded-xl border" />
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
                          <img src={commentAttachment[post.id].url} alt={commentAttachment[post.id].name} className="max-w-[120px] rounded-xl border" />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border pr-6">
                            <Paperclip className="w-4 h-4 text-gray-400" />
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
                      <div className="relative inline-block bg-gray-50 rounded-xl border p-2 pr-6">
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
                      <div className="relative inline-block bg-gray-50 rounded-xl border p-2 pr-6">
                        <div className="flex items-center gap-2 text-sm text-blue-500">
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
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-lg space-y-3">
                      <h4 className="font-medium text-sm">Link toevoegen</h4>
                      <Input
                        placeholder="Voer een URL in..."
                        value={commentLinkUrl[post.id] || ""}
                        onChange={(e) => setCommentLinkUrl({ ...commentLinkUrl, [post.id]: e.target.value })}
                        className="rounded-xl"
                      />
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowLinkInput(null)} className="rounded-xl">
                          Annuleren
                        </Button>
                        <Button size="sm" onClick={() => setShowLinkInput(null)} disabled={!commentLinkUrl[post.id]} className="rounded-xl bg-blue-500 hover:bg-blue-600">
                          Link
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Video URL Input Panel */}
                  {showVideoInput === post.id && (
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-lg space-y-3">
                      <h4 className="font-medium text-sm">Video toevoegen</h4>
                      <Input
                        placeholder="YouTube, Loom, Vimeo of Wistia link..."
                        value={commentVideoUrl[post.id] || ""}
                        onChange={(e) => setCommentVideoUrl({ ...commentVideoUrl, [post.id]: e.target.value })}
                        className="rounded-xl"
                      />
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowVideoInput(null)} className="rounded-xl">
                          Annuleren
                        </Button>
                        <Button size="sm" onClick={() => setShowVideoInput(null)} disabled={!commentVideoUrl[post.id]} className="rounded-xl bg-blue-500 hover:bg-blue-600">
                          Toevoegen
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Emoji Picker Panel */}
                  {showEmojiPicker === post.id && (
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-lg">
                      <div className="grid grid-cols-8 gap-1">
                        {commonEmojis.map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => insertEmoji(post.id, emoji)}
                            className="text-xl hover:bg-gray-50 rounded-xl p-1.5 transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GIF Search Panel */}
                  {showGifSearch === post.id && (
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-lg space-y-3">
                      <Input
                        placeholder="Zoek GIFs..."
                        value={gifSearchQuery}
                        onChange={(e) => {
                          setGifSearchQuery(e.target.value);
                          searchGifs(e.target.value);
                        }}
                        className="text-sm rounded-xl"
                      />
                      {searchingGifs && <p className="text-xs text-gray-400">Zoeken...</p>}
                      {gifResults.length > 0 && (
                        <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                          {gifResults.map((gif) => (
                            <button
                              key={gif.id}
                              onClick={() => {
                                selectGif(post.id, gif.url);
                                setShowGifSearch(null);
                              }}
                              className="hover:opacity-75 transition-opacity rounded-xl overflow-hidden"
                            >
                              <img src={gif.preview} alt="GIF" className="w-full h-20 object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-gray-300">Powered by Tenor</p>
                    </div>
                  )}

                  {/* Comment Input with Toolbar */}
                  <div className="border border-gray-200 rounded-2xl flex items-center bg-[#F8FAFC] hover:bg-white focus-within:bg-white focus-within:border-gray-300 transition-all">
                    <Input
                      placeholder="Schrijf een reactie..."
                      value={commentText[post.id] || ""}
                      onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                    />
                    <div className="flex items-center gap-0.5 pr-2">
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
                        className={`p-2 rounded-xl hover:bg-gray-100 transition-colors ${uploadingFile === post.id ? 'opacity-50' : ''}`}
                        title="Bestand toevoegen"
                      >
                        <Paperclip className={`w-4 h-4 text-gray-400 ${uploadingFile === post.id ? 'animate-pulse' : ''}`} />
                      </button>
                      {/* Link */}
                      <button
                        onClick={() => { closeAllPanels('link'); setShowLinkInput(showLinkInput === post.id ? null : post.id); }}
                        className={`p-2 rounded-xl hover:bg-gray-100 transition-colors ${showLinkInput === post.id ? 'bg-gray-100' : ''}`}
                        title="Link toevoegen"
                      >
                        <Link2 className="w-4 h-4 text-gray-400" />
                      </button>
                      {/* Video */}
                      <button
                        onClick={() => { closeAllPanels('video'); setShowVideoInput(showVideoInput === post.id ? null : post.id); }}
                        className={`p-2 rounded-xl hover:bg-gray-100 transition-colors ${showVideoInput === post.id ? 'bg-gray-100' : ''}`}
                        title="Video toevoegen"
                      >
                        <Play className="w-4 h-4 text-gray-400" />
                      </button>
                      {/* Emoji */}
                      <button
                        onClick={() => { closeAllPanels('emoji'); setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id); }}
                        className={`p-2 rounded-xl hover:bg-gray-100 transition-colors ${showEmojiPicker === post.id ? 'bg-gray-100' : ''}`}
                        title="Emoji toevoegen"
                      >
                        <Smile className="w-4 h-4 text-gray-400" />
                      </button>
                      {/* GIF */}
                      <button
                        onClick={() => { closeAllPanels('gif'); setShowGifSearch(showGifSearch === post.id ? null : post.id); }}
                        className={`p-2 rounded-xl hover:bg-gray-100 transition-colors text-xs font-bold ${showGifSearch === post.id ? 'bg-gray-100' : ''}`}
                        title="GIF toevoegen"
                      >
                        <span className="text-gray-400">GIF</span>
                      </button>
                      {/* Send */}
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(post.id)}
                        disabled={submittingComment === post.id || (!commentText[post.id]?.trim() && !commentGifUrl[post.id] && !commentAttachment[post.id] && !commentVideoUrl[post.id])}
                        className="rounded-xl bg-blue-500 hover:bg-blue-600 ml-1 h-8 w-8 p-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Trash2, Send, User, Plus } from "lucide-react";

interface Author {
  id: string;
  name: string;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

interface Post {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  author: Author;
  comments: Comment[];
  _count: { comments: number };
}

interface CommunityFeedProps {
  initialPosts: Post[];
  currentUserId: string;
}

export function CommunityFeed({ initialPosts, currentUserId }: CommunityFeedProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      if (res.ok) {
        setNewPost({ title: "", content: "" });
        setShowNewPost(false);
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

  const handleAddComment = async (postId: string) => {
    const content = commentText[postId]?.trim();
    if (!content) return;

    setSubmittingComment(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setCommentText({ ...commentText, [postId]: "" });
        router.refresh();
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setSubmittingComment(null);
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

  return (
    <div className="space-y-4">
      {/* New Post Button/Form */}
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
                placeholder="Wat wil je delen?"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreatePost} disabled={submitting}>
                  {submitting ? "Posten..." : "Plaatsen"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewPost(false);
                    setNewPost({ title: "", content: "" });
                  }}
                >
                  Annuleren
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nog geen posts in de community.</p>
            <p className="text-sm">Wees de eerste om iets te delen!</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id}>
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
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                {post.author.id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePost(post.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <h3 className="font-semibold mb-2">{post.title}</h3>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{post.content}</p>

              {/* Comments toggle */}
              <button
                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-3"
              >
                <MessageCircle className="w-4 h-4" />
                {post._count.comments} {post._count.comments === 1 ? "reactie" : "reacties"}
              </button>

              {/* Comments Section */}
              {expandedPost === post.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.author.name}</span>
                          {getRoleBadge(comment.author.role)}
                          <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add comment */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Schrijf een reactie..."
                      value={commentText[post.id] || ""}
                      onChange={(e) =>
                        setCommentText({ ...commentText, [post.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      disabled={submittingComment === post.id}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
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

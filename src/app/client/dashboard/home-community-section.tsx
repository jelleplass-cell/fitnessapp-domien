"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Send, User, Pin } from "lucide-react";
import Link from "next/link";

interface Post {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
  isPinned: boolean;
}

interface HomeCommunityProps {
  posts: Post[];
  currentUserId: string;
}

export function HomeCommunitySection({ posts, currentUserId }: HomeCommunityProps) {
  const router = useRouter();
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

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

  const handleAddComment = async (postId: string) => {
    const content = commentText[postId]?.trim();
    if (!content) return;

    setSubmitting(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setCommentText({ ...commentText, [postId]: "" });
        setExpandedPost(null);
        router.refresh();
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Card key={post.id} className={post.isPinned ? "border-blue-200" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{post.author.name}</span>
                  {getRoleBadge(post.author.role)}
                  {post.isPinned && (
                    <Badge variant="secondary" className="text-xs">
                      <Pin className="w-3 h-3 mr-1" />
                      Vastgepind
                    </Badge>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
                </div>

                {post.title && (
                  <h3 className="font-semibold mt-1">{post.title}</h3>
                )}

                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {post.content}
                </p>

                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {post._count.likes}
                  </span>
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="text-xs text-gray-500 hover:text-blue-500 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    {post._count.comments} reacties
                  </button>
                  <Link href="/client/community" className="ml-auto">
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Bekijk post
                    </Button>
                  </Link>
                </div>

                {/* Quick comment input */}
                {expandedPost === post.id && (
                  <div className="mt-3 flex gap-2">
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
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      disabled={submitting === post.id || !commentText[post.id]?.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

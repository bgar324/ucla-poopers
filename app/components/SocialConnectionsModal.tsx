"use client";

import { useEffect } from "react";
import { Users } from "lucide-react";
import UserCard from "./UserCard";

interface SocialConnectionUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  reviewCount: number;
  followerCount: number;
  followingCount: number;
}

interface SocialConnectionsModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  users: SocialConnectionUser[];
  isLoading: boolean;
  errorMessage: string;
  emptyMessage: string;
  selectedUserId: string | null;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export default function SocialConnectionsModal({
  isOpen,
  title,
  description,
  users,
  isLoading,
  errorMessage,
  emptyMessage,
  selectedUserId,
  onClose,
  onSelectUser,
}: SocialConnectionsModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[115] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-connections-title"
        className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-amber-900/10 bg-rose-100 shadow-[0_30px_100px_rgba(0,0,0,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-amber-900/10 px-6 py-5 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900 shadow-[inset_0_0_0_1px_rgba(120,53,15,0.08)]">
                <Users size={22} strokeWidth={2.2} />
              </div>

              <div>
                <h2
                  id="social-connections-title"
                  className=" font-gasoek text-3xl text-amber-900"
                >
                  {title}
                </h2>
                <p className="mt-2 max-w-2xl font-rubik text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-amber-900/20 bg-white px-4 py-2 font-rubik text-sm text-amber-900 transition hover:bg-amber-50 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 lg:px-8">
          {isLoading ? (
            <div className="rounded-[1.5rem] border border-amber-900/10 bg-white/60 px-5 py-10 text-center font-rubik text-slate-600">
              Loading connections...
            </div>
          ) : errorMessage ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-6 text-center font-rubik text-red-700">
              {errorMessage}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-[1.5rem] border border-amber-900/10 bg-white/60 px-5 py-10 text-center font-rubik text-slate-600">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onClick={() => onSelectUser(user.id)}
                  isSelected={selectedUserId === user.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

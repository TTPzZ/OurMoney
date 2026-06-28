"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { createGroup } from "@/lib/actions/group";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function CreateGroupModal({
  onOpenGroup,
}: {
  onOpenGroup?: (groupId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsPending(true);
    try {
      const result = await createGroup(name);
      if (result.success) {
        mutate("/api/groups");
        setIsOpen(false);
        setName("");
        if (onOpenGroup) {
          onOpenGroup(result.groupId);
        } else {
          router.push(`/group/${result.groupId}`);
        }
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Failed to create group. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="shadow-xl min-h-[56px] w-full max-w-sm"
        leftIcon={<Plus size={24} />}
      >
        Tạo nhóm mới
      </Button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Tạo nhóm mới</h3>
                <p className="text-sm text-slate-400 font-medium tracking-tight">Bắt đầu chia sẻ chi tiêu với bạn bè.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Tên nhóm"
                  placeholder='Ví dụ: "Ăn trưa", "Du lịch Đà Lạt"'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  autoFocus
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="xl"
                  loading={isPending}
                  loadingText="Đang tạo..."
                >
                  Xác nhận
                </Button>
              </form>
            </div>
          </Card>
        </div>,
        document.body
      )}
    </>
  );
}

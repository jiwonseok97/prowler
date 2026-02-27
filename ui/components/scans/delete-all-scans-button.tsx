"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteAllScans } from "@/actions/scans";
import { DeleteIcon } from "@/components/icons";
import { Button } from "@/components/shadcn";
import { Modal } from "@/components/shadcn/modal";
import { useToast } from "@/components/ui";

export const DeleteAllScansButton = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteAllScans();
    setIsDeleting(false);

    if (result?.errors && result.errors.length > 0) {
      const error = result.errors[0];
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: `${error.detail}`,
      });
      return;
    }

    const deletedCount =
      typeof result?.deleted?.scans === "number" ? result.deleted.scans : 0;

    toast({
      title: "Scans Deleted",
      description: `Deleted ${deletedCount} scans.`,
    });

    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Delete All Scans"
        description="This will permanently delete all scan records and related summaries. This action cannot be undone."
      >
        <div className="flex w-full justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {!isDeleting && <DeleteIcon size={24} />}
            {isDeleting ? "Deleting..." : "Delete All"}
          </Button>
        </div>
      </Modal>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        Delete All Scans
      </Button>
    </>
  );
};

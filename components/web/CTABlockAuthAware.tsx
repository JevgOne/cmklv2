"use client";

import { useSession } from "next-auth/react";
import { CTABlock } from "@/components/web/CTABlock";
import { getCTACopy, type TagCopyInput } from "@/lib/landing-copy";

export interface CTABlockAuthAwareProps {
  tag: TagCopyInput;
}

/**
 * Client wrapper — swap CTA copy podle auth state.
 * Potřeba kvůli ISR page (getServerSession by forcoval dynamic rendering).
 */
export function CTABlockAuthAware({ tag }: CTABlockAuthAwareProps) {
  const { data: session } = useSession();
  const copy = getCTACopy(tag, !!session?.user, session?.user?.role);
  return <CTABlock copy={copy} variant="mid" />;
}

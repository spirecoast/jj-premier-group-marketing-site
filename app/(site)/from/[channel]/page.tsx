import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChannelLanding } from "@/components/growth/channel-landing";
import { CHANNELS } from "@/lib/channels/copy";
import { getSiteSettings } from "@/lib/content";
import { LEAD_CHANNELS, isLeadChannel } from "@/lib/leads";
import { pageMetadata } from "@/lib/seo";

/**
 * /from/youtube, /from/instagram, /from/facebook, /from/nextdoor: the links in
 * the team's bios and posts. Kept out of search (noindex, and not in the
 * sitemap): they exist for people arriving from a post, not from Google.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return LEAD_CHANNELS.map((channel) => ({ channel }));
}

export async function generateMetadata({ params }: { params: Promise<{ channel: string }> }): Promise<Metadata> {
  const { channel } = await params;
  if (!isLeadChannel(channel)) return {};
  const c = CHANNELS[channel];
  return pageMetadata({ title: c.title, description: c.description, path: `/from/${channel}`, noIndex: true });
}

export default async function FromChannelPage({ params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  if (!isLeadChannel(channel)) notFound();
  const settings = await getSiteSettings();
  return <ChannelLanding copy={CHANNELS[channel]} phone={{ e164: settings.primaryPhoneE164, display: settings.primaryPhoneDisplay }} />;
}

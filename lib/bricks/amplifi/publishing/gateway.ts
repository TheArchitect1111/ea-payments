export function publishGuard(post: any, requestedChannel: string) {
  if (!post.provider) throw new Error("No provider configured - blocked");
  if (post.channel !== requestedChannel) throw new Error(`Channel mismatch: got ${post.channel}, expected ${requestedChannel}`);
  if (post.scheduledAt && new Date() < new Date(post.scheduledAt)) {
    return { status: "queued", message: "Scheduled for later, not publishing now" };
  }
  return { status: "ready_to_publish" };
}

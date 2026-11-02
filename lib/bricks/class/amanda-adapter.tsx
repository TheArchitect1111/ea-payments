// Amanda - Class Brick Reference
// 12 classes: 8 available = direct Square, 4 waitlist = single CTA

export const AMANDA_CLASSES = { total: 12, available: 8, waitlist: 4, payment: "Square", workflow: "direct-vs-waitlist" };
export function isClassAvailable(id) { return (typeof id === "string" ? parseInt(id) : id) <= 8; }
export function getClassCTA(id) { return isClassAvailable(id) ? { mode: "direct", label: "Register Now", href: "/checkout?class="+id } : { mode: "waitlist", label: "Join Waitlist", href: "/waitlist?class="+id }; }

export async function GET(request: Request) {
  return Response.redirect(new URL('/chris-book-cover.svg', request.url), 302);
}

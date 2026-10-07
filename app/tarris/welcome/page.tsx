import WelcomeClient from "./welcome-client";

type SearchParams = { member?: string | string[]; code?: string | string[] };
export default async function WelcomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const member = Array.isArray(params.member) ? params.member[0] : params.member;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  return <WelcomeClient member={member || "1"} code={code} />;
}

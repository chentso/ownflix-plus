import { NextRequest } from "next/server";
import { POST as authPost } from "../auth/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return authPost(req);
}

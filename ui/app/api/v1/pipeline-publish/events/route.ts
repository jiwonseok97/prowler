import { NextRequest } from "next/server";

import { forwardPipelinePublish } from "../_proxy";

export async function POST(request: NextRequest) {
  return forwardPipelinePublish(request, "events");
}

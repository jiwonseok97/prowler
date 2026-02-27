import { NextRequest } from "next/server";

import { forwardPipelinePublish } from "../_proxy";

export async function GET(request: NextRequest) {
  return forwardPipelinePublish(request, "latest");
}

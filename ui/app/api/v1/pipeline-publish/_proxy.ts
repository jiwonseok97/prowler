import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const buildTargetUrl = (request: NextRequest, suffix: string) => {
  const base = apiBaseUrl.replace(/\/+$/, "");
  const target = new URL(`${base}/pipeline-publish/${suffix}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
  return target.toString();
};

export const forwardPipelinePublish = async (
  request: NextRequest,
  suffix: string,
) => {
  if (!apiBaseUrl) {
    return NextResponse.json(
      { detail: "NEXT_PUBLIC_API_BASE_URL is not configured" },
      { status: 500 },
    );
  }

  const headers = new Headers();
  const auth = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  if (auth) headers.set("authorization", auth);
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", request.headers.get("accept") || "application/json");

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text();

  const response = await fetch(buildTargetUrl(request, suffix), {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") || "application/json",
    },
  });
};

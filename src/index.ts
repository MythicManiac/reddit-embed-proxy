/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  //
  // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
  // MY_QUEUE: Queue;
}

type RedditResponse = {
  data: {
    children: {
      data: {
        title: string,
        selftext: string,
        preview?: {
          images: {
            source: {
              url: string,
              width: number,
              height: number,
            },
          }[],
        },
      },
    }[],
  },
}[];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    url.host = "reddit.com";
    url.protocol = "https:"
    if (!url.pathname.endsWith(".json")) {
      url.pathname = `${url.pathname}.json`;
    }
    const redditResponse = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.3",
      }
    });
    const responseJson = await redditResponse.json() as RedditResponse;
    const post = responseJson[0].data.children[0].data;

    const image = post.preview?.images[0];

    const preview = image ? `
<meta property="og:image" content="${image.source.url} />
<meta property="og:image:width" content="${image.source.width}" />
<meta property="og:image:height" content="${image.source.height}" />
` : ""

    const html = `
<html>
<head>
<meta property="og:title" content="${post.title}" />
<meta property="og:description" content="${post.selftext}"
${preview}
</head>
</html>
`;

    return new Response(html, { headers: {"content-type": "text/html;charset=UTF-8" }});
  },
};

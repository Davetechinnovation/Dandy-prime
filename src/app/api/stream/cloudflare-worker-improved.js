const cloudflareWorker = {
  async fetch(request, env) {
    const clientIP = request.headers.get("CF-Connecting-IP");
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const source = url.searchParams.get("source") || "vidsrc";
    const mediaType = url.searchParams.get("media_type") || "movie";

    if (!id || !/^[a-zA-Z0-9-_\.]+$/.test(id)) {
      return new Response("Invalid ID format", { status: 400 });
    }

    const ALLOWED_SOURCES = [
      "vidsrc",
      "flixhq",
      "goojara",
      "zoro",
      "dramacool",
      "asiaflix",
    ];
    if (!ALLOWED_SOURCES.includes(source)) {
      return new Response("Invalid source", { status: 400 });
    }

    const ALLOWED_MEDIA_TYPES = ["movie", "tv", "anime", "kdrama"];
    if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
      return new Response("Invalid media type", { status: 400 });
    }

    const secret = request.headers.get("X-Your-Secret-Key");
    if (!env.WORKER_SECRET || secret !== env.WORKER_SECRET) {
      console.log(`Unauthorized access attempt from ${clientIP}`);
      return new Response("Unauthorized", { status: 401 });
    }

    const SOURCE_CONFIG = {
      vidsrc: {
        domain: "https://vidsrc.to",
        urlPattern: (mediaType, id) => `embed/${mediaType}/${id}`,
        supportsMediaTypes: ["movie", "tv", "anime", "kdrama"],
      },
      flixhq: {
        domain: "https://flixhq.to",
        urlPattern: (mediaType, id) => `embed/${mediaType}/${id}`,
        supportsMediaTypes: ["movie", "tv", "anime", "kdrama"],
      },
      goojara: {
        domain: "https://goojara.to",
        urlPattern: (mediaType, id) => `embed/${id}`,
        supportsMediaTypes: ["movie", "tv", "anime", "kdrama"],
      },
      zoro: {
        domain: "https://zoro.to",
        urlPattern: (mediaType, id) => `embed/${id}`,
        supportsMediaTypes: ["movie", "tv", "anime", "kdrama"],
      },
      dramacool: {
        domain: "https://dramacool.pa",
        urlPattern: (mediaType, id) => `embed/${id}`,
        supportsMediaTypes: ["movie", "tv", "anime", "kdrama"],
      },
      asiaflix: {
        domain: "https://asiaflix.net/home",
        urlPattern: (mediaType, id) => `embed/${id}`,
        supportsMediaTypes: ["movie", "tv", "anime", "kdrama"],
      },
    };

    const sourceConfig = SOURCE_CONFIG[source];
    if (!sourceConfig) {
      return new Response("Invalid source", { status: 400 });
    }

    if (!sourceConfig.supportsMediaTypes.includes(mediaType)) {
      return new Response(
        `Source ${source} doesn't support media type ${mediaType}`,
        { status: 400 }
      );
    }

    const targetUrl = `${sourceConfig.domain}/${sourceConfig.urlPattern(
      mediaType,
      id
    )}`;

    try {
      console.log(`Fetching from ${source}: ${targetUrl}`);

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: sourceConfig.domain,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.error(
          `Source ${source} returned ${response.status}: ${response.statusText}`
        );
        return new Response(`Source unavailable (${response.status})`, {
          status: 502,
        });
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        console.warn(`Unexpected content type from ${source}: ${contentType}`);
      }

      const rewriter = new HTMLRewriter()
        .on("script", {
          element(element) {
            element.remove();
          },
        })
        // Remove ALL stylesheet links with /cdn-cgi/ in href (case-insensitive)
        .on("link[rel='stylesheet'][href*='/cdn-cgi/']", {
          element(element) {
            element.remove();
          },
        })
        // Remove any <link> or <script> with href or src containing /cdn-cgi/ (case-insensitive)
        .on("link[href*='/cdn-cgi/'], script[src*='/cdn-cgi/']", {
          element(element) {
            element.remove();
          },
        })
        // Remove any element with href or src starting with /cdn-cgi/
        .on("[href^='/cdn-cgi/'], [src^='/cdn-cgi/']", {
          element(element) {
            element.remove();
          },
        })
        // Remove any <style> tag containing @import or url('/cdn-cgi/')
        .on("style", {
          element(element) {
            const text = element.textContent || "";
            if (/(@import|url)\(['\"]?\/cdn-cgi\//i.test(text)) {
              element.remove();
            }
          },
        })
        // Also remove any other stylesheet links
        .on("link[rel='stylesheet']", {
          element(element) {
            element.remove();
          },
        })
        .on(
          "div[class*='overlay'], div[class*='ads'], div[id*='ads'], div[class*='popup'], .advertisement",
          {
            element(element) {
              element.remove();
            },
          }
        )
        .on(
          "iframe[src*='ads'], iframe[src*='adserver'], iframe[src*='googleads'], iframe[src*='doubleclick']",
          {
            element(element) {
              element.remove();
            },
          }
        )
        .on(
          "a[href*='ads'], a[href*='adclick'], a[onclick*='popup'], a[onclick*='open']",
          {
            element(element) {
              element.remove();
            },
          }
        )
        .on("head", {
          element(element) {
            element.append(
              `<style>
              .ad-container, .ads, .advertisement, .popup-overlay,
              div[id*="ad"], div[class*="ad"], div[id*="popup"],
              iframe[src*="ads"], iframe[src*="doubleclick"] {
                display: none !important;
                visibility: hidden !important;
                pointer-events: none !important;
                position: absolute !important;
                left: -9999px !important;
              }
              div[onclick*='open'], a[href*='adclick'] {
                display: none !important;
              }
              iframe[src*="embed"], video {
                display: block !important;
                visibility: visible !important;
              }
            </style>`,
              { html: true }
            );
          },
        });

      const transformedResponse = rewriter.transform(response);
      const CSP_HEADER =
        "default-src 'self'; script-src 'none'; object-src 'none'; frame-ancestors 'self';";

      return new Response(transformedResponse.body, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Frame-Options": "SAMEORIGIN",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
          "Cache-Control": "public, max-age=300",
          "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "X-Your-Secret-Key",
          "Content-Security-Policy": CSP_HEADER,
        },
      });
    } catch (error) {
      console.error(`Error fetching from ${source}:`, error.message);

      if (error.name === "AbortError") {
        return new Response("Request timeout", { status: 504 });
      } else if (error.message.includes("network")) {
        return new Response("Network error", { status: 502 });
      } else {
        return new Response("Failed to fetch from source", { status: 500 });
      }
    }
  },
};

export default cloudflareWorker;

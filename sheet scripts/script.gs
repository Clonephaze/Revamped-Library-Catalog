function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Catalog Tools")
    .addItem("➕ Add Item", "showSidebar")
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("sidebar")
    .setTitle("Add Catalog Item")
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function addItem(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("catalog");
  if (!sheet) throw new Error('Sheet "catalog" not found.');
  if (!data.name || !data.name.trim()) throw new Error("Name is required.");
  if (!data.category) throw new Error("Category is required.");

  sheet.appendRow([
    data.category.trim(),
    data.name.trim(),
    data.description.trim(),
    data.printTime ? Number(data.printTime) : "",
    data.author.trim(),
    data.source.trim(),
    data.picture.trim(),
    data.tags.trim(),
  ]);

  return { success: true, name: data.name.trim() };
}

function addFilament(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Filaments");
  if (!sheet) throw new Error('Sheet "Filaments" not found.');
  if (!data.name || !data.name.trim()) throw new Error("Name is required.");

  const lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 1).setValue(data.name.trim());

  var colors = [data.color1, data.color2, data.color3, data.color4];
  for (var i = 0; i < colors.length; i++) {
    if (colors[i]) {
      sheet.getRange(lastRow, i + 2).setBackground(colors[i]);
    }
  }

  return { success: true, name: data.name.trim() };
}

function checkDuplicate(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("catalog");
  if (!sheet) return false;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const names = sheet
    .getRange(2, 2, lastRow - 1, 1)
    .getValues()
    .flat();
  return names.some(
    (n) => n.toString().toLowerCase() === name.toLowerCase().trim(),
  );
}

function getCategories() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("catalog");
  const defaults = ["Toys & Gadgets", "Bookmarks", "Educational & STEM"];
  if (!sheet || sheet.getLastRow() < 2) return defaults;
  const cats = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 1)
    .getValues()
    .flat()
    .map((c) => c.toString().trim())
    .filter(Boolean);
  return [...new Set([...defaults, ...cats])].sort();
}

function getTags() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("catalog");
  if (!sheet) return [];

  // Find the tags column by header name
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var tagColIndex = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().toLowerCase().indexOf("tag") !== -1) {
      tagColIndex = i + 1;
      break;
    }
  }
  if (tagColIndex === -1) return [];

  // Primary: read the dropdown options from the data validation rule —
  // that's where "Popular", "Staff Favorite", "New" etc. are defined.
  try {
    const validation = sheet.getRange(2, tagColIndex).getDataValidation();
    if (validation) {
      const type = validation.getCriteriaType();
      if (type === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
        const values = validation.getCriteriaValues()[0]; // array of allowed values
        if (values && values.length) return values.slice().sort();
      }
    }
  } catch (e) {
    // fall through to cell-scan fallback
  }

  // Fallback: scan existing cell values (handles comma- or newline-separated multi-select)
  if (sheet.getLastRow() < 2) return [];
  const cellValues = sheet
    .getRange(2, tagColIndex, sheet.getLastRow() - 1, 1)
    .getValues()
    .flat();
  const all = cellValues.flatMap(function (cell) {
    return cell.toString().split(/[,\n]+/).map(function (t) { return t.trim(); }).filter(Boolean);
  });
  return [...new Set(all)].sort();
}

function fetchPrintablesData(url) {
  try {
    const match = url.match(/printables\.com\/model\/(\d+)/);
    if (!match) return { error: "Not a valid Printables model URL." };
    const modelId = match[1];

    // Try GraphQL first — works fine locally but Cloudflare may 403 Google IPs.
    // If it fails for any reason, fall back to og: meta tag parsing.
    try {
      const gql = _fetchViaGraphQL(modelId);
      if (gql && !gql.error) return gql;
    } catch (e) {
      // intentionally swallowed — fall through to HTML fallback
    }

    return _fetchViaHtml(url, modelId);
  } catch (e) {
    return { error: e.message };
  }
}

function _fetchViaGraphQL(modelId) {
  const query =
    "query { print(id: \"" + modelId + "\") {" +
    " name summary slug" +
    " user { publicUsername }" +
    " images { filePath }" +
    " tags { name }" +
    " } }";

  const response = UrlFetchApp.fetch("https://api.printables.com/graphql/", {
    method: "post",
    contentType: "application/json",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Origin": "https://www.printables.com",
      "Referer": "https://www.printables.com/",
      "Accept": "application/json",
    },
    payload: JSON.stringify({ query: query }),
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    return { error: "GraphQL " + response.getResponseCode() };
  }

  const data = JSON.parse(response.getContentText());
  if (data.errors && data.errors.length) return { error: data.errors[0].message };

  const print = data.data && data.data.print;
  if (!print) return { error: "Model not found." };

  const image =
    print.images && print.images[0]
      ? "https://media.printables.com/" + print.images[0].filePath
      : "";

  const tags = (print.tags || []).map(function (t) { return t.name; });
  const source = "https://www.printables.com/model/" + modelId + "-" + (print.slug || "");

  return {
    title: print.name || "",
    description: print.summary || "",
    author: (print.user && print.user.publicUsername) || "",
    image: image,
    source: source,
    tags: tags,
  };
}

// Fallback: fetch the normal page and parse og: meta tags.
// Printables server-renders these for SEO, so they're present even without JS.
// Tags are not available this way, but name/image/author all are.
// og:title format: "Model Name by AuthorUsername | Download free STL model | Printables.com"
function _fetchViaHtml(url, modelId) {
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const code = response.getResponseCode();
  if (code !== 200) return { error: "Could not load page (HTTP " + code + ")." };

  const html = response.getContentText();

  // Printables uses name="og:..." (not property="og:..."), but we match both to be safe.
  function getMeta(key) {
    var patterns = [
      new RegExp('<meta[^>]+name=["\']' + key + '["\'][^>]+content=["\']([^"\']+)["\']', 'i'),
      new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']' + key + '["\']', 'i'),
      new RegExp('<meta[^>]+property=["\']' + key + '["\'][^>]+content=["\']([^"\']+)["\']', 'i'),
      new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']' + key + '["\']', 'i'),
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = html.match(patterns[i]);
      if (m) return m[1].trim();
    }
    return "";
  }

  // og:title = "Model Name by AuthorUsername | Download free STL model | Printables.com"
  // Split on " | " first to drop the trailing boilerplate, then on " by " to get name + author.
  const rawTitle = getMeta("og:title");
  var modelName = "";
  var author = "";
  if (rawTitle) {
    const beforePipe = rawTitle.split(" | ")[0].trim(); // "Model Name by AuthorUsername"
    const byIdx = beforePipe.lastIndexOf(" by ");
    if (byIdx !== -1) {
      modelName = beforePipe.substring(0, byIdx).trim();
      author = beforePipe.substring(byIdx + 4).trim();
    } else {
      modelName = beforePipe;
    }
  }

  const image = getMeta("og:image");

  // The summary div is Svelte SSR — present in raw HTML, no JS needed.
  // Svelte wraps content in <!--[--> ... <!--]--> hydration markers.
  // The class hash (svelte-xxxxxxx) changes between deploys so we only match "summary".
  var description = "";
  var summaryMatch = html.match(/<div[^>]+class="summary[^"]*"[^>]*><!--\[-->([\s\S]*?)<!--\]--><\/div>/);
  if (summaryMatch) {
    description = summaryMatch[1].trim();
  }

  // Breadcrumbs: <a href="/model">3D Models</a> then category links with ?category=N
  // We want the first category (second breadcrumb) — e.g. "Hobby &amp; Makers"
  // Grab all category hrefs in order and take the first one's link text.
  var printablesCategory = "";
  var breadcrumbMatch = html.match(/<div[^>]+class="breadcrumbs[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (breadcrumbMatch) {
    var catMatch = breadcrumbMatch[1].match(/<a[^>]+href="\/model\?category=[^"]*"[^>]*>([^<]+)<\/a>/);
    if (catMatch) {
      // Decode HTML entities (e.g. &amp; → &)
      printablesCategory = catMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
    }
  }

  return {
    title: modelName,
    description: description,
    author: author,
    image: image,
    source: url,
    tags: [],
    printablesCategory: printablesCategory,
  };
}

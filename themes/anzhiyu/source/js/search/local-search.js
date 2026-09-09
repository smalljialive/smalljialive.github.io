window.addEventListener("load", () => {
  let loadFlag = false;
  let dataObj = [];
  const $searchMask = document.getElementById("search-mask");

  const handleSearchEscape = event => {
    if (event.code === "Escape") closeSearch();
  };

  const openSearch = () => {
    const bodyStyle = document.body.style;
    bodyStyle.width = "100%";
    bodyStyle.overflow = "hidden";
    anzhiyu.animateIn($searchMask, "to_show 0.5s");
    anzhiyu.animateIn(document.querySelector("#local-search .search-dialog"), "titleScale 0.5s");
    setTimeout(() => {
      document.querySelector("#local-search-input input").focus();
    }, 100);
    if (!loadFlag) {
      search();
      loadFlag = true;
    }
    document.removeEventListener("keydown", handleSearchEscape);
    document.addEventListener("keydown", handleSearchEscape);
  };

  const closeSearch = () => {
    document.removeEventListener("keydown", handleSearchEscape);
    const bodyStyle = document.body.style;
    bodyStyle.width = "";
    bodyStyle.overflow = "";
    anzhiyu.animateOut(document.querySelector("#local-search .search-dialog"), "search_close .5s");
    anzhiyu.animateOut($searchMask, "to_hide 0.5s");
  };

  const searchClickFn = () => {
    const headerSearch = document.querySelector("#search-button > .search");
    const menuSearch = document.querySelector("#menu-search");
    if (headerSearch) headerSearch.addEventListener("click", openSearch);
    if (menuSearch) menuSearch.addEventListener("click", openSearch);
  };

  const searchClickFnOnce = () => {
    document.querySelector("#local-search .search-close-button").addEventListener("click", closeSearch);
    $searchMask.addEventListener("click", closeSearch);
    if (GLOBAL_CONFIG.localSearch.preload) dataObj = fetchData(GLOBAL_CONFIG.localSearch.path);
  };

  const isJson = url => /\.json$/.test(url);

  const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const escapeHTML = text =>
    String(text).replace(/[&<>"']/g, char => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[char];
    });

  const highlightText = (text, keywords) => {
    if (!text || !keywords.length) return escapeHTML(text || "");
    const pattern = new RegExp(keywords.map(escapeRegExp).join("|"), "gi");
    let result = "";
    let lastIndex = 0;

    text.replace(pattern, (match, offset) => {
      result += escapeHTML(text.slice(lastIndex, offset));
      result += `<span class="search-keyword">${escapeHTML(match)}</span>`;
      lastIndex = offset + match.length;
      return match;
    });

    result += escapeHTML(text.slice(lastIndex));
    return result;
  };

  const getImageSource = content => {
    const imgTags = content.match(/<img\b[^>]*>/gi) || [];
    for (const imgTag of imgTags) {
      const srcMatch = imgTag.match(/\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      if (!srcMatch) continue;
      const src = srcMatch[1] || srcMatch[2] || srcMatch[3] || "";
      if (/^(?:https?:)?\/\//i.test(src) || /^\.{0,2}\//.test(src)) return src;
    }
    return "";
  };

  const showDatabaseError = () => {
    const $loadDataItem = document.getElementById("loading-database");
    if ($loadDataItem) $loadDataItem.innerHTML = "<span> 搜索数据库加载失败，请刷新重试</span>";
  };

  const fetchData = async path => {
    try {
      let data = [];
      const response = await fetch(path);
      if (!response.ok) throw new Error(`搜索数据库请求失败: ${response.status}`);

      if (isJson(path)) {
        data = await response.json();
      } else {
        const res = await response.text();
        const xml = new window.DOMParser().parseFromString(res, "text/xml");
        if (xml.querySelector("parsererror")) throw new Error("搜索数据库 XML 解析失败");

        data = [...xml.querySelectorAll("entry")].map(item => {
          const tagsArr = [];
          const tags = item.querySelector("tags");
          if (tags) {
            Array.prototype.forEach.call(tags.getElementsByTagName("tag"), tag => {
              tagsArr.push(tag.textContent);
            });
          }

          const content = item.querySelector("content")?.textContent || "";
          return {
            title: item.querySelector("title")?.textContent || "",
            content,
            url: item.querySelector("url")?.textContent || "",
            tags: tagsArr,
            oneImage: getImageSource(content),
          };
        });
      }

      const $loadDataItem = document.getElementById("loading-database");
      if ($loadDataItem) {
        const $searchWrap = $loadDataItem.nextElementSibling;
        if ($searchWrap) $searchWrap.style.display = "block";
        $loadDataItem.remove();
      }
      return data;
    } catch (error) {
      console.error("加载搜索数据库失败:", error);
      showDatabaseError();
      throw error;
    }
  };

  const search = () => {
    if (!GLOBAL_CONFIG.localSearch.preload) {
      dataObj = fetchData(GLOBAL_CONFIG.localSearch.path);
    }
    const $input = document.querySelector("#local-search-input input");
    const $resultContent = document.getElementById("local-search-results");
    const $loadingStatus = document.getElementById("loading-status");

    $input.addEventListener("input", function () {
      const query = this.value.trim();
      $resultContent.innerHTML = "";
      $loadingStatus.innerHTML = "";
      if (!query) return;

      const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
      if (!keywords.length) return;

      $loadingStatus.innerHTML = '<i class="anzhiyufont anzhiyu-icon-spinner anzhiyu-pulse-icon"></i>';
      let str = '<div class="search-result-list">';
      let count = 0;

      Promise.resolve(dataObj)
        .then(data => {
          if ($input.value.trim() !== query) return;

          data.forEach(item => {
            let isMatch = true;
            const rawTitle = item.title ? item.title.trim() : "";
            const rawContent = item.content ? item.content.trim().replace(/<[^>]+>/g, "") : "";
            const searchableTitle = rawTitle.toLowerCase();
            const searchableContent = rawContent.toLowerCase();
            const dataTags = Array.isArray(item.tags) ? item.tags : [];
            const oneImage = item.oneImage || "";
            const dataUrl = item.url.startsWith("/") ? item.url : GLOBAL_CONFIG.root + item.url;
            let firstOccur = -1;

            if (searchableTitle !== "" || searchableContent !== "") {
              keywords.forEach((keyword, index) => {
                const indexTitle = searchableTitle.indexOf(keyword);
                let indexContent = searchableContent.indexOf(keyword);
                if (indexTitle < 0 && indexContent < 0) {
                  isMatch = false;
                } else {
                  if (indexContent < 0) indexContent = 0;
                  if (index === 0) firstOccur = indexContent;
                }
              });
            } else {
              isMatch = false;
            }

            if (!isMatch || firstOccur < 0) return;

            let start = firstOccur - 30;
            let end = firstOccur + 100;
            let pre = "";
            let post = "";

            if (start < 0) start = 0;
            if (start === 0) end = 100;
            else pre = "...";

            if (end > rawContent.length) end = rawContent.length;
            else post = "...";

            const displayTitle = highlightText(rawTitle, keywords);
            const matchContent = highlightText(rawContent.substring(start, end), keywords);

            str += '<div class="local-search__hit-item">';
            if (oneImage) {
              str += `<div class="search-left"><img src="${escapeHTML(oneImage)}" alt="${escapeHTML(
                rawTitle
              )}" data-fancybox="gallery">`;
            } else {
              str += '<div class="search-left" style="width:0">';
            }
            str += "</div>";

            if (oneImage) {
              str += `<div class="search-right"><a href="${escapeHTML(
                dataUrl
              )}" class="search-result-title">${displayTitle}</a>`;
            } else {
              str += `<div class="search-right" style="width: 100%"><a href="${escapeHTML(
                dataUrl
              )}" class="search-result-title">${displayTitle}</a>`;
            }

            count += 1;

            if (rawContent !== "") {
              str +=
                '<p class="search-result" onclick="pjax.loadUrl(`' +
                dataUrl +
                '`)">' +
                pre +
                matchContent +
                post +
                "</p>";
            }

            if (dataTags.length) {
              str += '<div class="search-result-tags">';
              for (let i = 0; i < dataTags.length; i++) {
                const element = dataTags[i].trim();
                str +=
                  '<a class="tag-list" href="/tags/' +
                  element +
                  '/" data-pjax-state="" one-link-mark="yes">#' +
                  element +
                  "</a>";
              }
              str += "</div>";
            }
            str += "</div></div>";
          });

          if (count === 0) {
            str +=
              '<div id="local-search__hits-empty">' +
              GLOBAL_CONFIG.localSearch.languages.hits_empty.replace(/\$\{query}/, escapeHTML(query)) +
              "</div>";
          }
          str += "</div>";
          $resultContent.innerHTML = str;
          $loadingStatus.innerHTML = "";
          window.pjax && window.pjax.refresh($resultContent);
        })
        .catch(error => {
          console.error("执行站内搜索失败:", error);
          if ($input.value.trim() !== query) return;
          $loadingStatus.innerHTML = "";
          $resultContent.innerHTML = '<div id="local-search__hits-empty">搜索数据库加载失败，请刷新重试</div>';
        });
    });
  };

  searchClickFn();
  searchClickFnOnce();

  // pjax
  window.addEventListener("pjax:complete", () => {
    !anzhiyu.isHidden($searchMask) && closeSearch();
    searchClickFn();
  });
});

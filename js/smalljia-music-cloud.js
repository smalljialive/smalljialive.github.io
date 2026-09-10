(function () {
  "use strict";

  if (window.__smallJiaMusicCloudLoaded) return;
  window.__smallJiaMusicCloudLoaded = true;

  const SUPABASE_URL = "https://yluidpgnvfurcomnexjr.supabase.co";
  const SUPABASE_KEY = "sb_publishable_ouIhEhTVrbsU98a0klTEdA_DEHjJvhT";
  const LOCAL_PLAYLIST_KEY = "smalljia_music_custom_playlists_v1";

  let cloud = null;

  const normalize = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’\"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const readLocal = () => {
    try {
      const value = JSON.parse(localStorage.getItem(LOCAL_PLAYLIST_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  };

  const trackKey = track => track?.key || (track?.id
    ? `${track.server || track.source || "netease"}:${track.id}`
    : `${track?.name || "未知歌曲"}::${track?.artist || "未知歌手"}`.toLowerCase());

  const serializeTrack = track => ({
    id: track?.id || "",
    server: track?.server || track?.source || "netease",
    source: track?.source || track?.server || "netease",
    name: track?.name || "未知歌曲",
    artist: track?.artist || "未知歌手",
    album: track?.album || "",
    cover: track?.cover || "",
    url: "",
    lrc: "",
    key: trackKey(track),
    __gdStudio: track?.__gdStudio ? { ...track.__gdStudio } : undefined,
  });

  const mergeTracks = (first = [], second = []) => {
    const result = [];
    const seen = new Set();
    [...first, ...second].forEach(track => {
      const item = serializeTrack(track);
      const key = trackKey(item);
      if (seen.has(key)) return;
      seen.add(key);
      result.push(item);
    });
    return result;
  };

  class SmallJiaMusicCloud {
    constructor(app, library, client) {
      this.app = app;
      this.library = library;
      this.client = client;
      this.session = null;
      this.user = null;
      this.syncTimer = null;
      this.syncing = false;
      this.originalSave = library.savePlaylists?.bind(library) || null;
      this.dom = {};
    }

    async init() {
      this.injectUi();
      this.bindUi();
      this.patchLibrarySave();

      const { data } = await this.client.auth.getSession();
      await this.handleSession(data?.session || null, true);

      this.client.auth.onAuthStateChange((_event, session) => {
        setTimeout(() => this.handleSession(session || null, false), 0);
      });
    }

    injectUi() {
      const sidebar = this.app.root?.querySelector(".sjm-sidebar");
      if (sidebar && !this.app.root.querySelector("#sjm-account-card")) {
        const card = document.createElement("section");
        card.id = "sjm-account-card";
        card.className = "sjm-account-card";
        card.innerHTML = `
          <div class="sjm-account-icon">☁</div>
          <div class="sjm-account-copy">
            <strong id="sjm-account-title">本地模式</strong>
            <span id="sjm-account-subtitle">登录后跨设备同步歌单</span>
          </div>
          <button id="sjm-account-action" type="button">登录 / 注册</button>`;
        const note = sidebar.querySelector(".sjm-sidebar-note");
        sidebar.insertBefore(card, note || null);
      }

      if (!this.app.root.querySelector("#sjm-auth-modal")) {
        const modal = document.createElement("div");
        modal.id = "sjm-auth-modal";
        modal.className = "sjm-auth-modal";
        modal.hidden = true;
        modal.innerHTML = `
          <div class="sjm-auth-backdrop" data-sjm-auth-close></div>
          <section class="sjm-auth-panel" role="dialog" aria-modal="true" aria-labelledby="sjm-auth-title">
            <button class="sjm-auth-close" type="button" data-sjm-auth-close aria-label="关闭">×</button>
            <span class="sjm-eyebrow">SMALLJIA CLOUD</span>
            <h2 id="sjm-auth-title">登录音乐馆</h2>
            <p class="sjm-auth-desc">登录后，你创建的歌单会同步到云端，换电脑或无痕模式也能恢复。</p>
            <div class="sjm-auth-tabs">
              <button class="active" type="button" data-auth-mode="login">登录</button>
              <button type="button" data-auth-mode="signup">注册</button>
            </div>
            <form id="sjm-auth-form">
              <label>邮箱<input id="sjm-auth-email" type="email" autocomplete="email" required placeholder="you@example.com"></label>
              <label>密码<input id="sjm-auth-password" type="password" autocomplete="current-password" minlength="6" required placeholder="至少 6 位"></label>
              <button id="sjm-auth-submit" class="sjm-auth-submit" type="submit">登录</button>
            </form>
            <p id="sjm-auth-message" class="sjm-auth-message"></p>
            <p class="sjm-auth-tip">首次登录会自动把当前浏览器已有歌单与云端歌单合并并去重。</p>
          </section>`;
        this.app.root.appendChild(modal);
      }

      const byId = id => this.app.root.querySelector(`#${id}`);
      this.dom = {
        card: byId("sjm-account-card"),
        title: byId("sjm-account-title"),
        subtitle: byId("sjm-account-subtitle"),
        action: byId("sjm-account-action"),
        modal: byId("sjm-auth-modal"),
        form: byId("sjm-auth-form"),
        email: byId("sjm-auth-email"),
        password: byId("sjm-auth-password"),
        submit: byId("sjm-auth-submit"),
        message: byId("sjm-auth-message"),
        authTitle: byId("sjm-auth-title"),
        tabs: [...this.app.root.querySelectorAll("[data-auth-mode]")],
      };
      this.authMode = "login";
    }

    bindUi() {
      this.dom.action?.addEventListener("click", async () => {
        if (this.user) {
          if (!window.confirm("退出当前音乐馆账号？本地歌单仍会保留。")) return;
          await this.client.auth.signOut();
          return;
        }
        this.openModal("login");
      });

      this.app.root.querySelectorAll("[data-sjm-auth-close]").forEach(node => {
        node.addEventListener("click", () => this.closeModal());
      });

      this.dom.tabs.forEach(tab => {
        tab.addEventListener("click", () => this.setAuthMode(tab.dataset.authMode));
      });

      this.dom.form?.addEventListener("submit", async event => {
        event.preventDefault();
        const email = this.dom.email?.value.trim() || "";
        const password = this.dom.password?.value || "";
        if (!email || password.length < 6) return this.setMessage("请输入有效邮箱和至少 6 位密码。", true);
        this.setMessage(this.authMode === "signup" ? "正在创建账号…" : "正在登录…");
        this.dom.submit.disabled = true;
        try {
          if (this.authMode === "signup") {
            const { data, error } = await this.client.auth.signUp({
              email,
              password,
              options: { data: { display_name: email.split("@")[0] } },
            });
            if (error) throw error;
            if (!data?.session) {
              this.setMessage("注册成功，请先到邮箱完成验证，然后回来登录。", false, true);
            } else {
              this.setMessage("注册成功，正在同步歌单…");
            }
          } else {
            const { error } = await this.client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            this.setMessage("登录成功，正在同步歌单…");
          }
        } catch (error) {
          this.setMessage(error?.message || "操作失败，请稍后重试。", true);
        } finally {
          this.dom.submit.disabled = false;
        }
      });

      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && this.dom.modal && !this.dom.modal.hidden) this.closeModal();
      });
    }

    setAuthMode(mode) {
      this.authMode = mode === "signup" ? "signup" : "login";
      this.dom.tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.authMode === this.authMode));
      if (this.dom.authTitle) this.dom.authTitle.textContent = this.authMode === "signup" ? "注册音乐馆账号" : "登录音乐馆";
      if (this.dom.submit) this.dom.submit.textContent = this.authMode === "signup" ? "创建账号" : "登录";
      if (this.dom.password) this.dom.password.autocomplete = this.authMode === "signup" ? "new-password" : "current-password";
      this.setMessage("");
    }

    openModal(mode = "login") {
      this.setAuthMode(mode);
      if (!this.dom.modal) return;
      this.dom.modal.hidden = false;
      document.documentElement.classList.add("sjm-auth-open");
      setTimeout(() => this.dom.email?.focus(), 50);
    }

    closeModal() {
      if (!this.dom.modal) return;
      this.dom.modal.hidden = true;
      document.documentElement.classList.remove("sjm-auth-open");
    }

    setMessage(text, isError = false, isSuccess = false) {
      if (!this.dom.message) return;
      this.dom.message.textContent = text || "";
      this.dom.message.classList.toggle("error", !!isError);
      this.dom.message.classList.toggle("success", !!isSuccess);
    }

    patchLibrarySave() {
      if (!this.originalSave || this.library.__cloudSavePatched) return;
      this.library.__cloudSavePatched = true;
      this.library.savePlaylists = (...args) => {
        const result = this.originalSave(...args);
        if (this.user && !this.syncing) this.scheduleUpload();
        return result;
      };
    }

    scheduleUpload() {
      clearTimeout(this.syncTimer);
      this.updateAccount("syncing");
      this.syncTimer = setTimeout(() => this.uploadAll().catch(error => {
        console.error("SmallJia Music Cloud: upload failed", error);
        this.updateAccount("error");
        this.app.showToast?.("云端同步失败，本地歌单已保留");
      }), 700);
    }

    async handleSession(session, initial) {
      this.session = session;
      this.user = session?.user || null;
      if (!this.user) {
        this.updateAccount("local");
        return;
      }

      this.updateAccount("syncing");
      if (!initial) this.closeModal();
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        await this.mergeCloudAndLocal();
        this.updateAccount("synced");
        this.app.showToast?.("☁️ 云端歌单已同步");
      } catch (error) {
        console.error("SmallJia Music Cloud: initial sync failed", error);
        this.updateAccount("error");
        this.app.showToast?.("登录成功，但云端歌单同步失败");
      }
    }

    updateAccount(state) {
      if (!this.dom.card) return;
      this.dom.card.dataset.state = state;
      if (!this.user) {
        if (this.dom.title) this.dom.title.textContent = "本地模式";
        if (this.dom.subtitle) this.dom.subtitle.textContent = "登录后跨设备同步歌单";
        if (this.dom.action) this.dom.action.textContent = "登录 / 注册";
        return;
      }
      const email = this.user.email || "已登录";
      if (this.dom.title) this.dom.title.textContent = email;
      if (this.dom.subtitle) {
        this.dom.subtitle.textContent = state === "syncing" ? "正在同步云端歌单…"
          : state === "error" ? "云端暂时不可用 · 本地已保留"
          : "☁️ 歌单已同步";
      }
      if (this.dom.action) this.dom.action.textContent = "退出";
    }

    cloudTrackToLocal(row) {
      return {
        id: row.source_track_id || "",
        server: row.source || "netease",
        source: row.source || "netease",
        name: row.name || "未知歌曲",
        artist: row.artist || "未知歌手",
        album: row.album || "",
        cover: row.cover || "",
        url: "",
        lrc: "",
        key: row.track_key,
        __gdStudio: {
          source: row.source || "netease",
          urlId: row.url_id || row.source_track_id || "",
          lyricId: row.lyric_id || row.source_track_id || "",
          picId: row.pic_id || row.source_track_id || "",
        },
      };
    }

    async loadCloud() {
      const userId = this.user.id;
      const { data: playlists, error: playlistError } = await this.client
        .from("playlists")
        .select("id,client_id,name,created_at,updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (playlistError) throw playlistError;

      const { data: tracks, error: trackError } = await this.client
        .from("playlist_tracks")
        .select("playlist_id,track_key,source,source_track_id,name,artist,album,cover,lyric_id,pic_id,url_id,sort_order")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true });
      if (trackError) throw trackError;

      const byPlaylist = new Map();
      (tracks || []).forEach(row => {
        if (!byPlaylist.has(row.playlist_id)) byPlaylist.set(row.playlist_id, []);
        byPlaylist.get(row.playlist_id).push(this.cloudTrackToLocal(row));
      });

      return (playlists || []).map(row => ({
        id: row.client_id || row.id,
        name: row.name,
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        tracks: byPlaylist.get(row.id) || [],
      }));
    }

    mergePlaylistSets(localList, cloudList) {
      const merged = cloudList.map(item => ({ ...item, tracks: mergeTracks(item.tracks, []) }));
      localList.forEach(local => {
        let target = merged.find(item => item.id === local.id);
        if (!target) target = merged.find(item => normalize(item.name) === normalize(local.name));
        if (target) {
          target.tracks = mergeTracks(target.tracks, local.tracks || []);
          if (!target.name && local.name) target.name = local.name;
        } else {
          merged.push({
            id: local.id || `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: local.name || "我的歌单",
            createdAt: local.createdAt || Date.now(),
            tracks: mergeTracks(local.tracks || [], []),
          });
        }
      });
      return merged;
    }

    async mergeCloudAndLocal() {
      this.syncing = true;
      try {
        const local = Array.isArray(this.library.playlists) ? this.library.playlists : readLocal();
        const remote = await this.loadCloud();
        this.library.playlists = this.mergePlaylistSets(local, remote);
        if (!this.library.selectedPlaylistId || !this.library.playlists.some(item => item.id === this.library.selectedPlaylistId)) {
          this.library.selectedPlaylistId = this.library.playlists[0]?.id || "";
        }
        this.originalSave?.();
        this.library.renderPlaylists?.();
        await this.uploadAll(true);
      } finally {
        this.syncing = false;
      }
    }

    async uploadAll(silent = false) {
      if (!this.user) return;
      if (!silent) this.updateAccount("syncing");
      const userId = this.user.id;
      const playlists = Array.isArray(this.library.playlists) ? this.library.playlists : [];

      for (const local of playlists) {
        const clientId = local.id || `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        local.id = clientId;
        const { data: cloudPlaylist, error: upsertError } = await this.client
          .from("playlists")
          .upsert({
            user_id: userId,
            client_id: clientId,
            name: String(local.name || "我的歌单").slice(0, 50),
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,client_id" })
          .select("id")
          .single();
        if (upsertError) throw upsertError;

        const playlistId = cloudPlaylist.id;
        const { error: deleteError } = await this.client
          .from("playlist_tracks")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("user_id", userId);
        if (deleteError) throw deleteError;

        const rows = (local.tracks || []).map((track, index) => ({
          playlist_id: playlistId,
          user_id: userId,
          track_key: trackKey(track),
          source: track.server || track.source || "netease",
          source_track_id: track.id || null,
          name: track.name || "未知歌曲",
          artist: track.artist || null,
          album: track.album || null,
          cover: track.cover || null,
          lyric_id: track.__gdStudio?.lyricId || track.id || null,
          pic_id: track.__gdStudio?.picId || track.id || null,
          url_id: track.__gdStudio?.urlId || track.id || null,
          sort_order: index,
        }));
        if (rows.length) {
          const { error: insertError } = await this.client.from("playlist_tracks").insert(rows);
          if (insertError) throw insertError;
        }
      }

      const clientIds = playlists.map(item => item.id).filter(Boolean);
      const { data: remoteRows, error: remoteError } = await this.client
        .from("playlists")
        .select("id,client_id")
        .eq("user_id", userId);
      if (remoteError) throw remoteError;
      const stale = (remoteRows || []).filter(row => !clientIds.includes(row.client_id));
      if (stale.length) {
        const { error: staleError } = await this.client
          .from("playlists")
          .delete()
          .in("id", stale.map(row => row.id))
          .eq("user_id", userId);
        if (staleError) throw staleError;
      }

      this.updateAccount("synced");
    }
  }

  const boot = () => {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      const app = window.SmallJiaMusic;
      const library = window.SmallJiaMusicLibrary;
      const supabaseGlobal = window.supabase;
      if (app?.root && library?.app === app && supabaseGlobal?.createClient) {
        clearInterval(timer);
        if (cloud?.app === app) return;
        const client = supabaseGlobal.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        cloud = new SmallJiaMusicCloud(app, library, client);
        window.SmallJiaMusicCloud = cloud;
        cloud.init().catch(error => {
          console.error("SmallJia Music Cloud: init failed", error);
          app.showToast?.("云端登录模块初始化失败，本地模式仍可使用");
        });
      }
      if (attempts > 200) clearInterval(timer);
    }, 100);
  };

  const destroy = () => {
    clearTimeout(cloud?.syncTimer);
    cloud = null;
    window.SmallJiaMusicCloud = null;
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", boot);
  document.addEventListener("pjax:send", destroy);
})();

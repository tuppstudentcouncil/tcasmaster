import { getIdTokenResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const authButtons = document.querySelectorAll("[data-auth-button], .nav-actions .login-btn");

function createAuthIcon() {
  const icon = document.createElement("span");
  icon.className = "ui-icon ui-icon-user";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>';
  return icon;
}

function createChevronIcon() {
  const icon = document.createElement("span");
  icon.className = "auth-arrow";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="m6 9 6 6 6-6"/></svg>';
  return icon;
}

function createTextElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function createProfileAvatar(user, className = "auth-avatar") {
  const wrapper = document.createElement("div");
  wrapper.className = `${className}-wrap`;

  const displayName = user.displayName || user.email || "U";
  const initial = displayName.trim().charAt(0).toUpperCase();

  const fallback = document.createElement("span");
  fallback.className = `${className}-fallback`;
  fallback.textContent = initial;

  if (user.photoURL) {
    const avatar = document.createElement("img");
    avatar.className = className;
    avatar.src = user.photoURL;
    avatar.alt = displayName;
    avatar.referrerPolicy = "no-referrer";
    avatar.crossOrigin = "anonymous";
    avatar.loading = "eager";

    avatar.onload = () => {
      fallback.remove();
    };

    avatar.onerror = () => {
      avatar.remove();
      if (!wrapper.contains(fallback)) {
        wrapper.appendChild(fallback);
      }
    };

    wrapper.appendChild(fallback);
    wrapper.appendChild(avatar);
  } else {
    wrapper.appendChild(fallback);
  }

  return wrapper;
}

function createProfileMenu(user) {
  const menu = document.createElement("div");
  menu.className = "profile-menu";
  menu.setAttribute("data-profile-menu", "");
  menu.setAttribute("role", "menu");

  const identity = createTextElement("div", "profile-menu-identity", "");
  const avatarWrap = createProfileAvatar(user, "profile-menu-avatar");
  identity.appendChild(avatarWrap);

  const identityCopy = createTextElement("div", "profile-menu-copy", "");
  identityCopy.appendChild(createTextElement("strong", "", user.displayName || "บัญชีของฉัน"));
  identityCopy.appendChild(createTextElement("span", "", user.email || ""));
  identity.appendChild(identityCopy);
  menu.appendChild(identity);

  menu.appendChild(createTextElement("div", "profile-menu-divider", ""));
  
  const profileLink = document.createElement("a");
  profileLink.href = "profile.html";
  profileLink.textContent = "ข้อมูลโปรไฟล์";
  profileLink.setAttribute("role", "menuitem");
  menu.appendChild(profileLink);

  const lobbyLink = document.createElement("a");
  lobbyLink.href = "index.html";
  lobbyLink.textContent = "เข้าสู่ Lobby";
  lobbyLink.setAttribute("role", "menuitem");
  menu.appendChild(lobbyLink);

  const communityLink = document.createElement("a");
  communityLink.href = "community.html";
  communityLink.textContent = "ชุมชนและพอร์ต";
  communityLink.setAttribute("role", "menuitem");
  menu.appendChild(communityLink);

  const adminSlot = document.createElement("div");
  adminSlot.dataset.adminMenuSlot = "";
  menu.appendChild(adminSlot);

  menu.appendChild(createTextElement("div", "profile-menu-divider", ""));
  const logoutButton = createTextElement("button", "profile-menu-logout", "ออกจากระบบ");
  logoutButton.type = "button";
  logoutButton.setAttribute("role", "menuitem");
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "กำลังออกจากระบบ...";
    try {
      await signOut(auth);
      window.location.href = "login.html";
    } catch (error) {
      console.error(error);
      logoutButton.disabled = false;
      logoutButton.textContent = "ออกจากระบบ";
    }
  });
  menu.appendChild(logoutButton);
  return menu;
}

async function addAdminMenuLink(user, menu) {
  if (!menu || !user) return;
  try {
    const tokenResult = await getIdTokenResult(user, true);
    if (!tokenResult?.claims?.admin) return;
    const slot = menu.querySelector("[data-admin-menu-slot]");
    if (!slot) return;
    const adminLink = document.createElement("a");
    adminLink.href = "admin.html";
    adminLink.textContent = "จัดการระบบ (Admin)";
    adminLink.setAttribute("role", "menuitem");
    slot.appendChild(adminLink);
  } catch (error) {
    console.warn("ตรวจสอบสิทธิ์ Admin ไม่สำเร็จ", error);
  }
}

onAuthStateChanged(auth, (user) => {
  const greeting = document.querySelector("[data-lobby-greeting]");
  if (greeting) {
    greeting.hidden = !user;
    greeting.textContent = user ? `ยินดีต้อนรับกลับ, ${user.displayName || user.email || "เพื่อนของเรา"}` : "";
  }

  // If on profile page, populate user data
  if (user && document.body.classList.contains("profile-page")) {
    const nameEl = document.getElementById("userDisplayName");
    const emailEl = document.getElementById("userEmail");
    const usernameEl = document.getElementById("userUsername");
    const avatarImgEl = document.getElementById("userAvatarImg");
    const formFullNameEl = document.getElementById("formFullName");

    if (user.displayName) {
      if (nameEl) nameEl.textContent = user.displayName;
      if (formFullNameEl && !formFullNameEl.value) formFullNameEl.value = user.displayName;
    }
    if (user.email) {
      if (emailEl) emailEl.textContent = user.email;
      if (usernameEl) {
        const username = user.email.split("@")[0];
        usernameEl.textContent = `@${username}`;
      }
    }
    if (user.photoURL && avatarImgEl) {
      avatarImgEl.src = user.photoURL;
      avatarImgEl.style.display = "block";
    }
  }

  authButtons.forEach((button) => {
    const navActions = button.closest(".nav-actions") || button.parentElement;
    const oldMenu = navActions?.querySelector("[data-profile-menu]");
    oldMenu?.remove();

    if (!user) {
      const existingIcon = button.querySelector(".ui-icon") || createAuthIcon();
      button.replaceChildren(existingIcon, document.createTextNode("เข้าสู่ระบบ"));
      button.dataset.loggedIn = "false";
      button.href = "login.html";
      button.removeAttribute("aria-expanded");
      button.removeAttribute("aria-haspopup");
      button.title = "เข้าสู่ระบบ";
      button.onclick = null;
      return;
    }

    const displayName = user.displayName || user.email || "บัญชีของฉัน";
    button.replaceChildren();
    
    const avatarWrap = createProfileAvatar(user, "auth-avatar");
    button.appendChild(avatarWrap);

    button.appendChild(createTextElement("span", "auth-name", displayName));
    button.appendChild(createChevronIcon());
    button.dataset.loggedIn = "true";
    button.title = user.email || displayName;
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-expanded", "false");
    button.removeAttribute("href");
    button.removeAttribute("data-modal");

    const menu = createProfileMenu(user);
    navActions?.appendChild(menu);
    addAdminMenuLink(user, menu);
    button.onclick = (event) => {
      event.preventDefault();
      const open = menu.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
    };
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-auth-button], [data-profile-menu]")) return;
  document.querySelectorAll("[data-profile-menu].open").forEach((menu) => {
    menu.classList.remove("open");
    menu.parentElement?.querySelector('[data-logged-in="true"]')?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll("[data-profile-menu].open").forEach((menu) => {
    menu.classList.remove("open");
    menu.parentElement?.querySelector('[data-logged-in="true"]')?.setAttribute("aria-expanded", "false");
  });
});

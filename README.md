# 🛡️ aCAPTCHA v1.1

aCAPTCHA is a quick, client-side CAPTCHA you can drop into your project — no backend, no tracking, no API keys, no fuss.

Built in a day as a passion project for devs who want simple, privacy-friendly bot protection without selling their soul.

---

## What it does:

- 🧩 Visual grid puzzles  
- 🔊 Audio digit checks (0–9)  
- 💡 Hybrid mode (visual + audio)  
- 🌙 Dark mode toggle  
- 📊 Basic in-browser stats (success rate, solve time)  
- 🔐 Some bot-blocking tricks like devtools detection and selection blocking

---

## Heads up — it’s NOT AI

This isn’t Google-level reCAPTCHA. No machine learning here, just clever UI logic.

Perfect for small projects, static sites, and offline apps where you just need *some* protection without tracking or complexity.

---

## Quick start

1. Add the script:

```
<script src="captcha-v2.0.js" defer></script>
```

2. Drop the tag where you want the CAPTCHA:

```
<captcha-element type="both" dark-mode="true"></captcha-element>
```

---

## Self-hosting & audio note

If you’re running it offline, make sure the `sounds/` folder with `0.mp3`–`9.mp3` is next to the script.

If the audio files are missing, the audio feature will break — some browsers might try speech synthesis but don’t count on it offline.

---

## 📦 Versions & Releases

Want the latest, or need an older version?  
Hit up the GitHub releases page:  
👉 [https://github.com/arooshbd2024/aCAPTCHA/releases](https://github.com/arooshbd2024/aCAPTCHA/releases)

---

## Docs & stuff

Check it out: [https://acaptcha.dev](https://acaptcha.dev)

---

Made with ❤️ in a day — no promises, just something useful.

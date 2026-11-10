/* =========================================================
   Personal Website - JavaScript
   Web Technology Lab - Assignment 1
   ---------------------------------------------------------
   One script file is shared by all pages. Each feature first
   checks that its element exists on the current page.
   ========================================================= */

/* ---------- 1. Highlight the link of the current page ---------- */
function highlightActiveLink() {
    var currentPage = window.location.pathname.split("/").pop() || "index.html";
    var links = document.querySelectorAll(".nav-links a");

    for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute("href") === currentPage) {
            links[i].classList.add("active");
        }
    }
}

/* Soft highlight in the nav that slides to the hovered link
   and returns to the current page's link */
function setupNavPill() {
    var list = document.querySelector(".nav-links");
    if (!list) return;

    var pill = document.createElement("span");
    pill.className = "nav-pill";
    pill.setAttribute("aria-hidden", "true");
    list.insertBefore(pill, list.firstChild);
    list.classList.add("has-pill");

    function moveTo(link) {
        if (!link || link.offsetWidth === 0) {
            pill.style.opacity = "0";
            return;
        }
        pill.style.opacity = "1";
        pill.style.width = link.offsetWidth + "px";
        pill.style.height = link.offsetHeight + "px";
        pill.style.transform = "translate(" + link.offsetLeft + "px, " + link.offsetTop + "px)";
    }

    function backToActive() {
        moveTo(list.querySelector("a.active"));
    }

    // Place it on the current page's link straight away (no slide)
    pill.style.transition = "none";
    backToActive();
    void pill.offsetWidth;
    pill.style.transition = "";

    list.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("mouseenter", function () { moveTo(link); });
        link.addEventListener("focus", function () { moveTo(link); });
    });
    list.addEventListener("mouseleave", backToActive);
    window.addEventListener("resize", backToActive);
    if (document.fonts) document.fonts.ready.then(backToActive);   // widths change when the font loads
}

/* Nav gets a stronger shadow and moves up a little once you scroll */
function setupNavScroll() {
    var nav = document.querySelector("nav");
    if (!nav) return;
    function update() {
        nav.classList.toggle("scrolled", window.scrollY > 10);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
}

/* ---------- 2. Mobile menu (hamburger) ---------- */
function toggleMenu() {
    document.querySelector(".nav-links").classList.toggle("open");
}

/* ---------- 3. Theme: Light / Dark / System ---------- */
/* "mode"  = what the user picked  (light, dark or system)
   "theme" = what is actually shown (light or dark)
   The small script in each page's <head> applies the saved mode
   before the page is drawn; these functions handle changes. */

var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

// Turns a mode into the real theme ("system" follows the device setting)
function resolveTheme(mode) {
    if (mode === "system") {
        return darkQuery.matches ? "dark" : "light";
    }
    return mode;
}

// Called by the three theme buttons in the navigation bar
function setThemeMode(mode, event) {
    var root = document.documentElement;
    if (root.getAttribute("data-mode") === mode) return;

    root.setAttribute("data-mode", mode);   // slides the bubble
    try {
        localStorage.setItem("themeMode", mode);
    } catch (e) {
        // Storage may be blocked (e.g. private mode) - ignore
    }

    applyTheme(resolveTheme(mode), event);

    var names = { light: "☀️ Light theme", dark: "🌙 Dark theme", system: "💻 Following your system theme" };
    showToast(names[mode]);
}

// Switches the colours with an animation
function applyTheme(theme, event) {
    var root = document.documentElement;
    if (root.getAttribute("data-theme") === theme) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Animation 1: a circle grows from the clicked button (View Transitions API)
    if (document.startViewTransition && !reduceMotion) {
        var x = event ? event.clientX : window.innerWidth / 2;
        var y = event ? event.clientY : 0;
        // radius big enough to reach the farthest corner of the screen
        var radius = Math.hypot(Math.max(x, window.innerWidth - x),
                                Math.max(y, window.innerHeight - y));

        var transition = document.startViewTransition(function () {
            root.setAttribute("data-theme", theme);
        });

        transition.ready.then(function () {
            root.animate(
                { clipPath: ["circle(0px at " + x + "px " + y + "px)",
                             "circle(" + radius + "px at " + x + "px " + y + "px)"] },
                { duration: 700, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
            );
        }).catch(function () {
            // Animation was skipped (e.g. tab hidden) - the theme is still applied
        });
        return;
    }

    // Animation 2 (older browsers): smooth colour fade
    root.classList.add("theme-fade");
    root.setAttribute("data-theme", theme);
    setTimeout(function () {
        root.classList.remove("theme-fade");
    }, 600);
}

// If "System" is selected, follow the device when its theme changes
darkQuery.addEventListener("change", function () {
    if (document.documentElement.getAttribute("data-mode") === "system") {
        applyTheme(resolveTheme("system"));
    }
});

/* Spotlight effect: the glow inside a card follows the mouse */
function setupSpotlight() {
    document.addEventListener("mousemove", function (e) {
        var card = e.target.closest ? e.target.closest(".card") : null;
        if (!card) return;
        var box = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - box.left) + "px");
        card.style.setProperty("--my", (e.clientY - box.top) + "px");
    });
}

/* ---------- 4. Toast message (replaces the plain alert box) ---------- */
function showToast(message) {
    var toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 3000);
}

/* ---------- 5. Greeting based on the time of day ---------- */
function setGreeting() {
    var greeting = document.getElementById("greeting");
    if (!greeting) return;

    var hour = new Date().getHours();
    var text;

    if (hour < 12) {
        text = "Good morning";
    } else if (hour < 17) {
        text = "Good afternoon";
    } else {
        text = "Good evening";
    }
    greeting.textContent = text + ", I'm";
}

/* ---------- 6. Rotating role text ---------- */
/* Every few seconds the current role blurs and slides up out of view,
   and the next one slides up into place. */
function startRoleRotator() {
    var element = document.getElementById("roleWord");
    if (!element) return;

    var words = ["Upcoming Software Engineer", "Computer Science Student", "Tech Enthusiast", "Lifelong Learner"];
    var index = 0;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setInterval(function () {
        index = (index + 1) % words.length;

        // No animation support or user prefers less motion: just swap the text
        if (reduceMotion || !element.animate) {
            element.textContent = words[index];
            return;
        }

        var out = element.animate([
            { opacity: 1, transform: "translateY(0)",    filter: "blur(0)" },
            { opacity: 0, transform: "translateY(-45%)", filter: "blur(6px)" }
        ], { duration: 350, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });

        out.onfinish = function () {
            element.textContent = words[index];
            element.animate([
                { opacity: 0, transform: "translateY(45%)", filter: "blur(6px)" },
                { opacity: 1, transform: "translateY(0)",   filter: "blur(0)" }
            ], { duration: 500, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
            out.cancel();
        };
    }, 2800);
}

/* Avatar tilts in 3D towards the mouse (desktop only) */
function setupHeroTilt() {
    var area = document.getElementById("heroVisual");
    var card = document.getElementById("avatarCard");
    if (!area || !card) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hasMouse = window.matchMedia("(hover: hover)").matches;
    if (reduceMotion || !hasMouse) return;

    area.addEventListener("mousemove", function (e) {
        var box = area.getBoundingClientRect();
        var x = (e.clientX - box.left) / box.width - 0.5;    // -0.5 to 0.5
        var y = (e.clientY - box.top) / box.height - 0.5;
        card.style.setProperty("--ry", (x * 20) + "deg");
        card.style.setProperty("--rx", (-y * 20) + "deg");
        card.style.setProperty("--gx", ((x + 0.5) * 100) + "%");
        card.style.setProperty("--gy", ((y + 0.5) * 100) + "%");
    });

    area.addEventListener("mouseleave", function () {
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--rx", "0deg");
        card.style.removeProperty("--gx");
        card.style.removeProperty("--gy");
    });
}

/* ---------- 7. Live digital clock ---------- */
function startClock() {
    var clock = document.getElementById("clock");
    if (!clock) return;
    var dateText = document.getElementById("dateText");

    var zone = "Asia/Kolkata";     // always show the time in Hubballi (IST)

    function update() {
        var now = new Date();
        clock.textContent = now.toLocaleTimeString("en-IN", { timeZone: zone });
        dateText.textContent = now.toLocaleDateString("en-IN", {
            timeZone: zone, weekday: "long", day: "numeric", month: "long", year: "numeric"
        });
    }
    update();
    setInterval(update, 1000);

    // Tell visitors in other time zones how far ahead/behind Hubballi is
    var note = document.getElementById("tzNote");
    if (note) {
        var istOffset = 330;                                   // IST = UTC + 5:30
        var visitorOffset = -new Date().getTimezoneOffset();   // visitor's minutes from UTC
        var diff = istOffset - visitorOffset;

        if (diff === 0) {
            note.textContent = "Same time zone as you";
        } else {
            var abs = Math.abs(diff);
            var hours = Math.floor(abs / 60);
            var mins = abs % 60;
            var gap = (hours ? hours + "h" : "") + (hours && mins ? " " : "") + (mins ? mins + "m" : "");
            note.textContent = gap + (diff > 0 ? " ahead of you" : " behind you");
        }
    }
}

/* ---------- 8. Reveal cards and count up numbers on scroll ---------- */
function setupScrollEffects() {
    var items = document.querySelectorAll(".reveal");

    // Older browsers: just show everything
    if (!("IntersectionObserver" in window)) {
        items.forEach(function (el) { el.classList.add("visible"); });
        countUp(document);
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                countUp(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    items.forEach(function (el) { observer.observe(el); });
}

/* Counts each .stat-num from 0 up to its data-to value */
function countUp(container) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    container.querySelectorAll(".stat-num[data-to]").forEach(function (el) {
        var target = parseFloat(el.getAttribute("data-to"));
        var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var suffix = el.getAttribute("data-suffix") || "";
        if (reduceMotion) return;   // the final value is already in the HTML

        var duration = 1400;
        var start = null;

        function step(time) {
            if (start === null) start = time;
            var progress = Math.min((time - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);     // fast start, slow finish
            el.textContent = (target * eased).toFixed(decimals) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    });
}

/* Thin bar at the top of the resume page that shows how far you have scrolled */
function setupScrollProgress() {
    var bar = document.getElementById("scrollProgress");
    if (!bar) return;

    function update() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? window.scrollY / max : 0;
        bar.style.transform = "scaleX(" + ratio + ")";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
}

/* ---------- 9. Back-to-top button ---------- */
function setupTopButton() {
    var button = document.getElementById("topBtn");

    window.addEventListener("scroll", function () {
        button.style.display = window.scrollY > 300 ? "block" : "none";
    });

    button.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

/* ---------- 10. Print / save as PDF ---------- */
function printPage() {
    window.print();
}

/* ---------- 11. Bio-data photo preview ---------- */
function showPhoto(url) {
    var box = document.getElementById("photoBox");
    box.style.backgroundImage = "url('" + url + "')";
    box.textContent = "";
    box.classList.add("has-photo");
}

// Called when a photo is chosen with the "Upload photo" button
function previewPhoto(input) {
    var file = input.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
        // Shrink the photo first so it fits in the browser's storage
        var img = new Image();
        img.onload = function () {
            var scale = Math.min(1, 600 / img.height);
            var canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            var small = canvas.toDataURL("image/jpeg", 0.85);

            showPhoto(small);
            try {
                localStorage.setItem("biodataPhoto", small);
                showToast("Photo saved");
            } catch (err) {
                showToast("Photo shown, but could not be saved in this browser");
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/* Animated avatar in the photo box: eyes follow the mouse, click to wink */
function setupAvatarBot() {
    var bot = document.getElementById("avatarBot");
    if (!bot) return;

    var whites = bot.querySelectorAll(".ab-white");
    var pupils = bot.querySelectorAll(".ab-pupil");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hasMouse = window.matchMedia("(hover: hover)").matches;

    if (!reduceMotion && hasMouse) {
        document.addEventListener("mousemove", function (e) {
            if (!document.body.contains(bot)) return;     // replaced by a photo
            for (var i = 0; i < whites.length; i++) {
                var box = whites[i].getBoundingClientRect();
                var dx = e.clientX - (box.left + box.width / 2);
                var dy = e.clientY - (box.top + box.height / 2);
                var distance = Math.hypot(dx, dy) || 1;
                var move = Math.min(2.6, distance / 40) / distance;   // max 2.6 units
                pupils[i].style.transform = "translate(" + (dx * move) + "px, " + (dy * move) + "px)";
            }
        });
    }

    bot.addEventListener("click", function () {
        bot.classList.remove("wink");
        void bot.offsetWidth;            // restart the animation
        bot.classList.add("wink");
        setTimeout(function () { bot.classList.remove("wink"); }, 600);
        showToast("Hi! Use \"Upload photo\" to add a picture");
    });
}

// On page load: use the uploaded photo if one was saved, otherwise images/photo.jpg
function loadSavedPhoto() {
    var box = document.getElementById("photoBox");
    if (!box) return;

    var saved = null;
    try { saved = localStorage.getItem("biodataPhoto"); } catch (e) {}
    if (saved) {
        showPhoto(saved);
        return;
    }

    var src = box.getAttribute("data-src");
    if (!src) return;
    var test = new Image();
    test.onload = function () { showPhoto(src); };   // only if the file exists
    test.src = src;
}

/* Bio-data: show the current age next to the date of birth */
function showAge() {
    var chip = document.querySelector(".age-chip[data-dob]");
    if (!chip) return;

    var dob = new Date(chip.getAttribute("data-dob") + "T00:00:00");
    var today = new Date();
    var age = today.getFullYear() - dob.getFullYear();
    var birthdayPassed = today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!birthdayPassed) age--;

    chip.textContent = age + " years";
}

/* Number the items of each list so they animate in one after another */
function staggerTiles() {
    document.querySelectorAll(".biodata tbody, .stagger").forEach(function (body) {
        Array.prototype.forEach.call(body.children, function (row, i) {
            row.style.setProperty("--i", i);
        });
    });
}

/* ---------- 12. Contact form validation ---------- */
function setError(id, message) {
    document.getElementById(id + "Error").textContent = message;
    document.getElementById(id).classList.toggle("invalid", message !== "");
}

function validateForm(event) {
    event.preventDefault();   // stop the page from reloading

    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var phone = document.getElementById("phone").value.trim();
    var subject = document.getElementById("subject").value;
    var message = document.getElementById("message").value.trim();

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var phonePattern = /^[6-9][0-9]{9}$/;     // 10-digit Indian mobile number
    var valid = true;

    if (name.length < 3) {
        setError("name", "Please enter at least 3 characters.");
        valid = false;
    } else {
        setError("name", "");
    }

    if (!emailPattern.test(email)) {
        setError("email", "Please enter a valid email address.");
        valid = false;
    } else {
        setError("email", "");
    }

    if (phone !== "" && !phonePattern.test(phone)) {
        setError("phone", "Enter a valid 10-digit mobile number.");
        valid = false;
    } else {
        setError("phone", "");
    }

    if (subject === "") {
        setError("subject", "Please choose a subject.");
        valid = false;
    } else {
        setError("subject", "");
    }

    if (message.length < 10) {
        setError("message", "Message should be at least 10 characters.");
        valid = false;
    } else {
        setError("message", "");
    }

    if (valid) {
        var box = document.getElementById("successBox");
        box.innerHTML = "<b>Thank you, " + escapeHTML(name) + "!</b> " +
            "Your message about <i>" + escapeHTML(subject) + "</i> has been received. " +
            "I will reply to <b>" + escapeHTML(email) + "</b> soon.";
        box.style.display = "block";
        document.getElementById("contactForm").reset();
        updateCharCount();
        showToast("✅ Message sent successfully!");
    }
}

/* Prevents HTML typed in the form from being run on the page */
function escapeHTML(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function updateCharCount() {
    var box = document.getElementById("message");
    if (!box) return;
    document.getElementById("charCount").textContent = box.value.length + " / 300";
}

/* ---------- Run everything when the page has loaded ---------- */
document.addEventListener("DOMContentLoaded", function () {
    setupSpotlight();
    highlightActiveLink();
    setupNavPill();
    setupNavScroll();
    setGreeting();
    startRoleRotator();
    setupHeroTilt();
    showAge();
    staggerTiles();
    loadSavedPhoto();
    setupAvatarBot();
    setupScrollProgress();
    startClock();
    setupScrollEffects();
    setupTopButton();

    document.getElementById("year").textContent = new Date().getFullYear();

    var form = document.getElementById("contactForm");
    if (form) {
        form.addEventListener("submit", validateForm);
        document.getElementById("message").addEventListener("input", updateCharCount);

        // "Clear" button: also reset the counter and error messages
        form.addEventListener("reset", function () {
            setTimeout(function () {
                updateCharCount();
                ["name", "email", "phone", "subject", "message"].forEach(function (id) {
                    setError(id, "");
                });
            }, 0);
        });
    }
});

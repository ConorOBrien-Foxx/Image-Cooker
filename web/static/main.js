const makeImageCard = (title, image, ...actions) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
        <div class="card">
            <div class="card-image">
                <!-- img goes here -->
                <span class="card-title"></span>
            </div>
            <!-- <div class="card-content">
            </div> -->
        </div>
    `;
    const card = wrapper.firstElementChild;
    card.querySelector(".card-title").textContent = title;
    // todo: allow content to be array?
    card.querySelector(".card-image").prepend(image);
    if(actions) {
        const cardActions = document.createElement("div");
        cardActions.classList.add("card-action");
        for(let action of actions) {
            const { className, text, content } = action;
            const button = document.createElement("button");
            button.className = `tight btn waves-effect waves-light ${className}`;
            if(text) {
                button.textContent = text;
            }
            if(content) {
                button.appendChild(content);
            }
            cardActions.appendChild(button);
        }
        card.appendChild(cardActions);
    }
    return card;
};

const materialIconElement = (name, tag="i") => {
    const element = document.createElement(tag);
    element.className = `material-icons-outlined`;
    element.textContent = name;
    return element;
};

const PNG_PREFIX = "data:image/png;base64,";
const AppState = {
    imageBase64: null,
    gallery: null,
    left: 0,
    right: -1,
    base64NoPrefix() {
        return this.imageBase64.replace(/^data:image\/.+;base64,/, "");
    },
    init() {
        const galleryContainer = document.getElementById("galleryContainer");
        galleryContainer.addEventListener("click", ev => {
            let { target } = ev;
            if(target.tagName !== "BUTTON") {
                target = target.closest("button");
                if(target?.tagName !== "BUTTON") {
                    return;
                }
            }
            const myCard = ev.target.closest(".card");
            const myIndex = [...myCard.parentElement.children].indexOf(myCard);
            if(target.classList.contains("set-left")) {
                this.setLeft(myIndex);
            }
            if(target.classList.contains("set-right")) {
                this.setRight(myIndex);
            }
            this.updateFocusSets();
            this.updateDisplayCompare();
        });
        this.updateFocusSets();
    },
    updateFocusSets() {
        const galleryContainer = document.getElementById("galleryContainer");
        const cards = [...galleryContainer.querySelectorAll(".card")];
        if(!cards) {
            return;
        }
        
        for(let button of galleryContainer.querySelectorAll(".set-left, .set-right")) {
            button.classList.remove("secondary");
        }
        cards.at(this.left)?.querySelector("button:first-child").classList.add("secondary");
        cards.at(this.right)?.querySelector("button:last-child").classList.add("secondary");
    },
    setLeft(idx) {
        return this.left = idx;
    },
    setRight(idx) {
        return this.right = idx;
    },
    setGallery({ history, result }) {
        return this.gallery = history.concat(result).map(rawBase64 => PNG_PREFIX + rawBase64);
    },
    updateGalleryDisplay() {
        // TODO: diffing by src
        const galleryContainer = document.getElementById("galleryContainer");
        while(galleryContainer.firstChild) {
            galleryContainer.removeChild(galleryContainer.firstChild);
        }
        this.gallery.forEach((src, idx) => {
            const newImgElement = document.createElement("img");
            newImgElement.src = src;
            const card = makeImageCard("", newImgElement, {
                content: materialIconElement("arrow_back_ios_new"),
                className: "set-left",
            }, {
                content: materialIconElement("arrow_forward_ios"),
                className: "set-right",
            });
            galleryContainer.appendChild(card);
        });
        this.updateFocusSets();
    },
    updateDisplayCompare() {
        document.getElementById("beforeImage").src = this.gallery.at(this.left);
        document.getElementById("afterImage").src = this.gallery.at(this.right);
    },
};

window.addEventListener("load", function () {
    // https://materializeweb.com/themes.html
    // Change Theme Setting with a Switch
    const currentTheme = localStorage.getItem("theme");
    const switchElem = document.querySelector("#theme-switch");

    const setDarkTheme = (isDark) => {
        if (isDark) {
            switchElem.classList.add("is-dark");
            switchElem.querySelector("i").innerText = "light_mode";
            switchElem.title = "Switch to light mode";
            document.documentElement.setAttribute("theme", "dark");
        }
        else {
            switchElem.classList.remove("is-dark");
            switchElem.querySelector("i").innerText = "dark_mode";
            switchElem.title = "Switch to dark mode";
            document.documentElement.setAttribute("theme");
        }
    };

    if (switchElem) {
        // Load
        if (currentTheme) {
            setDarkTheme(true);
        }
        // Change
        switchElem.addEventListener("click", e => {
            e.preventDefault();
            if (!switchElem.classList.contains("is-dark")) {
                // Dark Theme
                document.documentElement.setAttribute("theme", "dark");
                localStorage.setItem("theme", "dark");
                setDarkTheme(true);
            }
            else {
                // Light Theme
                document.documentElement.removeAttribute("theme");
                localStorage.removeItem("theme");
                setDarkTheme(false);
            }
        });
    };
    
    /*
    const createTransparentPNGBase64 = file => new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.src = URL.createObjectURL(file);

        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png"));
        };
    });
    */
    
    AppState.init();
    
    const imageInput = document.getElementById("image-input");
    const code = document.getElementById("code");
    const updateImage = () => {
        const file = imageInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const base64String = e.target.result;
                AppState.imageBase64 = base64String;
                fetch("/test", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        startImage: AppState.base64NoPrefix(),
                        code: code.value,
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    AppState.setLeft(0);
                    AppState.setRight(-1);
                    AppState.setGallery(data);
                    AppState.updateGalleryDisplay();
                    AppState.updateDisplayCompare();
                })
                .catch(error => {
                    console.error("Error:", error);
                });
            };
            reader.readAsDataURL(file);
        }
    };
    imageInput.addEventListener("change", updateImage);
    code.addEventListener("change", updateImage);
    updateImage();
});

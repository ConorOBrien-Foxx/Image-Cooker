const makeImageCard = (title, image, ...actions) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
        <div class="card">
            <div class="card-image">
            
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
            const button = document.createElement("button");
            button.className = "tight btn waves-effect waves-light";
            button.textContent = action;
            cardActions.appendChild(button);
        }
        card.appendChild(cardActions);
    }
    return card;
};

const PNG_PREFIX = "data:image/png;base64,";
const SET_LEFT_LABEL = "Left";
const SET_RIGHT_LABEL = "Right";
const AppState = {
    imageBase64: null,
    gallery: null,
    left: null,
    right: null,
    base64NoPrefix() {
        return this.imageBase64.replace(/^data:image\/.+;base64,/, "");
    },
    init() {
        const galleryContainer = document.getElementById("galleryContainer");
        galleryContainer.addEventListener("click", ev => {
            const { target } = ev;
            if(target.tagName !== "BUTTON") {
                return;
            }
            const myCard = ev.target.closest(".card");
            const myIndex = [...myCard.parentElement.children].indexOf(myCard);
            if(target.textContent.includes(SET_LEFT_LABEL)) {
                console.log("setting left", myIndex);
                this.setLeft(myIndex);
            }
            if(target.textContent.includes(SET_RIGHT_LABEL)) {
                console.log("setting right", myIndex);
                this.setRight(myIndex);
            }
            this.updateDisplayCompare();
        });
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
            // const card = makeImageCard(`Version ${idx}`, newImgElement, SET_LEFT_LABEL, SET_RIGHT_LABEL);
            const card = makeImageCard("", newImgElement, SET_LEFT_LABEL, SET_RIGHT_LABEL);
            galleryContainer.appendChild(card);
        });
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
                    AppState.setGallery(data);
                    AppState.updateGalleryDisplay();
                    AppState.setLeft(0);
                    AppState.setRight(-1);
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

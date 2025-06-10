let userApiKey = '';
let uploadedFiles = [];
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const imagePreview = document.getElementById("imagePreview");
const generateButton = document.getElementById("generateButton");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveApiKey = document.getElementById("saveApiKey");
const apiKeyStatus = document.getElementById("apiKeyStatus");
const toast = document.getElementById("toast");

saveApiKey.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        userApiKey = key;
        apiKeyStatus.textContent = "API Key disimpan.";
        apiKeyStatus.style.color = "green";
        generateButton.disabled = false;
    } else {
        apiKeyStatus.textContent = "Masukkan API Key yang valid.";
        apiKeyStatus.style.color = "red";
    }
});

uploadArea.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", e => handleFiles(e.target.files));

function handleFiles(files) {
    uploadedFiles = Array.from(files).slice(0, 100).filter(f => f.type.startsWith("image/"));
    imagePreview.innerHTML = "";
    uploadedFiles.forEach(file => {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        imagePreview.appendChild(img);
    });
    generateButton.style.display = uploadedFiles.length > 0 ? "inline-block" : "none";
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

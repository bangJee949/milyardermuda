
let uploadedFiles = [];
let userApiKey = localStorage.getItem("geminiApiKey") || '';

const apiKeyInput = document.getElementById("apiKeyInput");
const saveApiKey = document.getElementById("saveApiKey");
const apiKeyStatus = document.getElementById("apiKeyStatus");
const fileInput = document.getElementById("fileInput");
const generateButton = document.getElementById("generateButton");
const previewArea = document.getElementById("previewArea");
const toast = document.getElementById("toast");

// Load saved API key if exists
if (userApiKey) {
    apiKeyInput.value = userApiKey;
    apiKeyStatus.textContent = "API Key loaded.";
    generateButton.disabled = false;
}

saveApiKey.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        userApiKey = key;
        localStorage.setItem("geminiApiKey", key);
        apiKeyStatus.textContent = "API Key saved.";
        generateButton.disabled = false;
    } else {
        apiKeyStatus.textContent = "Please enter a valid API key.";
    }
});

document.getElementById("uploadArea").addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", e => {
    const files = Array.from(e.target.files).slice(0, 100);
    uploadedFiles = files.filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
    previewArea.innerHTML = "";
    uploadedFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        const media = document.createElement(file.type.startsWith("video/") ? "video" : "img");
        media.src = url;
        if (file.type.startsWith("video/")) {
            media.controls = true;
        }
        media.className = "preview-media";
        previewArea.appendChild(media);
    });
    generateButton.disabled = uploadedFiles.length === 0;
});

generateButton.addEventListener("click", async () => {
    if (!userApiKey) {
        alert("API Key belum disimpan.");
        return;
    }
    const results = document.getElementById("results");
    results.innerHTML = "Processing...";
    const output = [];

    for (let file of uploadedFiles) {
        const base64 = await fileToBase64(file);
        const type = file.type.startsWith("video/") ? "video" : "image";

        const prompt =
            en: `Analyze the ${type} content and generate metadata for Adobe Stock:

1. Title: 5-10 trending and relevant keywords, no punctuation.
2. Description: Max 200 characters, accurate and concise.
3. Keywords: 49 relevant terms, 10 top keywords at the beginning.`,
            zh: `分析该${type === "video" ? "视频" : "图片"}内容并生成适用于Adobe Stock的元数据：

1. 标题：5-10个趋势和相关关键词，简洁无标点。
2. 描述：不超过200字符，精准简洁。
3. 关键词：共49个关键词，前10个为主关键词，其余相关。`
        };

        const metadata = {};

        try {
            const body = {
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: file.type,
                                data: base64.split(",")[1]
                            }
                        }
                    ]
                }]
            };

            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${userApiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                metadata["en"] = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No result";
            } catch (err) {
    metadata["en"] = "Error contacting Gemini API.";
}
                metadata[lang] = "Error contacting Gemini API.";
            }
        }

        output.push({ filename: file.name, text: metadata.en, previewUrl: URL.createObjectURL(file), type: file.type });
    }

    displayBilingualResults(output);
});

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = err => reject(err);
    });
}

function extract(field, text) {
    if (!text) return "N/A";
    const pattern = new RegExp(`${field}\s*[:：]\s*(.*?)\n`, "i");
    const match = text.match(pattern);
    return match ? match[1].replace(/^\*+|\*+$/g, "").trim() : "N/A";
}

function clean(text) {
    return text.replace(/^\*+|\*+$/g, "").trim();
}

function copyText(txt) {
    navigator.clipboard.writeText(txt).then(() => {
        toast.textContent = "Copied!";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2000);
    });
}

function displayBilingualResults(dataArray) {
    const results = document.getElementById("results");
    results.innerHTML = "";
    dataArray.forEach(item => {
        const block = document.createElement("div");
        block.className = "tab-block";

        const media = document.createElement(item.type.startsWith("video/") ? "video" : "img");
        media.src = item.previewUrl;
        if (item.type.startsWith("video/")) media.controls = true;
        media.className = "preview-media";
        

        const titleEn = clean(extract("title", item.text));
        const descEn = clean(extract("description", item.text));
        const keywordsEn = clean(extract("keywords", item.text));

        
        
        

        block.innerHTML = `
            <div class="tab-header"><h3>${item.filename}</h3></div>
            <h4>English</h4>
            <div><strong>Title:</strong> <button class="copy-btn" onclick="copyText(\`${titleEn}\`)">Copy</button><pre>${titleEn}</pre></div>
            <div><strong>Description:</strong> <button class="copy-btn" onclick="copyText(\`${descEn}\`)">Copy</button><pre>${descEn}</pre></div>
            <div><strong>Keywords:</strong> <button class="copy-btn" onclick="copyText(\`${keywordsEn}\`)">Copy</button><pre>${keywordsEn}</pre></div>
            
            <div><strong>标题:</strong> <button class="copy-btn" onclick="copyText(\`${titleZh}\`)">Copy</button><pre>${titleZh}</pre></div>
            <div><strong>描述:</strong> <button class="copy-btn" onclick="copyText(\`${descZh}\`)">Copy</button><pre>${descZh}</pre></div>
            <div><strong>关键词:</strong> <button class="copy-btn" onclick="copyText(\`${keywordsZh}\`)">Copy</button><pre>${keywordsZh}</pre></div>
        `;
        block.prepend(media);
        results.appendChild(block);
    });
}


let uploadedFiles = [];
let userApiKey = '';

document.getElementById("saveApiKey").addEventListener("click", () => {
    const key = document.getElementById("apiKeyInput").value.trim();
    if (key) {
        userApiKey = key;
        document.getElementById("apiKeyStatus").textContent = "API Key disimpan.";
        document.getElementById("generateButton").disabled = false;
    }
});

document.getElementById("uploadArea").addEventListener("click", () => {
    document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", e => {
    const files = Array.from(e.target.files).slice(0, 100);
    uploadedFiles = files.filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
    const previewArea = document.getElementById("previewArea");
    previewArea.innerHTML = "";
    uploadedFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        const media = document.createElement(file.type.startsWith("video/") ? "video" : "img");
        media.src = url;
        if (file.type.startsWith("video/")) {
            media.controls = true;
        }
        previewArea.appendChild(media);
    });
    document.getElementById("generateButton").disabled = uploadedFiles.length === 0;
});

document.getElementById("generateButton").addEventListener("click", async () => {
    const results = document.getElementById("results");
    results.innerHTML = "Processing...";
    const output = [];

    for (let file of uploadedFiles) {
        const base64 = await fileToBase64(file);
        const type = file.type.startsWith("video/") ? "video" : "image";

        const prompts = {
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

        for (const [lang, prompt] of Object.entries(prompts)) {
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

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${userApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            metadata[lang] = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No result";
        }

        output.push({ filename: file.name, text: metadata.en, textZh: metadata.zh });
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

function copyText(txt) {
    navigator.clipboard.writeText(txt).then(() => {
        const toast = document.getElementById("toast");
        toast.textContent = "Copied!";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2000);
    });
}

function extract(field, text) {
    if (!text) return "N/A";
    const pattern = new RegExp(`${field}\s*[:：]\s*(.*?)\n`, "i");
    const match = text.match(pattern);
    return match ? match[1].replace(/^\*+|\*+$/g, "").trim() : "N/A";
}
    const match = text.match(new RegExp(`${field}\s*[:：]\s*(.*?)\n`, "i"));
    return match ? match[1].trim() : "N/A";
}

function displayBilingualResults(dataArray) {
    const results = document.getElementById("results");
    results.innerHTML = "";
    dataArray.forEach(item => {
        const block = document.createElement("div");
        block.className = "tab-block";

        const titleEn = clean(extract("title", item.text));
        const descEn = clean(extract("description", item.text));
        const keywordsEn = clean(extract("keywords", item.text));

        const titleZh = clean(extract("title", item.textZh));
        const descZh = clean(extract("description", item.textZh));
        const keywordsZh = clean(extract("keywords", item.textZh));

        block.innerHTML = `
            <div class="tab-header"><h3>${item.filename}</h3></div>
            <h4>English</h4>
            <div><strong>Title:</strong> <button class="copy-btn" onclick="copyText(\`${titleEn}\`)">Copy</button><pre>${titleEn}</pre></div>
            <div><strong>Description:</strong> <button class="copy-btn" onclick="copyText(\`${descEn}\`)">Copy</button><pre>${descEn}</pre></div>
            <div><strong>Keywords:</strong> <button class="copy-btn" onclick="copyText(\`${keywordsEn}\`)">Copy</button><pre>${keywordsEn}</pre></div>
            <h4>中文</h4>
            <div><strong>标题:</strong> <button class="copy-btn" onclick="copyText(\`${titleZh}\`)">Copy</button><pre>${titleZh}</pre></div>
            <div><strong>描述:</strong> <button class="copy-btn" onclick="copyText(\`${descZh}\`)">Copy</button><pre>${descZh}</pre></div>
            <div><strong>关键词:</strong> <button class="copy-btn" onclick="copyText(\`${keywordsZh}\`)">Copy</button><pre>${keywordsZh}</pre></div>
        `;
        results.appendChild(block);
    });
}


function clean(text) {
    return text.replace(/^\*+|\*+$/g, "").trim();
}

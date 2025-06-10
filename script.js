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
        if (file.type.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = url;
            previewArea.appendChild(img);
        } else if (file.type.startsWith("video/")) {
            const video = document.createElement("video");
            video.src = url;
            video.controls = true;
            previewArea.appendChild(video);
        }
    });
    document.getElementById("generateButton").disabled = uploadedFiles.length === 0;
});

document.getElementById("generateButton").addEventListener("click", async () => {
    const results = document.getElementById("results");
    results.innerHTML = "Memproses...";
    const output = [];

    for (let file of uploadedFiles) {
        const base64 = await fileToBase64(file);
        const type = file.type.startsWith("video/") ? "video" : "image";
        const prompt = `Analisa konten ${type} dan buat metadata untuk Adobe Stock:

1. Judul akurat dengan peluang 90% laku dan trending (5-10 kata, tanpa tanda baca).
2. Deskripsi jelas maksimal 200 karakter.
3. 49 keyword: 10 kata kunci utama paling relevan dan sisanya masih relevan dan terhubung.`;

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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${userApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Tidak ada hasil";
        output.push(`<div><strong>${file.name}</strong><pre>${text}</pre></div>`);
    }

    results.innerHTML = output.join('');
});

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = err => reject(err);
    });
}
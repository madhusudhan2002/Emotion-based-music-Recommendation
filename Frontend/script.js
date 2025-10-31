const backendURL = "http://127.0.0.1:5000";

document.getElementById("detectBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select an image first!");
    return;
  }

  // Create FormData to send image
  const formData = new FormData();
  formData.append("image", file);

  try {
    // Call backend to detect emotion
    const response = await fetch(`${backendURL}/detect-emotion`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.error) {
      alert(data.error);
      return;
    }

    const emotion = data.emotion;
    document.getElementById("emotionResult").innerText = `Detected Emotion: ${emotion}`;

    // Fetch recommended songs
    const recResponse = await fetch(`${backendURL}/recommendations/${emotion}/en`);
    const recData = await recResponse.json();

    const musicDiv = document.getElementById("musicContainer");
    musicDiv.innerHTML = `<h2>Recommended Songs (${recData.genre}):</h2>`;

    recData.tracks.forEach(track => {
      musicDiv.innerHTML += `
        <div class="track">
          <p><strong>${track.name}</strong> - ${track.artist}</p>
          <iframe src="${track.embed_url}" width="300" height="80" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>
        </div>
      `;
    });

  } catch (error) {
    console.error("Error:", error);
    alert("Failed to connect to backend.");
  }
});

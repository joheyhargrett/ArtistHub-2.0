const artistData = [
  { id: "6l3HvQ5sa6mXTsMTB19rO5", name: "J-Cole" },
  { id: "1uNFoZAHBGtllmzznpCI3s", name: "Justin Bieber" },
  { id: "790FomKkXshlbRYZFtlgla", name: "Karol G" },
  { id: "12Chz98pHFMPJEknJQMWvI", name: "Muse" },
  { id: "181bsRPaVXVlUKXrxwZfHK", name: "Megan Thee Stallion" },
  { id: "3TVXtAsR1Inumwj472S9r4", name: "Drake" },
  { id: "1Xyo4u8uXC1ZmMpatF05PJ", name: "The Weeknd" },
  { id: "53XhwfbYqKCa1cC15pYq2q", name: "Imagine Dragons" },
  { id: "1HY2Jd0NmPuamShAr6KMms", name: "Lady Gaga" },
  { id: "5pKCCKE2ajJHZ9KAiaK11H", name: "Rihanna" }
];

let data = {};

const requestToken = async () => {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials&client_id=64ffb24515d44051b073917a2bd60326&client_secret=7ba47ffd43fc4c799c3e9a64b02b2456",
    });

    if (!response.ok) {
      throw new Error(`Token request failed with status ${response.status}`);
    }

    data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error fetching token:', error);
    alert('Failed to fetch token. Please try again later.');
  }
};

const renderPage = async () => {
  await requestToken();

  artistData.forEach(async (artist) => {
    const artistInfo = await fetchArtist(artist.id);
    if (artistInfo) {
      renderArtist(artist, artistInfo);
    }
  });

  const searchButton = document.getElementById("searchButton");
  searchButton.addEventListener("click", searchArtist);
};

const fetchArtist = async (artistId) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch artist with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching artist ${artistId}:`, error);
    return null;
  }
};

const fetchArtistGenre = async (artistId, artistContainer) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch genre with status ${response.status}`);
    }

    const artistInfo = await response.json();
    const genre = artistInfo.genres[0];

    const genresContainer = artistContainer.querySelector(".genres");

    if (genre) {
      const formattedGenre = genre
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const genreElement = document.createElement("span");
      genreElement.textContent = formattedGenre;

      genresContainer.appendChild(genreElement);
    } else {
      genresContainer.textContent = "No genre available";
    }

    const socialLinks = document.createElement("div");
    socialLinks.classList.add("social-links");
    artistInfo.external_urls &&
      Object.keys(artistInfo.external_urls).forEach((platform) => {
        const link = document.createElement("a");
        link.href = artistInfo.external_urls[platform];
        link.target = "_blank";
        link.textContent =
          platform === "spotify" ? "Follow Artist on Spotify" : platform;
        socialLinks.appendChild(link);
      });

    artistContainer.appendChild(socialLinks);
  } catch (error) {
    console.error(`Error fetching genre for artist ID ${artistId}:`, error);
  }
};

const renderArtist = (artist, artistInfo) => {
  const artistContainer = document.createElement("div");
  artistContainer.classList.add("artist-container");

  const artistImage = document.createElement("img");
  artistImage.src = artistInfo.images[1].url;

  const artistName = document.createElement("h2");
  artistName.textContent = artist.name;

  const heartIcon = document.createElement("span");
  heartIcon.className = "heart-icon tooltip";
  heartIcon.innerHTML = isArtistHearted(artist.id) ? "❤️" : "🤍";
  if (isArtistHearted(artist.id)) {
    heartIcon.classList.add("pulsate");
  }
  const tooltipText = document.createElement("span");
  tooltipText.className = "tooltiptext";
  tooltipText.textContent = isArtistHearted(artist.id) ? "Unlike" : "Like";
  heartIcon.appendChild(tooltipText);
  heartIcon.addEventListener("click", () => {
    toggleHeart(artist.id);
    tooltipText.textContent = isArtistHearted(artist.id) ? "Unlike" : "Like";
  });

  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset";
  resetButton.addEventListener("click", () => resetArtistContainer(artist.id));

  const genresContainer = document.createElement("div");
  genresContainer.classList.add("genres");

  artistContainer.appendChild(artistImage);
  artistContainer.appendChild(artistName);
  artistContainer.appendChild(heartIcon);
  artistContainer.appendChild(resetButton);
  artistContainer.appendChild(genresContainer);
  artistContainer.setAttribute("data-artist", artist.id);

  content.appendChild(artistContainer);

  artistImage.addEventListener("click", () => showAlbumDropdown(artist.id));

  fetchArtistGenre(artist.id, artistContainer);
};

const showAlbumDropdown = async (artistId) => {
  try {
    clearAlbumDropdown();

    const albumDropdown = document.createElement("select");
    albumDropdown.id = `albumDropdown-${artistId}`;
    albumDropdown.classList.add("album-dropdown");

    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Select an Album";
    albumDropdown.appendChild(defaultOption);

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?market=US`,
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch albums with status ${response.status}`);
    }

    const artistAlbums = await response.json();
    renderAlbumDropdown(artistAlbums.items, artistId, albumDropdown);
  } catch (error) {
    console.error(`Error fetching albums for artist ID ${artistId}:`, error);
  }
};

const renderAlbumDropdown = (albums, artistId, albumDropdown) => {
  albums.forEach((album) => {
    const option = document.createElement("option");
    option.value = album.id;
    option.textContent = album.name;
    albumDropdown.appendChild(option);
  });

  albumDropdown.addEventListener("change", async (event) => {
    const selectedAlbumId = event.target.value;
    const artistContainer = content.querySelector(
      `[data-artist="${artistId}"]`
    );
    const trackListContainer = artistContainer.querySelector(
      ".track-list-container"
    );
    clearTrackList(trackListContainer);
    await fetchAlbumTracks(selectedAlbumId, trackListContainer);
  });

  const artistContainer = content.querySelector(`[data-artist="${artistId}"]`);
  const trackListContainer = document.createElement("div");
  trackListContainer.classList.add("track-list-container");
  artistContainer.appendChild(trackListContainer);

  artistContainer.appendChild(albumDropdown);
};

const fetchAlbumTracks = async (albumId, trackListContainer) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}/tracks`,
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tracks with status ${response.status}`);
    }

    const albumTracks = await response.json();
    const albumDetails = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}`,
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    if (!albumDetails.ok) {
      throw new Error(`Failed to fetch album details with status ${albumDetails.status}`);
    }

    const albumInfo = await albumDetails.json();

    renderTrackList(
      albumTracks.items,
      trackListContainer,
      albumInfo.images[1].url,
      albumInfo.release_date,
      albumInfo.total_tracks
    );
  } catch (error) {
    console.error(`Error fetching tracks for album ID ${albumId}:`, error);
  }
};

const renderTrackList = (
  tracks,
  trackListContainer,
  albumCoverUrl,
  releaseDate,
  totalTracks
) => {
  const trackList = document.createElement("ul");
  trackList.classList.add("track-list");

  const albumCover = document.createElement("img");
  albumCover.src = albumCoverUrl;
  albumCover.classList.add("album-cover");
  trackListContainer.appendChild(albumCover);

  const albumDetails = document.createElement("div");
  albumDetails.classList.add("album-details");
  albumDetails.innerHTML = `
    <p>Release Date: ${releaseDate}</p>
    <p>Total Tracks: ${totalTracks}</p>
  `;
  trackListContainer.appendChild(albumDetails);

  tracks.forEach((track, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${index + 1}. ${track.name}`;
    trackList.appendChild(listItem);
  });

  trackListContainer.appendChild(trackList);
};

const searchInput = document.getElementById("searchInput");
const suggestionsContainer = document.getElementById("suggestions");

searchInput.addEventListener("input", async () => {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${searchTerm}&type=artist&limit=5`,
        {
          headers: { Authorization: `Bearer ${data.access_token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search artists with status ${response.status}`);
      }

      const searchResults = await response.json();
      if (searchResults.artists && searchResults.artists.items.length > 0) {
        displaySuggestions(searchResults.artists.items);
      } else {
        clearSuggestions();
      }
    } catch (error) {
      console.error(`Error searching for artists:`, error);
    }
  } else {
    clearSuggestions();
  }
});

const displaySuggestions = (artists) => {
  clearSuggestions();
  artists.forEach((artist) => {
    const option = document.createElement("option");
    option.value = artist.name;
    suggestionsContainer.appendChild(option);
  });
};

const clearSuggestions = () => {
  while (suggestionsContainer.firstChild) {
    suggestionsContainer.removeChild(suggestionsContainer.firstChild);
  }
};

const searchArtist = async () => {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${searchTerm}&type=artist`,
        {
          headers: { Authorization: `Bearer ${data.access_token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search artists with status ${response.status}`);
      }

      const searchResults = await response.json();
      if (searchResults.artists && searchResults.artists.items.length > 0) {
        const artist = searchResults.artists.items[0];
        const artistInfo = await fetchArtist(artist.id);
        if (artistInfo) {
          renderArtist(artist, artistInfo);
          searchInput.value = "";
          clearSuggestions();
        }
      } else {
        alert("No artists found for the given search term.");
      }
    } catch (error) {
      console.error(`Error searching for artist:`, error);
      alert("Failed to search for the artist. Please try again later.");
    }
  }
};

const content = document.getElementById("content");

function isArtistHearted(artistId) {
  const heartedArtists =
    JSON.parse(localStorage.getItem("heartedArtists")) || [];
  return heartedArtists.includes(artistId);
}

function updateHeartedArtists(artistId, hearted) {
  const heartedArtists =
    JSON.parse(localStorage.getItem("heartedArtists")) || [];

  if (hearted) {
    if (!heartedArtists.includes(artistId)) {
      heartedArtists.push(artistId);
    }
  } else {
    const index = heartedArtists.indexOf(artistId);
    if (index !== -1) {
      heartedArtists.splice(index, 1);
    }
  }

  localStorage.setItem("heartedArtists", JSON.stringify(heartedArtists));
}

const resetArtistContainer = (artistId) => {
  const artistContainer = content.querySelector(`[data-artist="${artistId}"]`);

  const heartIcon = artistContainer.querySelector(".heart-icon");
  heartIcon.innerHTML = isArtistHearted(artistId) ? "❤️" : "🤍";
  heartIcon.classList.remove("pulsate");
  clearAlbumDropdown();
  clearTrackList(artistContainer.querySelector(".track-list-container"));
};

const toggleHeart = (artistId) => {
  const artistContainer = content.querySelector(`[data-artist="${artistId}"]`);
  const heartIcon = artistContainer.querySelector(".heart-icon");
  const isLiked = isArtistHearted(artistId);

  if (isLiked) {
    updateHeartedArtists(artistId, false);
    heartIcon.innerHTML = "🤍";
    heartIcon.classList.remove("pulsate");
  } else {
    updateHeartedArtists(artistId, true);
    heartIcon.innerHTML = "❤️";
    heartIcon.classList.add("pulsate");
  }
};

const clearAlbumDropdown = () => {
  const albumDropdowns = content.querySelectorAll(
    "select[id^='albumDropdown-']"
  );
  albumDropdowns.forEach((dropdown) => dropdown.remove());
};

const clearTrackList = (trackListContainer) => {
  const existingTrackList = trackListContainer.querySelector("ul");
  if (existingTrackList) {
    existingTrackList.remove();
  }

  const existingAlbumCover = trackListContainer.querySelector(".album-cover");
  if (existingAlbumCover) {
    existingAlbumCover.remove();
  }
};

const toggleLightMode = () => {
  document.body.classList.toggle('light-mode');
};

const toggleButton = document.getElementById('toggleButton');
toggleButton.addEventListener('click', toggleLightMode);

renderPage();

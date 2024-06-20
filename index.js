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
const artistCache = new Map();
const debounceTimeout = 300;
let debounceTimer;

const showError = (message) => {
  const errorMessage = document.getElementById("error-message");
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
  setTimeout(() => {
    errorMessage.classList.add("hidden");
  }, 3000);
};

const showLoading = () => {
  const loadingSpinner = document.getElementById('loading-spinner');
  if (loadingSpinner) {
    loadingSpinner.classList.remove('hidden');
  }
};

const hideLoading = () => {
  const loadingSpinner = document.getElementById('loading-spinner');
  if (loadingSpinner) {
    loadingSpinner.classList.add('hidden');
  }
};

const requestToken = async (retryCount = 3) => {
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
    if (retryCount > 0) {
      await requestToken(retryCount - 1);
    } else {
      showError('Failed to fetch token. Please try again later.');
    }
  }
};

const renderPage = async () => {
  await requestToken();
  renderArtists();
  setupSearch();
};

const renderArtists = async () => {
  for (const artist of artistData) {
    await renderArtistData(artist);
  }
};

const renderArtistData = async (artist) => {
  if (artistCache.has(artist.id)) {
    renderArtist(artist, artistCache.get(artist.id));
  } else {
    const artistInfo = await fetchArtist(artist.id);
    if (artistInfo) {
      artistCache.set(artist.id, artistInfo);
      renderArtist(artist, artistInfo);
    }
  }
};

const setupSearch = () => {
  const searchButton = document.getElementById("searchButton");
  searchButton.addEventListener("click", searchArtist);
};

const fetchArtist = async (artistId, retryCount = 3) => {
  try {
    showLoading();
    const response = await makeFetchRequest(
      `https://api.spotify.com/v1/artists/${artistId}`,
      { Authorization: `Bearer ${data.access_token}` }
    );
    hideLoading();
    return await handleFetchResponse(response);
  } catch (error) {
    hideLoading();
    console.error(`Error fetching artist ${artistId}:`, error);
    if (retryCount > 0) {
      return await fetchArtist(artistId, retryCount - 1);
    } else {
      showError('Failed to fetch artist data. Please try again later.');
      return null;
    }
  }
};

const makeFetchRequest = async (url, headers) => {
  return await fetch(url, { headers });
};

const handleFetchResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`Failed to fetch with status ${response.status}`);
  }
  return await response.json();
};

const renderArtist = (artist, artistInfo) => {
  const artistContainer = createArtistContainer(artist, artistInfo);

  content.appendChild(artistContainer);

  fetchArtistGenre(artist.id, artistContainer);
  fetchTopTracks(artist.id, artistContainer);
  fetchAllAlbums(artist.id, artistContainer);
  fetchRelatedArtists(artist.id, artistContainer);
};

const createArtistContainer = (artist, artistInfo) => {
  const artistContainer = document.createElement("div");
  artistContainer.classList.add("artist-container");

  const artistImage = createArtistImage(artistInfo);
  const artistName = createArtistName(artist);
  const heartIcon = createHeartIcon(artist);
  const resetButton = createResetButton(artist);
  const genresContainer = createGenresContainer();

  artistContainer.appendChild(artistImage);
  artistContainer.appendChild(artistName);
  artistContainer.appendChild(heartIcon);
  artistContainer.appendChild(resetButton);
  artistContainer.appendChild(genresContainer);
  artistContainer.setAttribute("data-artist", artist.id);

  artistImage.addEventListener("click", () => showAlbumDropdown(artist.id, artistContainer));

  return artistContainer;
};

const createArtistImage = (artistInfo) => {
  const artistImage = document.createElement("img");
  artistImage.src = artistInfo.images[1].url;
  return artistImage;
};

const createArtistName = (artist) => {
  const artistName = document.createElement("h2");
  artistName.textContent = artist.name;
  return artistName;
};

const createHeartIcon = (artist) => {
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
  return heartIcon;
};

const createResetButton = (artist) => {
  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset";
  resetButton.addEventListener("click", () => resetArtistContainer(artist.id));
  return resetButton;
};

const createGenresContainer = () => {
  const genresContainer = document.createElement("div");
  genresContainer.classList.add("genres");
  return genresContainer;
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
    showError('Failed to fetch artist genre. Please try again later.');
  }
};

const showAlbumDropdown = async (artistId, artistContainer) => {
  try {
    clearAlbumDropdown(artistContainer);

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
    renderAlbumDropdown(artistAlbums.items, artistId, albumDropdown, artistContainer);
  } catch (error) {
    console.error(`Error fetching albums for artist ID ${artistId}:`, error);
    showError('Failed to fetch albums. Please try again later.');
  }
};

const renderAlbumDropdown = (albums, artistId, albumDropdown, artistContainer) => {
  albums.forEach((album) => {
    const option = document.createElement("option");
    option.value = album.id;
    option.textContent = album.name;
    albumDropdown.appendChild(option);
  });

  albumDropdown.addEventListener("change", async (event) => {
    const selectedAlbumId = event.target.value;
    const trackListContainer = artistContainer.querySelector(
      ".track-list-container"
    );
    clearTrackList(trackListContainer);
    await fetchAlbumTracks(selectedAlbumId, trackListContainer);
  });

  const trackListContainer = document.createElement("div");
  trackListContainer.classList.add("track-list-container");
  artistContainer.appendChild(trackListContainer);

  artistContainer.appendChild(albumDropdown);
};

const fetchAlbumTracks = async (albumId, trackListContainer, retryCount = 3) => {
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
    if (retryCount > 0) {
      await fetchAlbumTracks(albumId, trackListContainer, retryCount - 1);
    } else {
      showError('Failed to fetch album tracks. Please try again later.');
    }
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

    if (track.preview_url) {
      const audioPreview = document.createElement("audio");
      audioPreview.src = track.preview_url;
      audioPreview.controls = true;
      listItem.appendChild(audioPreview);
    }

    trackList.appendChild(listItem);
  });

  trackListContainer.appendChild(trackList);
};

const searchInput = document.getElementById("searchInput");
const suggestionsContainer = document.getElementById("suggestions");

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
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
        showError('Failed to search for artists. Please try again later.');
      }
    } else {
      clearSuggestions();
    }
  }, debounceTimeout);
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
      showError('Failed to search for the artist. Please try again later.');
    }
  }
};

const fetchTopTracks = async (artistId, artistContainer) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch top tracks with status ${response.status}`);
    }

    const topTracks = await response.json();
    renderTopTracksDropdown(topTracks.tracks, artistContainer);
  } catch (error) {
    console.error(`Error fetching top tracks for artist ID ${artistId}:`, error);
    showError('Failed to fetch top tracks. Please try again later.');
  }
};

const renderTopTracksDropdown = (tracks, artistContainer) => {
  const topTracksDropdown = document.createElement("select");
  topTracksDropdown.classList.add("top-tracks-dropdown");
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Top Tracks";
  topTracksDropdown.appendChild(defaultOption);

  tracks.forEach((track) => {
    const option = document.createElement("option");
    option.value = track.id;
    option.textContent = track.name;
    topTracksDropdown.appendChild(option);
  });

  topTracksDropdown.addEventListener("change", async (event) => {
    const selectedTrackId = event.target.value;
    const trackInfo = await fetchTrack(selectedTrackId);
    if (trackInfo) {
      renderTrackInfo(trackInfo, artistContainer);
    }
  });

  artistContainer.appendChild(topTracksDropdown);
};

const fetchTrack = async (trackId, retryCount = 3) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch track with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching track ${trackId}:`, error);
    if (retryCount > 0) {
      return await fetchTrack(trackId, retryCount - 1);
    } else {
      showError('Failed to fetch track data. Please try again later.');
      return null;
    }
  }
};

const renderTrackInfo = (track, artistContainer) => {
  const trackInfoContainer = artistContainer.querySelector(".track-info-container") || document.createElement("div");
  trackInfoContainer.classList.add("track-info-container");
  trackInfoContainer.innerHTML = `
    <h4>${track.name}</h4>
    <p>Album: ${track.album.name}</p>
    <p>Duration: ${(track.duration_ms / 60000).toFixed(2)} minutes</p>
  `;

  if (track.preview_url) {
    const audioPreview = document.createElement("audio");
    audioPreview.src = track.preview_url;
    audioPreview.controls = true;
    trackInfoContainer.appendChild(audioPreview);
  }

  artistContainer.appendChild(trackInfoContainer);
};

const fetchAllAlbums = async (artistId, artistContainer) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?market=US`,
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch albums with status ${response.status}`);
    }

    const albums = await response.json();
    renderAllAlbumsDropdown(albums.items, artistContainer);
  } catch (error) {
    console.error(`Error fetching albums for artist ID ${artistId}:`, error);
    showError('Failed to fetch albums. Please try again later.');
  }
};

const renderAllAlbumsDropdown = (albums, artistContainer) => {
  const allAlbumsDropdown = document.createElement("select");
  allAlbumsDropdown.classList.add("all-albums-dropdown");
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "All Albums";
  allAlbumsDropdown.appendChild(defaultOption);

  albums.forEach((album) => {
    const option = document.createElement("option");
    option.value = album.id;
    option.textContent = album.name;
    allAlbumsDropdown.appendChild(option);
  });

  allAlbumsDropdown.addEventListener("change", async (event) => {
    const selectedAlbumId = event.target.value;
    const albumTracksContainer = artistContainer.querySelector(".album-tracks-container") || document.createElement("div");
    albumTracksContainer.classList.add("album-tracks-container");
    clearAlbumTracks(albumTracksContainer);
    await fetchAlbumTracks(selectedAlbumId, albumTracksContainer);
    artistContainer.appendChild(albumTracksContainer);
  });

  artistContainer.appendChild(allAlbumsDropdown);
};

const fetchRelatedArtists = async (artistId, artistContainer) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch related artists with status ${response.status}`);
    }

    const relatedArtists = await response.json();
    renderRelatedArtistsDropdown(relatedArtists.artists, artistContainer);
  } catch (error) {
    console.error(`Error fetching related artists for artist ID ${artistId}:`, error);
    showError('Failed to fetch related artists. Please try again later.');
  }
};

const renderRelatedArtistsDropdown = (artists, artistContainer) => {
  const relatedArtistsDropdown = document.createElement("select");
  relatedArtistsDropdown.classList.add("related-artists-dropdown");
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Related Artists";
  relatedArtistsDropdown.appendChild(defaultOption);

  artists.forEach((artist) => {
    const option = document.createElement("option");
    option.value = artist.id;
    option.textContent = artist.name;
    relatedArtistsDropdown.appendChild(option);
  });

  relatedArtistsDropdown.addEventListener("change", async (event) => {
    const selectedArtistId = event.target.value;
    const artistInfo = await fetchArtist(selectedArtistId);
    if (artistInfo) {
      renderArtist({ id: selectedArtistId, name: artistInfo.name }, artistInfo);
    }
  });

  artistContainer.appendChild(relatedArtistsDropdown);
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
  clearAlbumDropdown(artistContainer);
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

const clearAlbumDropdown = (artistContainer) => {
  const albumDropdowns = artistContainer.querySelectorAll(
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

const clearAlbumTracks = (albumTracksContainer) => {
  while (albumTracksContainer.firstChild) {
    albumTracksContainer.removeChild(albumTracksContainer.firstChild);
  }
};

const toggleLightMode = () => {
  document.body.classList.toggle('light-mode');
};

const toggleButton = document.getElementById('toggleButton');
toggleButton.addEventListener('click', toggleLightMode);

renderPage();

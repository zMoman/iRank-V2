
// Function to add song to playlist
function addSongToPlaylist(songData) {
  let playlistTable = document.getElementById('playlist_table').getElementsByTagName('tbody')[0];
  let newRow = playlistTable.insertRow();
  
  // Add action buttons
  let cell1 = newRow.insertCell(0);
  cell1.innerHTML = `<button onclick="removeSongFromPlaylist(this)">-</button>
                     <button onclick="moveSongUp(this)">🔼</button>
                     <button onclick="moveSongDown(this)">🔽</button>`;

  // Add song title
  let cell2 = newRow.insertCell(1);
  cell2.textContent = songData.title;

  // Add artist
  let cell3 = newRow.insertCell(2);
  cell3.textContent = songData.artist;

  // Add artwork
  let cell4 = newRow.insertCell(3);
  cell4.innerHTML = `<img src="${songData.artworkUrl}" alt="Artwork" style="width:50px;height:auto;">`;

  savePlaylist(); // Save after adding
}

// Function to remove song from playlist
function removeSongFromPlaylist(button) {
  let row = button.parentNode.parentNode;
  row.parentNode.removeChild(row);
  savePlaylist(); // Save after removing
}

// Function to move song up in playlist
function moveSongUp(button) {
  let row = button.parentNode.parentNode;
  let previousRow = row.previousElementSibling;
  if (previousRow) {
      row.parentNode.insertBefore(row, previousRow);
      savePlaylist(); // Save after reordering
  }
}

// Function to move song down in playlist
function moveSongDown(button) {
  let row = button.parentNode.parentNode;
  let nextRow = row.nextElementSibling;
  if (nextRow) {
      row.parentNode.insertBefore(nextRow, row);
      savePlaylist(); // Save after reordering
  }
}

// Function to get songs from server
function getSong() {
  let songTitle = document.getElementById('songTitleTextField').value.trim();
  if(songTitle === '') {
      return alert('Please enter a Song Title');
  }

  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
      if (xhr.readyState == 4 && xhr.status == 200) {
          updateSearchResults(JSON.parse(xhr.responseText), songTitle);
      }
  };
  xhr.open('GET', `/songs?title=${songTitle}`, true);
  xhr.send();
}

// Function to update search results and heading
function updateSearchResults(data, songTitle) {
  // Update the heading with the actual song title
  document.getElementById('search_query').textContent = "Songs matching: " + songTitle;


  let searchResultsTable = document.getElementById('search_results_table').getElementsByTagName('tbody')[0];
  searchResultsTable.innerHTML = ''; // Clear existing results

  data.results.forEach(song => {
      let newRow = searchResultsTable.insertRow();
      
      // Add button
      let cell1 = newRow.insertCell(0);
      cell1.innerHTML = `<button onclick='addSongToPlaylist({title: "${song.trackName}", artist: "${song.artistName}", artworkUrl: "${song.artworkUrl100}"})'>+</button>`;

      // Add title
      let cell2 = newRow.insertCell(1);
      cell2.textContent = song.trackName;

      // Add artist
      let cell3 = newRow.insertCell(2);
      cell3.textContent = song.artistName;

      // Add artwork
      let cell4 = newRow.insertCell(3);
      cell4.innerHTML = `<img src="${song.artworkUrl100}" alt="Artwork" style="width:50px;height:auto;">`;
  });
}

// Function to save the current state of the playlist to local storage
function savePlaylist() {
  let playlist = [];
  let rows = document.getElementById('playlist_table').rows;
  for (let i = 1; i < rows.length; i++) {
      let song = {
          title: rows[i].cells[1].textContent,
          artist: rows[i].cells[2].textContent,
          artworkUrl: rows[i].cells[3].getElementsByTagName('img')[0].src
      };
      playlist.push(song);
  }
  localStorage.setItem('playlist', JSON.stringify(playlist));
}

// Function to load the playlist from local storage
function loadPlaylist() {
  let storedPlaylist = localStorage.getItem('playlist');
  if (storedPlaylist) {
      let playlist = JSON.parse(storedPlaylist);
      playlist.forEach(addSongToPlaylist);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('submit_button').addEventListener('click', getSong);

  // Add key handler for the document as a whole
  document.addEventListener('keyup', function(event) {
      event.preventDefault();
      if (event.keyCode === 13) { // Enter key
          getSong();
      }
  });

  loadPlaylist(); // Load the playlist when the page loads
});

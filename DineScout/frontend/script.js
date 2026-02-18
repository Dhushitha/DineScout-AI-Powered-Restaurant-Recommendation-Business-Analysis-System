let userLat = null;
let userLon = null;


// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}


// ================= GET LOCATION =================
function getLocation() {

  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(

    (pos) => {

      userLat = pos.coords.latitude;
      userLon = pos.coords.longitude;

      console.log("Location:", userLat, userLon);

      searchRestaurants();
    },

    () => {
      alert("Please allow location access");
    }

  );
}


// ================= SEARCH =================
function searchRestaurants() {

  const cuisine = document.getElementById("cuisine").value.trim();
  const budget = document.getElementById("budget").value.trim();

  const token = localStorage.getItem("token");

  const resultDiv = document.getElementById("results");

  if (!cuisine) {
    alert("Enter cuisine");
    return;
  }

  if (!userLat || !userLon) {
    alert("Location not detected. Try again.");
    return;
  }

  resultDiv.innerHTML = "Loading...";

  fetch(
    `http://localhost:5000/api/restaurants/search?cuisine=${cuisine}&budget=${budget || 99999}&lat=${userLat}&lon=${userLon}`,
    {
      headers: {
        Authorization: token
      }
    }
  )

  .then(res => {

    if (res.status === 401) {
      alert("Session expired");
      logout();
      return;
    }

    if (!res.ok) {
      throw new Error("Server error");
    }

    return res.json();
  })

  .then(data => {
    showResults(data);
  })

  .catch(err => {

    console.error(err);

    resultDiv.innerHTML =
      "<p style='color:red'>Server error. Try again.</p>";
  });

}


// ================= SHOW RESULTS =================
function showResults(data) {

  const div = document.getElementById("results");

  div.innerHTML = "";

  if (!data || data.length === 0) {

    div.innerHTML = "<p>No restaurants found</p>";
    return;
  }


  data.forEach(r => {

    const mapLink =
      `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`;

    div.innerHTML += `

      <div class="card">

        <h3>${r.name}</h3>

        <p>🍽 ${r.cuisines}</p>
        <p>⭐ Rating: ${r.rating} (${r.category})</p>
        <p>💰 Cost: ₹${r.cost}</p>
        <p>📍 Distance: ${r.distance} km</p>

        <a href="${mapLink}" target="_blank">
          <button>Get Route</button>
        </a>

      </div>

    `;
  });

}

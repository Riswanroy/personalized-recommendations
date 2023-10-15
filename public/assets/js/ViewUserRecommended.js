let items = [];
document.addEventListener("DOMContentLoaded", function () {
  const storedValue = localStorage.getItem("selectedOption");
  if (storedValue) {
    const h2Element = document.querySelector("#selectedOption");
    h2Element.textContent = `USER ${storedValue}`;
  }
  const encodedValue = encodeURIComponent(storedValue);

  fetch(`/send-data?value=${encodedValue}`)
    .then((response) => response.json())
    .then((data) => {
      console.log("Data received from server:", data);
    })
    .catch((error) => console.log("Error sending data:", error));

  const recommendedContainer = document.querySelector(".recommended-row");

  fetch("/data")
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      items = data.map((item) => item.PRODUCT_ID);
      // console.log(items);

      items.forEach((itemId) => {
        const product = products.find((product) => product.id === itemId);
        if (product) {
          const productDiv = document.createElement("div");
          productDiv.className = "col-sm-6 col-md-4 col-lg-3";
          productDiv.innerHTML = `
            <div class="box">
              <div class="img-box">
                <img src="${product.imageSrc}" alt="" />
              </div>
              <div class="detail-box">
                <h6>${product.name}</h6>
                <h6>Price <span>$${product.price}</span></h6>
              </div>
              ${product.isNew ? '<div class="new"><span>New</span></div>' : ""}
            </div>
          `;
          recommendedContainer.appendChild(productDiv);
        }
      });
    })
    .catch((error) => console.log("Error fetching data:", error));
});

function changeUser() {
  const selectElement = document.querySelector("#USER");
  const selectedValue = selectElement.value;
  localStorage.setItem("selectedOption", selectedValue);
  location.reload();
}

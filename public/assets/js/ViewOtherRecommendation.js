document.addEventListener("DOMContentLoaded", function () {
  fetch("/other-recom")
    .then((response) => response.json())
    .then((data) => {
      const otherRecommendations = data.recommendations;
      const otherRecommendedContainer = document.querySelector(
        ".other-recommended-row"
      );
      console.log(otherRecommendations);
      // You may need to replace 'products' with the actual array containing product data

      otherRecommendations.forEach((productId) => {
        const product = products.find((product) => product.id === productId);
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
          otherRecommendedContainer.appendChild(productDiv);
        }
      });
    })
    .catch((error) =>
      console.log("Error fetching other recommendations:", error)
    );
});

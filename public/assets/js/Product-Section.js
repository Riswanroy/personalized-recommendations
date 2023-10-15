document.addEventListener("DOMContentLoaded", function () {
  const productContainer = document.querySelector(".row");

  products.forEach((product) => {
    const productDiv = document.createElement("div");
    productDiv.className = "col-sm-6 col-md-4 col-lg-3";
    productDiv.innerHTML = `
      <div class="box">
        <form action="/select-product" method="post" class="form-submit">
          <input type="hidden" name="product_id" value="${product.id}" />
          <button type="submit" class="product-link-button">
            <div class="img-box">
              <img src="${product.imageSrc}" alt="" />
            </div>
            <div class="detail-box">
              <h6>${product.name}</h6>
              <h6>Price:<span>$${product.price}</span></h6>
            </div>
            ${product.isNew ? '<div class="new"><span>New</span></div>' : ""}
          </button>
        </form>
      </div>
    `;
    productContainer.appendChild(productDiv);
  });
});

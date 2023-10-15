$(document).ready(function () {
  var shopBoxes = $(".shop_section .box:gt(4)");
  var btn = $("#btn");

  shopBoxes.hide();

  btn.click(function () {
    $(".shop_section .box:hidden").slice(0, 4).fadeIn();

    if (shopBoxes.filter(":hidden").length === 0) {
      btn.hide(); // Hide the button once all items are displayed
    }
  });
});

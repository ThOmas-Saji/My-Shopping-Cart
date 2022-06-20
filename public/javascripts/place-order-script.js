
$('#checkout-form').submit((e) => {
  e.preventDefault()
  $.ajax({
    url: '/place-order',
    method: 'post',
    data: $('#checkout-form').serialize(),
    success: (response) => {
      if (response.status && !response.razorpay && !response.onlilePayError) {
        alert("ORDER PLACED")
        location.href = '/order-complete'
      } else if (!response.status && !response.razorpay && !response.onlilePayError) { alert('Please Fill all Boxs') } else if (
        !response.status && !response.razorpay && response.onlilePayError
      ) {
        alert("Can't Do Online payment Now")
      }
      else {
        razorpayPayment(response.razorpayOrder)
      }
    }
  })
})

function razorpayPayment(order) {
  var options = {
    "key": "rzp_test_5lP7Jc8J41Q3LW", // Enter the Key ID generated from the Dashboard
    "amount": order.amount,
    // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    "currency": "INR",
    "name": "My Shopping Cart",
    "description": "Test Transaction",
    "image": "../images/appLogo.jpg",
    "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    "handler": function (response) {
      alert("Online Payment Success");
      verifyPayment(response)
    },
    "prefill": {
      "name": "Gaurav Kumar",
      "email": "gaurav.kumar@example.com",
      "contact": "9999999999"
    },
    "notes": {
      "address": "Razorpay Corporate Office"
    },
    "theme": {
      "color": "#3399cc"
    }
  };
  var rzp1 = new Razorpay(options);
  rzp1.open();
}

function verifyPayment(response) {
  location.href = '/orders'
  // $.ajax({
  //   url: '/verify-payment', 
  //   method: 'get',
  // })
}